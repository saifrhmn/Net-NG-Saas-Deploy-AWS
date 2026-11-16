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

namespace Karbar.Application.Features.Items.Commands
{
    public static class CreateItem
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string ItemId { get; set; }
            public string Name { get; set; }
            public string? ItemDescription { get; set; }
            public string MaterialNumber { get; set; }
            public double MRP { get; set; }
            public int? LowStock { get; set; }
            public decimal? InvoicePrice { get; set; }
            public double SellingPrice { get; set; }
            public double PurchasePrice { get; set; }
            public string Barcode { get; set; }
            public int CategoryId { get; set; }
            public int BrandId { get; set; }
            public int UomId { get; set; }
            public int WarehouseId { get; set; }
            public int TenantId { get; set; }
            public int Status { get; set; }
            public string ImagePath { get; set; }
            public string? BaseUnitOfMeasure { get; set; }
            public string? SizeOrPackSize { get; set; }
            public decimal? Volume { get; set; }
            public string? VolumeUnit { get; set; }
            public decimal? DiscountAmount { get; set; }
            public decimal? MovingAveragePrice { get; set; }
            public decimal? StandardPrice { get; set; }
            public DateTime? LastChangedDate { get; set; }
            public string? FreightGroup { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory) 
            {
                RuleFor(v => v.MaterialNumber)
                    .NotEmpty().WithMessage("MaterialNumber is required.")
                    .MaximumLength(100).WithMessage("Name must not exceed 100 characters.");

                //RuleFor(v => v.MRP)
                //    .GreaterThan(0).WithMessage("Price must be greater than 0.");
            }
        }

        #endregion

        #region command handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Item> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _stockRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Warehouse> _whRepository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<Item> repository,
                IGenericRepository<Karbar.Domain.Entities.Stock> stockRepository,
                IGenericRepository<Karbar.Domain.Entities.Warehouse> whRepository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _stockRepository = stockRepository;
                _whRepository = whRepository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }
            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                try
                {
                    var userId = _httpContextAccessor.HttpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);

                    var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                    if (!validationResult.IsValid)
                        throw new ValidationException(validationResult.Errors);
                    Item entity;
                    if (!string.IsNullOrEmpty(request.ItemId))
                    {
                        entity = await _repository.GetByIdAsync(x => x.ItemId == request.ItemId, cancellationToken);
                        if (entity == null)
                            throw new KeyNotFoundException("Item not found for update");

                        entity.UpdatedDate = DateTime.Now;
                        entity.UpdatedBy = userId;
                        entity.Status = (StatusEnum)request.Status;
                    }
                    else // Create case
                    {
                        var materialNumberdup_check = await _repository.GetByIdAsync(x => x.MaterialNumber == request.MaterialNumber && x.TenantId == request.TenantId, cancellationToken);
                        if (materialNumberdup_check != null)
                            throw new KeyNotFoundException("Material number is duplicated.");

                        entity = new Item
                        {
                            ItemId = GenerateId.MakeId(), // GUID / Custom ID generator
                            CreatedBy = userId,
                            CreatedDate = DateTime.Now,
                            Status = (StatusEnum)1
                        };
                    }

                    // Assign fields (common for create & update)
                    entity.Name = request.Name;
                    entity.ItemDescription = request.ItemDescription;
                    entity.MRP = request.MRP;
                    entity.MaterialNumber = request.MaterialNumber;
                    entity.SellingPrice = request.SellingPrice;
                    entity.PurchasePrice = request.PurchasePrice;
                    entity.Barcode = request.Barcode;
                    entity.BaseUnitOfMeasure = request.BaseUnitOfMeasure;
                    entity.SizeOrPackSize = request.SizeOrPackSize;
                    entity.Volume = request.Volume;
                    entity.VolumeUnit = request.VolumeUnit;
                    entity.DiscountAmount = request.DiscountAmount;
                    entity.MovingAveragePrice = request.MovingAveragePrice;
                    entity.StandardPrice = request.StandardPrice;
                    entity.LastChangedDate = request.LastChangedDate;
                    entity.FreightGroup = request.FreightGroup;
                    entity.MRP = request.MRP;
                    entity.InvoicePrice = request.InvoicePrice;
                    entity.LowStock = request.LowStock;
                    entity.CategoryId = request.CategoryId > 0 ? request.CategoryId : null;
                    entity.BrandId = request.BrandId > 0 ? request.BrandId : null;
                    entity.UomId = request.UomId > 0 ? request.UomId : null;
                    entity.WarehouseId = request.WarehouseId > 0 ? request.WarehouseId : null;
                    entity.TenantId = request.TenantId > 0 ? request.TenantId : null;
                    if (!string.IsNullOrEmpty(request.ImagePath)) { entity.ImageUrl = request.ImagePath; }
                    entity.Status = (StatusEnum)request.Status;
                    
                    // Save changes
                    string resultMessage;
                    if (!string.IsNullOrEmpty(request.ItemId))
                    {
                        await _repository.UpdateAsync(entity, cancellationToken);
                        resultMessage = "Updated Successfully";
                    }
                    else
                    {
                        await _repository.AddAsync(entity, cancellationToken);
                        resultMessage = "Created Successfully";
                    }

                    await _repository.SaveChangesAsync(cancellationToken);
                    #region-Stock-create

                    var warehouses = (await _whRepository.GetAllAsync(cancellationToken))
                             .Where(x => x.TenantId == request.TenantId)
                             .Select(w => new {
                                 w.Id
                             })
                             .ToList();


                    foreach (var warehouse in warehouses)
                    {
                        var existingStock = await _stockRepository.GetByIdAsync(
                            x => x.ItemId == entity.Id
                              && x.WarehouseId == warehouse.Id
                              && x.TenantId == request.TenantId,
                            cancellationToken);

                        if (existingStock == null)
                        {
                            var entityStock = new Karbar.Domain.Entities.Stock
                            {
                                StockId = GenerateId.MakeId(),
                                ItemId = entity.Id,
                                WarehouseId = warehouse.Id,
                                TenantId = request.TenantId,
                                CreatedBy = userId,
                                CreatedDate = DateTime.Now,
                                Status = StatusEnum.Active
                            };

                            await _stockRepository.AddAsync(entityStock, cancellationToken);
                        }
                    }
                    await _repository.SaveChangesAsync(cancellationToken);

                    #endregion-Stock-create
                    return resultMessage;
                }
                catch (ValidationException ex)
                {
                    // Validation-level error, return controlled message
                    throw new ValidationException("Validation failed: " + string.Join(", ", ex.Errors.Select(e => e.ErrorMessage)));
                }
                catch (KeyNotFoundException ex)
                {
                    // For update case if item not found
                    throw new Exception(ex.Message);
                }
                catch (Exception ex)
                {
                    // Unexpected errors
                    throw new Exception("An error occurred while processing the item: " + ex.Message, ex);
                }
            }
        }

        #endregion
    }
}
