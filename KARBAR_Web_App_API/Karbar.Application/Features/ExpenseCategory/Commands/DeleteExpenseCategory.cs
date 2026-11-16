using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.ExpenseCategory.Commands
{
    public static class DeleteExpenseCategory
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int ExpenseCategoryId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.ExpenseCategoryId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<Karbar.Domain.Entities.ExpenseCategory> repository,
                IValidator<Command> validator)
            {
                _repository = repository;
                _validator = validator;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);

                if (!validationResult.IsValid)
                {
                    throw new ValidationException(validationResult.Errors);
                }

                var category = await _repository.GetByIdAsync(x => x.Id == request.ExpenseCategoryId, cancellationToken);
                if (category == null) return "Expense Category not found";

                await _repository.DeleteAsync(category, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}