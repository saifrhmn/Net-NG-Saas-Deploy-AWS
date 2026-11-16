using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetCustomerReceivableReport
    {
        public sealed class Query : IRequest<List<GetCustomerReceivableReportResponse>>
        {
            public int? TenantId { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public string? SearchText { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<GetCustomerReceivableReportResponse>>
        {
            private readonly IGenericRepository<GetCustomerReceivableReportResponse> _repository;

            public QueryHandler(IGenericRepository<GetCustomerReceivableReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<GetCustomerReceivableReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                DateTime? fromDate = request.FromDate;
                DateTime? toDate = request.ToDate;

                var result = await _repository.ExecuteStoredProcedureAsync<GetCustomerReceivableReportResponse>(
                    @"EXEC GetReceivableReport
                        @TenantId,
                        @FromDate,
                        @ToDate,
                        @SearchText,
                        @PageIndex,
                        @PageSize",
                    cancellationToken,

                    new SqlParameter("@TenantId", request.TenantId ?? (object)DBNull.Value),
                    new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                    new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                    new SqlParameter("@SearchText", string.IsNullOrWhiteSpace(request.SearchText) ? (object)DBNull.Value : request.SearchText.Trim()),
                    new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                    new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value)
                );

                return result.Adapt<List<GetCustomerReceivableReportResponse>>();
            }
        }
    }
}