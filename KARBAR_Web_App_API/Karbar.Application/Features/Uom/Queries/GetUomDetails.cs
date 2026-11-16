using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Uom;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.Uom.Queries
{
    public class GetUomDetails
    {
        public sealed class Query : IRequest<UomResponse>
        {
            public int UomId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, UomResponse>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Uom> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.Uom> repository)
            {
                _repository = repository;
            }

            public async Task<UomResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.UomId, cancellationToken);
                    var result = entity?.Adapt<UomResponse>() ?? null;
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