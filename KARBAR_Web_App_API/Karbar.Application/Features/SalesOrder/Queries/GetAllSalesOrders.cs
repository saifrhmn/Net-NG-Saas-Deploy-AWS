using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.SalesOrder;
using Karbar.Domain.Entities.ReturnOrder;
using Karbar.Domain.Entities.SalesOrder;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Karbar.Application.Features.SalesOrder.Queries
{
    public static class GetAllSalesOrders
    {
        public sealed class Query : IRequest<List<SalesOrderResponse>> 
        { 
             public string? SearchText { get; set; }
            public int? TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public bool? IsReturn { get; set; }
            public bool? IsDraft { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<SalesOrderResponse>>
        {
            private readonly IGenericRepository<SalesOrderMaster> _masterRepository;
            private readonly IGenericRepository<ReturnOrderMaster> _masterReturnRepository;
            private readonly IGenericRepository<ReturnOrderDetail> _detailReturnRepository;
            public QueryHandler(IGenericRepository<SalesOrderMaster> masterRepository, IGenericRepository<ReturnOrderMaster> masterReturnRepository, IGenericRepository<ReturnOrderDetail> detailReturnRepository)
            {
                _masterRepository = masterRepository;
                _masterReturnRepository = masterReturnRepository;
                _detailReturnRepository = detailReturnRepository;
            }

            public async Task<List<SalesOrderResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _masterRepository.Query()
                             .Include(x => x.SalesOrderDetails)
                                 .ThenInclude(d => d.Item)
                                     .ThenInclude(i => i.Uom)
                             .Include(x => x.Customer)
                             .Include(x => x.SalesOrderDetails)
                                 .ThenInclude(d => d.Warehouse)
                             .AsQueryable();
                query = query.Where(m =>
        m.SalesOrderDetails.Any(d =>
            d.Status == StatusEnum.Active &&
            d.Quantity !=
            (
                _detailReturnRepository.Query()
                .Where(rd =>
                    rd.ReturnOrderMaster.SalesInvoiceNo == m.InvoiceNo &&
                    m.IsDraft == false &&
                    rd.ItemId == d.ItemId)
                .Sum(rd => (decimal?)rd.Quantity) ?? 0
            )
        )
    );
                // Tenant filter
                if (request.TenantId > 1 || request.TenantId == -1)
                {
                    query = query.Where(x => x.TenantId == request.TenantId);
                }
                if (request.FromDate.HasValue && request.ToDate.HasValue)
                {
                    var fromDate = request.FromDate.Value.Date;
                    var toDate = request.ToDate.Value.Date.AddDays(1).AddTicks(-1);

                    query = query.Where(p => p.OrderDate >= fromDate && p.OrderDate <= toDate);
                }
                if (request.IsDraft.HasValue)
                {
                    query = query.Where(x => x.IsDraft == request.IsDraft);
                }
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();

                    query = query.Where(x =>
                        x.InvoiceNo.ToLower().Contains(search) ||
                        x.Customer.Name.ToLower().Contains(search)
                        || x.Customer.Contact.ToLower().Contains(search));

                }

                // Count BEFORE pagination
                var totalCount = await query.CountAsync(cancellationToken);

                // Ordering
                query = query.OrderByDescending(x => x.CreatedDate);

                // Pagination
                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                // Execute query
                var list = await query.ToListAsync(cancellationToken);

                var result = await query.Select(m => new SalesOrderResponse
                {
                    Id = m.Id,
                    SalesOrderId = m.SalesOrderId,
                    InvoiceNo = m.InvoiceNo,
                    OrderDate = m.OrderDate.ToString(),
                    CustomerId = m.CustomerId,

                    CustomerName = m.Customer != null ? m.Customer.Name : "",
                    CustomerPhone = m.Customer != null ? m.Customer.Contact : "",
                    CustomerAddress = m.Customer != null ? m.Customer.Address + " " + m.Customer.AddressLine1 + " "+ m.Customer.AddressLine2 : "",

                    TotalAmount = m.TotalAmount,
                    DiscountAmount = m.DiscountAmount,
                    PaidAmount = m.PaidAmount,
                    DueAmount = m.DueAmount,
                    SubTotal = m.SubTotal,
                    Vat = m.Vat,
                    Tax = m.Tax,
                    DeliveryCharge = m.DeliveryCharge,
                    IsDraft = m.IsDraft,
                    Remarks = m.Remarks,
                    IsReturn = m.IsReturn,
                    PaymentMethod = m.PaymentMethod != null ? m.PaymentMethod.ToString() : null,
                    TenantId = m.TenantId,
                    TotalReturnQuantity = m.SalesOrderDetails
                                .Where(d => d.Status == StatusEnum.Active)
                                .Sum(d =>
                                    _detailReturnRepository.Query()
                                        .Where(rd =>
                                            rd.ReturnOrderMaster.SalesInvoiceNo == m.InvoiceNo &&
                                            m.IsDraft == false &&
                                            rd.ItemId == d.ItemId)
                                        .Sum(rd => (decimal?)rd.Quantity) ?? 0
                                ),

                    TotalReturnAmount = m.SalesOrderDetails
                                .Where(d => d.Status == StatusEnum.Active)
                                .Sum(d =>
                                    _detailReturnRepository.Query()
                                        .Where(rd =>
                                            rd.ReturnOrderMaster.SalesInvoiceNo == m.InvoiceNo &&
                                            m.IsDraft == false &&
                                            rd.ItemId == d.ItemId)
                                        .Sum(rd => (decimal?)rd.TotalAmount) ?? 0
                                ),
                    SalesOrderDetails = m.SalesOrderDetails
                .Where(t => t.Status == StatusEnum.Active)
                .Where(tt => tt.IsReturn == request.IsReturn || tt.IsReturn == true)

                .Select(d => new
                {
                    Detail = d,

                    ReturnQty = _detailReturnRepository.Query()
                        .Where(rd =>
                            rd.ReturnOrderMaster.SalesInvoiceNo == m.InvoiceNo &&
                            m.IsDraft == false &&
                            d.ItemId == rd.ItemId)
                        .Sum(rd => (decimal?)rd.Quantity) ?? 0,

                    ReturnAmount = _detailReturnRepository.Query()
                        .Where(rd =>
                            rd.ReturnOrderMaster.SalesInvoiceNo == m.InvoiceNo &&
                            m.IsDraft == false &&
                            d.ItemId == rd.ItemId)
                        .Sum(rd => (decimal?)rd.TotalAmount) ?? 0
                })

                // ✅ THEN filter
                .Where(x => x.Detail.Quantity != x.ReturnQty)

                // 🔥 FINAL projection
                .Select(x => new SalesOrderDetailResponse
                {
                    Id = x.Detail.Id,
                    ItemId = x.Detail.ItemId,
                    ItemName = x.Detail.Item.Name,
                    UomId = x.Detail.UomId,
                    UomName = x.Detail.Item.Uom.Name,
                    Quantity = x.Detail.Quantity,
                    UnitPrice = x.Detail.UnitPrice,
                    ReturnQuantity = x.ReturnQty,
                    ActualSalesQuantity = x.Detail.Quantity - x.ReturnQty,
                    ReturnTotalAmount = x.ReturnAmount,
                    WarehouseId = x.Detail.WarehouseId,
                    WarehouseName = x.Detail.Warehouse.Name,
                    ShadesName = x.Detail.ShadesName,
                    IsReturn = x.Detail.IsReturn,
                })
                .ToList()

                }).ToListAsync(cancellationToken);
                return result;

            }
        }
    }
}