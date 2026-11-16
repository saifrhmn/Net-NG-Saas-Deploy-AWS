using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace Karbar.Application.Features.Roles.Commands
{
    public static class CreateRole
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string RoleId { get; set; }
            public string Name { get; set; }
            public bool IsAdmin { get; set; }
            public int Status { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.Name)
                    .NotEmpty().WithMessage("Name is required.")
                    .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Role> _repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<Role> repository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    throw new ValidationException(validationResult.Errors);
                }

                Role entity;
                if (!string.IsNullOrEmpty(request.RoleId))
                {
                    entity = await _repository.GetByIdAsync(x => x.RoleId == request.RoleId, cancellationToken);

                    if (entity == null)
                        return "Role not found";

                    entity.UpdatedDate = DateTime.Now;
                    entity.UpdatedBy = userId;
                    entity.Status = (StatusEnum)request.Status;
                }
                else
                {
                    entity = new Role
                    {
                        RoleId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1,
                    };
                }

                entity.Name = request.Name;
                entity.IsAdmin = request.IsAdmin;
                

                var res = string.Empty;
                if (!string.IsNullOrEmpty(request.RoleId))
                {
                    await _repository.UpdateAsync(entity, cancellationToken);
                    res = "Updated Successfully";
                }
                else
                {
                    await _repository.AddAsync(entity, cancellationToken);
                    res = "Created Successfully";
                }

                await _repository.SaveChangesAsync(cancellationToken);

                return res;
            }
        }

        #endregion
    }
}