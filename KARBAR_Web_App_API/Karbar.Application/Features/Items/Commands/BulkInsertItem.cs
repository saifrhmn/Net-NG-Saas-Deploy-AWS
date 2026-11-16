using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace Karbar.Application.Features.Items.Commands
{
    public static class BulkInsertItem
    {
        #region Command
        public sealed class Command : IRequest<int>
        {
            [JsonIgnore]
            public Stream FileStream { get; set; } = default!;
            public string FileName { get; set; } = string.Empty;
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

        #region CommandHandler
        public sealed class CommandHandler : IRequestHandler<Command, int>
        {
            private readonly IGenericRepository<Item> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _stockRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Brand> _brandRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Category> _categoryRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Uom> _uomRepository;
            private readonly IGenericRepository<Warehouse> _whRepository;
            private readonly IHttpContextAccessor _httpContextAccessor = new HttpContextAccessor();

            public CommandHandler(
                IGenericRepository<Item> repository,
                IGenericRepository<Karbar.Domain.Entities.Stock> stockRepository,
                IGenericRepository<Warehouse> whRepository,
                IGenericRepository<Karbar.Domain.Entities.Brand> brandRepository,
                IGenericRepository<Karbar.Domain.Entities.Category> categoryRepository,
                IGenericRepository<Karbar.Domain.Entities.Uom> uomRepository,
            IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _stockRepository = stockRepository;
                _whRepository = whRepository;
                _brandRepository = brandRepository;
                _categoryRepository = categoryRepository;
                _uomRepository = uomRepository;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<int> Handle(Command request, CancellationToken cancellationToken)
            {
                //var userId = _httpContextAccessor.HttpContext?
                //    .User?.FindFirstValue(ClaimTypes.NameIdentifier)
                //    ?? throw new UnauthorizedAccessException("User not found");

                int processedCount = 0;

                IWorkbook workbook = Path.GetExtension(request.FileName).ToLower() switch
                {
                    ".xls" => new HSSFWorkbook(request.FileStream),
                    ".xlsx" => new XSSFWorkbook(request.FileStream),
                    _ => throw new Exception("Invalid Excel format")
                };

                var sheet = workbook.GetSheetAt(0);

                for (int rowIndex = 1; rowIndex <= sheet.LastRowNum; rowIndex++)
                {
                    try
                    {
                        var row = sheet.GetRow(rowIndex);
                        if (row == null) continue;

                        string materialNumber = row.GetCell(0)?.ToString()?.Trim();
                        string name = row.GetCell(1)?.ToString()?.Trim();
                        string categoryName = row.GetCell(5)?.ToString()?.Trim();
                        string brandName = row.GetCell(6)?.ToString()?.Trim();
                        string uomName = row.GetCell(7)?.ToString()?.Trim();
                        string warehouseName = row.GetCell(8)?.ToString()?.Trim();
                        string description = row.GetCell(10)?.ToString()?.Trim();
                        if (!int.TryParse(row.GetCell(9)?.ToString()?.Trim(), out int tenantId)) continue;
                        if (!decimal.TryParse(row.GetCell(11)?.ToString()?.Trim(), out decimal StockQty)) continue;

                        if (string.IsNullOrEmpty(materialNumber) || string.IsNullOrEmpty(name))
                            continue;

                        double.TryParse(row.GetCell(2)?.ToString(), out double mrp);
                        double.TryParse(row.GetCell(3)?.ToString(), out double sellingPrice);
                        double.TryParse(row.GetCell(4)?.ToString(), out double purchasePrice);

                        #region CATEGORY
                        var category = await _categoryRepository.Query()
                            .FirstOrDefaultAsync(x =>
                                x.Name == categoryName && x.TenantId == tenantId, cancellationToken);

                        if (category == null)
                        {
                            category = new Domain.Entities.Category
                            {
                                CategoryId = GenerateId.MakeId(),
                                Name = categoryName,
                                TenantId = tenantId,
                                CreatedDate = DateTime.Now,
                                Status = StatusEnum.Active
                            };
                            await _categoryRepository.AddAsync(category, cancellationToken);
                        }
                        await _categoryRepository.SaveChangesAsync(cancellationToken);
                        #endregion

                        #region BRAND
                        var brand = await _brandRepository.Query()
                            .FirstOrDefaultAsync(x =>
                                x.Name == brandName && x.TenantId == tenantId, cancellationToken);

                        if (brand == null)
                        {
                            brand = new Domain.Entities.Brand
                            {
                                BrandId = GenerateId.MakeId(),
                                Name = brandName,
                                TenantId = tenantId,
                                CreatedDate = DateTime.Now,
                                Status = StatusEnum.Active
                            };
                            await _brandRepository.AddAsync(brand, cancellationToken);
                        }
                        await _brandRepository.SaveChangesAsync(cancellationToken);
                        #endregion

                        #region UOM
                        var uom = await _uomRepository.Query()
                            .FirstOrDefaultAsync(x =>
                                x.Name == uomName && x.TenantId == tenantId, cancellationToken);

                        if (uom == null)
                        {
                            uom = new Domain.Entities.Uom
                            {
                                UomId = GenerateId.MakeId(),
                                Name = uomName,
                                TenantId = tenantId,
                                CreatedDate = DateTime.Now,
                                Status = StatusEnum.Active
                            };
                            await _uomRepository.AddAsync(uom, cancellationToken);
                        }
                        await _uomRepository.SaveChangesAsync(cancellationToken);
                        #endregion

                        #region ITEM
                        var item = await _repository.Query()
                            .FirstOrDefaultAsync(x =>
                                x.MaterialNumber == materialNumber && x.TenantId == tenantId,
                                cancellationToken);

                        if (item != null)
                        {
                            item.Name = name;
                            item.MRP = mrp;
                            item.SellingPrice = sellingPrice;
                            item.PurchasePrice = purchasePrice;
                            item.CategoryId = category.Id;
                            item.BrandId = brand.Id;
                            item.UomId = uom.Id;
                            item.ItemDescription = description;
                            item.UpdatedDate = DateTime.Now;
                        }
                        else
                        {
                            item = new Item
                            {
                                ItemId = GenerateId.MakeId(),
                                MaterialNumber = materialNumber,
                                Name = name,
                                MRP = mrp,
                                SellingPrice = sellingPrice,
                                PurchasePrice = purchasePrice,
                                CategoryId = category.Id,
                                BrandId = brand.Id,
                                UomId = uom.Id,
                                TenantId = tenantId,
                                ItemDescription = description,
                                CreatedDate = DateTime.Now,
                                Status = StatusEnum.Active
                            };

                            await _repository.AddAsync(item, cancellationToken);
                        }
                        await _repository.SaveChangesAsync(cancellationToken);
                        #endregion
                        #region-Stock-create
                        if (string.IsNullOrEmpty(warehouseName))
                            continue;

                        var warehousefind = (await _whRepository.GetAllAsync(cancellationToken))
                                .FirstOrDefault(x => x.TenantId == tenantId && x.Name == warehouseName);

                        if (warehousefind == null)
                        {
                            warehousefind = new Warehouse
                            {
                                WarehouseId = GenerateId.MakeId(),
                                Name = warehouseName,
                                TenantId = tenantId,
                                CreatedDate = DateTime.Now,
                                CreatedBy= "D23AAB33-5C84-43B0-8",
                                Status = (StatusEnum)1,
                            };
                            await _whRepository.AddAsync(warehousefind, cancellationToken);
                            await _whRepository.SaveChangesAsync(cancellationToken);
                        }

                        var existingStock = await _stockRepository.GetByIdAsync(
                            x => x.ItemId == item.Id
                              && x.WarehouseId == warehousefind.Id
                              && x.TenantId == tenantId,
                            cancellationToken);

                        if (existingStock == null)
                        {
                            var entityStock = new Karbar.Domain.Entities.Stock
                            {
                                StockId = GenerateId.MakeId(),
                                ItemId = item.Id,
                                WarehouseId = warehousefind.Id,
                                Quantity = StockQty,
                                TenantId = tenantId,
                                CreatedDate = DateTime.Now,
                                Status = StatusEnum.Active
                            };

                            await _stockRepository.AddAsync(entityStock, cancellationToken);
                        }
                        else
                        {
                            // Update existing stock
                            //existingStock.Quantity += StockQty;
                            //existingStock.UpdatedDate = DateTime.Now;
                            //await _stockRepository.UpdateAsync(existingStock, cancellationToken);
                            --processedCount;
                        }

                        await _repository.SaveChangesAsync(cancellationToken);
                        #endregion-Stock-create

                        processedCount++;
                    }
                    catch (Exception ex)
                    {
                        throw;
                    }
                }


                return processedCount;
            }
        }

        #endregion
    }
}
