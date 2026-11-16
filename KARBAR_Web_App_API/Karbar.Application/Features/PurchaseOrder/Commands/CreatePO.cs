using System.Security.Claims;
using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.PurchaseOrder.Commands
{
    public static class CreatePO
    {
        #region Command
        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public string PurchaseInvoiceNo { get; set; }
            public string PurchaseOrderId { get; set; }
            public DateTime PurchaseDate { get; set; }
            public DateTime RecievedDate { get; set; }
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

            public List<PurchaseOrderDetailRequest> PurchaseDetails { get; set; }
            public decimal PaidAmount { get; set; }
            public decimal DueAmount { get; set; }
            public decimal SubTotal { get; set; }
        }

        public sealed class PurchaseOrderDetailRequest
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
            public DateTime? PurchaseDate { get; set; }
            public DateTime? RecievedDate { get; set; }
        }
        #endregion
        #region Validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                //RuleFor(x => x.WarehouseId).GreaterThan(0);
                //RuleFor(x => x.TenantId).GreaterThan(0);
                //RuleFor(x => x.PurchaseDetails).NotEmpty().WithMessage("Purchase details required.");

                //RuleForEach(x => x.PurchaseDetails).ChildRules(detail =>
                //{
                //    detail.RuleFor(d => d.ItemId).GreaterThan(0);
                //    detail.RuleFor(d => d.Quantity).GreaterThan(0);
                //    detail.RuleFor(d => d.UnitPrice).GreaterThan(0);
                //});
            }
        }
        #endregion
        #region Handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<PurchaseOrderMaster> _masterRepository;
            private readonly IGenericRepository<PurchaseOrderDetail> _detailRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Payment.Payment> _paymentRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _RepositoryStock;
            private readonly IGenericRepository<Karbar.Domain.Entities.InvoiceData> _repositorySapSalesData;
            private readonly IGenericRepository<Karbar.Domain.Entities.Item> _repositoryItem;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<PurchaseOrderMaster> masterRepository,
                IGenericRepository<PurchaseOrderDetail> detailRepository,
                IGenericRepository<Karbar.Domain.Entities.Stock> RepositoryStock,
                IGenericRepository<Karbar.Domain.Entities.Payment.Payment> paymentRepository,
                IGenericRepository<Karbar.Domain.Entities.InvoiceData> repositorySapSalesData,
                IGenericRepository<Karbar.Domain.Entities.Item> repositoryItem,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _masterRepository = masterRepository;
                _detailRepository = detailRepository;   
                _repositoryItem = repositoryItem;   
                _repositorySapSalesData = repositorySapSalesData;
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

                PurchaseOrderMaster master;

                // Update Operation
                if (!string.IsNullOrEmpty(request.PurchaseOrderId))
                {
                    master = await _masterRepository.GetByIdAsync(
                        x => x.PurchaseOrderId == request.PurchaseOrderId,
                        cancellationToken)?? new PurchaseOrderMaster();

                    master.UpdatedDate = DateTime.Now;
                    master.UpdatedBy = userId;
                    
                    var existingDetails = await _detailRepository
                        .Query()
                        .Where(x => x.PurchaseOrderMasterId == master.Id)
                        .ToListAsync(cancellationToken);

                    foreach (var detail in existingDetails)
                    {
                        await _detailRepository.DeleteAsync(detail, cancellationToken);
                    }
                }
                else
                {
                    // Create new purchase master
                    master = new PurchaseOrderMaster
                    {
                        PurchaseOrderId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1,
                    };
                }
                master.PurchaseInvoiceNo = request.PurchaseInvoiceNo;
                master.PurchaseDate = request.PurchaseDate;
                master.RecievedDate = request.RecievedDate;
                master.TotalAmount = request.TotalAmount;
                master.SubTotal = request.SubTotal;
                master.DiscountAmount = request.DiscountAmount;
                master.Tax = request.Tax;
                master.Vat = request.Vat;
                master.TenantId = request.TenantId;

                if (request.DueAmount > 0 && request.PaidAmount != request.TotalAmount && (request.PaymentMethod != null && request.PaymentMethod > 0))
                {
                    var entryPayment = new Karbar.Domain.Entities.Payment.Payment
                    {
                        TenantId = request.TenantId,
                        UserType = UserTypeEnum.Supplier,
                        UserId = request.PurchaseDetails[0].SupplierId,
                        PaymentMethod = (PaymentMethodEnum)request.PaymentMethod,
                        PaymentType = 1,
                        OrderId = master.Id,
                        OrderInvoiceNo = master.PurchaseInvoiceNo,
                        DueAmount = request.DueAmount,
                        PaidAmount = request.PaidAmount,
                        TotalAmount = request.TotalAmount,
                        IsBerger = false,

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

                // Save master
                if (!string.IsNullOrEmpty(request.PurchaseOrderId))
                    await _masterRepository.UpdateAsync(master, cancellationToken);
                else
                    await _masterRepository.AddAsync(master, cancellationToken);
                await _masterRepository.SaveChangesAsync(cancellationToken);
                // Details
                var details = request.PurchaseDetails.Select(d => new PurchaseOrderDetail
                {
                    PurchaseOrderDetailId = GenerateId.MakeId(),
                    PurchaseOrderMasterId = master.Id,
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
                foreach (var i in details)
                {
                    await StockHelper.IncreaseStockAsync(
                        _RepositoryStock,
                        i.ItemId,
                        i.WarehouseId,   
                        request.TenantId,
                        i.Quantity);
                }
                // Commit
                await _masterRepository.SaveChangesAsync(cancellationToken);
                // weightedAveragePrice to save changes in the repositories
                foreach (var purchaseDetail in request.PurchaseDetails)
                {
                    var item = await _repositoryItem
                        .Query()
                        .FirstOrDefaultAsync(
                            x => x.Id == purchaseDetail.ItemId &&
                                 x.TenantId == request.TenantId,
                            cancellationToken);

                    if (item == null)
                        continue;

                    var invoices = await _masterRepository
                        .Query()
                        .Join(
                            _detailRepository.Query(),
                            master => master.Id,
                            detail => detail.PurchaseOrderMasterId,
                            (master, detail) => new
                            {
                                Master = master,
                                Detail = detail
                            })
                        .Where(x =>
                            x.Master.TenantId == request.TenantId &&
                            x.Detail.ItemId == purchaseDetail.ItemId)
                        .OrderByDescending(x => x.Master.CreatedDate)
                        .Take(3)
                        .ToListAsync(cancellationToken);

                    decimal averagePrice = invoices.Count > 0
                        ? invoices.Sum(x => x.Detail.UnitPrice) / invoices.Count
                        : 0m;

                    item.WeightedAveragePrice = averagePrice;
                    item.WeightedAveragePriceUpdatetdDate = DateTime.Now;
                }

                await _repositoryItem.SaveChangesAsync(cancellationToken);
                return !string.IsNullOrEmpty(request.PurchaseOrderId)
                    ? "Purchase Order Updated Successfully"
                    : "Purchase Order Created Successfully";

            }
        }
        #endregion
    }
}


