using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.Suppliers.Commands
{
    public static class DeleteSupplier
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int SupplierId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.SupplierId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Supplier> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<Supplier> repository,
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

                var supplier = await _repository.GetByIdAsync(x => x.Id == request.SupplierId, cancellationToken);
                if (supplier == null) return "Supplier not found";

                await _repository.DeleteAsync(supplier, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}