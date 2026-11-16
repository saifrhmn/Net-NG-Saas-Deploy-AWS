using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.Reports
{
    public class GetDatewiseSupplierPaybleReport
    {
        public sealed class Query : IRequest<List<GetDatewiseSupplierPaybleReportResponse>>
        {
            public int? TenantId { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public string? SearchText { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<GetDatewiseSupplierPaybleReportResponse>>
        {
            private readonly IGenericRepository<GetDatewiseSupplierPaybleReportResponse> _repository;
            public QueryHandler(IGenericRepository<GetDatewiseSupplierPaybleReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<GetDatewiseSupplierPaybleReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    DateTime? fromDate = request.FromDate;
                    DateTime? toDate = request.ToDate;
                    
                    var result = await _repository.ExecuteStoredProcedureAsync<GetDatewiseSupplierPaybleReportResponse>(
                                @"EXEC GetDatewiseSupplierPaybleReport
                                @TenantId,
                                @FromDate,
                                @ToDate,
                                @PageSize,
                                @PageIndex,
                                @SearchText",
                                cancellationToken,

                                new SqlParameter("@TenantId", request.TenantId ?? (object)DBNull.Value),
                                new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                                new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                                new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                                new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value),
                                new SqlParameter("@SearchText", string.IsNullOrWhiteSpace(request.SearchText) ? (object)DBNull.Value : request.SearchText)
                            );

                    var response = result.Adapt<List<GetDatewiseSupplierPaybleReportResponse>>() ?? new List<GetDatewiseSupplierPaybleReportResponse>();

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
