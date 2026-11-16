using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.RequestOrder;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.RequestOrder;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.RequestOrder.Queries
{
    public class GetAllRO
    {
        public sealed class Query : IRequest<List<RequestOrderResponse>>
        {
            public string? SearchText { get; set; }
            public bool ? IsBerger { get; set; }
            public string? OrderStatus { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }
        public sealed class QueryHandler : IRequestHandler<Query, List<RequestOrderResponse>>
        {
            private readonly IGenericRepository<RequestOrderMaster> _repository;

            public QueryHandler(IGenericRepository<RequestOrderMaster> repository)
            {
                _repository = repository;
            }

            public async Task<List<RequestOrderResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                    .Query()
                    .Include(p => p.Tenant)
                    .Include(p => p.RequestOrderDetails)
                     .ThenInclude(p => p.Item)
                    .Include(p => p.RequestOrderDetails)
                      .ThenInclude(p => p.Uom)
                    .Include(p => p.RequestOrderDetails)
                      .ThenInclude(p => p.Supplier)
                    .Include(p => p.RequestOrderDetails)
                      .ThenInclude(p => p.Warehouse)
                    .AsQueryable();

                if (request.TenantId > 1 || request.TenantId == -1)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }
                else { 
                }

                if (request.IsBerger.HasValue)
                {
                    query = query.Where(p => p.IsBerger == request.IsBerger);
                }

                if (!string.IsNullOrWhiteSpace(request.OrderStatus))
                {
                    var status = request.OrderStatus.Trim().ToLower();
                    query = query.Where(p => p.OrderStatus != null && p.OrderStatus.ToLower() == status);
                }

                if (request.FromDate.HasValue && request.ToDate.HasValue)
                {
                    var fromDate = request.FromDate.Value.Date;
                    var toDate = request.ToDate.Value.Date.AddDays(1).AddTicks(-1);

                    query = query.Where(p =>
                        p.CreatedDate >= fromDate &&
                        p.CreatedDate <= toDate);
                }

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p => (p.PurchaseInvoiceNo != null && p.PurchaseInvoiceNo.ToLower().Contains(search))
                                            || (p.PurchaseOrderId != null && p.PurchaseOrderId.ToLower().Contains(search)));
                }

                var totalCount = await query.CountAsync(cancellationToken);
                query = query.OrderByDescending(x => x.CreatedDate);
                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var orders = await query.ToListAsync(cancellationToken);

                var response = orders.Select(order => new RequestOrderResponse
                {
                    Id = order.Id,
                    PurchaseInvoiceNo = order.PurchaseInvoiceNo,
                    PurchaseOrderId = order.PurchaseOrderId,
                    PurchaseDate = order.PurchaseDate,
                    RecievedDate = order.ReceivedDate,
                    TenantId = order.TenantId,
                    TenantName = order.Tenant?.Name ?? "",
                    TenantCode = order.Tenant?.TenantCustomerNo ?? "",
                    TotalAmount = order.TotalAmount,
                    DiscountAmount = order.DiscountAmount,
                    Tax = order.Tax,
                    Vat = order.Vat,
                    IsBerger = order.IsBerger,
                    OrderStatus = order.OrderStatus,
                    ReceivedDate = order.ReceivedDate,

                    RequestOrderDetails = order.RequestOrderDetails.Select(detail => new RequestOrderDetailResponse
                    {
                        Id = detail.Id,
                        PurchaseOrderDetailId = detail.RequestOrderDetailId,
                        ItemId = detail.ItemId ?? 0,
                        ItemName = detail.Item?.Name ?? "",
                        MaterialNumber = detail.Item?.MaterialNumber ?? "",
                        UomId = detail.UomId ?? 0,
                        UomName = detail.Uom?.Name ?? "",
                        SupplierId = detail.SupplierId ?? 0,
                        SupplierName = detail.Supplier?.Name ?? "",
                        WarehouseId = detail.WarehouseId ?? 0,
                        Quantity = detail.Quantity,
                        UnitPrice = detail.UnitPrice,
                        TotalAmount = detail.TotalAmount,
                    }).ToList()
                }).ToList();
                return response;
            }
        }
    }
}
