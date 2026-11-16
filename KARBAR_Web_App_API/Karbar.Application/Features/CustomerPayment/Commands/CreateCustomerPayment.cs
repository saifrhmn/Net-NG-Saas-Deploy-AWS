using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.CustomerPayment;
using CustomerPaymentEntity = Karbar.Domain.Entities.CustomerPayment.CustomerPayment;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace Karbar.Application.Features.CustomerPayment.Commands
{
    public static class CreateCustomerPayment
    {
        #region command
        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public int CustomerId { get; set; }
            public string PaymentType { get; set; } = "Advance";
            public int? RequestOrderId { get; set; }
            public int? RequestOrderDetailId { get; set; }
            public string? OrderInvoiceNo { get; set; }
            public decimal? TotalAmount { get; set; }
            public decimal? PaidAmount { get; set; }
            public decimal? DueAmount { get; set; }
            public decimal Amount { get; set; }
            public int Status { get; set; }
        }
        #endregion

        #region validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                RuleFor(v => v.CustomerId)
                    .NotEmpty().WithMessage("CustomerId is required.");

                RuleFor(v => v.Amount)
                    .GreaterThanOrEqualTo(0).WithMessage("Amount must be >= 0");
            }
        }
        #endregion

        #region handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<CustomerPaymentEntity> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderMaster> _so_repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<CustomerPaymentEntity> repository, IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderMaster> so_repository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _validator = validator;
                _so_repository = so_repository;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                CustomerPaymentEntity entity;

                if (request.Id > 0)
                {
                    entity = await _repository.GetByIdAsync(x => x.Id == request.Id, cancellationToken);
                    if (entity == null)
                        return "Customer payment not found";

                    entity.UpdatedDate = DateTime.Now;
                    entity.UpdatedBy = userId;
                    entity.Status = (StatusEnum)request.Status;
                }
                else
                {
                    entity = new CustomerPaymentEntity
                    {
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1 // Active by default
                    };
                }

                entity.CustomerId = request.CustomerId;
                entity.PaymentType = request.PaymentType;
                entity.RequestOrderId = request.RequestOrderId;
                entity.RequestOrderDetailId = request.RequestOrderDetailId;
                entity.OrderInvoiceNo = request.OrderInvoiceNo;
                entity.TotalAmount = request.TotalAmount;
                entity.PaidAmount = request.PaidAmount;
                entity.DueAmount = request.DueAmount;
                entity.Amount = request.Amount;

                if (request.Id > 0)
                {
                    await _repository.UpdateAsync(entity, cancellationToken);
                }
                else
                {
                    await _repository.AddAsync(entity, cancellationToken);
                }

                #region Due Amount Adjustment in Sales Order 
                //if (request.RequestOrderId.HasValue && request.DueAmount.HasValue)
                //{
                //    var salesOrder = await _so_repository.GetByIdAsync(x => x.Id == request.RequestOrderId.Value, cancellationToken);
                //    if (salesOrder != null)
                //    {
                //        //if(salesOrder.DueAmount < request.DueAmount.Value)
                //        //{
                //        //    throw new Exception("Due amount to adjust exceeds the sales order's due amount.");
                //        //}
                //        if (request.DueAmount == 0)
                //        {
                //            salesOrder.PaidAmount = request.TotalAmount ?? 0;
                //            salesOrder.DueAmount = request.DueAmount.Value;
                //        }
                //        else { 
                //            salesOrder.PaidAmount = (request.TotalAmount ?? 0) - request.DueAmount.Value;
                //            salesOrder.DueAmount = request.DueAmount.Value;
                //        }
                //        await _so_repository.UpdateAsync(salesOrder, cancellationToken);
                //    }
                //}
                #endregion Due Amount Adjustment in Sales Order

                await _repository.SaveChangesAsync(cancellationToken);

                return request.Id > 0 ? "Customer payment updated successfully" : "Customer payment created successfully";
            }
        }
        #endregion
    }
}
