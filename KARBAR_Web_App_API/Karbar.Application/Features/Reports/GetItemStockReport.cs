using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Brand;
using Karbar.Application.Contracts.Report;
using Karbar.Application.Contracts.Uom;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Reports
{
    public class GetItemStockReport
    {
        public sealed class Query : IRequest<List<ItemStockReportResponse>>
        {
            public int? TenantId { get; set; }
            public int? ItemId { get; set; }
            public int? BrandId { get; set; }
            public int? CategoryId { get; set; }
            public int? WarehouseId { get; set; }
            public string MaterialNo { get; set; }
            public string ItemName { get; set; }
            public string FromDate { get; set; }
            public string ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<ItemStockReportResponse>>
        {
            private readonly IGenericRepository<ItemStockReportResponse> _repository;
            public QueryHandler(IGenericRepository<ItemStockReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<ItemStockReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    DateTime? fromDate = string.IsNullOrWhiteSpace(request.FromDate)
                           ? null
                           : DateTime.Parse(request.FromDate);
                    DateTime? toDate = string.IsNullOrWhiteSpace(request.ToDate)
                            ? null
                            : DateTime.Parse(request.ToDate);

                    var result = await _repository.ExecuteStoredProcedureAsync<ItemStockReportResponse>(
                                @"EXEC GetItemStockReport 
                                @TenantId,
                                @ItemId,
                                @BrandId,
                                @CategoryId,
                                @WarehouseId,
                                @MaterialNo,
                                @ItemName,
                                @FromDate,
                                @ToDate,
                                @PageIndex,
                                @PageSize",
                                cancellationToken,

                                new SqlParameter("@TenantId", request.TenantId ?? (object)DBNull.Value),
                                new SqlParameter("@ItemId", request.ItemId ?? (object)DBNull.Value),
                                new SqlParameter("@BrandId", request.BrandId ?? (object)DBNull.Value),
                                new SqlParameter("@CategoryId", request.CategoryId ?? (object)DBNull.Value),
                                new SqlParameter("@WarehouseId", request.WarehouseId ?? (object)DBNull.Value),
                                new SqlParameter("@MaterialNo", request.MaterialNo ?? (object)DBNull.Value),
                                new SqlParameter("@ItemName", request.ItemName ?? (object)DBNull.Value),
                                new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                                new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                                new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                                new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value)
                            );

                    var response = result.Adapt<List<ItemStockReportResponse>>() ?? new List<ItemStockReportResponse>();

                    var totalCount = result.FirstOrDefault()?.TotalCount ?? 0;
                    response.ForEach(x => x.TotalCount = totalCount);

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