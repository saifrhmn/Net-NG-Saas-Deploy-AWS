using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Report;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;
using NPOI.SS.UserModel;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.Reports
{
    public class GetPaymentCollectionReport
    {
        public sealed class Query : IRequest<List<PaymentCollectionReportResponse>>
        {
            public int? TenantId { get; set; }
            public string FromDate { get; set; }
            public string ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
            public string? SearchText { get; set; }
            public int? PartyType { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<PaymentCollectionReportResponse>>
        {
            private readonly IGenericRepository<PaymentCollectionReportResponse> _repository;
            public QueryHandler(IGenericRepository<PaymentCollectionReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<PaymentCollectionReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    DateTime? fromDate = string.IsNullOrWhiteSpace(request.FromDate)
                           ? null
                           : DateTime.Parse(request.FromDate);
                    DateTime? toDate = string.IsNullOrWhiteSpace(request.ToDate)
                            ? null
                            : DateTime.Parse(request.ToDate);

                    var result = await _repository.ExecuteStoredProcedureAsync<PaymentCollectionReportResponse>(
                                @"EXEC GetPaymentCollectionReport
                                @TenantId,
                                @FromDate,
                                @ToDate,
                                @PageIndex,
                                @PageSize,
                                @SearchText,
                                @PartyType",
                                cancellationToken,

                                new SqlParameter("@TenantId", request.TenantId ?? (object)DBNull.Value),
                                new SqlParameter("@FromDate", fromDate ?? (object)DBNull.Value),
                                new SqlParameter("@ToDate", toDate ?? (object)DBNull.Value),
                                new SqlParameter("@PageIndex", request.PageIndex ?? (object)DBNull.Value),
                                new SqlParameter("@PageSize", request.PageSize ?? (object)DBNull.Value),
                                new SqlParameter("@SearchText", request.SearchText ?? (object)DBNull.Value),
                                new SqlParameter("@PartyType", request.PartyType ?? (object)DBNull.Value)
                            );

                    var response = result.Adapt<List<PaymentCollectionReportResponse>>() ?? new List<PaymentCollectionReportResponse>();

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
