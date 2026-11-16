using System;
using System.Threading;
using System.Threading.Tasks;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Tenant;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.Tenants.Queries
{
    public class GetTenantDetails
    {
        public sealed class Query : IRequest<TenantResponse>
        {
            public int TenantId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, TenantResponse>
        {
            private readonly IGenericRepository<Tenant> _repository;
            public QueryHandler(IGenericRepository<Tenant> repository)
            {
                _repository = repository;
            }

            public async Task<TenantResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.TenantId, cancellationToken);

                    var result = entity?.Adapt<TenantResponse>() ?? null;

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
