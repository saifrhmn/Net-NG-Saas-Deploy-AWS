using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.BankInformation;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.BankInformations.Queries
{
    public class GetBankInformationDetails
    {
        public sealed class Query : IRequest<BankInformationResponse>
        {
            public int BankInformationId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, BankInformationResponse>
        {
            private readonly IGenericRepository<BankInformation> _repository;

            public QueryHandler(IGenericRepository<BankInformation> repository)
            {
                _repository = repository;
            }

            public async Task<BankInformationResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(
                        x => x.Id == request.BankInformationId,
                        cancellationToken);

                    var result = entity?.Adapt<BankInformationResponse>() ?? null;
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
