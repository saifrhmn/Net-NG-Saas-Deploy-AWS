using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Customer;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.Customers.Queries
{
    public class GetCustomerDetails
    {
        public sealed class Query : IRequest<CustomerResponse>
        {
            public int CustomerId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, CustomerResponse>
        {
            private readonly IGenericRepository<Customer> _repository;
            public QueryHandler(IGenericRepository<Customer> repository)
            {
                _repository = repository;
            }

            public async Task<CustomerResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.CustomerId, cancellationToken);
                    var result = entity?.Adapt<CustomerResponse>() ?? null;
                    return result;
                }
                catch (Exception)
                {
                    throw;
                }
            }
        }
    }
}