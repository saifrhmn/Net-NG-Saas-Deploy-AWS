using Karbar.Application.Common.Interface;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetStockTransferReport
    {
        public sealed class Query : IRequest<List<GetStockTransferReportResponse>>
        {
            public int? TenantId { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<GetStockTransferReportResponse>>
        {
            private readonly IGenericRepository<GetStockTransferReportResponse> _repository;

            public QueryHandler(IGenericRepository<GetStockTransferReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<GetStockTransferReportResponse>> Handle(
                Query request,
                CancellationToken cancellationToken)
            {
                DateTime? fromDate = request.FromDate;
                DateTime? toDate = request.ToDate;

                var result = await _repository.ExecuteStoredProcedureAsync<GetStockTransferReportResponse>(
                    @"EXEC GetStockTransferReport
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

                return result.Adapt<List<GetStockTransferReportResponse>>();
            }
        }
    }
}