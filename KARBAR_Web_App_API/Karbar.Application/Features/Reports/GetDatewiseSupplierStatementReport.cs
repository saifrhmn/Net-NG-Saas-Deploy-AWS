using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;

namespace Karbar.Application.Features.Reports
{
    public class GetDatewiseSupplierStatementReport
    {
        public sealed class Query : IRequest<List<DatewiseSupplierStatementReportResponse>>
        {
            public int? TenantId { get; set; }
            public string? SearchText { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<DatewiseSupplierStatementReportResponse>>
        {
            private readonly IGenericRepository<DatewiseSupplierStatementReportResponse> _repository;

            public QueryHandler(IGenericRepository<DatewiseSupplierStatementReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<DatewiseSupplierStatementReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    DateTime? fromDate = request.FromDate;
                    DateTime? toDate = request.ToDate;

                    var result = await _repository.ExecuteStoredProcedureAsync<DatewiseSupplierStatementReportResponse>(
                        @"EXEC GetDatewiseSupplierStatementReport
                            @TenantId,
                            @SearchText,
                            @FromDate,
                            @ToDate,
                            @PageIndex,
                            @PageSize",
                        cancellationToken,

                        new SqlParameter("@TenantId", request.TenantId ?? (object)DBNull.Value),
                        new SqlParameter("@SearchText", string.IsNullOrWhiteSpace(request.SearchText)
                            ? (object)DBNull.Value
                            : request.SearchText),
                        new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                        new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                        new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                        new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value)
                    );

                    var response = result.Adapt<List<DatewiseSupplierStatementReportResponse>>()
                                   ?? new List<DatewiseSupplierStatementReportResponse>();

                    var totalCount = result.FirstOrDefault()?.TotalCount ?? 0;
                    response.ForEach(x => x.TotalCount = totalCount);

                    return response;
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }
    }
}