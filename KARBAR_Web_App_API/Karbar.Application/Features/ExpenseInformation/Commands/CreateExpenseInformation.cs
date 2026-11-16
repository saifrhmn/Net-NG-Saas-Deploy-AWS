using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace Karbar.Application.Features.ExpenseInformations.Commands
{
    public static class CreateExpenseInformation
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string ExpenseInfoId { get; set; }
            public string ExpensePurpose { get; set; }
            public string Remarks { get; set; }
            public decimal ExpenseAmount { get; set; }
            public int ForWhom { get; set; }
            public int TenantId { get; set; }
            public int Status { get; set; }
            public DateTime EntryDate { get; set; }
            public DateTime ExpenseDate { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                //RuleFor(v => v.ExpenseType)
                //    .NotEmpty().WithMessage("Expense type is required.")
                //    .MaximumLength(200).WithMessage("Expense type must not exceed 200 characters.");

                //RuleFor(v => v.Amount)
                //    .GreaterThan(0).WithMessage("Amount must be greater than zero.");
            }
        }

        #endregion

        #region handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<ExpenseInformation> _repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<ExpenseInformation> repository,
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
                    throw new ValidationException(validationResult.Errors);

                ExpenseInformation entity;

                if (!string.IsNullOrEmpty(request.ExpenseInfoId))
                {
                    entity = await _repository.GetByIdAsync(x => x.ExpenseInfoId == request.ExpenseInfoId, cancellationToken);

                    if (entity == null)
                        return "Expense info not found";

                    entity.UpdatedDate = DateTime.Now;
                    entity.UpdatedBy = userId;
                    entity.Status = (StatusEnum)request.Status;
                }
                else
                {
                    entity = new ExpenseInformation
                    {
                        ExpenseInfoId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = StatusEnum.Active
                    };
                }

                // Assign fields
                entity.ExpensePurpose = request.ExpensePurpose;
                entity.ForWhom = request.ForWhom;
                entity.ExpenseAmount = request.ExpenseAmount;
                entity.Remarks = request.Remarks;
                entity.TenantId = request.TenantId;
                entity.Status = (StatusEnum)1;
                entity.EntryDate = request.EntryDate;
                entity.ExpenseDate = request.ExpenseDate;
                string result;

                if (!string.IsNullOrEmpty(request.ExpenseInfoId))
                {
                    await _repository.UpdateAsync(entity, cancellationToken);
                    result = "Updated Successfully";
                }
                else
                {
                    await _repository.AddAsync(entity, cancellationToken);
                    result = "Created Successfully";
                }

                await _repository.SaveChangesAsync(cancellationToken);

                return result;
            }
        }

        #endregion
    }
}
