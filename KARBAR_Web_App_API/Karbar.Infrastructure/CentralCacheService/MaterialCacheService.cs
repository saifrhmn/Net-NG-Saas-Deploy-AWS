using Azure.Core;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Item;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.PurchaseOrderRecieved;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Karbar.Infrastructure.CentralCacheService
{
    public class MaterialCacheService : IMaterialCacheService
    {
        private readonly IMemoryCache _cache;
        private readonly IGenericRepository<Item> _repository;
        private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _w_repository;
        private readonly IGenericRepository<Karbar.Domain.Entities.Category> _ct_repository;
        private const string CacheKey = "MATERIAL_LIST";
        public MaterialCacheService(
        IMemoryCache cache,
        IGenericRepository<Item> repository,
        IGenericRepository<Karbar.Domain.Entities.Stock> w_repository,
        IGenericRepository<Karbar.Domain.Entities.Category> ct_repository)
        {
            _cache = cache;
            _repository = repository;
            _w_repository = w_repository;
            _ct_repository = ct_repository;
        }
        public void ClearCache()
        {
            _cache.Remove(CacheKey);
        }
        public async Task<List<ItemListResponseDto>> GetMaterialsAsync(int tanentId, int? catagoryId, int? brandId,string? searchText,int? pageindex,int? pagesize,bool? isBergerItem)
        {
            var options = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30),
                SlidingExpiration = TimeSpan.FromMinutes(10)
            };
            var cacheKey = $"{CacheKey}_{tanentId}";
            if (!_cache.TryGetValue(CacheKey, out List<ItemListResponseDto> allMaterials))
            {
                allMaterials = await _repository
                    .Query()
                    .Include(c => c.Category)
                    .Include(c => c.Brand)
                    .Include(c => c.Uom)
                    .Include(c => c.Warehouse)
                    .Where(x => x.Status != StatusEnum.Deleted && x.Status != StatusEnum.Inactive && x.TenantId == tanentId)
                    .AsNoTracking()
                    .Select(x => new ItemListResponseDto
                    {
                        Id = x.Id,
                        ItemId = x.ItemId,
                        MaterialNumber = x.MaterialNumber,
                        Name = x.Name,
                        MRP = x.MRP ?? 0,
                        SellingPrice = x.SellingPrice ?? 0,
                        PurchasePrice = x.PurchasePrice ?? 0,
                        InvoicePrice = x.InvoicePrice ?? 0,
                        Barcode = x.Barcode,
                        CategoryId = x.CategoryId,
                        CategoryName = x.Category != null ? x.Category.Name : null,
                        BrandId = x.BrandId,
                        BrandName = x.Brand != null ? x.Brand.Name : null,
                        UomId = x.UomId,
                        UomName = x.Uom != null ? x.Uom.Name : null,
                        WarehouseId = x.WarehouseId,
                        WarehouseName = x.Warehouse != null ? x.Warehouse.Name : null,
                        TenantId = x.TenantId ?? 0,
                        Status = x.Status,
                        LowStock = x.LowStock,
                        ImageUrl = x.ImageUrl,
                        WeightedAveragePrice = x.WeightedAveragePrice == 0 ? Convert.ToDecimal(x.PurchasePrice) : x.WeightedAveragePrice,
                        WeightedAveragePriceUpdatetdDate = x.WeightedAveragePriceUpdatetdDate
                    })
                    .ToListAsync();

                _cache.Set(cacheKey, allMaterials, options);
            }

            var filteredMaterials = allMaterials.AsEnumerable();

            if (catagoryId.HasValue && catagoryId > 0)
                filteredMaterials = filteredMaterials.Where(x => x.CategoryId == catagoryId);

            if (brandId.HasValue && brandId > 0)
                filteredMaterials = filteredMaterials.Where(x => x.BrandId == brandId);

            if (isBergerItem.HasValue)
            {
                //filteredMaterials = isBergerItem.Value
                //    ? filteredMaterials.Where(x => x.BrandId == 7 || x.BrandId == 45 || x.BrandId == 425)
                //    : filteredMaterials.Where(x => x.BrandId != 7 && x.BrandId != 45 && x.BrandId != 425);
                //var bergerBrandIds = filteredMaterials
                //        .Where(b => b.TenantId == tanentId && b.Name.ToLower().Contains("berger"))
                //        .Select(b => b.Id)
                //        .ToList();

                var bergerCategoryIds = _ct_repository.Query()
                .Where(c => c.TenantId == tanentId &&
                            c.Name.Contains("Berger"))
                .Select(c => c.Id)
                .ToList();
                filteredMaterials = filteredMaterials
                .Where(x => x.TenantId == tanentId
                         && x.CategoryId.HasValue
                         && bergerCategoryIds.Contains(x.CategoryId.Value))
                .DistinctBy(x => x.Id)
                .ToList();
            }

            if (!string.IsNullOrWhiteSpace(searchText))
            {
                var search = searchText.Trim().ToLower();
                filteredMaterials = filteredMaterials
                                     .Where(x =>
                                         (!string.IsNullOrEmpty(x.Name) &&
                                          x.Name.Contains(search, StringComparison.OrdinalIgnoreCase))
                                         ||
                                         (!string.IsNullOrEmpty(x.MaterialNumber) &&
                                          x.MaterialNumber.Contains(search, StringComparison.OrdinalIgnoreCase))
                                     );
            }

            var totalCount = filteredMaterials.Count();

            List<ItemListResponseDto> result;

            if (pageindex.HasValue && pagesize.HasValue)
            {
                result = filteredMaterials
                    .OrderByDescending(x => x.Id)
                    .Skip((pageindex.Value - 1) * pagesize.Value)
                    .Take(pagesize.Value)
                    .ToList();
            }
            else
            {
                // No pagination → full list
                result = filteredMaterials
                    .OrderByDescending(x => x.Id)
                    .ToList();
            }

            var itemIds = result.Select(x => x.Id).ToList();

            var warehouseStockList = await _w_repository
                .Query()
                .Include(ws => ws.Warehouse)
                .Where(ws =>
                    ws.TenantId == tanentId &&
                    ws.Status == StatusEnum.Active &&
                    itemIds.Contains(ws.ItemId))
                .Select(ws => new WarehouseStockResponse
                {
                    ItemId = ws.ItemId,
                    WarehouseId = ws.WarehouseId,
                    Warehouse = ws.Warehouse.Name,
                    ItemQty = ws.Quantity
                })
                .ToListAsync();

            var stockByItem = warehouseStockList
                .GroupBy(s => s.ItemId)
                .ToDictionary(g => g.Key, g => g.ToList());

            foreach (var item in result)
            {
                if (stockByItem.TryGetValue(item.Id, out var stockList))
                {
                    item.Warehousestk = stockList;
                }
                item.TotalCount = totalCount;
            }

            return result;
        }
    }
}
