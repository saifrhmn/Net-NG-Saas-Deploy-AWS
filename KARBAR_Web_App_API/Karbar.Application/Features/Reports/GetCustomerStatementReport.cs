using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetCustomerStatementReport
    {
        public sealed class Query : IRequest<List<GetCustomerStatementReportResponse>>
        {
            public int? TenantId { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public string? SearchText { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<GetCustomerStatementReportResponse>>
        {
            private readonly IGenericRepository<GetCustomerStatementReportResponse> _repository;

            public QueryHandler(IGenericRepository<GetCustomerStatementReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<GetCustomerStatementReportResponse>> Handle(
                Query request,
                CancellationToken cancellationToken)
            {
                DateTime? fromDate = request.FromDate;
                DateTime? toDate = request.ToDate;

                var result = await _repository.ExecuteStoredProcedureAsync<GetCustomerStatementReportResponse>(
                    @"EXEC GetCustomerStatementReport
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
                    new SqlParameter("@SearchText",
                        string.IsNullOrWhiteSpace(request.SearchText)
                            ? (object)DBNull.Value
                            : request.SearchText),
                    new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                    new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value)
                );

                return result.Adapt<List<GetCustomerStatementReportResponse>>();
            }
        }
    }
}