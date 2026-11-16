using System.Security.Claims;
using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Payment;
using Karbar.Domain.Entities.RequestOrder;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using PaymentEntity = Karbar.Domain.Entities.Payment.Payment;

namespace Karbar.Application.Features.Payment.Commands
{
    public static class CreatePayment
    {
        #region command
        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public int TenantId { get; set; }
            public int UserType { get; set; }
            public int UserId { get; set; }
            public int PaymentMethod { get; set; }
            public int PaymentType { get; set; }    // 1 = Purchase, 2 = Sales
            public int OrderId { get; set; }    // Refers to RequestOrderMaster / PurchaseOrderMaster Id or SalesOrder Id based on PaymentType
            public string OrderInvoiceNo { get; set; }
            public decimal TotalAmount { get; set; }
            public decimal DueAmount { get; set; }
            public decimal? DiscountAmount { get; set; }
            public decimal PaidAmount { get; set; }
            public int? MobileBankMethod { get; set; }
            public string? PhoneNumber { get; set; }
            public string? BankName { get; set; }
            public string? AccountNumber { get; set; }
            public bool IsBerger { get; set; }
        }
        #endregion

        #region validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                RuleFor(v => v.TenantId)
                    .NotEmpty().WithMessage("TenantId is required.");

                RuleFor(v => v.UserId)
                    .NotEmpty().WithMessage("UserId is required.");

                RuleFor(v => v.TotalAmount)
                    .GreaterThanOrEqualTo(0).WithMessage("Total amount must be >= 0");
            }
        }
        #endregion

        #region handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<PaymentEntity> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.PurchaseOrderMaster> _po_repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.RequestOrder.RequestOrderMaster> _ro_repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderMaster> _so_repository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<PaymentEntity> repository, 
                IGenericRepository<Karbar.Domain.Entities.PurchaseOrderMaster> po_repository,
                IGenericRepository<Karbar.Domain.Entities.RequestOrder.RequestOrderMaster> ro_repository,
                IGenericRepository<Domain.Entities.SalesOrder.SalesOrderMaster> so_repository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _po_repository = po_repository;
                _ro_repository = ro_repository;
                _so_repository = so_repository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                PaymentEntity entity;

                if (request.Id > 0)
                {
                    entity = await _repository.GetByIdAsync(x => x.Id == request.Id, cancellationToken);
                    if (entity == null)
                        return "Payment not found";

                    entity.UpdatedDate = DateTime.Now;
                    entity.UpdatedBy = userId;
                }
                else
                {
                    entity = new PaymentEntity
                    {
                        TenantId = request.TenantId,

                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1 // Active by default
                    };
                }

                
                entity.UserType = (UserTypeEnum)request.UserType;
                entity.UserId = request.UserId;
                entity.PaymentMethod = (PaymentMethodEnum)request.PaymentMethod;
                entity.PaymentType = request.PaymentType;
                entity.OrderId = request.OrderId;
                entity.OrderInvoiceNo = request.OrderInvoiceNo;
                entity.TotalAmount = request.TotalAmount;
                entity.DueAmount = request.DueAmount;
                entity.DiscountAmount = request.DiscountAmount;
                entity.PaidAmount = entity.PaidAmount + request.PaidAmount;
                switch ((PaymentMethodEnum)request.PaymentMethod)
                {   
                    case PaymentMethodEnum.Cash:
                        break;
                    case PaymentMethodEnum.Credit:
                        break;
                    case PaymentMethodEnum.MobileBanking:
                        entity.MobileBankMethod = (MobileBankMethodEnum)request.MobileBankMethod;
                        entity.PhoneNumber = request.PhoneNumber;
                        break;
                    case PaymentMethodEnum.BankTransfer:
                        entity.AccountNumber = request.AccountNumber;
                        entity.BankName = request.BankName;
                        break;
                    default:
                        break;
                }
                entity.IsBerger = request.IsBerger;

                if (request.Id > 0 && request.DueAmount == 0)
                {
                    switch (request.PaymentType)
                    {
                        case 1:
                            if (request.IsBerger)
                            {
                                var existRO = await _ro_repository.GetByIdAsync(x => x.Id == request.OrderId, cancellationToken);
                                if (existRO != null)
                                {
                                    existRO.PaymentStatus = PaymentStatusEnum.Paid;
                                    await _ro_repository.UpdateAsync(existRO, cancellationToken);
                                }
                            }
                            else
                            {
                                var existPO = await _po_repository.GetByIdAsync(x => x.Id == request.OrderId, cancellationToken);
                                if (existPO != null)
                                {
                                    existPO.PaymentStatus = PaymentStatusEnum.Paid;
                                    await _po_repository.UpdateAsync(existPO, cancellationToken);
                                }
                            }
                            break;
                        case 2:
                            var existSO = await _so_repository.GetByIdAsync(x => x.Id == request.OrderId, cancellationToken);
                            if (existSO != null)
                            {
                                existSO.PaymentStatus = PaymentStatusEnum.Paid;
                                await _so_repository.UpdateAsync(existSO, cancellationToken);
                            }
                            break;
                        default:
                            break;
                    }
                }


                if (request.Id > 0)
                    await _repository.UpdateAsync(entity, cancellationToken);
                else
                    await _repository.AddAsync(entity, cancellationToken);

                await _repository.SaveChangesAsync(cancellationToken);

                return request.Id > 0 ? "Payment updated successfully" : "Payment created successfully";
            }
        }
        #endregion
    }
}
