using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Invoice;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Invoices.Queries
{
    public class GetLastThreeInvoiceAverage
    {
        public sealed class Query : IRequest<LastThreeInvoiceAverageResponse>
        {
            public string DealerCode { get; set; }
            public string MaterialCode { get; set; }
        }

        public sealed class QueryHandler
            : IRequestHandler<Query, LastThreeInvoiceAverageResponse>
        {
            private readonly IGenericRepository<InvoiceData> _repository;

            public QueryHandler(
                IGenericRepository<InvoiceData> repository)
            {
                _repository = repository;
            }

            public async Task<LastThreeInvoiceAverageResponse> Handle(
                Query request,
                CancellationToken cancellationToken)
            {
                var invoices = (await _repository.GetAllAsync())
                            .Where(x =>
                                x.DealerCode == request.DealerCode &&
                                x.MaterialCode == request.MaterialCode &&
                                x.IsCustomerRecieved == true)
                            .OrderByDescending(x => x.InvoiceDate)
                            .Take(3)
                            .ToList();

                var average = invoices.Any()
                    ? invoices.Average(x => x.UnitPrice)
                    : 0;

                return new LastThreeInvoiceAverageResponse
                {
                    DealerCode = request.DealerCode,
                    MaterialCode = request.MaterialCode,
                    AverageInvoiceValue = average
                };
            }
        }
    }
}