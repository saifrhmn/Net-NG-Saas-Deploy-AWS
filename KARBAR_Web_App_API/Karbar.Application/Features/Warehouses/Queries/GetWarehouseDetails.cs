using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Warehouse;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.Warehouses.Queries
{
    public class GetWarehouseDetails
    {
        public sealed class Query : IRequest<WarehouseResponse>
        {
            public int WarehouseId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, WarehouseResponse>
        {
            private readonly IGenericRepository<Warehouse> _repository;
            public QueryHandler(IGenericRepository<Warehouse> repository)
            {
                _repository = repository;
            }

            public async Task<WarehouseResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.WarehouseId, cancellationToken);
                    var result = entity?.Adapt<WarehouseResponse>() ?? null;
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