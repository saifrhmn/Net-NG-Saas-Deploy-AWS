using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.BankInformations.Commands
{
    public static class DeleteBankInformation
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.Id)
                    .NotEmpty().WithMessage("Invalid request");
            }
        }

        #endregion

        #region handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<BankInformation> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<BankInformation> repository,
                IValidator<Command> validator)
            {
                _repository = repository;
                _validator = validator;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var validation = await _validator.ValidateAsync(request, cancellationToken);
                if (!validation.IsValid)
                    throw new ValidationException(validation.Errors);

                var entity = await _repository.GetByIdAsync(x => x.Id == request.Id, cancellationToken);
                if (entity == null) return "Bank information not found";

                await _repository.DeleteAsync(entity, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}
