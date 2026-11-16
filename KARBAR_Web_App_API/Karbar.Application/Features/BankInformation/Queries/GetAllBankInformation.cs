using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.BankInformation;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.BankInformations.Queries
{
    public class GetAllBankInformation
    {
        public sealed class Query : IRequest<List<BankInformationResponse>>
        {
            public string? SearchText { get; set; }
            public int? TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<BankInformationResponse>>
        {
            private readonly IGenericRepository<BankInformation> _repository;

            public QueryHandler(IGenericRepository<BankInformation> repository)
            {
                _repository = repository;
            }

            public async Task<List<BankInformationResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository.Query()
                    .Where(x => x.Status != StatusEnum.Deleted);

                if (request.TenantId > 0)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p => p.AccountName.ToLower().Contains(search) ||
                                             p.BankName.ToLower().Contains(search));
                }

                var totalCount = await query.CountAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var result = await query.ToListAsync(cancellationToken);
                var response = result.Adapt<List<BankInformationResponse>>() ?? new List<BankInformationResponse>();

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;

                return response;
            }
        }
    }
}
