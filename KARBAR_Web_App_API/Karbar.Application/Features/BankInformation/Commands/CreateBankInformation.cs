using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace Karbar.Application.Features.BankInformations.Commands
{
    public static class CreateBankInformation
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string BankInfoId { get; set; }
            public string BankName { get; set; }
            public string AccountName { get; set; }
            public string BranchName { get; set; }
            
            public string AccountNumber { get; set; }
            public int TenantId { get; set; }
            public int Status { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.BankName)
                    .NotEmpty().WithMessage("Bank name is required.");

                RuleFor(v => v.AccountName)
                    .NotEmpty().WithMessage("Account name is required.");

                RuleFor(v => v.AccountNumber)
                    .NotEmpty().WithMessage("Account number is required.")
                    .MaximumLength(50).WithMessage("Account number must not exceed 50 characters.");
            }
        }

        #endregion

        #region handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<BankInformation> _repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<BankInformation> repository,
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

                BankInformation entity;

                if (!string.IsNullOrEmpty(request.BankInfoId))
                {
                    entity = await _repository.GetByIdAsync(x => x.BankInfoId == request.BankInfoId, cancellationToken);

                    if (entity == null)
                        return "Bank info not found";

                    entity.UpdatedBy = userId;
                    entity.UpdatedDate = DateTime.Now;
                    entity.Status = (StatusEnum)request.Status;
                }
                else
                {
                    entity = new BankInformation
                    {
                        BankInfoId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = StatusEnum.Active
                    };
                }

                // Assign
                entity.BankName = request.BankName;
                entity.AccountName = request.AccountName;
                entity.BranchName = request.BranchName;
                entity.AccountNumber = request.AccountNumber;
                entity.TenantId = request.TenantId;

                string result;

                if (!string.IsNullOrEmpty(request.BankInfoId))
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
