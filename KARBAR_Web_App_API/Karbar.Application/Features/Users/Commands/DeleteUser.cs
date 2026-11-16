using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.Users.Commands
{
    public static class DeleteUser
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int UserId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.UserId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<User> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<User> repository,
                IValidator<Command> validator)
            {
                _repository = repository;
                _validator = validator;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                var user = await _repository.GetByIdAsync(x => x.Id == request.UserId, cancellationToken);
                if (user == null)
                    return "User not found";


                user.Status = StatusEnum.Deleted;
                user.UpdatedDate = DateTime.UtcNow;


                await _repository.UpdateAsync(user, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}