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
    public class GetInventoryMovementReport
    {
        public sealed class Query : IRequest<List<GetInventoryMovementReportResponse>>
        {
            public int? TenantId { get; set; }
            public string? FromDate { get; set; }
            public string? ToDate { get; set; }
            public int? Month { get; set; }
            public int? Year { get; set; }
            public int? CategoryId { get; set; }
            public int? BrandId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public string? ItemName { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<GetInventoryMovementReportResponse>>
        {
            private readonly IGenericRepository<GetInventoryMovementReportResponse> _repository;
            public QueryHandler(IGenericRepository<GetInventoryMovementReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<GetInventoryMovementReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    DateTime? fromDate = string.IsNullOrWhiteSpace(request.FromDate)
                           ? null
                           : DateTime.Parse(request.FromDate);
                    DateTime? toDate = string.IsNullOrWhiteSpace(request.ToDate)
                            ? null
                            : DateTime.Parse(request.ToDate);

                    var result = await _repository.ExecuteStoredProcedureAsync<GetInventoryMovementReportResponse>(
                                @"EXEC GetInventoryMovementReport 
                                @FromDate,
                                @ToDate,
                                @Month,
                                @Year,
                                @CatagoryId,
                                @BrandId,
                                @TenantIds,
                                @PageIndex,
                                @PageSize,@ItemName",
                                cancellationToken,

                                new SqlParameter("@TenantIds", request.TenantId ?? (object)DBNull.Value),
                                new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                                new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                                new SqlParameter("@Month", request.Month ?? (object)DBNull.Value),
                                new SqlParameter("@Year", request.Year ?? (object)DBNull.Value),
                                new SqlParameter("@CatagoryId", request.CategoryId ?? (object)DBNull.Value),
                                new SqlParameter("@BrandId", request.BrandId ?? (object)DBNull.Value),
                                new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                                new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value),
                                new SqlParameter("@ItemName", request.ItemName ?? (object)DBNull.Value)
                            );

                    var response = result.Adapt<List<GetInventoryMovementReportResponse>>() ?? new List<GetInventoryMovementReportResponse>();

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
