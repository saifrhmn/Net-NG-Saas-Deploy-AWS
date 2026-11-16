using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetTopSoldItemsReport
    {
        public sealed class Query : IRequest<List<GetTopSoldItemsReportResponse>>
        {
            public int? TenantId { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int? BrandId { get; set; }
            public int? CategoryId { get; set; }
            public int? Top { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<GetTopSoldItemsReportResponse>>
        {
            private readonly IGenericRepository<GetTopSoldItemsReportResponse> _repository;

            public QueryHandler(IGenericRepository<GetTopSoldItemsReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<GetTopSoldItemsReportResponse>> Handle(
                Query request,
                CancellationToken cancellationToken)
            {
                try
                {
                    var result = await _repository.ExecuteStoredProcedureAsync<GetTopSoldItemsReportResponse>(
                        @"EXEC GetTopSoldItemsReport
                            @TenantId,
                            @FromDate,
                            @ToDate,
                            @BrandId,
                            @CategoryId,
                            @Top,
                            @PageIndex,
                            @PageSize",
                        cancellationToken,

                        new SqlParameter("@TenantId", request.TenantId ?? (object)DBNull.Value),
                        new SqlParameter("@FromDate", request.FromDate ?? (object)DBNull.Value),
                        new SqlParameter("@ToDate", request.ToDate ?? (object)DBNull.Value),
                        new SqlParameter("@BrandId", request.BrandId ?? (object)DBNull.Value),
                        new SqlParameter("@CategoryId", request.CategoryId ?? (object)DBNull.Value),
                        new SqlParameter("@Top", request.Top ?? (object)DBNull.Value),
                        new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                        new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value)
                    );

                    return result.Adapt<List<GetTopSoldItemsReportResponse>>()
                           ?? new List<GetTopSoldItemsReportResponse>();
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }
    }
}
