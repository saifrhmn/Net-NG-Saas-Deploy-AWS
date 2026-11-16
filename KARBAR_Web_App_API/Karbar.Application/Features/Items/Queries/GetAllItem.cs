using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Item;
using Karbar.Application.Contracts.Supplier;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Items.Queries
{
    public class GetAllItem
    {
        public sealed class Query : IRequest<List<ItemResponse>>
        {
            public string SearchText { get; set; }
            public int TenantId { get; set; }
            public int? CategoryId { get; set; }
            public int? BrandId { get; set; }
            public bool? IsBergerItem { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }

        }

        public sealed class QueryHandler : IRequestHandler<Query, List<ItemResponse>>
        {
            private readonly IGenericRepository<Item> _repository;
            private readonly IGenericRepository<User> _u_repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _w_repository;
            public QueryHandler(IGenericRepository<Item> repository, IGenericRepository<User> u_repository, IGenericRepository<Karbar.Domain.Entities.Stock> w_repository)
            {
                _repository = repository;
                _u_repository = u_repository;
                _w_repository = w_repository;
            }
            public async Task<List<ItemResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                IQueryable<Item> query;
                var user = await _u_repository.GetByIdAsync(x => x.TenantId == request.TenantId, cancellationToken);

                if(user.RoleId != 1 || user.RoleId != 2)
                {
                    query = _repository
                            .Query()
                            .Include(c => c.Category)
                            .Include(c => c.Brand)
                            .Include(c => c.Uom)
                            .Include(c => c.Warehouse).Where(x => x.Status != StatusEnum.Deleted)
                            .AsNoTracking()
                            .Where(p => p.TenantId == request.TenantId);
                }
                else
                {
                    query = _repository
                            .Query()
                            .Include(c => c.Category)
                            .Include(c => c.Brand)
                            .Include(c => c.Uom)
                            .Include(c => c.Warehouse).Where(x => x.Status != StatusEnum.Deleted)
                            .AsNoTracking()
                            .Where(p => p.TenantId == request.TenantId); 
                }

                if (request.CategoryId > 0)
                {
                    query = query.Where(p => p.CategoryId == request.CategoryId);
                }
                if (request.BrandId > 0)
                {
                    query = query.Where(p => p.BrandId == request.BrandId);
                    //query = request.BrandId == 7? query.Where(p => p.BrandId == 7)
                    //         : query.Where(p => p.BrandId != 7);
                }
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p => p.Name.ToLower().Contains(search));
                }

                var totalCount = await query.CountAsync(cancellationToken);
                query = query.OrderByDescending(x => x.Id);
                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }
                var itemIds = query.Select(i => i.Id).ToList();
                //var w_itemIds = query.Select(i => i.WarehouseId).ToList();
                var w_itemIds = await _w_repository
                        .Query()
                        .Where(ws => ws.TenantId == request.TenantId)
                        .Select(ws => ws.WarehouseId)
                        .Distinct()
                        .ToListAsync(cancellationToken);
                // Fetch list
                var result = await query.ToListAsync(cancellationToken);

                var response = result.Select(x => new ItemResponse
                {
                    Id = x.Id,
                    ItemId = x.ItemId.ToString(),
                    MaterialNumber = x.MaterialNumber,
                    Name = x.Name ?? "",
                    MRP = x.MRP ?? 0.0,
                    SellingPrice = x.SellingPrice ?? 0.0,
                    PurchasePrice = x.PurchasePrice ?? 0.0,
                    Barcode = x.Barcode ?? "",
                    CategoryId = x.CategoryId ?? 0,
                    CategoryName = x.Category?.Name ?? "",
                    BrandId = x.BrandId ?? 0,
                    BrandName = x.Brand?.Name ?? "",
                    UomId = x.UomId ?? 0,
                    UomName = x.Uom?.Name ?? "",
                    TenantId = x.TenantId ?? 0,
                    ImageUrl = x.ImageUrl ?? "",
                    InvoicePrice = x.InvoicePrice,
                    Status = x.Status,
                    LowStock = x.LowStock,
                    TotalCount = totalCount,
                    WeightedAveragePrice = x.WeightedAveragePrice == 0 ? Convert.ToDecimal(x.PurchasePrice) : x.WeightedAveragePrice,
                    WeightedAveragePriceUpdatedDate = x.WeightedAveragePriceUpdatetdDate,
                }).ToList();

                var warehouseStockList = await _w_repository
                                .Query()
                                .Include(ws => ws.Warehouse) 
                                .Where(ws =>
                                    ws.TenantId == request.TenantId &&
                                    ws.Status == StatusEnum.Active &&
                                    itemIds.Contains(ws.ItemId))
                                .Select(ws => new WarehouseStockResponse
                                {
                                    ItemId = ws.ItemId,
                                    WarehouseId = ws.WarehouseId,
                                    Warehouse = ws.Warehouse.Name,   
                                    ItemQty = ws.Quantity
                                })
                                .ToListAsync(cancellationToken);



                // 3. Group warehouse stock by ItemId
                var stockByItem = warehouseStockList
                    .GroupBy(s => s.ItemId)
                    .ToDictionary(g => g.Key, g => g.ToList());

                // 4. Attach warehouse stock list to each item
                foreach (var item in response)
                {
                    if (stockByItem.TryGetValue(item.Id, out var stockList))
                    {
                        item.Warehousestk = stockList;  // property in ItemResponse
                    }
                }


                // 5. Return final response
                return response;


            }
        }
    }
}
