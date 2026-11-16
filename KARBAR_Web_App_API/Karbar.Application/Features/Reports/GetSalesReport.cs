using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Brand;
using Karbar.Application.Contracts.Report;
using Karbar.Application.Contracts.Uom;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace Karbar.Application.Features.Reports
{
    public class GetSalesReport
    {
        public sealed class Query : IRequest<List<SalesReportResponse>>
        {
            public int? TenantId { get; set; }
            public int? ItemId { get; set; }
            public int? CategoryId { get; set; }
            public int? BrandId { get; set; }
            public int? WarehouseId { get; set; }
            public string? SearchText { get; set; }   // InvoiceNo / Material / Item / Customer Name / Phone
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<SalesReportResponse>>
        {
            private readonly IGenericRepository<SalesReportResponse> _repository;
            public QueryHandler(IGenericRepository<SalesReportResponse> repository)
            {
                _repository = repository;
            }

            public async Task<List<SalesReportResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    DateTime? fromDate = request.FromDate;
                    DateTime? toDate = request.ToDate;

                    var result = await _repository.ExecuteStoredProcedureAsync<SalesReportResponse>(
                        @"EXEC dbo.GetSalesReport
                @TenantId,
                @ItemId,
                @CategoryId,
                @BrandId,
                @WarehouseId,
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

                        new SqlParameter("@ItemId", SqlDbType.Int)
                        {
                            Value = (object?)request.ItemId ?? DBNull.Value
                        },

                        new SqlParameter("@CategoryId", SqlDbType.Int)
                        {
                            Value = (object?)request.CategoryId ?? DBNull.Value
                        },

                        new SqlParameter("@BrandId", SqlDbType.Int)
                        {
                            Value = (object?)request.BrandId ?? DBNull.Value
                        },

                        new SqlParameter("@WarehouseId", SqlDbType.Int)
                        {
                            Value = (object?)request.WarehouseId ?? DBNull.Value
                        },

                        new SqlParameter("@SearchText", SqlDbType.NVarChar, 200)
                        {
                            Value = string.IsNullOrWhiteSpace(request.SearchText)
                                ? DBNull.Value
                                : request.SearchText.Trim()
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

                    return result.Adapt<List<SalesReportResponse>>() ?? new List<SalesReportResponse>();
                }
                catch
                {
                    throw;
                }
            }
        }
    }
}