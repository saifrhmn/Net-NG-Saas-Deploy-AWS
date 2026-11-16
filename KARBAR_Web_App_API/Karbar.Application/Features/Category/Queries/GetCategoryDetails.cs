using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Brand;
using Karbar.Application.Contracts.Category;
using Mapster;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.Category.Queries
{
    public static class GetCategoryDetails
    {
        public class Query : IRequest<CategoryResponse>
        {
            public int CategoryId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, CategoryResponse>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Category> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.Category> repository)
            {
                _repository = repository;
            }

            public async Task<CategoryResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.CategoryId, cancellationToken);
                    var result = entity?.Adapt<CategoryResponse>() ?? null;
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
