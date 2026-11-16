using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetPurchaseReport
    {
        public sealed class Query : IRequest<List<PurchaseReportResponse>>
        {
            public int? TenantId { get; set; }
            public int? ItemId { get; set; }
            public int? CategoryId { get; set; }
            public int? BrandId { get; set; }
            public int? WarehouseId { get; set; }
            public string InvoiceNo { get; set; }
            public string FromDate { get; set; }
            public string ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public string? SearchMaterial { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<PurchaseReportResponse>>
        {
            private readonly IGenericRepository<PurchaseReportResponse> _repository;
            public QueryHandler(IGenericRepository<PurchaseReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<PurchaseReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    DateTime? fromDate = string.IsNullOrWhiteSpace(request.FromDate)
                           ? null
                           : DateTime.Parse(request.FromDate);
                    DateTime? toDate = string.IsNullOrWhiteSpace(request.ToDate)
                            ? null
                            : DateTime.Parse(request.ToDate);

                    var result = await _repository.ExecuteStoredProcedureAsync<PurchaseReportResponse>(
                                @"EXEC GetPurchaseReport 
                                @TenantId,
                                @ItemId,
                                @CategoryId,
                                @BrandId,
                                @WarehouseId,
                                @InvoiceNo,
                                @FromDate,
                                @ToDate,
                                @PageIndex,
                                @PageSize,
                                @SearchMaterial",
                                cancellationToken,

                                new SqlParameter("@TenantId", request.TenantId ?? (object)DBNull.Value),
                                new SqlParameter("@ItemId", request.ItemId ?? (object)DBNull.Value),
                                new SqlParameter("@CategoryId", request.CategoryId ?? (object)DBNull.Value),
                                new SqlParameter("@BrandId", request.BrandId ?? (object)DBNull.Value),
                                new SqlParameter("@WarehouseId", request.WarehouseId ?? (object)DBNull.Value),
                                new SqlParameter("@InvoiceNo", request.InvoiceNo ?? (object)DBNull.Value),
                                new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                                new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                                new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                                new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value),
                                new SqlParameter("@SearchMaterial", request.SearchMaterial  ?? (object)DBNull.Value)
                            );

                    var response = result.Adapt<List<PurchaseReportResponse>>() ?? new List<PurchaseReportResponse>();

                    return response;
                }
                catch (Exception ex)
                {

                    throw ex;
                }
            }
        }
    }
}