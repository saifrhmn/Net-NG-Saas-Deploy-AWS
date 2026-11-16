using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetProfitAndLossReport
    {
        public sealed class Query : IRequest<List<GetProfitAndLossReportResponse>>
        {
            public int? TenantId { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<GetProfitAndLossReportResponse>>
        {
            private readonly IGenericRepository<GetProfitAndLossReportResponse> _repository;

            public QueryHandler(IGenericRepository<GetProfitAndLossReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<GetProfitAndLossReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                DateTime? fromDate = request.FromDate;
                DateTime? toDate = request.ToDate;

                var result = await _repository.ExecuteStoredProcedureAsync<GetProfitAndLossReportResponse>(
                    @"EXEC GetProfitAndLossReport
                        @TenantId,
                        @FromDate,
                        @ToDate,
                        @PageIndex,
                        @PageSize",
                    cancellationToken,

                    new SqlParameter("@TenantId", request.TenantId ?? (object)DBNull.Value),
                    new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                    new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                    new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                    new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value)
                );

                return result.Adapt<List<GetProfitAndLossReportResponse>>();
            }
        }
    }
}