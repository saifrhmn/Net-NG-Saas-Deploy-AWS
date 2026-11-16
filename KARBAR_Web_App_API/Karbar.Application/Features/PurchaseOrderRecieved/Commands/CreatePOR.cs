using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Features.Invoices.Queries;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.PurchaseOrderRecieved;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Ocsp;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace Karbar.Application.Features.PurchaseOrderRecieved.Commands
{
    public static class CreatePOR
    {
        #region Command
        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public string RecievedOrderId { get; set; }
            public string RecievedNo { get; set; }
            public DateTime? RecievedDate { get; set; }
            public decimal? PaidAmount { get; set; }
            public decimal? TotalAmount { get; set; }
            public decimal? BergerTotalPurchaseAmount { get; set; }
            public decimal? DiscountAmount { get; set; }
            public decimal? Tax { get; set; }
            public decimal? Vat { get; set; }
            public string? RequestOrderNo { get; set; }
            public int TenantId { get; set; }

            public List<PurchaseOrderDetailRequest> PurchaseDetails { get; set; } = new();
        }

        public sealed class PurchaseOrderDetailRequest
        {
            public int Id { get; set; }
            public int PurchaseOrderMasterId { get; set; }
            public string PurchaseOrderDetailId { get; set; }
            public int ItemId { get; set; }
            public int? UomId { get; set; }
            public int? WarehouseId { get; set; }
            public int? SupplierId { get; set; }

            public decimal InvoiceQty { get; set; }
            public decimal RemainingQty { get; set; }
            public decimal UnitPrice { get; set; }
            public decimal TotalAmount { get; set; }
            public decimal BergerPurchaseAmount { get; set; }
            public string OrderStatus { get; set; }
            public DateTime? PurchaseDate { get; set; }
            public DateTime? RecievedDate { get; set; }
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
            private readonly IGenericRepository<Karbar.Domain.Entities.Item> _repositoryItem;
            //private readonly IGenericRepository<Karbar.Domain.Entities.Tenant> _repositoryTenant;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<PurchaseOrderRecievedMaster> masterRepository,
                IGenericRepository<PurchaseOrderRecievedDetail> detailRepository,
                IGenericRepository<Karbar.Domain.Entities.Stock> repositoryStock,
                IGenericRepository<Karbar.Domain.Entities.Item> repositoryItem,
                IGenericRepository<Karbar.Domain.Entities.InvoiceData> repositorySapSalesData,
                //IGenericRepository<Karbar.Domain.Entities.Tenant> repositoryTenant,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _masterRepository = masterRepository;
                _detailRepository = detailRepository;
                _repositoryStock = repositoryStock;
                _repositorySapSalesData = repositorySapSalesData;
                _repositoryItem = repositoryItem;
                //_repositoryTenant = repositoryTenant;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                PurchaseOrderRecievedMaster master;


                if (!string.IsNullOrEmpty(request.RecievedOrderId))
                {
                    master = await _masterRepository.GetByIdAsync(x => x.RecievedOrderId == request.RecievedOrderId, cancellationToken)
                             ?? new PurchaseOrderRecievedMaster();

                    master.UpdatedDate = DateTime.Now;
                    master.UpdatedBy = userId;

                }
                else
                {
                    master = new PurchaseOrderRecievedMaster
                    {
                        RecievedOrderId = GenerateId.MakeId(),
                        CreatedBy = userId,
                        CreatedDate = DateTime.Now,
                        Status = (StatusEnum)1,
                    };
                }

                master.RecievedNo = request.RecievedNo;
                master.RequestOrderNo = request.RequestOrderNo;
                master.RecievedDate = request.RecievedDate;
                master.PaidAmount = request.PaidAmount;
                master.TotalAmount = request.TotalAmount;
                master.BergerTotalPurchaseAmount = request.BergerTotalPurchaseAmount;
                master.DiscountAmount = request.DiscountAmount;
                master.Tax = request.Tax;
                master.Vat = request.Vat;
                master.TenantId = request.TenantId;

                if (!string.IsNullOrEmpty(request.RecievedOrderId))
                    await _masterRepository.UpdateAsync(master, cancellationToken);
                else
                    await _masterRepository.AddAsync(master, cancellationToken);

                await _masterRepository.SaveChangesAsync(cancellationToken);

                // Load existing details ONCE
                var existingDetails = await _detailRepository
                    .Query()
                    .Where(d => d.PurchaseOrderMasterId == master.Id)
                    .ToListAsync(cancellationToken);

                foreach (var req in request.PurchaseDetails)
                {
                    var existing = existingDetails
                        .FirstOrDefault(x => x.ItemId == req.ItemId);

                    if (existing != null)
                    {
                        // UPDATE
                        if (req.UomId > 0)
                            existing.UomId = req.UomId;

                        if (req.SupplierId > 0)
                            existing.SupplierId = req.SupplierId;

                        if (req.WarehouseId > 0)
                            existing.WarehouseId = req.WarehouseId;

                        existing.InvoiceQty = req.InvoiceQty;
                        existing.RemainingQty = req.RemainingQty;
                        existing.UnitPrice = req.UnitPrice;
                        existing.TotalAmount = req.TotalAmount;
                        existing.BergerPurchaseAmount = req.BergerPurchaseAmount;
                        existing.OrderStatus = req.OrderStatus ?? "";
                        existing.UpdatedBy = userId;
                        existing.UpdatedDate = DateTime.Now;
                    }
                    else
                    {
                        // INSERT
                        var newDetail = new PurchaseOrderRecievedDetail
                        {
                            PurchaseOrderDetailId = GenerateId.MakeId(),
                            PurchaseOrderMasterId = master.Id,
                            ItemId = req.ItemId,
                            UomId = req.UomId > 0 ? req.UomId : null,
                            SupplierId = req.SupplierId > 0 ? req.SupplierId : null,
                            WarehouseId = req.WarehouseId > 0 ? req.WarehouseId : null,
                            InvoiceQty = req.InvoiceQty,
                            RemainingQty = req.RemainingQty,
                            UnitPrice = req.UnitPrice,
                            TotalAmount = req.TotalAmount,
                            BergerPurchaseAmount = req.BergerPurchaseAmount,
                            OrderStatus = req.OrderStatus,
                            CreatedBy = userId,
                            CreatedDate = DateTime.Now,
                            Status = StatusEnum.Active
                        };

                        await _detailRepository.AddAsync(newDetail, cancellationToken);
                    }
                }

                await _detailRepository.SaveChangesAsync(cancellationToken);
                var sapSalesDatas = await _repositorySapSalesData
                                .Query()
                                .Where(d => d.InvoiceNo == request.RecievedNo)
                                .ToListAsync(cancellationToken);
                
                foreach (var detail in sapSalesDatas)
                {
                    //if (request.PurchaseDetails.All(x => x.RemainingQty == 0))
                    //{
                        detail.IsCustomerRecieved = true;
                    //}
                }
                await _repositorySapSalesData.SaveChangesAsync(cancellationToken);

                // Update Stock 
                foreach (var i in request.PurchaseDetails)
                {
                    await StockHelper.IncreaseStockAsync(
                        _repositoryStock,
                        i.ItemId,
                        i.WarehouseId,
                        request.TenantId,
                        i.InvoiceQty - i.RemainingQty);
                }
                // Commit
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
                            x.Detail.ItemId == purchaseDetail.ItemId &&
                            x.Detail.BergerPurchaseAmount.HasValue)
                        .OrderByDescending(x => x.Master.RecievedDate)
                        .Take(3)
                        .ToListAsync(cancellationToken);

                    decimal averagePrice = invoices.Count > 0
                        ? invoices.Sum(x => (x.Detail.BergerPurchaseAmount/x.Detail.InvoiceQty)!.Value) / invoices.Count
                        : 0m;

                    item.WeightedAveragePrice = averagePrice;
                    item.WeightedAveragePriceUpdatetdDate = DateTime.Now;
                }

                await _repositoryItem.SaveChangesAsync(cancellationToken);
                return !string.IsNullOrEmpty(request.RecievedOrderId)
                    ? "Purchase Order Received Updated Successfully"
                    : "Purchase Order Received Created Successfully";
            }
        }
        #endregion
    }
}
