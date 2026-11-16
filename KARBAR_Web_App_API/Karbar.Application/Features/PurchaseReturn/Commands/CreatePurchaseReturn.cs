using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.PurchaseReturn;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.PurchaseReturn;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Karbar.Application.Features.PurchaseReturn.Commands
{
    public static class CreatePurchaseReturn
    {
        #region Command
        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public string? PurchaseInvoiceNo { get; set; }
            public string? PurchaseReturnId { get; set; }
            public DateTime PurchaseDate { get; set; }
            public decimal? TotalAmount { get; set; }
            public decimal? DiscountAmount { get; set; }
            public decimal? Tax { get; set; }
            public decimal? Vat { get; set; }
            public string? PaymentMethod { get; set; }
            public string? MobileBankMethod { get; set; }
            public string? PhoneNumber { get; set; }
            public int? BankId { get; set; }
            public string? CardNumber { get; set; }
            public int WarehouseId { get; set; }
            public int TenantId { get; set; }
            public int? SupplierId { get; set; }
            public string? Remarks { get; set; }
            public bool? IsReturn { get; set; }
            public List<PurchaseReturnDetailRequest> PurchaseReturnDetails { get; set; } = new();
        }

        public sealed class PurchaseReturnDetailRequest
        {
            public int? Id { get; set; }
            public string? PurchaseReturnDetailId { get; set; }
            public int ItemId { get; set; }
            public int UomId { get; set; }
            public int? WarehouseId { get; set; }
            public decimal Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal TotalAmount { get; set; }
            public bool? IsReturn { get; set; }
        }
        #endregion

        #region Validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {

            }
        }
        #endregion

        #region Custom Exceptions
        public class PurchaseReturnNotFoundException : Exception
        {
            public PurchaseReturnNotFoundException(string purchaseReturnId)
                : base($"Purchase Return with ID '{purchaseReturnId}' was not found.") { }
        }

        #endregion

        #region Handler
        #region Handler

        public sealed class CommandHandler
            : IRequestHandler<Command, string>
        {
            private readonly
                IGenericRepository<PurchaseReturnMaster>
                _masterRepository;

            private readonly
                IGenericRepository<PurchaseReturnDetail>
                _detailRepository;

            private readonly
                IGenericRepository<PurchaseOrderMaster>
                _POmasterRepository;

            private readonly
                IGenericRepository<PurchaseOrderDetail>
                _POdetailRepository;

            private readonly
                IGenericRepository<Karbar.Domain.Entities.Stock>
                _repositoryStock;

            private readonly IValidator<Command> _validator;

            private readonly IHttpContextAccessor
                _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<PurchaseReturnMaster>
                    masterRepository,

                IGenericRepository<PurchaseReturnDetail>
                    detailRepository,

                IGenericRepository<PurchaseOrderMaster>
                    POmasterRepository,

                IGenericRepository<PurchaseOrderDetail>
                    POdetailRepository,

                IGenericRepository<Karbar.Domain.Entities.Stock>
                    repositoryStock,

                IValidator<Command> validator,

                IHttpContextAccessor httpContextAccessor)
            {
                _masterRepository =
                    masterRepository;

                _detailRepository =
                    detailRepository;

                _POmasterRepository =
                    POmasterRepository;

                _POdetailRepository =
                    POdetailRepository;

                _repositoryStock =
                    repositoryStock;

                _validator =
                    validator;

                _httpContextAccessor =
                    httpContextAccessor;
            }

            public async Task<string> Handle(
                Command request,
                CancellationToken cancellationToken)
            {
                try
                {
                    // =====================================================
                    // 1. Get logged-in user
                    // =====================================================

                    var userId =
                        _httpContextAccessor.HttpContext?
                            .User
                            .FindFirstValue(
                                ClaimTypes.NameIdentifier);

                    // =====================================================
                    // 2. Validate request
                    // =====================================================

                    var validationResult =
                        await _validator.ValidateAsync(
                            request,
                            cancellationToken);

                    if (!validationResult.IsValid)
                    {
                        throw new ValidationException(
                            validationResult.Errors);
                    }

                    // =====================================================
                    // 3. Create / Update Master
                    // =====================================================

                    PurchaseReturnMaster master;

                    bool isUpdate = false;

                    if (request.Id > 0)
                    {
                        // -------------------------------------------------
                        // Update
                        // -------------------------------------------------

                        master =
                            await _masterRepository.GetByIdAsync(
                                x => x.Id == request.Id,
                                cancellationToken);

                        if (master == null)
                        {
                            throw new PurchaseReturnNotFoundException(
                                request.PurchaseReturnId);
                        }

                        isUpdate = true;

                        master.UpdatedDate =
                            DateTime.Now;

                        master.UpdatedBy =
                            userId;

                        // ================================================
                        // Get existing return details
                        // ================================================

                        var existingDetails =
                            await _detailRepository
                                .Query()
                                .Where(x =>
                                    x.PurchaseReturnId ==
                                    master.Id)
                                .ToListAsync(
                                    cancellationToken);

                        // ================================================
                        // Reverse old stock
                        //
                        // Old return was already deducted from stock.
                        //
                        // Example:
                        //
                        // Stock = 90
                        // Old Return = 10
                        //
                        // Update starts:
                        // Stock = 100
                        // ================================================

                        foreach (
                            var oldDetail
                            in existingDetails)
                        {
                            if (oldDetail.Quantity <= 0)
                                continue;

                            await StockHelper.IncreaseStockAsync(
                                _repositoryStock,

                                oldDetail.ItemId,

                                oldDetail.WarehouseId,

                                request.TenantId,

                                oldDetail.Quantity);
                        }

                        // ================================================
                        // Delete existing return details
                        // ================================================

                        foreach (
                            var oldDetail
                            in existingDetails)
                        {
                            await _detailRepository.DeleteAsync(
                                oldDetail,
                                cancellationToken);
                        }

                        if (existingDetails.Any())
                        {
                            await _detailRepository
                                .SaveChangesAsync(
                                    cancellationToken);
                        }
                    }
                    else
                    {
                        // -------------------------------------------------
                        // Create
                        // -------------------------------------------------

                        master =
                            new PurchaseReturnMaster
                            {
                                PurchaseReturnId =
                                    "PurRet-" +
                                    GenerateId.MakeId(),

                                CreatedBy =
                                    userId,

                                CreatedDate =
                                    DateTime.Now,

                                Status =
                                    (StatusEnum)1
                            };
                    }

                    // =====================================================
                    // 4. Populate Master
                    // =====================================================

                    master.PurchaseInvoiceNo =
                        request.PurchaseInvoiceNo;

                    master.PurchaseDate =
                        request.PurchaseDate;

                    master.SupplierId =
                        request.SupplierId;

                    master.TotalAmount =
                        request.TotalAmount;

                    master.DiscountAmount =
                        request.DiscountAmount;

                    master.Tax =
                        request.Tax;

                    master.Vat =
                        request.Vat;

                    master.PaymentMethod =
                        request.PaymentMethod;

                    master.MobileBankMethod =
                        request.MobileBankMethod;

                    master.PhoneNumber =
                        request.PhoneNumber;

                    master.BankId =
                        request.BankId;

                    master.CardNumber =
                        request.CardNumber;

                    master.WarehouseId =
                        request.WarehouseId;

                    master.TenantId =
                        request.TenantId;

                    master.Remarks =
                        request.Remarks;

                    // =====================================================
                    // 5. Save Master
                    // =====================================================

                    if (isUpdate)
                    {
                        await _masterRepository.UpdateAsync(
                            master,
                            cancellationToken);
                    }
                    else
                    {
                        await _masterRepository.AddAsync(
                            master,
                            cancellationToken);
                    }

                    await _masterRepository.SaveChangesAsync(
                        cancellationToken);

                    // =====================================================
                    // 6. Get Purchase Order Details
                    // =====================================================

                    var poDetailsList =
                        await
                        (
                            from masterPO
                                in _POmasterRepository.Query()

                            join detail
                                in _POdetailRepository.Query()

                                on masterPO.Id
                                equals detail.PurchaseOrderMasterId

                            where masterPO.PurchaseInvoiceNo ==
                                  request.PurchaseInvoiceNo

                            select detail

                        ).ToListAsync(
                            cancellationToken);

                    if (!poDetailsList.Any())
                    {
                        throw new Exception(
                            $"Purchase Order not found for invoice " +
                            $"{request.PurchaseInvoiceNo}.");
                    }

                    // =====================================================
                    // 7. Create Return Details
                    // =====================================================

                    var details =
                        new List<PurchaseReturnDetail>();

                    foreach (
                        var requestDetail
                        in request.PurchaseReturnDetails)
                    {
                        // =================================================
                        // Validate quantity
                        // =================================================

                        if (requestDetail.Quantity <= 0)
                        {
                            throw new Exception(
                                $"Return quantity must be greater than " +
                                $"zero for ItemId " +
                                $"{requestDetail.ItemId}.");
                        }

                        // =================================================
                        // Warehouse
                        // =================================================

                        var warehouseId =
                            requestDetail.WarehouseId
                            ?? request.WarehouseId;

                        if (warehouseId <= 0)
                        {
                            throw new Exception(
                                $"WarehouseId is required for ItemId " +
                                $"{requestDetail.ItemId}.");
                        }

                        // =================================================
                        // Find PO Detail
                        // =================================================

                        var poDetail =
                            poDetailsList.FirstOrDefault(
                                x =>
                                    x.ItemId ==
                                        requestDetail.ItemId

                                    &&

                                    x.WarehouseId ==
                                        warehouseId);

                        if (poDetail == null)
                        {
                            throw new Exception(
                                $"PO detail not found for ItemId " +
                                $"{requestDetail.ItemId}, " +
                                $"WarehouseId {warehouseId}.");
                        }

                        // =================================================
                        // Validate Return Quantity
                        // =================================================

                        if (requestDetail.Quantity >
                            poDetail.Quantity)
                        {
                            throw new Exception(
                                $"Return quantity " +
                                $"{requestDetail.Quantity} " +
                                $"cannot be greater than PO quantity " +
                                $"{poDetail.Quantity} " +
                                $"for ItemId " +
                                $"{requestDetail.ItemId}.");
                        }

                        // =================================================
                        // Create Purchase Return Detail
                        // =================================================

                        var returnDetail =
                            new PurchaseReturnDetail
                            {
                                PurchaseReturnDetailId =
                                    GenerateId.MakeId(),

                                PurchaseReturnId =
                                    master.Id,

                                ItemId =
                                    requestDetail.ItemId,

                                UomId =
                                    requestDetail.UomId,

                                WarehouseId =
                                    warehouseId,

                                Quantity =
                                    requestDetail.Quantity,

                                UnitPrice =
                                    requestDetail.UnitPrice,

                                TotalAmount =
                                    requestDetail.TotalAmount,

                                CreatedBy =
                                    userId,

                                CreatedDate =
                                    DateTime.Now,

                                Status =
                                    (StatusEnum)1
                            };

                        details.Add(
                            returnDetail);

                        // =================================================
                        // Update PO Quantity
                        //
                        // This assumes PO Quantity represents
                        // REMAINING quantity.
                        // =================================================

                        poDetail.Quantity -=
                            requestDetail.Quantity;

                        // =================================================
                        // Mark PO detail as fully returned
                        // =================================================

                        if (poDetail.Quantity == 0)
                        {
                            poDetail.IsReturn = true;
                        }

                        // =================================================
                        // Decrease Stock
                        //
                        // Purchase Return:
                        //
                        // Warehouse -> Supplier
                        //
                        // Therefore:
                        //
                        // Stock - Return Quantity
                        // =================================================

                        await StockHelper.DecreaseStockAsync(
                            _repositoryStock,

                            requestDetail.ItemId,

                            warehouseId,

                            request.TenantId,

                            requestDetail.Quantity);
                    }

                    // =====================================================
                    // 8. Save Return Details
                    // =====================================================

                    if (details.Any())
                    {
                        await _detailRepository.AddRangeAsync(
                            details,
                            cancellationToken);

                        await _detailRepository.SaveChangesAsync(
                            cancellationToken);
                    }

                    // =====================================================
                    // 9. Save PO Detail Changes
                    // =====================================================

                    await _POdetailRepository.SaveChangesAsync(
                        cancellationToken);

                    // =====================================================
                    // 10. Return Response
                    // =====================================================

                    return isUpdate
                        ? "Purchase Return Updated Successfully"
                        : "Purchase Return Created Successfully";
                }
                catch (ValidationException)
                {
                    throw;
                }
                catch (Exception ex)
                {
                    throw new Exception(
                        $"An error occurred while processing " +
                        $"purchase return: {ex.Message}",
                        ex);
                }
            }
        }

        #endregion
        #endregion
    }
}