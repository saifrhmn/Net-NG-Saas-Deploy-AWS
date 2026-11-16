using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.Uom.Commands
{
    public static class DeleteUom
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int? UomId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.UomId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Uom> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<Karbar.Domain.Entities.Uom> repository,
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

                var uom = await _repository.GetByIdAsync(x => x.Id == request.UomId, cancellationToken);
                if (uom == null) return "UoM not found";

                await _repository.DeleteAsync(uom, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}