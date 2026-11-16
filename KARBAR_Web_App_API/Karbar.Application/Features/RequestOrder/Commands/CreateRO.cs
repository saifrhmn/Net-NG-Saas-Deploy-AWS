using System.Security.Claims;
using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities.RequestOrder;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.RequestOrder.Commands
{
    public static class CreateRO
    {
        #region Command
        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public string OrderNo { get; set; }
            public string PurchaseOrderId { get; set; }
            public DateTime PurchaseDate { get; set; }
            public DateTime? RecievedDate { get; set; }
            public decimal TotalAmount { get; set; }
            public decimal DiscountAmount { get; set; }
            public decimal Tax { get; set; }
            public decimal Vat { get; set; }
            public int? PaymentMethod { get; set; }
            public int? MobileBankMethod { get; set; }
            public string PhoneNumber { get; set; }
            //public int BankId { get; set; }
            public string? BankName { get; set; }
            public string? AccountNumber { get; set; }
            //public string CardNumber { get; set; }
            public string ShippingMethod { get; set; }
            public int WarehouseId { get; set; }
            public int TenantId { get; set; }
            public bool? IsBerger { get; set; }
            public List<RequestOrderDetailRequest> RequestOrderDetails { get; set; }
            public decimal PaidAmount { get; set; }
            public decimal DueAmount { get; set; }
        }

        public sealed class RequestOrderDetailRequest
        {
            public int Id { get; set; }
            public string PurchaseOrderDetailId { get; set; }
            public int ItemId { get; set; }
            public int UomId { get; set; }
            public int WarehouseId { get; set; }
            public int SupplierId { get; set; }

            public decimal Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal TotalAmount { get; set; }
            public DateTime PurchaseDate { get; set; }
            public DateTime RecievedDate { get; set; }
        }
        #endregion
        #region Validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
               
            }
        }
        #endregion
        #region Handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<RequestOrderMaster> _masterRepository;
            private readonly IGenericRepository<RequestOrderDetail> _detailRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Payment.Payment> _paymentRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _RepositoryStock;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<RequestOrderMaster> masterRepository,
                IGenericRepository<RequestOrderDetail> detailRepository,
                IGenericRepository<Karbar.Domain.Entities.Payment.Payment> paymentRepository,
                IGenericRepository<Karbar.Domain.Entities.Stock> RepositoryStock,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _masterRepository = masterRepository;
                _detailRepository = detailRepository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
                _RepositoryStock = RepositoryStock;
                _paymentRepository = paymentRepository;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var userId = _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                RequestOrderMaster master;

                // Update Operation
                if (!string.IsNullOrEmpty(request.PurchaseOrderId))
                {
                    master = await _masterRepository.GetByIdAsync(
                        x => x.PurchaseOrderId == request.PurchaseOrderId,
                        cancellationToken) ?? new RequestOrderMaster();

                    master.UpdatedDate = DateTime.Now;
                    master.UpdatedBy = userId;

                    var existingDetails = await _detailRepository
                        .Query()
                        .Where(x => x.Id == request.Id)
                        .ToListAsync(cancellationToken);

                    foreach (var detail in existingDetails)
                    {
                        await _detailRepository.DeleteAsync(detail, cancellationToken);
                    }
                }
                else
                {
                    // Create new purchase master
                    master = new RequestOrderMaster
                    {
                        PurchaseOrderId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1,
                    };
                }
                var dailyOrderCount = await _masterRepository
                        .Query().CountAsync() ;
                
                dailyOrderCount += 1;
                master.PurchaseInvoiceNo = "JH-" + DateTime.Now.ToString("ddMMyy") +"-"+ dailyOrderCount.ToString("D4");
                master.PurchaseDate = request.PurchaseDate;
                master.ReceivedDate = request.RecievedDate;
                master.TotalAmount = request.TotalAmount;
                master.DiscountAmount = request.DiscountAmount;
                master.Tax = request.Tax;
                master.Vat = request.Vat;
                master.IsBerger = request.IsBerger;
                master.OrderStatus = "Created";
                master.TenantId = request.TenantId;
                //master.PaidAmount = request.PaidAmount;
                //master.DueAmount = request.DueAmount;
                if (request.DueAmount > 0 && request.PaidAmount != request.TotalAmount && (request.PaymentMethod != null && request.PaymentMethod > 0))
                {
                    var entryPayment = new Karbar.Domain.Entities.Payment.Payment
                    {
                        TenantId = request.TenantId,
                        UserType = UserTypeEnum.Supplier,
                        UserId = request.RequestOrderDetails[0].SupplierId,
                        PaymentMethod = (PaymentMethodEnum)request.PaymentMethod,
                        PaymentType = 1,
                        OrderId = master.Id,
                        OrderInvoiceNo = master.PurchaseInvoiceNo,
                        DueAmount = request.DueAmount,
                        PaidAmount = request.PaidAmount,
                        TotalAmount = request.TotalAmount,
                        IsBerger = true
                    };
                    switch ((PaymentMethodEnum)request.PaymentMethod)
                    {
                        case PaymentMethodEnum.Cash:
                            break;
                        case PaymentMethodEnum.Credit:
                            break;
                        case PaymentMethodEnum.MobileBanking:
                            entryPayment.MobileBankMethod = (MobileBankMethodEnum)request.MobileBankMethod;
                            entryPayment.PhoneNumber = request.PhoneNumber;
                            break;
                        case PaymentMethodEnum.BankTransfer:
                            entryPayment.AccountNumber = request.AccountNumber;
                            entryPayment.BankName = request.BankName;
                            break;
                        default:
                            break;
                    }

                    await _paymentRepository.AddAsync(entryPayment, cancellationToken);
                }

                // Save master
                if (!string.IsNullOrEmpty(request.PurchaseOrderId))
                    await _masterRepository.UpdateAsync(master, cancellationToken);
                else
                    await _masterRepository.AddAsync(master, cancellationToken);
                await _masterRepository.SaveChangesAsync(cancellationToken);
                // Details
                var details = request.RequestOrderDetails.Select(d => new RequestOrderDetail
                {
                    RequestOrderDetailId = GenerateId.MakeId(),
                    RequestOrderMasterId = master.Id,
                    ItemId = d.ItemId,
                    UomId = d.UomId,
                    SupplierId = d.SupplierId,
                    WarehouseId = d.WarehouseId,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice,
                    TotalAmount = d.TotalAmount,
                    CreatedBy = userId,
                    CreatedDate = DateTime.Now,
                    Status = (StatusEnum)1,
                }).ToList();

                // Save details
                await _detailRepository.AddRangeAsync(details, cancellationToken);
                // Update Stock 
                //foreach (var i in details)
                //{
                //    await StockHelper.IncreaseStockAsync(
                //        _RepositoryStock,
                //        i.ItemId,
                //        i.WarehouseId,
                //        request.TenantId,
                //        i.Quantity);
                //}
                // Commit
                await _masterRepository.SaveChangesAsync(cancellationToken);

                return !string.IsNullOrEmpty(request.PurchaseOrderId)
                    ? "Request Order Updated Successfully"
                    : "Request Order Created Successfully";

            }
        }
        #endregion
    }
}
