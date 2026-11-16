using System.Security.Claims;
using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Domain.Entities.PurchaseOrderRecieved;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Karbar.Application.Features.PurchaseOrderRecieved.Commands
{
    public static class ReceiveRemainingQty
    {
        #region Command
        public sealed class Command : IRequest<string>
        {
            public string RecievedOrderId { get; set; }
            public int Quantity { get; set; }
        }
        #endregion


        #region Validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                // add validation rules as needed
            }
        }
        #endregion

        #region Handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<PurchaseOrderRecievedMaster> _masterRepository;
            private readonly IGenericRepository<PurchaseOrderRecievedDetail> _detailRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _repositoryStock;
            private readonly IGenericRepository<Karbar.Domain.Entities.InvoiceData> _repositorySapSalesData;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<PurchaseOrderRecievedMaster> masterRepository,
                IGenericRepository<PurchaseOrderRecievedDetail> detailRepository,
                IGenericRepository<Karbar.Domain.Entities.Stock> repositoryStock,
                IGenericRepository<Karbar.Domain.Entities.InvoiceData> repositorySapSalesData,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _masterRepository = masterRepository;
                _detailRepository = detailRepository;
                _repositoryStock = repositoryStock;
                _repositorySapSalesData = repositorySapSalesData;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                try
                {
                    var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                    var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                    if (!validationResult.IsValid)
                        throw new ValidationException(validationResult.Errors);

                    var existReceivedOrder = await _masterRepository.GetByIdAsync(x => x.RecievedOrderId == request.RecievedOrderId);
                    if (existReceivedOrder == null)
                        throw new Exception("Receive order not found");

                    var details = await _detailRepository.GetByIdAsync(x => x.PurchaseOrderMasterId == existReceivedOrder.Id);
                    if (details == null)
                        throw new Exception("Receive order details not found");

                    if (details.RemainingQty < request.Quantity)
                        throw new Exception("Quantity must be less than or equal 'Remaining Quantity'");

                    details.RemainingQty = details.RemainingQty - request.Quantity;
                    await _detailRepository.UpdateAsync(details);

                    existReceivedOrder.RecievedDate = DateTime.Now;
                    await _masterRepository.UpdateAsync(existReceivedOrder);

                    var res = await _detailRepository.SaveChangesAsync(cancellationToken);

                    // Update Stock
                    if (res > 0 && request.Quantity > 0)
                    {
                        await StockHelper.IncreaseStockAsync(
                            _repositoryStock,
                            details.ItemId,
                            details.WarehouseId,
                            existReceivedOrder.TenantId,
                            request.Quantity);
                    }


                    return res > 0
                        ? "Received successfully"
                        : "Failed to receive";
                }
                catch (Exception ex)
                {
                    throw;
                }

            }
        }
        #endregion
    }
}
