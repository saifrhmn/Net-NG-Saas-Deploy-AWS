using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.PurchaseReturn;
using Karbar.Domain.Entities.PurchaseReturn;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Karbar.Application.Features.PurchaseReturn.Queries
{
    public static class GetAllPurchaseReturns
    {
        #region Query
        public sealed class Query : IRequest<List<PurchaseReturnResponse>>
        {
            public string? SearchText { get; set; }
            public int TenantId { get; set; }
            public int PageIndex { get; set; } 
            public int PageSize { get; set; } 
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
        }
        #endregion

        #region Handler
        public sealed class QueryHandler : IRequestHandler<Query, List<PurchaseReturnResponse>>
        {
            private readonly IGenericRepository<PurchaseReturnMaster> _masterRepository;
            private readonly IGenericRepository<PurchaseReturnDetail> _detailRepository;

            public QueryHandler(
                IGenericRepository<PurchaseReturnMaster> masterRepository,
                IGenericRepository<PurchaseReturnDetail> detailRepository)
            {
                _masterRepository = masterRepository;
                _detailRepository = detailRepository;
            }

            public async Task<List<PurchaseReturnResponse>> Handle(
    Query request,
    CancellationToken cancellationToken)
            {
                try
                {
                    // =========================================================
                    // 1. Build query
                    // =========================================================
                    var query = _masterRepository
                        .Query()
                        .AsNoTracking()
                        .Include(p => p.Supplier)
                        .Include(p => p.PurchaseReturnDetails)
                            .ThenInclude(d => d.Item)
                        .Include(p => p.PurchaseReturnDetails)
                            .ThenInclude(d => d.Uom)
                        .Include(p => p.PurchaseReturnDetails)
                            .ThenInclude(d => d.Warehouse)
                        .AsQueryable();


                    // =========================================================
                    // 2. Tenant filter
                    // =========================================================
                    query = query.Where(x =>
                        x.TenantId == request.TenantId);


                    // =========================================================
                    // 3. Search filter
                    // =========================================================
                    if (!string.IsNullOrWhiteSpace(request.SearchText))
                    {
                        query = query.Where(x =>
                            x.PurchaseReturnId.Contains(request.SearchText) ||
                            x.PurchaseInvoiceNo.Contains(request.SearchText));
                    }


                    // =========================================================
                    // 4. From date
                    // =========================================================
                    if (request.FromDate.HasValue)
                    {
                        query = query.Where(x =>
                            x.PurchaseDate >= request.FromDate.Value);
                    }


                    // =========================================================
                    // 5. To date
                    // =========================================================
                    if (request.ToDate.HasValue)
                    {
                        var toDate = request.ToDate.Value.Date.AddDays(1);

                        query = query.Where(x =>
                            x.PurchaseDate < toDate);
                    }


                    // =========================================================
                    // 6. Total count before pagination
                    // =========================================================
                    var totalCount = await query
                        .CountAsync(cancellationToken);


                    // =========================================================
                    // 7. Pagination
                    // =========================================================
                    var pageIndex = request.PageIndex <= 0
                        ? 1
                        : request.PageIndex;

                    var pageSize = request.PageSize <= 0
                        ? 10
                        : request.PageSize;

                    var skip = (pageIndex - 1) * pageSize;


                    // =========================================================
                    // 8. Get Purchase Returns
                    // =========================================================
                    var purchaseReturns = await query
                        .OrderByDescending(x => x.CreatedDate)
                        .Skip(skip)
                        .Take(pageSize)
                        .ToListAsync(cancellationToken);


                    // =========================================================
                    // 9. Map response
                    // =========================================================
                    var response = purchaseReturns
                        .Select(pr => new PurchaseReturnResponse
                        {
                            Id = pr.Id,

                            PurchaseReturnId =
                                pr.PurchaseReturnId,

                            PurchaseInvoiceNo =
                                pr.PurchaseInvoiceNo,

                            PurchaseDate =
                                pr.PurchaseDate,


                            // =====================================================
                            // Supplier belongs to MASTER
                            // =====================================================
                            SupplierId =
                                pr.SupplierId,

                            SupplierName =
                                pr.Supplier?.Name,


                            TotalAmount =
                                (decimal)pr.TotalAmount,

                            DiscountAmount =
                                (decimal)pr.DiscountAmount,

                            Tax =
                                (decimal)pr.Tax,

                            Vat =
                                (decimal)pr.Vat,


                            PaymentMethod =
                                pr.PaymentMethod,

                            MobileBankMethod =
                                pr.MobileBankMethod,

                            PhoneNumber =
                                pr.PhoneNumber,

                            BankId =
                                pr.BankId,

                            CardNumber =
                                pr.CardNumber,

                            WarehouseId =
                                (int)pr.WarehouseId,

                            WarehouseName =
                                null,

                            TenantId =
                                (int)pr.TenantId,

                            Remarks =
                                pr.Remarks,

                            CreatedDate =
                                pr.CreatedDate,

                            CreatedBy =
                                pr.CreatedBy,

                            UpdatedDate =
                                pr.UpdatedDate,

                            UpdatedBy =
                                pr.UpdatedBy,


                            // =====================================================
                            // Details
                            // =====================================================
                            PurchaseReturnDetails =
                                pr.PurchaseReturnDetails?
                                    .Select(d => new PurchaseReturnDetailResponse
                                    {
                                        Id =
                                            d.Id,

                                        PurchaseReturnId =
                                            d.PurchaseReturnId,

                                        ItemId =
                                            d.ItemId,

                                        ItemName =
                                            d.Item?.Name ?? "",

                                        UomId =
                                            d.UomId,

                                        UomName =
                                            d.Uom?.Name ?? "",


                                        // Supplier is from MASTER
                                        SupplierId =
                                            pr.SupplierId,

                                        SupplierName =
                                            pr.Supplier?.Name ?? "",


                                        WarehouseId =
                                            d.WarehouseId,

                                        Quantity =
                                            d.Quantity,

                                        UnitPrice =
                                            d.UnitPrice,

                                        TotalAmount =
                                            d.TotalAmount
                                    })
                                    .ToList()
                                ?? new List<PurchaseReturnDetailResponse>()

                        })
                        .ToList();


                    return response;
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException(
                        $"Error retrieving purchase returns: {ex.Message}",
                        ex);
                }
            }
        }
        #endregion
    }
}