using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.Tenants.Commands
{
    public static class DeleteTenant
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string TenantId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.TenantId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Tenant> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<Tenant> repository,
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

                var tenant = await _repository.GetByIdAsync(x => x.TenantId == request.TenantId, cancellationToken);
                if (tenant == null) return "Tenant not found";

                await _repository.DeleteAsync(tenant, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}
