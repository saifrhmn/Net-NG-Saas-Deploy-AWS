using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Hosting;

namespace Karbar.Application.Features.StockFeatures.Commands
{
    public static class CreateStock
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int ItemId { get; set; }
            public List<WarehouseRequest> Warehouse { get; set; } = new();
            public int TenantId { get; set; }
            public string? Remarks { get; set; }
        }

        public class WarehouseRequest
        {
            public int StockId { get; set; }
            public int WarehouseId { get; set; }
            public decimal Quantity { get; set; }
        }

        #endregion
        #region validator

        public class Validator : AbstractValidator<Command>
            {
                public Validator(IServiceScopeFactory serviceScopeFactory)
                {

                }
            }

            #endregion
        #region command handler
            public sealed class CommandHandler : IRequestHandler<Command, string>
            {
                private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _repository;
                private readonly IValidator<Command> _validator;
                private readonly IHttpContextAccessor _httpContextAccessor;

                public CommandHandler(
                    IGenericRepository<Karbar.Domain.Entities.Stock> repository,
                    IValidator<Command> validator,
                    IHttpContextAccessor httpContextAccessor)
                {
                    _repository = repository;
                    _validator = validator;
                    _httpContextAccessor = httpContextAccessor;
                }

                public async Task<string> Handle(Command request, CancellationToken cancellationToken)
                {
                    var userId = _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

                    var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                    if (!validationResult.IsValid)
                        throw new ValidationException(validationResult.Errors);
                var entity = await _repository.GetByIdAsync(
    x => x.ItemId == request.ItemId &&
         x.TenantId == request.TenantId,
    cancellationToken);

                if (entity == null)
                    throw new Exception("Item not found");

                entity.Remarks = request.Remarks;
                entity.UpdatedBy = userId;
                entity.UpdatedDate = DateTime.Now;

                foreach (var wh in request.Warehouse)
                {
                    // ✅ CORRECT EXIST CHECK
                    var existingStock = await _repository.GetByIdAsync(
                        x => x.ItemId == request.ItemId &&
                             x.WarehouseId == wh.WarehouseId &&
                             x.TenantId == request.TenantId,
                        cancellationToken);

                    if (existingStock != null)
                    {
                        // UPDATE
                        existingStock.Quantity = wh.Quantity;
                        existingStock.UpdatedBy = userId;
                        existingStock.UpdatedDate = DateTime.Now;

                        await _repository.UpdateAsync(existingStock, cancellationToken);
                    }
                    else
                    {
                        // INSERT NEW WAREHOUSE STOCK
                        await _repository.AddAsync(new Domain.Entities.Stock
                        {
                            StockId = GenerateId.MakeId(),
                            ItemId = request.ItemId,
                            WarehouseId = wh.WarehouseId,
                            Quantity = wh.Quantity,
                            TenantId = request.TenantId,
                            Remarks = request.Remarks,
                            CreatedBy = userId,
                            CreatedDate = DateTime.Now,
                            Status = StatusEnum.Active
                        });
                    }
                }

                await _repository.UpdateAsync(entity, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Updated Successfully";
            }
            }


        #endregion

    }
}
