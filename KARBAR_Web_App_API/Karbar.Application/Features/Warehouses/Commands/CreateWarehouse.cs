using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace Karbar.Application.Features.Warehouses.Commands
{
    public static class CreateWarehouse
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string WarehouseId { get; set; }
            public string Name { get; set; }
            public string Location { get; set; }
            public int TenantId { get; set; }
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

                RuleFor(v => v.Location)
                    .MaximumLength(200).When(x => !string.IsNullOrWhiteSpace(x.Location)).WithMessage("Location must not exceed 200 characters.");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Warehouse> _repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<Warehouse> repository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
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

                Warehouse entity;
                if (!string.IsNullOrEmpty(request.WarehouseId))
                {
                    entity = await _repository.GetByIdAsync(x => x.WarehouseId == request.WarehouseId, cancellationToken);

                    entity.UpdatedDate = DateTime.Now;
                    entity.UpdatedBy = userId;
                    entity.Status = (StatusEnum)request.Status;
                }
                else
                {
                    entity = new Warehouse
                    {
                        WarehouseId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1,
                    };
                }

                entity.Name = request.Name;
                entity.Location = request.Location;
                entity.TenantId = request.TenantId;

                var res = string.Empty;
                if (!string.IsNullOrEmpty(request.WarehouseId))
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