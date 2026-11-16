using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.ExpenseCategory;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.ExpenseCategory.Queries
{
    public static class GetExpenseCategoryDetails
    {
        public class Query : IRequest<ExpenseCategoryResponse>
        {
            public int ExpenseCategoryId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, ExpenseCategoryResponse>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> repository)
            {
                _repository = repository;
            }

            public async Task<ExpenseCategoryResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(x => x.Id == request.ExpenseCategoryId, cancellationToken);
                    var result = entity?.Adapt<ExpenseCategoryResponse>();

                    if (result != null)
                    {
                        result.ParentCategoryName = _repository.GetByIdAsync(x => x.ExpenseCategoryId == result.ParentId).Result.Name;
                    }

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
