using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace Karbar.Application.Features.Customers.Commands
{
    public static class CreateCustomer
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string CustomerId { get; set; }
            public string Name { get; set; }
            public string Contact { get; set; }
            public string Address { get; set; }
            public int TenantId { get; set; }
            public int Status { get; set; }
            public string? CustomerCategory { get; set; }
            public string? AddressLine1 { get; set; }
            public string? AddressLine2 { get; set; }
            public string? Phone { get; set; }
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

                RuleFor(v => v.Contact)
                    .MaximumLength(50).When(x => !string.IsNullOrWhiteSpace(x.Contact)).WithMessage("Contact must not exceed 50 characters.");

                RuleFor(v => v.Address)
                    .MaximumLength(250).When(x => !string.IsNullOrWhiteSpace(x.Address)).WithMessage("Address must not exceed 250 characters.");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Customer> _repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<Customer> repository,
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

                Customer entity;
                if (!string.IsNullOrEmpty(request.CustomerId))
                {
                    entity = await _repository.GetByIdAsync(x => x.CustomerId == request.CustomerId, cancellationToken);

                    if (entity == null)
                        return "Customer not found";

                    entity.UpdatedDate = DateTime.Now;
                    entity.UpdatedBy = userId;
                    entity.Status = (StatusEnum)request.Status;
                }
                else
                {
                    entity = new Customer
                    {
                        CustomerId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1,
                    };
                }

                entity.Name = request.Name;
                entity.Contact = request.Contact;
                entity.Address = request.Address;
                entity.TenantId = request.TenantId;
                entity.CustomerCategory = request.CustomerCategory;
                entity.AddressLine1 = request.AddressLine1;
                entity.AddressLine2 = request.AddressLine2;
                entity.Phone = request.Phone;

                var res = string.Empty;
                if (!string.IsNullOrEmpty(request.CustomerId))
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