using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetSlowMovingNonMovingDeadStockReport
    {
        public sealed class Query : IRequest<List<GetSlowMovingNonMovingDeadStockReportResponse>>
        {
            public int? TenantId { get; set; }

            public int? PageIndex { get; set; }

            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler :
            IRequestHandler<Query, List<GetSlowMovingNonMovingDeadStockReportResponse>>
        {
            private readonly
                IGenericRepository<GetSlowMovingNonMovingDeadStockReportResponse> _repository;

            public QueryHandler(
                IGenericRepository<GetSlowMovingNonMovingDeadStockReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<GetSlowMovingNonMovingDeadStockReportResponse>> Handle(
                Query request,
                CancellationToken cancellationToken)
            {
                var result =
                    await _repository.ExecuteStoredProcedureAsync<GetSlowMovingNonMovingDeadStockReportResponse>(
                        @"EXEC GetSlowNonMovingDeadStockReport
                            @TenantId,
                            @PageIndex,
                            @PageSize",
                        cancellationToken,

                        new SqlParameter(
                            "@TenantId",
                            request.TenantId ?? (object)DBNull.Value),

                        new SqlParameter(
                            "@PageIndex",
                            request.PageIndex ?? (object)DBNull.Value),

                        new SqlParameter(
                            "@PageSize",
                            request.PageSize ?? (object)DBNull.Value)
                    );

                return result.Adapt<List<GetSlowMovingNonMovingDeadStockReportResponse>>();
            }
        }
    }
}

