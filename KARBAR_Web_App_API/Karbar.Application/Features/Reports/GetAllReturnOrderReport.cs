using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;
using System.Data;

namespace Karbar.Application.Features.Reports
{
    public class GetAllReturnOrderReport
    {
        public sealed class Query : IRequest<List<ReturnOrderReportResponse>>
        {
            public string? SearchText { get; set; }
            public int? TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<ReturnOrderReportResponse>>
        {
            private readonly IGenericRepository<ReturnOrderReportResponse> _repository;
            public QueryHandler(IGenericRepository<ReturnOrderReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<ReturnOrderReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    DateTime? fromDate = request.FromDate;
                    DateTime? toDate = request.ToDate;

                    var result = await _repository.ExecuteStoredProcedureAsync<ReturnOrderReportResponse>(
                        @"EXEC dbo.GetAllReturnOrderReport
                @TenantId,
                @SearchText,
                @FromDate,
                @ToDate,
                @PageIndex,
                @PageSize",
                        cancellationToken,

                        new SqlParameter("@TenantId", SqlDbType.Int)
                        {
                            Value = (object?)request.TenantId ?? DBNull.Value
                        },

                        new SqlParameter("@SearchText", SqlDbType.NVarChar)
                        {
                            Value = string.IsNullOrWhiteSpace(request.SearchText) ? (object)DBNull.Value : request.SearchText.Trim()
                        },

                        new SqlParameter("@FromDate", SqlDbType.DateTime)
                        {
                            Value = (object?)fromDate ?? DBNull.Value
                        },

                        new SqlParameter("@ToDate", SqlDbType.DateTime)
                        {
                            Value = (object?)toDate ?? DBNull.Value
                        },

                        new SqlParameter("@PageIndex", SqlDbType.Int)
                        {
                            Value = (object?)request.PageIndex ?? DBNull.Value
                        },

                        new SqlParameter("@PageSize", SqlDbType.Int)
                        {
                            Value = (object?)request.PageSize ?? DBNull.Value
                        });

                    return result.Adapt<List<ReturnOrderReportResponse>>() ?? new List<ReturnOrderReportResponse>();
                }
                catch
                {
                    throw;
                }
            }
        }
    }
}
