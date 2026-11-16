using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Domain.Entities;
using MediatR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.PurchaseOrder.Commands
{
    public static class DeletePO
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int PurchaseOrderId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                RuleFor(v => v.PurchaseOrderId)
                    .GreaterThan(0).WithMessage("Invalid Purchase Order");
            }
        }

        #endregion

        #region handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<PurchaseOrderMaster> _poRepository;
            private readonly IGenericRepository<PurchaseOrderDetail> _detailRepository;
            private readonly IValidator<Command> _validator;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _RepositoryStock;


            public CommandHandler(
                IGenericRepository<PurchaseOrderMaster> poRepository,
                IGenericRepository<PurchaseOrderDetail> detailRepository,
                IGenericRepository<Karbar.Domain.Entities.Stock> RepositoryStock,
                IValidator<Command> validator)
            {
                _poRepository = poRepository;
                _detailRepository = detailRepository;
                _validator = validator;
                _RepositoryStock = RepositoryStock;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                // 1️⃣ Validate input
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                // 2️⃣ Get master record
                var purchaseOrder = await _poRepository
                    .GetByIdAsync(x => x.Id == request.PurchaseOrderId, cancellationToken);

                if (purchaseOrder == null)
                    return "Purchase Order not found";

                // 3️⃣ Get related details
                var details = await _detailRepository
                    .GetAllAsync(cancellationToken);

                // 4️⃣ Delete all details
                foreach (var detail in details)
                {
                    await _detailRepository.DeleteAsync(detail, cancellationToken);
                }
                foreach (var i in details)
                {
                    await StockHelper.DecreaseStockAsync(
                        _RepositoryStock,
                        i.ItemId,
                        null,
                        0,
                        i.Quantity);
                }
                // 5️⃣ Delete master record
                await _poRepository.DeleteAsync(purchaseOrder, cancellationToken);

                // 6️⃣ Save all changes
                await _poRepository.SaveChangesAsync(cancellationToken);

                return "Purchase Order deleted successfully";
            }
        }

        #endregion

    }
}
