using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities.PurchaseOrderRecieved;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Karbar.Application.Features.PurchaseOrderRecieved.Commands
{
    public static class DeletePOR
    {
        #region command
        public sealed class Command : IRequest<string>
        {
            public int PurchaseRecievedId { get; set; }
        }
        #endregion

        #region validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                RuleFor(v => v.PurchaseRecievedId).GreaterThan(0).WithMessage("Invalid id");
            }
        }
        #endregion

        #region handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<PurchaseOrderRecievedMaster> _repository;
            private readonly IGenericRepository<PurchaseOrderRecievedDetail> _detailRepository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<PurchaseOrderRecievedMaster> repository,
                IGenericRepository<PurchaseOrderRecievedDetail> detailRepository,
                IValidator<Command> validator)
            {
                _repository = repository;
                _detailRepository = detailRepository;
                _validator = validator;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                var entity = await _repository.GetByIdAsync(x => x.Id == request.PurchaseRecievedId, cancellationToken);
                if (entity == null) return "Not found";

                var details = await _detailRepository.Query().Where(x => x.PurchaseOrderMasterId == entity.Id).ToListAsync(cancellationToken);
                foreach (var d in details)
                {
                    await _detailRepository.DeleteAsync(d, cancellationToken);
                }

                await _repository.DeleteAsync(entity, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }
        #endregion
    }
}
