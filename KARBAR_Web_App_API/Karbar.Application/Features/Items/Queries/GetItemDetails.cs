using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Item;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Items.Queries
{
    public class GetItemDetails
    {
        public sealed class Query : IRequest<ItemResponse>
        {
            public int ItemId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, ItemResponse>
        {
            private readonly IGenericRepository<Item> _repository;
            public QueryHandler(IGenericRepository<Item> repository)
            {
                _repository = repository;
            }
            public async Task<ItemResponse> Handle(Query request, CancellationToken cancellationToken)
            {

                try
                {
                    var query = _repository
                                        .Query()
                                        .Include(c => c.Category)
                                        .Include(c => c.Brand)
                                        .Include(c => c.Uom)
                                        .Include(c => c.Warehouse)
                                        .Where(x => x.Status != StatusEnum.Deleted && x.Id == request.ItemId);

                    var entity = await query.FirstOrDefaultAsync(cancellationToken);

                    if (entity == null)
                        return null;
                    var result = entity.Adapt<ItemResponse>();
                    return result;
                }
                catch (Exception ex)
                {
                    throw ex;
                }
            }
        }
    }
}
