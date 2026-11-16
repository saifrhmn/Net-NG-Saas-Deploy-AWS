using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.ReturnOrder;
using Karbar.Domain.Entities.ReturnOrder;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Karbar.Application.Features.ReturnOrder.Queries
{
    public static class GetAllReturnOrders
    {
        public sealed class Query : IRequest<List<ReturnOrderResponse>>
        {
            public string? SearchText { get; set; }
            public int? TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<ReturnOrderResponse>>
        {
            private readonly IGenericRepository<ReturnOrderMaster> _masterRepository;

            public QueryHandler(IGenericRepository<ReturnOrderMaster> masterRepository)
            {
                _masterRepository = masterRepository;
            }

            public async Task<List<ReturnOrderResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _masterRepository.Query()
                                .AsNoTracking()
                                .AsSplitQuery()
                                .Include(x => x.ReturnOrderDetails)
                                    .ThenInclude(d => d.Item)
                                        .ThenInclude(i => i.Uom)
                                .Include(x => x.ReturnOrderDetails)
                                    .ThenInclude(d => d.Warehouse)
                                .Include(x => x.ReturnOrderDetails)
                                    .ThenInclude(d => d.Uom)
                                .Include(x => x.Customer)
                                .AsQueryable();

                if (request.TenantId > 1 || request.TenantId == -1)
                {
                    query = query.Where(x => x.TenantId == request.TenantId);
                }
                if (request.FromDate.HasValue && request.ToDate.HasValue)
                {
                    var fromDate = request.FromDate.Value.Date;
                    var toDate = request.ToDate.Value.Date.AddDays(1).AddTicks(-1);

                    query = query.Where(p => p.SalesDate >= fromDate && p.SalesDate <= toDate);
                }
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(x =>
                        (x.SalesInvoiceNo != null && x.SalesInvoiceNo.ToLower().Contains(search)) ||
                        (x.ReturnOrderDetails.Any(d =>
                            d.Item != null &&
                            d.Item.Name != null &&
                            d.Item.Name.ToLower().Contains(search))) ||
                        (x.Customer != null && x.Customer.Name.ToLower().Contains(search)) ||
                        (x.Customer != null && x.Customer.Contact != null && x.Customer.Contact.ToLower().Contains(search)));
                }   

                var totalCount = await query.CountAsync(cancellationToken);

                query = query.OrderByDescending(x => x.Id);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query.Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                                 .Take(request.PageSize.Value);
                }

                var list = await query.ToListAsync(cancellationToken);

                var searchText = string.IsNullOrWhiteSpace(request.SearchText)
                    ? null
                    : request.SearchText.Trim().ToLower();

                List<ReturnOrderDetail> FilterDetails(ReturnOrderMaster m)
                {
                    var details = m.ReturnOrderDetails?.ToList() ?? new List<ReturnOrderDetail>();
                    if (searchText == null) return details;

                    var matching = details
                        .Where(d => d.Item != null && d.Item.Name != null && d.Item.Name.ToLower().Contains(searchText))
                        .ToList();

                    return matching.Count > 0 ? matching : details;
                }

                var result = list.Select(m => new ReturnOrderResponse
                {
                    Id = m.Id,
                    SalesInvoiceNo = m.SalesInvoiceNo,
                    ReturnOrderId = m.ReturnOrderId,
                    SalesDate = m.SalesDate,

                    CustomerId = m.CustomerId,
                    CustomerName = m.Customer?.Name ?? "",
                    CustomerPhone = m.Customer?.Contact ?? "",

                    TotalAmount = m.TotalAmount,
                    DiscountAmount = m.DiscountAmount,
                    Vat = m.Vat,
                    Tax = m.Tax,
                    PaymentMethod = m.PaymentMethod,
                    MobileBankMethod = m.MobileBankMethod,
                    PhoneNumber = m.PhoneNumber,
                    BankId = m.BankId,
                    CardNumber = m.CardNumber,
                    WarehouseId = m.WarehouseId,
                    TenantId = m.TenantId,
                    Remarks = m.Remarks,
                    TotalCount = totalCount,

                    ReturnOrderDetails = FilterDetails(m).Select(d => new ReturnOrderDetailResponse
                    {
                        Id = d.Id,
                        ReturnOrderDetailId = d.ReturnOrderDetailId,
                        ItemId = d.ItemId,
                        ItemName = d.Item?.Name ?? "",
                        UomId = d.UomId,
                        UomName = d.Uom?.Name ?? d.Item?.Uom?.Name ?? "",
                        WarehouseId = d.WarehouseId,
                        WarehouseName = d.Warehouse?.Name ?? "",
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice,
                        TotalAmount = d.TotalAmount
                    }).ToList() ?? new List<ReturnOrderDetailResponse>()
                }).ToList();

                return result;
            }
        }
    }
}
