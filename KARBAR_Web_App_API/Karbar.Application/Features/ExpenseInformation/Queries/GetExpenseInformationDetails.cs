using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.ExpenseInformation;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;

namespace Karbar.Application.Features.ExpenseInformations.Queries
{
    public class GetExpenseInformationDetails
    {
        public sealed class Query : IRequest<ExpenseInformationResponse>
        {
            public int ExpenseInformationId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, ExpenseInformationResponse>
        {
            private readonly IGenericRepository<ExpenseInformation> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> _cat_repository;

            public QueryHandler(IGenericRepository<ExpenseInformation> repository, IGenericRepository<Domain.Entities.ExpenseCategory> cat_repository)
            {
                _repository = repository;
                _cat_repository = cat_repository;
            }

            public async Task<ExpenseInformationResponse> Handle(Query request, CancellationToken cancellationToken)
            {
                try
                {
                    var entity = await _repository.GetByIdAsync(
                        x => x.Id == request.ExpenseInformationId,
                        cancellationToken);

                    var result = entity?.Adapt<ExpenseInformationResponse>() ?? null;

                    if (result != null && entity!.ForWhom.HasValue && entity.ForWhom.Value > 0)
                    {
                        var category = _cat_repository.GetByIdAsync(x => x.Id == entity.ForWhom).Result;
                        if (category != null)
                        {
                            if (!string.IsNullOrWhiteSpace(category.ParentId))
                            {
                                result!.SubCategoryName = category.Name;
                                var parentCategory = _cat_repository.GetByIdAsync(x => x.ExpenseCategoryId == category.ParentId).Result;
                                result.CategoryName = parentCategory != null ? parentCategory.Name : string.Empty;
                            }
                            else
                            {
                                result!.CategoryName = category.Name;
                            }
                        }
                    }

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
