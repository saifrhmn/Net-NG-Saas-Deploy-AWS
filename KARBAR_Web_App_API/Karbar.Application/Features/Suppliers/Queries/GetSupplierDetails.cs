using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Supplier;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.Suppliers.Queries
{
    public class GetSupplierDetails
    {
        public sealed class Query : IRequest<SupplierResponse>
        {
            public int SupplierId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, SupplierResponse>
        {
            private readonly IGenericRepository<Supplier> _repository;
            public QueryHandler(IGenericRepository<Supplier> repository)
            {
                _repository = repository;
            }

            public async Task<SupplierResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.SupplierId, cancellationToken);
                    var result = entity?.Adapt<SupplierResponse>() ?? null;
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