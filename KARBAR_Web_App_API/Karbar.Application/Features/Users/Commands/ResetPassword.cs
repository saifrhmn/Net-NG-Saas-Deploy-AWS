using System;
using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Karbar.Application.Features.Users.Commands
{
    public static class ResetPassword
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string PhoneNumber { get; set; }
            public string NewPassword { get; set; }
            public string ConfirmPassword { get; set; }
            public string RawPassword { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                RuleFor(v => v.PhoneNumber)
                    .NotEmpty().WithMessage("Phone number is required.");

                RuleFor(v => v.NewPassword)
                    .NotEmpty().WithMessage("New password is required.")
                    .MinimumLength(6).WithMessage("Password must be at least 6 characters.");

                RuleFor(v => v.ConfirmPassword)
                    .NotEmpty().WithMessage("Confirm password is required.")
                    .Equal(v => v.NewPassword).WithMessage("Passwords do not match.");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<User> _repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<User> repository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var actorUserId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    throw new ValidationException(validationResult.Errors);
                }

                var user = await _repository.GetByIdAsync(x => x.PhoneNumber == request.PhoneNumber, cancellationToken);
                if (user == null)
                {
                    return "User not found";
                }

                user.PasswordHash = CryptoHasher.DoHash(request.NewPassword);
                user.RawPassword = request.RawPassword;
                user.UpdatedDate = DateTime.Now;
                user.UpdatedBy = actorUserId;
                  
                await _repository.UpdateAsync(user, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Password reset successfully";
            }
        }

        #endregion
    }
}