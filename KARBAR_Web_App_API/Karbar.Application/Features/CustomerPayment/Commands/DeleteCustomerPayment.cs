using FluentValidation;
using Karbar.Application.Common.Interface;
using CustomerPaymentEntity = Karbar.Domain.Entities.CustomerPayment.CustomerPayment;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Karbar.Domain.Enums;

namespace Karbar.Application.Features.CustomerPayment.Commands
{
    public static class DeleteCustomerPayment
    {
        #region command
        public sealed class Command : IRequest<string>
        {
            public int CustomerPaymentId { get; set; }
        }
        #endregion

        #region validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.CustomerPaymentId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }
        #endregion

        #region handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<CustomerPaymentEntity> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<CustomerPaymentEntity> repository,
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

                var entity = await _repository.GetByIdAsync(x => x.Id == request.CustomerPaymentId, cancellationToken);
                if (entity == null) return "Customer payment not found";

                // soft-delete by setting status to Deleted
                entity.Status = StatusEnum.Deleted;
                entity.UpdatedDate = DateTime.UtcNow;

                await _repository.UpdateAsync(entity, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }
        #endregion
    }
}
