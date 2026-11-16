using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Roles;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace Karbar.Application.Features.Tenants.Commands
{
    public static class CreateTenant
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string TenantId { get; set; }
            public string Name { get; set; }
            public string Contact { get; set; }
            public string Email { get; set; }
            public string TenantCustomerNo { get; set; }
            public string Domain { get; set; }
            public int Status { get; set; }
            public int? RoleId { get; set; }
            public string? AddressLine1 { get; set; }
            public string? AddressLine2 { get; set; }
            public string? Phone { get; set; }
            public string? DepotCode { get; set; }

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

                RuleFor(v => v.Email)
                    .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email is not valid.");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Tenant> _repository;
            private readonly IGenericRepository<User> _user_repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<Tenant> repository,
                IGenericRepository<User> user_repository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _user_repository = user_repository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var userId = _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    throw new ValidationException(validationResult.Errors);
                }

                Tenant entity;
                if (!string.IsNullOrEmpty(request.TenantId))
                {
                    entity = await _repository.GetByIdAsync(x => x.TenantId == request.TenantId, cancellationToken);

                    entity.UpdatedDate = DateTime.Now;
                    entity.UpdatedBy = userId;
                    entity.Status = (StatusEnum)request.Status;
                }
                else
                {
                    entity = new Tenant
                    {
                        TenantId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1
                    };
                }

                entity.Name = request.Name;
                entity.Contact = request.Contact;
                entity.Email = request.Email;
                entity.Phone = request.Phone;
                entity.AddressLine1 = request.AddressLine1;
                entity.AddressLine2 = request.AddressLine2;
                entity.Domain = request.Domain ?? "";
                entity.DepotCode = request.DepotCode;

                var res = string.Empty;
                if (!string.IsNullOrEmpty(request.TenantId))
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
             
                ///
                /// Auto User Creation for Tenant
                /// 
                var uentity = new User
                {
                    UserId = GenerateId.MakeId(),
                    UserName = request.Name,
                    Name = request.Name,
                    Email = request.Email,
                    PhoneNumber = request.Contact,
                    CreatedBy = userId,
                    CreatedDate = DateTime.Now,
                    Status = StatusEnum.Active,
                    TenantId = entity.Id,
                    RoleId = (int)request.RoleId,
                    PasswordHash = CryptoHasher.DoHash("123456"),
                };
                await _user_repository.AddAsync(uentity, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);
                return res;
            }
        }

        #endregion
    }
}