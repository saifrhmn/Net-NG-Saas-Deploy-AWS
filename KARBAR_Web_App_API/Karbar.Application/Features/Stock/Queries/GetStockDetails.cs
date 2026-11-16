using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Item;
using Karbar.Application.Contracts.StockItems;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.Stock.Queries
{

    public class GetStockDetails
    {
        public sealed class Query : IRequest<StockResponse>
        {
            public string StockId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, StockResponse>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.Stock> repository)
            {
                _repository = repository;
            }
            public async Task<StockResponse> Handle(Query request, CancellationToken cancellationToken)
            {

                try
                {
                    var query = _repository.GetByIdAsync(x => x.StockId == request.StockId, cancellationToken);

                    var result = query.Result.Adapt<StockResponse>() ?? null;

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
