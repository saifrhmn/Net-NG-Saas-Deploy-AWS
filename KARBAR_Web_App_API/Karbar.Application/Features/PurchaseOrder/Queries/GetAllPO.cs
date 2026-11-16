using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.PurchaseOrder;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.PurchaseOrder.Queries
{
    public class GetAllPO
    {
        public sealed class Query : IRequest<List<PurchaseOrderResponse>>
        {
            public string? SearchText { get; set; }
            public int TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public bool? IsReturn { get; set; }
        }
        public sealed class QueryHandler : IRequestHandler<Query, List<PurchaseOrderResponse>>
        {
            private readonly IGenericRepository<PurchaseOrderMaster> _repository;

            public QueryHandler(IGenericRepository<PurchaseOrderMaster> repository)
            {
                _repository = repository;
            }

            public async Task<List<PurchaseOrderResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                    .Query()
                    .Include(p => p.PurchaseDetails)
                     .ThenInclude(p => p.Item)
                    .Include(p => p.PurchaseDetails)
                      .ThenInclude(p => p.Uom)
                    .Include(p => p.PurchaseDetails)
                      .ThenInclude(p => p.Supplier)
                    .Include(p => p.PurchaseDetails)
                      .ThenInclude(p => p.Warehouse)
                    .AsQueryable();

                if (request.TenantId > 1 || request.TenantId == -1)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }

                // Optional search
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim();
                    query = query.Where(x => x.PurchaseInvoiceNo.Contains(search));
                }

                // Count before pagination
                var totalCount = await query.CountAsync(cancellationToken);
                query = query.OrderByDescending(x => x.CreatedDate);
                // Pagination
                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                // Execute query
                var orders = await query.ToListAsync(cancellationToken);

                // Manual mapping to response
                var response = orders.Select(order => new PurchaseOrderResponse
                {
                    Id = order.Id,
                    PurchaseInvoiceNo= order.PurchaseInvoiceNo,
                    PurchaseOrderId = order.PurchaseOrderId,
                    PurchaseDate = order.PurchaseDate.ToString("MM/dd/yy"),
                    RecievedDate = order.RecievedDate,
                    TenantId = order.TenantId,
                    TotalAmount = order.TotalAmount,
                    DiscountAmount = order.DiscountAmount,
                    Tax = order.Tax,
                    Vat = order.Vat,

                    PurchaseDetails = order.PurchaseDetails.Select(detail => new PurchaseOrderDetailResponse
                    {
                        Id = detail.Id,
                        PurchaseOrderDetailId = detail.PurchaseOrderDetailId,
                        ItemId = detail.ItemId,                              
                        ItemName = detail.Item?.Name ?? "",
                        UomId = detail.UomId,                                
                        UomName = detail.Uom?.Name ?? "",
                        SupplierId = detail.SupplierId,
                        SupplierName = detail.Supplier?.Name ?? "",
                        WarehouseId = detail.WarehouseId,
                        Quantity = detail.Quantity,
                        UnitPrice = detail.UnitPrice,
                        TotalAmount = detail.TotalAmount,
                        IsReturn = detail.IsReturn,
                        WeightedAveragePrice = detail.Item.WeightedAveragePrice,
                        WeightedAveragePriceUpdatetdDate = detail.Item.WeightedAveragePriceUpdatetdDate,
                    }).ToList()
                }).ToList();



                return response;
            }
        }
    }
}
