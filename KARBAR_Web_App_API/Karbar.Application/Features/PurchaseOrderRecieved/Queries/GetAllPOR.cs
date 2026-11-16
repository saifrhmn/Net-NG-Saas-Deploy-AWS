using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.PurchaseOrderRecieved;
using Karbar.Domain.Entities.PurchaseOrderRecieved;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Karbar.Application.Features.PurchaseOrderRecieved.Queries
{
    public class GetAllPOR
    {
        public sealed class Query : IRequest<List<PurchaseOrderRecievedResponse>>
        {
            public string? SearchText { get; set; }
            public int TenantId { get; set; }
            public bool? IsCompleted { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<PurchaseOrderRecievedResponse>>
        {
            private readonly IGenericRepository<PurchaseOrderRecievedMaster> _repository;

            public QueryHandler(IGenericRepository<PurchaseOrderRecievedMaster> repository)
            {
                _repository = repository;
            }

            public async Task<List<PurchaseOrderRecievedResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                    .Query()
                        .IgnoreQueryFilters()
                    .Include(p => p.PurchaseOrderDetails)
                        .ThenInclude(d => d.Item)
                    .Include(p => p.PurchaseOrderDetails)
                        .ThenInclude(d => d.Uom)
                    .Include(p => p.PurchaseOrderDetails)
                        .ThenInclude(d => d.Supplier)
                    .Include(p => p.PurchaseOrderDetails)
                        .ThenInclude(d => d.Warehouse)
                    .AsQueryable();

                if (request.TenantId > 0)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }
                if (request.FromDate.HasValue && request.ToDate.HasValue)
                {
                    var fromDate = request.FromDate.Value.Date;
                    var toDate = request.ToDate.Value.Date.AddDays(1).AddTicks(-1);

                    query = query.Where(p => p.RecievedDate >= fromDate && p.RecievedDate <= toDate);
                }
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p => (p.RecievedNo != null && p.RecievedNo.ToLower().Contains(search))
                                            || (p.RequestOrderNo != null && p.RequestOrderNo.ToLower().Contains(search)));
                }
                if (request.IsCompleted.HasValue)
                {
                    switch (request.IsCompleted.Value)
                    {
                        case true:
                            query = query.Where(x => x.PurchaseOrderDetails.Sum(d => d.RemainingQty) == 0);
                            break;
                        case false:
                            query = query.Where(x => x.PurchaseOrderDetails.Sum(d => d.RemainingQty) > 0);
                            break;
                        default:
                            break;
                    }
                }

                var totalCount = await query.CountAsync(cancellationToken);

                //query = query.OrderByDescending(x => x.CreatedDate);
                var orders = await query.OrderByDescending(x => x.Id).ToListAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query.Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                                 .Take(request.PageSize.Value);
                }

               
                var response = orders.Select(order => new PurchaseOrderRecievedResponse
                {
                    Id = order.Id,
                    RecievedNo = order.RecievedNo,
                    RecievedOrderId = order.RecievedOrderId,
                    RecievedDate = order.RecievedDate,
                    CreatedDate = order.CreatedDate,
                    PaidAmount = order.PaidAmount,
                    TotalAmount = order.TotalAmount,
                    BergerTotalPurchaseAmount = order.BergerTotalPurchaseAmount,
                    DiscountAmount = order.DiscountAmount,
                    Tax = order.Tax,
                    Vat = order.Vat,
                    RequestOrderNo = order.RequestOrderNo,
                    TenantId = order.TenantId,

                    PurchaseDetails = order.PurchaseOrderDetails.Select(detail => new PurchaseOrderRecievedDetailResponse
                    {
                        Id = detail.Id,
                        PurchaseOrderDetailId = detail.PurchaseOrderDetailId,
                        ItemId = detail.ItemId ?? 0,
                        ItemName = detail.Item?.Name ?? "",
                        UomId = detail.UomId ?? 0,
                        UomName = detail.Uom?.Name ?? "",
                        SupplierId = detail.SupplierId ?? 0,
                        SupplierName = detail.Supplier?.Name ?? "",
                        WarehouseId = detail.WarehouseId ?? 0,
                        WarehouseName = detail.Warehouse?.Name ?? "",
                        InvoiceQty = detail.InvoiceQty,
                        RemainingQty= detail.RemainingQty,
                        UnitPrice = detail.UnitPrice,
                        TotalAmount = detail.TotalAmount,
                        BergerPurchaseAmount = detail.BergerPurchaseAmount,
                        OrderStatus = detail.OrderStatus,
                        WeightedAveragePrice = detail.Item.WeightedAveragePrice,
                        WeightedAveragePriceUpdatetdDate = detail.Item.WeightedAveragePriceUpdatetdDate,
                    }).ToList(),

                    IsCompleted = order.PurchaseOrderDetails.Sum(x => x.RemainingQty) > 0 ? false : true,
                    TotalCount = totalCount
                }).ToList();

                return response;
            }
        }
    }
}
