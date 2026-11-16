using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Karbar.Application.Features.Materials.Commands
{
    public static class AssignMaterialToTenant
    {
        // Every assigned item goes under this category (per tenant)
        private const string DefaultCategoryName = "BERGER PAINT";
        private const string MainWarehouseName = "MainShop";

        #region command

        public sealed class Command : IRequest<Result>
        {
            // Dealers. Every dealer receives every item in Items
            public List<int> TenantIds { get; set; } = new();
            public List<ItemRequest> Items { get; set; } = new();
        }

        public sealed class ItemRequest
        {
            // Source Item.Id to copy details (MRP, UOM, prices...) from (optional)
            public int ItemId { get; set; }
            public string? ItemName { get; set; }
            // Brand (Brands table). When empty, CategoryName is used as the brand
            public string? BrandName { get; set; }
            // Optional. When empty, taken from the source item (ItemId)
            public string? MaterialNumber { get; set; }
            public string? SizeOrPackSize { get; set; }
            // Optional. New items get MRP and SellingPrice = this value
            public double? MRP { get; set; }
            // Optional. Looked up by name in the Uoms table (per tenant) to set UomId
            public string? BaseUnitOfMeasure { get; set; }
            // Product group, e.g. "TexBond Pigment Past". Saved as the item's Brand;
            // the item's Category is always "BERGER PAINT"
            public string? CategoryName { get; set; }
            // 1 = Active, 0 = Inactive
            public int Status { get; set; } = (int)StatusEnum.Active;
        }

        public sealed class Result
        {
            public int TenantCount { get; set; }
            public int ItemCount { get; set; }
            public int ItemsCreated { get; set; }
            public int ItemsUpdated { get; set; }
            public int StocksCreated { get; set; }
            public int BrandsCreated { get; set; }
            public int CategoriesCreated { get; set; }
            public List<int> TenantsWithoutWarehouse { get; set; } = new();
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                RuleFor(v => v.TenantIds)
                    .NotEmpty().WithMessage("Select at least one dealer.");

                RuleFor(v => v.Items)
                    .NotEmpty().WithMessage("Select at least one item.");

                RuleForEach(v => v.Items).ChildRules(item =>
                {
                    item.RuleFor(i => i.ItemName)
                        .NotEmpty().WithMessage("Item name is required.");

                    item.RuleFor(i => i.Status)
                        .Must(s => s == (int)StatusEnum.Active || s == (int)StatusEnum.Inactive)
                        .WithMessage("Status must be 1 (Active) or 0 (Inactive).");
                });
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, Result>
        {
            private readonly IGenericRepository<Tenant> _tenantRepository;
            private readonly IGenericRepository<Warehouse> _whRepository;
            private readonly IGenericRepository<Item> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _stockRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Category> _categoryRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Brand> _brandRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Uom> _uomRepository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<Tenant> tenantRepository,
                IGenericRepository<Warehouse> whRepository,
                IGenericRepository<Item> repository,
                IGenericRepository<Karbar.Domain.Entities.Stock> stockRepository,
                IGenericRepository<Karbar.Domain.Entities.Category> categoryRepository,
                IGenericRepository<Karbar.Domain.Entities.Brand> brandRepository,
                IGenericRepository<Karbar.Domain.Entities.Uom> uomRepository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _tenantRepository = tenantRepository;
                _whRepository = whRepository;
                _repository = repository;
                _stockRepository = stockRepository;
                _categoryRepository = categoryRepository;
                _brandRepository = brandRepository;
                _uomRepository = uomRepository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<Result> Handle(Command request, CancellationToken cancellationToken)
            {
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                var userId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
                var now = DateTime.Now;
                var result = new Result();

                #region Tenants (active only)
                var requestedTenantIds = request.TenantIds.Distinct().ToList();
                var tenantIds = await _tenantRepository.Query()
                    .Where(t => t.Status == StatusEnum.Active && requestedTenantIds.Contains(t.Id))
                    .Select(t => t.Id)
                    .ToListAsync(cancellationToken);
                if (tenantIds.Count == 0)
                    throw new KeyNotFoundException("No active dealer found.");
                #endregion

                #region Warehouse per tenant ("MainShop", else first created)
                var warehouses = await _whRepository.Query()
                    .Where(w => tenantIds.Contains(w.TenantId) && w.Status != StatusEnum.Deleted)
                    .Select(w => new { w.Id, w.TenantId, w.Name, w.CreatedDate })
                    .ToListAsync(cancellationToken);
                var warehouseByTenant = warehouses
                    .GroupBy(w => w.TenantId)
                    .ToDictionary(g => g.Key, g =>
                    {
                        var ordered = g.OrderBy(w => w.CreatedDate ?? DateTime.MaxValue).ThenBy(w => w.Id).ToList();
                        return (ordered.FirstOrDefault(w => IsMainShop(w.Name)) ?? ordered[0]).Id;
                    });

                result.TenantsWithoutWarehouse = tenantIds.Where(t => !warehouseByTenant.ContainsKey(t)).ToList();
                tenantIds = tenantIds.Where(warehouseByTenant.ContainsKey).ToList();
                result.TenantCount = tenantIds.Count;
                if (tenantIds.Count == 0)
                    return result;
                #endregion

                #region Request items (+ source item details)
                // Same item name sent twice -> last one wins
                var requestItems = request.Items
                    .Where(i => !string.IsNullOrWhiteSpace(i.ItemName))
                    .GroupBy(i => i.ItemName!.Trim(), StringComparer.OrdinalIgnoreCase)
                    .Select(g => g.Last())
                    .ToList();
                result.ItemCount = requestItems.Count;

                var sourceIds = requestItems.Where(i => i.ItemId > 0).Select(i => i.ItemId).Distinct().ToList();
                var sourceMap = (await _repository.Query()
                        .AsNoTracking()
                        .Include(i => i.Uom)
                        .Where(i => sourceIds.Contains(i.Id))
                        .ToListAsync(cancellationToken))
                    .ToDictionary(i => i.Id);

                var lines = requestItems.Select(i =>
                {
                    var source = sourceMap.GetValueOrDefault(i.ItemId);
                    return new
                    {
                        Name = i.ItemName!.Trim(),
                        BrandName = !string.IsNullOrWhiteSpace(i.BrandName) ? i.BrandName.Trim()
                            : !string.IsNullOrWhiteSpace(i.CategoryName) ? i.CategoryName.Trim()
                            : null,
                        CategoryName = DefaultCategoryName,
                        MaterialNumber = string.IsNullOrWhiteSpace(i.MaterialNumber) ? source?.MaterialNumber : i.MaterialNumber.Trim(),
                        SizeOrPackSize = string.IsNullOrWhiteSpace(i.SizeOrPackSize) ? source?.SizeOrPackSize : i.SizeOrPackSize.Trim(),
                        MRP = i.MRP ?? source?.MRP,
                        HasRequestUom = !string.IsNullOrWhiteSpace(i.BaseUnitOfMeasure),
                        UomName = !string.IsNullOrWhiteSpace(i.BaseUnitOfMeasure) ? i.BaseUnitOfMeasure.Trim()
                            : !string.IsNullOrWhiteSpace(source?.Uom?.Name) ? source.Uom.Name.Trim()
                            : !string.IsNullOrWhiteSpace(source?.BaseUnitOfMeasure) ? source.BaseUnitOfMeasure.Trim()
                            : null,
                        Status = (StatusEnum)i.Status,
                        Source = source
                    };
                }).ToList();
                #endregion

                #region Category / Brand / UOM (find or create per tenant)
                var categoryNames = lines.Select(l => l.CategoryName).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var brandNames = lines.Where(l => l.BrandName != null).Select(l => l.BrandName!).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                var uomNames = lines.Where(l => l.UomName != null).Select(l => l.UomName!).Distinct(StringComparer.OrdinalIgnoreCase).ToList();

                var categoryMap = (await _categoryRepository.Query()
                        .Where(c => tenantIds.Contains(c.TenantId) &&
                                    categoryNames.Contains(c.Name) && c.Status != StatusEnum.Deleted)
                        .ToListAsync(cancellationToken))
                    .GroupBy(c => Key(c.TenantId, c.Name))
                    .ToDictionary(g => g.Key, g => g.OrderBy(c => c.Id).First());
                var brandMap = (await _brandRepository.Query()
                        .Where(b => tenantIds.Contains(b.TenantId) &&
                                    brandNames.Contains(b.Name) && b.Status != StatusEnum.Deleted)
                        .ToListAsync(cancellationToken))
                    .GroupBy(b => Key(b.TenantId, b.Name))
                    .ToDictionary(g => g.Key, g => g.OrderBy(b => b.Id).First());
                var uomMap = (await _uomRepository.Query()
                        .Where(u => tenantIds.Contains(u.TenantId) &&
                                    uomNames.Contains(u.Name) && u.Status != StatusEnum.Deleted)
                        .ToListAsync(cancellationToken))
                    .GroupBy(u => Key(u.TenantId, u.Name))
                    .ToDictionary(g => g.Key, g => g.OrderBy(u => u.Id).First());

                foreach (var tenantId in tenantIds)
                {
                    foreach (var name in categoryNames.Where(n => !categoryMap.ContainsKey(Key(tenantId, n))))
                    {
                        var category = new Karbar.Domain.Entities.Category
                        {
                            CategoryId = GenerateId.MakeId(),
                            Name = name,
                            TenantId = tenantId,
                            CreatedBy = userId,
                            CreatedDate = now,
                            Status = StatusEnum.Active
                        };
                        await _categoryRepository.AddAsync(category, cancellationToken);
                        categoryMap[Key(tenantId, name)] = category;
                        result.CategoriesCreated++;
                    }
                    foreach (var name in brandNames.Where(n => !brandMap.ContainsKey(Key(tenantId, n))))
                    {
                        var brand = new Karbar.Domain.Entities.Brand
                        {
                            BrandId = GenerateId.MakeId(),
                            Name = name,
                            TenantId = tenantId,
                            CreatedBy = userId,
                            CreatedDate = now,
                            Status = StatusEnum.Active
                        };
                        await _brandRepository.AddAsync(brand, cancellationToken);
                        brandMap[Key(tenantId, name)] = brand;
                        result.BrandsCreated++;
                    }
                    foreach (var name in uomNames.Where(n => !uomMap.ContainsKey(Key(tenantId, n))))
                    {
                        var uom = new Karbar.Domain.Entities.Uom
                        {
                            UomId = GenerateId.MakeId(),
                            Name = name,
                            TenantId = tenantId,
                            CreatedBy = userId,
                            CreatedDate = now,
                            Status = StatusEnum.Active
                        };
                        await _uomRepository.AddAsync(uom, cancellationToken);
                        uomMap[Key(tenantId, name)] = uom;
                    }
                }
                #endregion

                #region ITEM
                var itemNames = lines.Select(l => l.Name).ToList();
                var materialNumbers = lines.Where(l => !string.IsNullOrWhiteSpace(l.MaterialNumber)).Select(l => l.MaterialNumber!).Distinct().ToList();

                var existingItems = await _repository.Query()
                    .Where(x => x.TenantId != null && tenantIds.Contains(x.TenantId.Value) && x.Status != StatusEnum.Deleted &&
                                (itemNames.Contains(x.Name) || materialNumbers.Contains(x.MaterialNumber)))
                    .ToListAsync(cancellationToken);
                var itemsByMaterial = existingItems
                    .Where(x => !string.IsNullOrWhiteSpace(x.MaterialNumber))
                    .GroupBy(x => Key(x.TenantId!.Value, x.MaterialNumber!))
                    .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());
                var itemsByName = existingItems
                    .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                    .GroupBy(x => Key(x.TenantId!.Value, x.Name!))
                    .ToDictionary(g => g.Key, g => g.OrderBy(x => x.Id).First());

                // Navigation properties (Category/Brand/Uom/Item) let new rows get their Ids
                // inside a single SaveChanges, so everything is saved in one transaction
                var allItems = new List<Item>();
                var processed = new HashSet<Item>(ReferenceEqualityComparer.Instance);
                foreach (var tenantId in tenantIds)
                {
                    var warehouseId = warehouseByTenant[tenantId];

                    foreach (var line in lines)
                    {
                        var source = line.Source;
                        var category = categoryMap[Key(tenantId, line.CategoryName)];
                        var brand = line.BrandName != null ? brandMap[Key(tenantId, line.BrandName)] : null;
                        var uom = line.UomName != null ? uomMap[Key(tenantId, line.UomName)] : null;

                        Item? item = null;
                        if (!string.IsNullOrWhiteSpace(line.MaterialNumber))
                            itemsByMaterial.TryGetValue(Key(tenantId, line.MaterialNumber), out item);
                        if (item == null)
                            itemsByName.TryGetValue(Key(tenantId, line.Name), out item);

                        if (item != null)
                        {
                            item.Status = line.Status;
                            if (string.IsNullOrWhiteSpace(item.MaterialNumber) && line.MaterialNumber != null)
                                item.MaterialNumber = line.MaterialNumber;
                            if (line.SizeOrPackSize != null)
                                item.SizeOrPackSize = line.SizeOrPackSize;
                            item.Category = category;
                            if (brand != null)
                                item.Brand = brand;
                            // UOM sent in the request replaces the current one; otherwise only fill a missing UOM
                            if (uom != null && (line.HasRequestUom || item.UomId == null))
                            {
                                item.Uom = uom;
                                item.BaseUnitOfMeasure = line.UomName;
                            }
                            item.WarehouseId ??= warehouseId;
                            if (item.Id > 0)
                            {
                                item.UpdatedBy = userId;
                                item.UpdatedDate = now;
                            }
                            // Two lines resolving to the same item are counted once
                            if (!processed.Add(item))
                                continue;
                            if (item.Id > 0)
                                result.ItemsUpdated++;
                        }
                        else
                        {
                            item = new Item
                            {
                                ItemId = GenerateId.MakeId(),
                                MaterialNumber = line.MaterialNumber,
                                Name = line.Name,
                                ItemDescription = source?.ItemDescription,
                                MRP = line.MRP,
                                SellingPrice = line.MRP,
                                PurchasePrice = source?.PurchasePrice,
                                Barcode = source?.Barcode,
                                ImageUrl = source?.ImageUrl,
                                ImageName = source?.ImageName,
                                BaseUnitOfMeasure = line.UomName,
                                SizeOrPackSize = line.SizeOrPackSize,
                                Volume = source?.Volume,
                                VolumeUnit = source?.VolumeUnit,
                                DiscountAmount = source?.DiscountAmount,
                                MovingAveragePrice = source?.MovingAveragePrice,
                                StandardPrice = source?.StandardPrice,
                                InvoicePrice = source?.InvoicePrice,
                                LastChangedDate = source?.LastChangedDate,
                                FreightGroup = source?.FreightGroup,
                                Category = category,
                                Brand = brand,
                                Uom = uom,
                                WarehouseId = warehouseId,
                                TenantId = tenantId,
                                LowStock = 5,
                                CreatedBy = userId,
                                CreatedDate = now,
                                Status = line.Status
                            };
                            await _repository.AddAsync(item, cancellationToken);
                            processed.Add(item);
                            result.ItemsCreated++;

                            // Later lines for the same item in this tenant reuse it instead of creating a duplicate
                            if (!string.IsNullOrWhiteSpace(item.MaterialNumber))
                                itemsByMaterial.TryAdd(Key(tenantId, item.MaterialNumber), item);
                            itemsByName.TryAdd(Key(tenantId, line.Name), item);
                        }
                        allItems.Add(item);
                    }
                }
                #endregion

                #region-Stock-create (selected warehouse only)
                var existingItemIds = allItems.Where(i => i.Id > 0).Select(i => i.Id).ToList();
                var existingStocks = (await _stockRepository.Query()
                        .Where(s => existingItemIds.Contains(s.ItemId))
                        .Select(s => new { s.ItemId, s.WarehouseId })
                        .ToListAsync(cancellationToken))
                    .Select(s => (s.ItemId, s.WarehouseId))
                    .ToHashSet();

                var newStocks = new List<Karbar.Domain.Entities.Stock>();
                foreach (var item in allItems)
                {
                    var warehouseId = warehouseByTenant[item.TenantId!.Value];
                    if (item.Id > 0 && existingStocks.Contains((item.Id, warehouseId)))
                        continue;

                    newStocks.Add(new Karbar.Domain.Entities.Stock
                    {
                        StockId = GenerateId.MakeId(),
                        Item = item,
                        WarehouseId = warehouseId,
                        TenantId = item.TenantId,
                        Quantity = 0,
                        CreatedBy = userId,
                        CreatedDate = now,
                        Status = StatusEnum.Active
                    });
                }
                if (newStocks.Count > 0)
                    await _stockRepository.AddRangeAsync(newStocks, cancellationToken);
                result.StocksCreated = newStocks.Count;
                #endregion-Stock-create

                // Single save = single transaction: categories, brands, UOMs, items and stocks
                // are all saved together or none are
                await _repository.SaveChangesAsync(cancellationToken);

                return result;
            }

            private static (int TenantId, string Name) Key(int tenantId, string name) =>
                (tenantId, name.Trim().ToUpperInvariant());

            private static bool IsMainShop(string? name) =>
                name != null && name.Replace(" ", "").Equals(MainWarehouseName, StringComparison.OrdinalIgnoreCase);
        }

        #endregion
    }
}
