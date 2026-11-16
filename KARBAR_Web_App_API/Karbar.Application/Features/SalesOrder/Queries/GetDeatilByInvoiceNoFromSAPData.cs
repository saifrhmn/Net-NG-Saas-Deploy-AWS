using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.SalesOrder;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.SalesOrder;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NPOI.SS.UserModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.SalesOrder.Queries
{
    public static class GetDeatilByInvoiceNoFromSAPData
    {
        public sealed class Query : IRequest<List<SapSalesMasterResponse>>
        {
            public string? SearchText { get; set; }
            public int TenantId { get; set; }
            public int? PageIndex { get; set; }
            public bool? IsCustomerRecieved { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<SapSalesMasterResponse>>
        {
            private readonly IGenericRepository<SapSalesDataResponse> _masterRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Tenant> _tenant_Repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.InvoiceData> _sapSalesData_Repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Item> _item_Repository;

            public QueryHandler(IGenericRepository<SapSalesDataResponse> masterRepository, IGenericRepository<Domain.Entities.Tenant> tenant_Repository, IGenericRepository<Domain.Entities.InvoiceData> sapSalesData_Repository, IGenericRepository<Item> item_Repository)
            {
                _masterRepository = masterRepository;
                _tenant_Repository = tenant_Repository;
                _sapSalesData_Repository = sapSalesData_Repository;
                _item_Repository = item_Repository;
            }

            public async Task<List<SapSalesMasterResponse>?> Handle(Query request, CancellationToken cancellationToken)
            {
                int? pageIndex = request.PageIndex > 0 ? request.PageIndex : null;
                int? pageSize = request.PageSize > 0 ? request.PageSize : null;

                var tenant = await _tenant_Repository.Query()
                    .FirstOrDefaultAsync(x => x.Id == request.TenantId, cancellationToken)
                    ?? throw new KeyNotFoundException("Invalid Tenant");

                IQueryable<InvoiceData> query = _sapSalesData_Repository
                    .Query()
                    .Where(x => x.DealerCode == tenant.TenantCustomerNo);

                // Filters
                if (request.IsCustomerRecieved.HasValue)
                {
                    if (request.IsCustomerRecieved.Value)
                        query = query.Where(x => x.IsCustomerRecieved == true);
                    else
                        query = query.Where(x => x.IsCustomerRecieved == false || x.IsCustomerRecieved == null);
                }

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim();
                    query = query.Where(x => x.InvoiceNo.Contains(search));
                }

                #region GROUP INVOICES (for pagination)

                var groupedQuery = query
                    .GroupBy(x => x.InvoiceNo)
                    .Select(g => new
                    {
                        InvoiceNo = g.Key,
                        InvoiceDate = g.Max(x => x.InvoiceDate)
                    });

                var totalCount = await groupedQuery.CountAsync(cancellationToken);

                var pagedInvoices = await groupedQuery
                    .OrderByDescending(x => x.InvoiceDate)
                    .ThenByDescending(x => x.InvoiceNo)
                    .Skip(pageIndex.HasValue && pageSize.HasValue ? (pageIndex.Value - 1) * pageSize.Value : 0)
                    .Take(pageIndex.HasValue && pageSize.HasValue ? pageSize.Value : int.MaxValue)
                    .Select(x => x.InvoiceNo)
                    .ToListAsync(cancellationToken);

                #endregion

                #region FETCH DETAILS FOR PAGED INVOICES

                var data = await query
                    .Where(x => pagedInvoices.Contains(x.InvoiceNo))
                    .OrderByDescending(x => x.InvoiceDate)
                    .ToListAsync(cancellationToken);

                #endregion

                #region ITEM LOOKUP

                var materialNumbers = data
                    .Select(x => x.MaterialCode)
                    .Distinct()
                    .ToList();

                var items = await _item_Repository.Query()
                    .Where(x => materialNumbers.Contains(x.MaterialNumber) && x.TenantId == request.TenantId)
                    .ToListAsync(cancellationToken);

                var itemLookup = items.ToDictionary(x => x.MaterialNumber, x => x.Id);
                var itemNameLookup = items.ToDictionary(x => x.MaterialNumber, x => x.Name);

                #endregion

                #region MAP RESULT

                var result = data.Select(x => new InvoiceDataResponse
                {
                    Id = x.Id,
                    ItemId = itemLookup.TryGetValue(x.MaterialCode, out var itemId) ? itemId : (int?)null,
                    ItemName = itemNameLookup.TryGetValue(x.MaterialCode, out var name) ? name : null,
                    InvoiceNo = x.InvoiceNo,
                    MaterialCode = x.MaterialCode,
                    InvoiceDate = x.InvoiceDate,
                    DealerCode = x.DealerCode,
                    UnitPrice = x.UnitPrice,
                    NetPrice = x.NetPrice,
                    Quantity = x.Quantity,
                    TotalCount = totalCount
                })
                .Where(p => p.ItemId != null)
                .ToList();

                #endregion

                #region FINAL GROUPING

                return result
                    .GroupBy(x => new
                    {
                        x.DealerCode,
                        x.InvoiceNo,
                        x.InvoiceDate
                    })
                    .Select(g => new SapSalesMasterResponse
                    {
                        SoldToParty = g.Key.DealerCode,
                        BillingDocument = g.Key.InvoiceNo,
                        BillingDate = g.Key.InvoiceDate,
                        TotalCount = totalCount,

                        SapSalesDetails = g.Select(d => new SapSalesDetailResponse
                        {
                            MaterialGroup = null,
                            ItemId = d.ItemId,
                            MaterialNumber = d.MaterialCode,
                            MaterialGroupDescription = null,
                            SoldToPartyCode = d.DealerCode,
                            MaterialDescription = d.ItemName,
                            InvoiceAmount = Convert.ToString(d.NetPrice),
                            TaxAmount = "0",
                            ActualBilledQuantity = Convert.ToString(d.Quantity)
                        }).ToList()
                    })
                    .ToList();

                #endregion
                //int? pageIndex = request.PageIndex > 0 ? request.PageIndex : null;
                //int? pageSize = request.PageSize > 0 ? request.PageSize : null;

                //var tenant = await _tenant_Repository.Query()
                //    .FirstOrDefaultAsync(x => x.Id == request.TenantId, cancellationToken)
                //    ?? throw new KeyNotFoundException("Invalid Tenant");

                //IQueryable<InvoiceData> query = _sapSalesData_Repository
                //    .Query()
                //    .Where(x => x.DealerCode == tenant.TenantCustomerNo);

                //if (request.IsCustomerRecieved.HasValue)
                //{
                //    var csearch = request.IsCustomerRecieved.Value;
                //    if(csearch == true)
                //    {
                //        query = query.Where(x => x.IsCustomerRecieved == true);
                //    }
                //    else
                //    {
                //         query = query.Where(x => x.IsCustomerRecieved == false || x.IsCustomerRecieved == null);
                //    }
                //}

                //if (!string.IsNullOrWhiteSpace(request.SearchText))
                //{
                //    var search = request.SearchText.Trim();
                //    query = query.Where(x => x.InvoiceNo.Contains(search));
                //}

                //var totalCount = await query
                //    .Select(x => x.InvoiceNo)
                //    .Distinct()
                //    .CountAsync(cancellationToken);

                //List<string> invoiceNos = null;

                //if (pageIndex.HasValue && pageSize.HasValue)
                //{
                //    invoiceNos = await query
                //        //.GroupBy(x => x.InvoiceNo)
                //        //.Select(g => new
                //        //{
                //        //    InvoiceNo = g.Key,
                //        //    InvoiceDate = g.Max(x => x.InvoiceDate) 
                //        //})
                //        //.OrderByDescending(x => x.InvoiceDate)
                //        //.Skip((pageIndex.Value - 1) * pageSize.Value)
                //        //.Take(pageSize.Value)
                //        .Select(x => x.InvoiceNo)
                //        .ToListAsync(cancellationToken);

                //    query = query.Where(x => invoiceNos.Contains(x.InvoiceNo));
                //}

                //var data = await query
                //    .OrderByDescending(x => x.InvoiceDate)
                //    .ToListAsync(cancellationToken);

                //var materialNumbers = data
                //    .Select(x => x.MaterialCode)
                //    .Distinct()
                //    .ToList();

                //var items = await _item_Repository
                //    .Query()
                //    .Where(x => materialNumbers.Contains(x.MaterialNumber) && x.TenantId == request.TenantId)
                //    .ToListAsync(cancellationToken);

                //var itemLookup = items.ToDictionary(x => x.MaterialNumber, x => x.Id);
                //var itemNameLookup = items.ToDictionary(x => x.MaterialNumber, x => x.Name);

                //var result = data.Select(x => new InvoiceDataResponse
                //{
                //    Id = x.Id,
                //    ItemId = itemLookup.TryGetValue(x.MaterialCode, out var itemId) ? itemId : (int?)null,
                //    ItemName = itemNameLookup.TryGetValue(x.MaterialCode, out var name) ? name : null,
                //    InvoiceNo = x.InvoiceNo,
                //    MaterialCode = x.MaterialCode,
                //    InvoiceDate = x.InvoiceDate,
                //    DealerCode = x.DealerCode,
                //    UnitPrice = x.UnitPrice,
                //    NetPrice = x.NetPrice,
                //    Quantity = x.Quantity,
                //    TotalCount = totalCount
                //})
                //.Where(p => p.ItemId != null)
                //.ToList();

                //return result
                //.GroupBy(x => new
                //{
                //    x.DealerCode,
                //    x.InvoiceNo,
                //    x.InvoiceDate
                //})
                //.Select(g => new SapSalesMasterResponse
                //{
                //    SoldToParty = g.Key.DealerCode,
                //    BillingDocument = g.Key.InvoiceNo,
                //    BillingDate = g.Key.InvoiceDate,
                //    TotalCount = totalCount,

                //    SapSalesDetails = g.Select(d => new SapSalesDetailResponse
                //    {
                //        MaterialGroup = null,
                //        ItemId = d.ItemId,
                //        MaterialNumber = d.MaterialCode,
                //        MaterialGroupDescription = null,
                //        SoldToPartyCode = d.DealerCode,
                //        MaterialDescription = d.ItemName,
                //        InvoiceAmount = Convert.ToString(d.NetPrice),
                //        TaxAmount = "0",
                //        ActualBilledQuantity = Convert.ToString(d.Quantity)
                //    }).ToList()

                //}).ToList();
            }
        }
    }
}
