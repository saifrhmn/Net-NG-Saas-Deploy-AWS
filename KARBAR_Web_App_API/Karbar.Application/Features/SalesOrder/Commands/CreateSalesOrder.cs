using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.SalesOrder;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.ReturnOrder;
using Karbar.Domain.Entities.SalesOrder;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Karbar.Application.Features.SalesOrder.Commands
{
    public static class CreateSalesOrder
    {
        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public string? InvoiceNo { get; set; }
            public string SalesOrderId { get; set; }
            public DateTime SalesOrderDate { get; set; }
            public decimal TotalAmount { get; set; }
            public decimal DiscountAmount { get; set; }
            public decimal Tax { get; set; }
            public decimal Vat { get; set; }
            public decimal PaidAmount { get; set; }
            public decimal DueAmount { get; set; }
            public decimal SubTotal { get; set; }
            public decimal? DeliveryCharge { get; set; }
            public PaymentMethodEnum PaymentMethod { get; set; }
            public int? MobileBankMethod { get; set; }
            public string? PhoneNumber { get; set; }
            public string? Remarks { get; set; }
            public string? BankName { get; set; }
            public string? AccountNumber { get; set; }
            //public string CardNumber { get; set; }
            public int TenantId { get; set; }
            public int CustomerId { get; set; }
            public bool IsDraft { get; set; }
            public List<SalesOrderDetailRequest> SalesOrderDetails { get; set; }
        }
        public class SalesOrderDetailRequest
        {
            public int Id { get; set; }
            public string SalesOrderDetailId { get; set; }
            public int ItemId { get; set; }
            public int UomId { get; set; }
            public int? WarehouseId { get; set; }
            public decimal Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal TotalAmount { get; set; }
            public string? ShadesName { get; set; }
            public bool? IsReturn { get; set; }
        }
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {

            }
        }

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<SalesOrderMaster> _masterRepository;
            private readonly IGenericRepository<SalesOrderDetail> _detailRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Payment.Payment> _paymentRepository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _RepositoryStock;


            public CommandHandler(
                IGenericRepository<SalesOrderMaster> masterRepository,
                IGenericRepository<SalesOrderDetail> detailRepository,
                IGenericRepository<Karbar.Domain.Entities.Payment.Payment> paymentRepository,
                IHttpContextAccessor httpContextAccessor,
                IGenericRepository<Karbar.Domain.Entities.Stock> RepositoryStock,
                IValidator<Command> validator)
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
                try
                {
                    var userId = _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

                    // Validate
                    var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                    if (!validationResult.IsValid)
                        throw new ValidationException(validationResult.Errors);

                    SalesOrderMaster master;

                    // UPDATE OPERATION
                    if (!string.IsNullOrEmpty(request.SalesOrderId))
                    {
                        master = await _masterRepository.GetByIdAsync(
                            x => x.SalesOrderId == request.SalesOrderId,
                            cancellationToken) ?? new SalesOrderMaster();

                        master.UpdatedDate = DateTime.Now;
                        master.UpdatedBy = userId;
                        // DELETE OLD DETAILS (use SalesOrderId FK, not detail.Id)
                        var existingDetails = await _detailRepository
                            .Query()
                            .Where(x => x.SalesOrderId == master.Id)
                            .ToListAsync(cancellationToken);

                        if (existingDetails.Any())
                        {
                            foreach (var detail in existingDetails)
                            {
                                await _detailRepository.DeleteAsync(detail, cancellationToken);
                            }

                            // Commit deletes immediately so FK constraints won't interfere
                            await _detailRepository.SaveChangesAsync(cancellationToken);
                        }
                    }
                    else
                    {
                        // CREATE NEW MASTER
                        master = new SalesOrderMaster
                        {
                            SalesOrderId = GenerateId.MakeId(),
                            CreatedBy = userId,
                            CreatedDate = DateTime.Now,
                            Status = (StatusEnum)1
                        };
                    }

                    // MASTER FIELDS
                    master.SalesOrderId = string.IsNullOrEmpty(request.SalesOrderId)
                        ? master.SalesOrderId
                        : request.SalesOrderId;
                    master.InvoiceNo = request.InvoiceNo;
                    if (request.SalesOrderDate == null)
                    {
                        master.OrderDate = request.SalesOrderDate;
                    }
                    
                    master.CustomerId = request.CustomerId;
                    master.TotalAmount = request.TotalAmount;
                    master.SubTotal = request.SubTotal;
                    master.DiscountAmount = request.DiscountAmount;
                    master.DeliveryCharge = request.DeliveryCharge;
                    master.Vat = request.Vat;
                    master.Tax = request.Tax;
                    master.IsReturn = false;
                    master.IsDraft = request.IsDraft;
                    master.Remarks = request.Remarks;
                    master.PaidAmount = request.PaidAmount;
                    master.DueAmount = request.DueAmount;
                    master.PaymentMethod = (PaymentMethodEnum)request.PaymentMethod;
                    master.TenantId = request.TenantId == null ? 1 : request.TenantId;
                    if (request.IsDraft == false)
                    {
                        if (request.DueAmount > 0 && request.PaidAmount != request.TotalAmount && (request.PaymentMethod != null && request.PaymentMethod > 0))
                        {
                            var entryPayment = new Karbar.Domain.Entities.Payment.Payment
                            {
                                TenantId = request.TenantId,
                                UserType = UserTypeEnum.Customer,
                                UserId = request.CustomerId,
                                PaymentMethod = (PaymentMethodEnum)request.PaymentMethod,
                                PaymentType = 2,
                                OrderId = master.Id,
                                OrderInvoiceNo = master.InvoiceNo,
                                DueAmount = request.DueAmount,
                                PaidAmount = request.PaidAmount,
                                TotalAmount = request.TotalAmount,

                                CreatedBy = userId,
                                CreatedDate = DateTime.Now
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
                    }
                    // SAVE MASTER
                    if (!string.IsNullOrEmpty(request.SalesOrderId))
                        await _masterRepository.UpdateAsync(master, cancellationToken);
                    else
                        await _masterRepository.AddAsync(master, cancellationToken);

                    await _masterRepository.SaveChangesAsync(cancellationToken);

                    // DETAILS: guard null/empty and set integer FK
                    if (request.SalesOrderDetails != null && request.SalesOrderDetails.Any())
                    {
                        var details = request.SalesOrderDetails.Select(d => new SalesOrderDetail
                        {
                            SalesOrderDetailId = GenerateId.MakeId(),
                            SalesOrderId = master.Id, 
                            ItemId = d.ItemId,
                            UomId = d.UomId,
                            Quantity = d.Quantity,
                            UnitPrice = d.UnitPrice,
                            WarehouseId = d.WarehouseId,
                            TotalAmount = d.TotalAmount,
                            CreatedDate = DateTime.Now,
                            ShadesName = d.ShadesName,
                            IsReturn = d.IsReturn ?? false,
                            Status = (StatusEnum)1
                        }).ToList();

                        // SAVE DETAILS and commit on the repository that handled the add
                        await _detailRepository.AddRangeAsync(details, cancellationToken);
                        await _detailRepository.SaveChangesAsync(cancellationToken);

                        // IsDraft delete
                        if (request.IsDraft == false)
                        {
                            var orderIds = await _masterRepository.Query()
                                .Where(x => x.IsDraft == true && x.InvoiceNo == request.InvoiceNo)
                                .Select(x => x.Id)
                                .ToListAsync();

                            if (!orderIds.Any())
                            {
                                return string.Empty;
                            }

                            // Step 2: Delete details
                            await _detailRepository.Query()
                                .Where(d => orderIds.Contains(d.SalesOrderId))
                                .ExecuteDeleteAsync();

                            // Step 3: Delete masters
                            await _masterRepository.Query()
                                .Where(x => orderIds.Contains(x.Id))
                                .ExecuteDeleteAsync();
                        }
                        // Update Stock
                        if (request.IsDraft == false)
                        {
                            foreach (var i in details)
                            {
                                await StockHelper.DecreaseStockAsync(
                                    _RepositoryStock,
                                    i.ItemId,
                                    i.WarehouseId,
                                    request.TenantId,
                                    i.Quantity);
                            }
                        }
                    }

                    return string.IsNullOrEmpty(request.SalesOrderId)
                        ? "Sales Order Created Successfully"
                        : "Sales Order Updated Successfully";
                }
                catch (DbUpdateException dbEx)
                {
                    // Log the inner exception for debugging
                    var errorMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                    return $"Database error: {errorMessage}";
                }
                catch (ValidationException valEx)
                {
                    return $"Validation failed: {string.Join(", ", valEx.Errors.Select(e => e.ErrorMessage))}";
                }
                catch (Exception ex)
                {
                    return $"An unexpected error occurred: {ex.Message}";
                }
            }
        }
    }
}