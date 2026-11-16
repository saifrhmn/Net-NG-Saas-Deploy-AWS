using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.Stock.Commands
{
    public class StockHelper
    {
        private static readonly object _lock = new();

        public static async Task IncreaseStockAsync(IGenericRepository<Karbar.Domain.Entities.Stock> stockRepo, int? itemId, int? warehouseId, int tenantId, decimal Itemqty)
        {
            if (Itemqty <= 0)
                throw new ArgumentException("Quantity must be greater than zero");

            if (stockRepo == null)
                throw new Exception("StockHelper is not initialized");

            Karbar.Domain.Entities.Stock stock;

            

            stock = await stockRepo.GetByIdAsync(x =>
                     (!itemId.HasValue || x.ItemId == itemId.Value) &&
                     (!warehouseId.HasValue || x.WarehouseId == warehouseId.Value) &&
                     (x.TenantId == tenantId));

            if (stock == null)
            {
                stock = new Karbar.Domain.Entities.Stock
                {
                    ItemId = itemId.Value ,
                    WarehouseId = warehouseId.Value,
                    TenantId = tenantId,
                    Quantity = Itemqty,
                    Status = Domain.Enums.StatusEnum.Active
                };
                await stockRepo.AddAsync(stock);
            }
            else
            {
                stock.Quantity += Itemqty;
            }

            await stockRepo.SaveChangesAsync();
        }

        public static async Task DecreaseStockAsync(IGenericRepository<Karbar.Domain.Entities.Stock> stockRepo, int? itemId, int? warehouseId, int tenantId, decimal qty)
        {
            if (qty <= 0)
                throw new ArgumentException("Quantity must be greater than zero");

            Karbar.Domain.Entities.Stock stock;

            lock (_lock) { }

            stock = await stockRepo.GetByIdAsync(x =>
                 (!itemId.HasValue || x.ItemId == itemId.Value) &&
                 (!warehouseId.HasValue || x.WarehouseId == warehouseId.Value) &&
                  x.TenantId == tenantId);

            if (stock == null)
                throw new Exception("Item not found for this warehouse & tenant");

            if (stock.Quantity < qty)
                throw new Exception("Insufficient stock");

            stock.Quantity -= qty;

            await stockRepo.SaveChangesAsync();
        }

        public static async Task<int> GetStockAsync(IGenericRepository<Karbar.Domain.Entities.Stock> stockRepo, int? itemId, int? warehouseId, int tenantId)
        {
            if (stockRepo == null)
                throw new Exception("StockHelper is not initialized");

            Karbar.Domain.Entities.Stock stock;

            lock (_lock) { }

            stock = await stockRepo.GetByIdAsync(x =>
                x.ItemId == itemId &&
                x.WarehouseId == warehouseId &&
                x.TenantId == tenantId);

            return (int)(stock?.Quantity ?? 0);
        }

    }

}
