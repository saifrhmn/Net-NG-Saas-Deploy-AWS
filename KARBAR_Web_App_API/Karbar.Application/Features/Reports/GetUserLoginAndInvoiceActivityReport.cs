using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetUserLoginAndInvoiceActivityReport
    {
        public sealed class Query
    : IRequest<List<UserLoginAndInvoiceActivityReportResponse>>
        {
            public int? TenantId { get; set; }
            public DateTime? FromDate { get; set; }

            public DateTime? ToDate { get; set; }

            public int? PageIndex { get; set; }

            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler :
    IRequestHandler<Query, List<UserLoginAndInvoiceActivityReportResponse>>
        {
            private readonly
                IGenericRepository<UserLoginAndInvoiceActivityReportResponse>
                _repository;

            public QueryHandler(
                IGenericRepository<UserLoginAndInvoiceActivityReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<UserLoginAndInvoiceActivityReportResponse>> Handle(
                Query request,
                CancellationToken cancellationToken)
            {
                var result =
                    await _repository.ExecuteStoredProcedureAsync<UserLoginAndInvoiceActivityReportResponse>(
                        @"EXEC GetTenantWiseDailyInvoiceActivityReport
                    @TenantId,
                    @FromDate,
                    @ToDate,
                    @PageIndex,
                    @PageSize",
                        cancellationToken,
                        new SqlParameter(
                            "@TenantId",
                            request.TenantId ?? (object)DBNull.Value),
                        new SqlParameter(
                            "@FromDate",
                            request.FromDate ?? (object)DBNull.Value),

                        new SqlParameter(
                            "@ToDate",
                            request.ToDate ?? (object)DBNull.Value),

                        new SqlParameter(
                            "@PageIndex",
                            request.PageIndex ?? (object)DBNull.Value),

                        new SqlParameter(
                            "@PageSize",
                            request.PageSize ?? (object)DBNull.Value)
                    );

                return result.Adapt<List<UserLoginAndInvoiceActivityReportResponse>>();
            }
        }
    }
}