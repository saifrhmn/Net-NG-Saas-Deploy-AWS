using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.Roles.Commands
{
    public static class DeleteRole
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int RoleId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.RoleId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Role> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<Role> repository,
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

                var role = await _repository.GetByIdAsync(x => x.Id == request.RoleId, cancellationToken);
                if (role == null) return "Role not found";

                role.Status = StatusEnum.Deleted;
                role.UpdatedDate = DateTime.UtcNow;


                await _repository.UpdateAsync(role, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}