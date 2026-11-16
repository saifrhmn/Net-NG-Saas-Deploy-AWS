using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.Stock.Commands
{
    public class WarehouseTransfer
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int ItemId { get; set; }
            public int FromWarehouseId { get; set; }
            public decimal ChangedQty { get; set; }
            public int ToWarehouseId { get; set; }
            public int TenantId { get; set; }
            public string? Remarks { get; set; }
            public string? CreatedBy { get; set; }
            public DateTime? CreatedTime { get; set; }
        }


        #endregion
        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                RuleFor(x => x.ItemId)
                    .GreaterThan(0);

                RuleFor(x => x.FromWarehouseId)
                    .GreaterThan(0);

                RuleFor(x => x.ToWarehouseId)
                    .GreaterThan(0)
                    .NotEqual(x => x.FromWarehouseId)
                    .WithMessage("From and To warehouse cannot be same.");

                RuleFor(x => x.ChangedQty)
                    .GreaterThan(0);

                RuleFor(x => x.TenantId)
                    .GreaterThan(0);
            }
        }


        #endregion
        #region command handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.StockTransfersHistory> _stockTransferRepository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<Karbar.Domain.Entities.Stock> repository,
                IGenericRepository<Karbar.Domain.Entities.StockTransfersHistory> stockTransferRepository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _stockTransferRepository = stockTransferRepository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var userId = _httpContextAccessor.HttpContext?.User
                                .FindFirstValue(ClaimTypes.NameIdentifier);

                // 1. Validate request
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                // 2. Get stock from FROM warehouse
                var fromStock = await _repository.GetByIdAsync(x =>
                    x.ItemId == request.ItemId &&
                    x.WarehouseId == request.FromWarehouseId &&
                    x.TenantId == request.TenantId,
                    cancellationToken);

                if (fromStock == null)
                    throw new Exception("Source warehouse stock not found.");

                if (fromStock.Quantity < request.ChangedQty)
                    throw new Exception("Insufficient stock in source warehouse.");

                // 3. Deduct quantity
                fromStock.Quantity -= request.ChangedQty;
                fromStock.UpdatedBy = userId;
                fromStock.UpdatedDate = DateTime.UtcNow;

                await _repository.UpdateAsync(fromStock, cancellationToken);

                // 4. Get stock from TO warehouse
                var toStock = await _repository.GetByIdAsync(x =>
                    x.ItemId == request.ItemId &&
                    x.WarehouseId == request.ToWarehouseId &&
                    x.TenantId == request.TenantId,
                    cancellationToken);

                // 5. If destination stock does not exist, create new
                if (toStock == null)
                {
                    toStock = new Karbar.Domain.Entities.Stock
                    {
                        ItemId = request.ItemId,
                        WarehouseId = request.ToWarehouseId,
                        TenantId = request.TenantId,
                        Quantity = request.ChangedQty,
                        CreatedBy = userId,
                        CreatedDate = DateTime.UtcNow,
                        Remarks = request.Remarks
                    };

                    await _repository.AddAsync(toStock, cancellationToken);
                }
                else
                {
                    toStock.Quantity += request.ChangedQty;
                    toStock.UpdatedBy = userId;
                    toStock.UpdatedDate = DateTime.UtcNow;

                    await _repository.UpdateAsync(toStock, cancellationToken);
                }
                var transferRefNo = $"ST-{DateTime.Now:yyyyMMddHHmmss}";
                //  Log the transfer
                await _stockTransferRepository.AddAsync(new Domain.Entities.StockTransfersHistory
                {
                    StockTransferId = GenerateId.MakeId(),
                    TransferRefNo = transferRefNo,
                    TransferDate = DateTime.Now,
                    ItemId = request.ItemId,
                    FromWarehouseId = request.FromWarehouseId,
                    ToWarehouseId = request.ToWarehouseId,
                    QtyTransferred = request.ChangedQty,
                    Remarks = request.Remarks,
                    TenantId = request.TenantId,
                    CreatedBy = userId,
                    CreatedDate = DateTime.Now,
                    Status = StatusEnum.Active
                });
                try
                {
                    await _stockTransferRepository.SaveChangesAsync(cancellationToken);
                }
                catch (Exception ex)
                {
                    throw new Exception(ex.InnerException?.Message ?? ex.Message);
                }
                // 6. Save
                await _repository.SaveChangesAsync(cancellationToken);

                return "Stock transferred successfully";
            }
        }


        #endregion
    }
}
