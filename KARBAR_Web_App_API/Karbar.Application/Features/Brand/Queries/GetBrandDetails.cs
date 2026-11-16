using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Brand;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.Brand.Queries
{
    public class GetBrandDetails
    {
        public sealed class Query : IRequest<BrandResponse>
        {
            public int BrandId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, BrandResponse>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Brand> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.Brand> repository)
            {
                _repository = repository;
            }

            public async Task<BrandResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.BrandId, cancellationToken);
                    var result = entity?.Adapt<BrandResponse>() ?? null;
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