using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Roles;
using Karbar.Application.Contracts.StockItems;
using Karbar.Application.Contracts.User;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Stock.Queries
{
    public class GetAllStock
    {
        public sealed class Query : IRequest<List<StockResponseByWharehouse>>
        {
            public string SearchText { get; set; }
            public int TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<StockResponseByWharehouse>>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _repository;
            public QueryHandler(IGenericRepository<Karbar.Domain.Entities.Stock> repository)
            {
                _repository = repository;
            }

            public async Task<List<StockResponseByWharehouse>> Handle(Query request, CancellationToken cancellationToken)
            {
                //var query = _repository
                //                 .Query()
                //                 .Include(c => c.Item)
                //                 .Include(c => c.Warehouse)
                //                 .Where(x => x.Status != StatusEnum.Deleted);
                //if (request.TenantId > 1 || request.TenantId == -1)
                //{
                //    query = query.Where(p => p.TenantId == request.TenantId);
                //}

                //if (!string.IsNullOrWhiteSpace(request.SearchText))
                //{
                //    var search = request.SearchText.Trim().ToLower();

                //    query = query.Where(p =>
                //        p.Item.Name.ToLower().Contains(search) ||
                //        p.Warehouse.Name.ToLower().Contains(search)
                //    );
                //}

                //var totalCount = await query.CountAsync(cancellationToken);

                //if (request.PageIndex.HasValue && request.PageSize.HasValue)
                //{
                //    query = query
                //        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                //        .Take(request.PageSize.Value);
                //}

                //var result = await query.ToListAsync(cancellationToken);

                //var response = result
                //            .GroupBy(x => new
                //            {
                //                x.ItemId,
                //                ItemName = x.Item.Name,
                //                LowStock = x.Item.LowStock
                //            })
                //            .Select(g => new StockResponseByWharehouse
                //            {
                //                ItemId = g.Key.ItemId,
                //                ItemName = g.Key.ItemName,
                //                Warehouse = g.Select(w => new WarehouseStockResponse
                //                {
                //                    StockId = w.Id,
                //                    WarehouseId = w.WarehouseId,
                //                    Warehouse = w.Warehouse.Name,
                //                    ItemQty = w.Quantity,
                //                    TenantId = w.TenantId
                //                }).ToList(),
                //                LowStock = g.Key.LowStock,
                //                TotalCount = totalCount
                //            })
                //            .ToList();


                //return response;
                // STEP 1: Base query (NO pagination here)
                var baseQuery = _repository
                    .Query()
                    .AsNoTracking()
                    .Include(x => x.Item)
                    .Include(x => x.Warehouse)
                    .Where(x => x.Status != StatusEnum.Deleted);

                if (request.TenantId > 0)
                {
                    baseQuery = baseQuery.Where(p => p.TenantId == request.TenantId);
                }

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();

                    baseQuery = baseQuery.Where(x =>
                        (x.Item.MaterialNumber != null && x.Item.MaterialNumber.ToLower().Contains(search)) ||
                        (x.Item.Name != null && x.Item.Name.ToLower().Contains(search)) ||
                        (x.Warehouse.Name != null && x.Warehouse.Name.ToLower().Contains(search)));
                }


                var groupedQuery = baseQuery
                    .GroupBy(x => new
                    {
                        x.ItemId,
                        ItemName = x.Item.Name,
                        MaterialCode = x.Item.MaterialNumber,
                        LowStock = x.Item.LowStock
                    })
                    .Select(g => new StockResponseByWharehouse
                    {
                        ItemId = g.Key.ItemId,
                        ItemName = g.Key.ItemName,
                        MaterialCode = g.Key.MaterialCode,
                        LowStock = g.Key.LowStock,

                        Warehouse = g
                            .Select(w => new WarehouseStockResponse
                            {
                                StockId = w.Id,
                                WarehouseId = w.WarehouseId,
                                Warehouse = w.Warehouse.Name,
                                ItemQty = w.Quantity,
                                TenantId = w.TenantId
                            })
                            .ToList()
                    });

                groupedQuery = groupedQuery.OrderBy(x => x.ItemName);
                var totalCount = await groupedQuery.CountAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    groupedQuery = groupedQuery
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }


                var response = await groupedQuery
                    .Select(x => new StockResponseByWharehouse
                    {
                        ItemId = x.ItemId,
                        ItemName = x.ItemName,
                        MaterialCode = x.MaterialCode,
                        Warehouse = x.Warehouse,
                        LowStock = x.LowStock,
                        TotalCount = totalCount
                    })
                    .ToListAsync(cancellationToken);
                return response;
            }
        }
    }
}