using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.ReturnOrder;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.ReturnOrder;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Karbar.Application.Features.ReturnOrder.Commands
{
    public static class CreateReturnOrder
    {
        #region Command
        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public string? SalesInvoiceNo { get; set; }
            public string ReturnOrderId { get; set; }
            public DateTime SalesDate { get; set; }
            public decimal TotalAmount { get; set; }
            public decimal DiscountAmount { get; set; }
            public decimal Tax { get; set; }
            public decimal Vat { get; set; }
            public string? PaymentMethod { get; set; }
            public string? MobileBankMethod { get; set; }
            public string? PhoneNumber { get; set; }
            public int BankId { get; set; }
            public string? CardNumber { get; set; }
            public int WarehouseId { get; set; }
            public int TenantId { get; set; }
            public int? CustomerId { get; set; }
            public string? Remarks { get; set; }
            public List<ReturnOrderDetailRequest> ReturnOrderDetails { get; set; } = new();
        }

        public sealed class ReturnOrderDetailRequest
        {

            public int Id { get; set; }
            public string ReturnOrderDetailId { get; set; }
            public int ItemId { get; set; }
            public int UomId { get; set; }
            public int? WarehouseId { get; set; }
            public decimal Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal ReturnTotalAmount { get; set; }
            public decimal TotalAmount { get; set; }
            public bool IsReturn { get; set; }
        }
        #endregion

        #region Validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                // add rules if needed
            }
        }
        #endregion

        #region Handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<ReturnOrderMaster> _masterRepository;
            private readonly IGenericRepository<ReturnOrderDetail> _detailRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _repositoryStock;
            private readonly IGenericRepository<Karbar.Domain.Entities.Payment.Payment> _repositoryPayment;
            private readonly IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderMaster> _repositorySalesOrderMaster;
            private readonly IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderDetail> _repositorySalesOrderDetail;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<ReturnOrderMaster> masterRepository,
                IGenericRepository<ReturnOrderDetail> detailRepository,
                IGenericRepository<Karbar.Domain.Entities.Stock> repositoryStock,
                IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderMaster> so_repository,
                IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderDetail> so_details_repository,
                IGenericRepository<Karbar.Domain.Entities.Payment.Payment> repositoryPayment,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _masterRepository = masterRepository;
                _detailRepository = detailRepository;
                _repositoryStock = repositoryStock;
                _repositorySalesOrderMaster = so_repository;
                _repositorySalesOrderDetail = so_details_repository;
                _repositoryPayment = repositoryPayment;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }
            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                var master = await _masterRepository
                    .GetByIdAsync(x => x.SalesInvoiceNo == request.SalesInvoiceNo, cancellationToken)
                    ?? new ReturnOrderMaster();

                var detail_ret = await _detailRepository
                    .GetByIdAsync(x => x.ReturnOrderId == master.Id, cancellationToken)
                    ?? new ReturnOrderDetail();
                // Load all sales details once (optimization + validation)
                var salesOrderDetailsList = await (
                    from mastersal in _repositorySalesOrderMaster.Query()
                    join detail in _repositorySalesOrderDetail.Query()
                        on mastersal.Id equals detail.SalesOrderId
                    where mastersal.InvoiceNo == request.SalesInvoiceNo
                          && mastersal.IsDraft == false
                    select detail
                ).ToListAsync(cancellationToken);

                if (master.Id > 0)
                {
                    master.TotalAmount += request.TotalAmount;
                    master.UpdatedDate = DateTime.Now;
                    master.UpdatedBy = userId;

                    await _masterRepository.SaveChangesAsync(cancellationToken);

                    foreach (var item in request.ReturnOrderDetails)
                    {
                        var salesDetail = salesOrderDetailsList
                            .FirstOrDefault(x => x.ItemId == item.ItemId);

                        if (salesDetail == null)
                            throw new Exception($"Item {item.ItemId} not found in sales");

                        // VALIDATION (prevent over return)
                        var alreadyReturned = detail_ret.Quantity;
                        if (alreadyReturned + item.Quantity > salesDetail.Quantity)
                            throw new Exception($"Return exceeds sold qty for Item {item.ItemId}");

                        var returnDetails = await _detailRepository
                            .Query()
                            .Where(x => x.ReturnOrderId == master.Id && x.ItemId == item.ItemId)
                            .FirstOrDefaultAsync();

                        if (returnDetails != null)
                        {
                            returnDetails.Quantity += item.Quantity;
                            returnDetails.TotalAmount += item.TotalAmount;
                            returnDetails.UpdatedBy = userId;
                            returnDetails.UpdatedDate = DateTime.Now;

                            await _detailRepository.UpdateAsync(returnDetails);
                        }
                        else
                        {
                            var newEntry = new ReturnOrderDetail
                            {
                                ReturnOrderDetailId = GenerateId.MakeId(),
                                ReturnOrderId = master.Id,
                                ItemId = item.ItemId,
                                UomId = item.UomId,
                                WarehouseId = item.WarehouseId,
                                Quantity = item.Quantity,
                                UnitPrice = item.UnitPrice,
                                TotalAmount = item.TotalAmount,
                                CreatedBy = userId,
                                CreatedDate = DateTime.Now,
                                Status = (StatusEnum)1,
                            };

                            await _detailRepository.AddAsync(newEntry);
                        }

                        // IMPORTANT FIX
                        //salesDetail.Quantity += item.Quantity;

                        if (salesDetail.Quantity >= item.Quantity)
                            salesDetail.IsReturn = true;

                        // Stock update
                        await StockHelper.IncreaseStockAsync(
                            _repositoryStock,
                            item.ItemId,
                            item.WarehouseId,
                            request.TenantId,
                            item.Quantity);

                    }

                    await _detailRepository.SaveChangesAsync(cancellationToken);
                    await _repositorySalesOrderDetail.SaveChangesAsync(cancellationToken);
                }
                else
                {
                    master = new ReturnOrderMaster
                    {
                        ReturnOrderId = "RetOr-" + GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1,

                        SalesInvoiceNo = request.SalesInvoiceNo,
                        SalesDate = request.SalesDate,
                        CustomerId = request.CustomerId,
                        TotalAmount = request.ReturnOrderDetails.Sum(x => x.ReturnTotalAmount), //request.TotalAmount,
                        DiscountAmount = request.DiscountAmount,
                        Tax = request.Tax,
                        Vat = request.Vat,
                        PaymentMethod = request.PaymentMethod,
                        MobileBankMethod = request.MobileBankMethod,
                        PhoneNumber = request.PhoneNumber,
                        BankId = request.BankId,
                        CardNumber = request.CardNumber,
                        WarehouseId = request.WarehouseId,
                        TenantId = request.TenantId,
                        Remarks = request.Remarks
                    };

                    await _masterRepository.AddAsync(master, cancellationToken);
                    await _masterRepository.SaveChangesAsync(cancellationToken);

                    var details = new List<ReturnOrderDetail>();

                    foreach (var d in request.ReturnOrderDetails)
                    {
                        var salesDetail = salesOrderDetailsList
                            .FirstOrDefault(x => x.ItemId == d.ItemId);

                        if (salesDetail == null)
                            throw new Exception($"Item {d.ItemId} not found in sales");

                        // VALIDATION
                        if (d.Quantity > salesDetail.Quantity)
                            throw new Exception($"Return exceeds sold qty for Item {d.ItemId}");

                        details.Add(new ReturnOrderDetail
                        {
                            ReturnOrderDetailId = GenerateId.MakeId(),
                            ReturnOrderId = master.Id,
                            ItemId = d.ItemId,
                            UomId = d.UomId,
                            WarehouseId = d.WarehouseId,
                            Quantity = d.Quantity,
                            UnitPrice = d.UnitPrice,
                            TotalAmount = d.ReturnTotalAmount,
                            CreatedBy = userId,
                            CreatedDate = DateTime.Now,
                            Status = (StatusEnum)1,
                        });

                        // salesDetail.Quantity += d.Quantity;

                        if (salesDetail.Quantity >= salesDetail.Quantity)
                            salesDetail.IsReturn = true;
                    }

                    if (details.Any())
                    {
                        await _detailRepository.AddRangeAsync(details, cancellationToken);
                        await _detailRepository.SaveChangesAsync(cancellationToken);

                        foreach (var i in details)
                        {
                            await StockHelper.IncreaseStockAsync(
                                _repositoryStock,
                                i.ItemId,
                                i.WarehouseId,
                                request.TenantId,
                                i.Quantity);
                        }
                    }
                   
                    await _repositorySalesOrderDetail.SaveChangesAsync(cancellationToken);
                    

                }
                #region _payment_deduction
                var paymentDetails = await _repositoryPayment
                            .Query()
                            .Where(x => x.OrderInvoiceNo == master.SalesInvoiceNo)
                            .FirstOrDefaultAsync();
                if (paymentDetails != null)
                {
                    //var salesOrderMaster = await _repositorySalesOrderMaster.Query().Where(x => x.InvoiceNo == master.SalesInvoiceNo).FirstOrDefaultAsync();
                    //if (salesOrderMaster != null)
                    //{
                    //    salesOrderMaster.DueAmount = salesOrderMaster.
                    //}

                    paymentDetails.TotalAmount -= master.TotalAmount;
                    paymentDetails.DueAmount -= master.TotalAmount;
                    //if (paymentDetails.PaidAmount != 0)
                    //paymentDetails.PaidAmount -= master.TotalAmount;
                    await _repositoryPayment.UpdateAsync(paymentDetails, cancellationToken);
                }
                await _repositoryPayment.SaveChangesAsync(cancellationToken);
                #endregion _payment_deduction
                return !string.IsNullOrEmpty(request.ReturnOrderId)
                    ? "Return Order Updated Successfully"
                    : "Return Order Created Successfully";
            }
            //public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            //{
            //    var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

            //    var validationResult = await _validator.ValidateAsync(request, cancellationToken);
            //    if (!validationResult.IsValid)
            //        throw new ValidationException(validationResult.Errors);

            //    ReturnOrderMaster master = await _masterRepository.GetByIdAsync(x => x.SalesInvoiceNo == request.SalesInvoiceNo, cancellationToken)
            //                 ?? new ReturnOrderMaster();

            //    if (master.Id > 0)
            //    {
            //        master.TotalAmount += request.TotalAmount;
            //        master.UpdatedDate = DateTime.Now;
            //        master.UpdatedBy = userId;

            //        await _masterRepository.SaveChangesAsync(cancellationToken);

            //        foreach (var item in request.ReturnOrderDetails)        
            //        {
            //            var returnDetails = await _detailRepository
            //                    .Query()
            //                    .Where(x => x.ReturnOrderId == master.Id && x.ItemId == item.ItemId)
            //                    .FirstOrDefaultAsync();
            //            if (returnDetails != null)
            //            {
            //                returnDetails.Quantity += item.Quantity;
            //                returnDetails.TotalAmount += item.TotalAmount;
            //                returnDetails.UpdatedBy = userId;
            //                returnDetails.UpdatedDate = DateTime.Now;

            //                await _detailRepository.UpdateAsync(returnDetails);

            //            }
            //            else
            //            {
            //                var newEntry = new ReturnOrderDetail
            //                {
            //                    ReturnOrderDetailId = GenerateId.MakeId(),
            //                    ReturnOrderId = master.Id,
            //                    ItemId = item.ItemId,
            //                    UomId = item.UomId,
            //                    WarehouseId = item.WarehouseId,
            //                    Quantity = item.Quantity,
            //                    UnitPrice = item.UnitPrice,
            //                    TotalAmount = item.TotalAmount,
            //                    CreatedBy = userId,
            //                    CreatedDate = DateTime.Now,
            //                    Status = (StatusEnum)1,
            //                };

            //                var result = await _detailRepository.AddAsync(newEntry);
            //                if (result)
            //                {
            //                    var salesOrderDetails = await (
            //                            from mastersal in _repositorySalesOrderMaster.Query()
            //                            join detail in _repositorySalesOrderDetail.Query()
            //                                on mastersal.Id equals detail.SalesOrderId
            //                            where mastersal.InvoiceNo == request.SalesInvoiceNo && detail.ItemId == item.ItemId
            //                                  && mastersal.IsDraft == false
            //                            select detail
            //                        ).FirstOrDefaultAsync(cancellationToken);
            //                    if (salesOrderDetails != null)
            //                    {
            //                        salesOrderDetails.IsReturn = true;
            //                        await _repositorySalesOrderDetail.UpdateAsync(salesOrderDetails, cancellationToken);
            //                    }
            //                }
            //            }

            //            await StockHelper.IncreaseStockAsync(
            //                        _repositoryStock,
            //                        item.ItemId,
            //                        item.WarehouseId,
            //                        request.TenantId,
            //                        item.Quantity);

            //        }
            //        await _detailRepository.SaveChangesAsync(cancellationToken);

            //    }
            //    else
            //    {
            //        master = new ReturnOrderMaster
            //        {
            //            ReturnOrderId = "RetOr-" + GenerateId.MakeId(),
            //            CreatedBy = userId,
            //            CreatedDate = DateTime.Now,
            //            Status = (StatusEnum)1,
            //        };


            //        master.SalesInvoiceNo = request.SalesInvoiceNo;
            //        master.SalesDate = request.SalesDate;
            //        master.CustomerId = request.CustomerId;
            //        master.TotalAmount = request.TotalAmount;
            //        master.DiscountAmount = request.DiscountAmount;
            //        master.Tax = request.Tax;
            //        master.Vat = request.Vat;
            //        master.PaymentMethod = request.PaymentMethod;
            //        master.MobileBankMethod = request.MobileBankMethod;
            //        master.PhoneNumber = request.PhoneNumber;
            //        master.BankId = request.BankId;
            //        master.CardNumber = request.CardNumber;
            //        master.WarehouseId = request.WarehouseId;
            //        master.TenantId = request.TenantId;
            //        master.Remarks = request.Remarks;
            //        if (!string.IsNullOrEmpty(request.ReturnOrderId))
            //            await _masterRepository.UpdateAsync(master, cancellationToken);
            //        else
            //            await _masterRepository.AddAsync(master, cancellationToken);

            //        await _masterRepository.SaveChangesAsync(cancellationToken);

            //        var details = request.ReturnOrderDetails.Select(d => new ReturnOrderDetail
            //        {
            //            ReturnOrderDetailId = GenerateId.MakeId(),
            //            ReturnOrderId = master.Id,
            //            ItemId = d.ItemId,
            //            UomId = d.UomId,
            //            WarehouseId = d.WarehouseId,
            //            Quantity = d.Quantity,
            //            UnitPrice = d.UnitPrice,
            //            TotalAmount = d.TotalAmount,
            //            CreatedBy = userId,
            //            CreatedDate = DateTime.Now,
            //            Status = (StatusEnum)1,
            //        }).ToList();

            //        if (details.Any())
            //        {
            //            await _detailRepository.AddRangeAsync(details, cancellationToken);
            //            await _detailRepository.SaveChangesAsync(cancellationToken);

            //            // Return increases stock
            //            foreach (var i in details)
            //            {
            //                await StockHelper.IncreaseStockAsync(
            //                    _repositoryStock,
            //                    i.ItemId,
            //                    i.WarehouseId,
            //                    request.TenantId,
            //                    i.Quantity);
            //            }
            //        }
            //        var salesOrderDetails = await (
            //            from mastersal in _repositorySalesOrderMaster.Query()
            //            join detail in _repositorySalesOrderDetail.Query()
            //                on mastersal.Id equals detail.SalesOrderId
            //            where mastersal.InvoiceNo == request.SalesInvoiceNo
            //                  && mastersal.IsDraft == false
            //            select detail
            //        ).ToListAsync(cancellationToken);

            //        if (salesOrderDetails.Any())
            //        {
            //            foreach (var item in details)
            //            {
            //                var matched = salesOrderDetails
            //                    .Where(x => x.ItemId == item.ItemId)
            //                    .ToList();

            //                foreach (var salesDetail in matched)
            //                {
            //                    salesDetail.IsReturn = true;
            //                    await _repositorySalesOrderDetail.UpdateAsync(salesDetail, cancellationToken);
            //                }
            //            }

            //            await _repositorySalesOrderDetail.SaveChangesAsync(cancellationToken);
            //        }
            //    }


            //    return !string.IsNullOrEmpty(request.ReturnOrderId)
            //        ? "Return Order Updated Successfully"
            //        : "Return Order Created Successfully";
            //}
        }
        #endregion
    }
}
