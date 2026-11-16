using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Customer;
using Karbar.Application.Contracts.DashBoard;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.Dashboard.Queries
{
    public class GetAllDashboardList
    {
        public sealed class Query : IRequest<List<DashBoardResponse>>
        {
            public int TenantId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<DashBoardResponse>>
        {
            private readonly IGenericRepository<Customer> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.ReturnOrder.ReturnOrderMaster> _repositoryReturnOrder;
            private readonly IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderMaster> _repositorySalesOrder;
            private readonly IGenericRepository<Karbar.Domain.Entities.SalesOrder.SalesOrderDetail> _repositorySalesOrderDetail;
            private readonly IGenericRepository<Karbar.Domain.Entities.RequestOrder.RequestOrderMaster> _repositoryRequestOrder;
            private readonly IGenericRepository<Karbar.Domain.Entities.PurchaseOrderRecieved.PurchaseOrderRecievedMaster> _repositoryPORecieved;
            private readonly IGenericRepository<Karbar.Domain.Entities.PurchaseOrderMaster> _repositoryPurchaseOrder;
            private readonly IGenericRepository<Karbar.Domain.Entities.Payment.Payment> _repositoryPayment;
            private readonly IGenericRepository<Karbar.Domain.Entities.ExpenseInformation> _repositoryExpense;
            private readonly IGenericRepository<Karbar.Domain.Entities.Item> _repositoryItem;
            private readonly IGenericRepository<Karbar.Domain.Entities.Warehouse> _repositoryWarehouse;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _repositoryStock;
            public QueryHandler(
                IGenericRepository<Customer> repository, 
                IGenericRepository<Karbar.Domain.Entities.Payment.Payment> repositoryPayment,
                IGenericRepository<Karbar.Domain.Entities.ReturnOrder.ReturnOrderMaster> repositoryReturnOrder,
                IGenericRepository<Domain.Entities.SalesOrder.SalesOrderMaster> repositorySalesOrder, 
                IGenericRepository<Domain.Entities.RequestOrder.RequestOrderMaster> repositoryRequestOrder, 
                IGenericRepository<ExpenseInformation> repositoryExpense, 
                IGenericRepository<Domain.Entities.Stock> repositoryStock, 
                IGenericRepository<Item> repositoryItem, 
                IGenericRepository<Warehouse> repositoryWarehouse, 
                IGenericRepository<Domain.Entities.SalesOrder.SalesOrderDetail> repositorySalesOrderDetail, 
                IGenericRepository<Karbar.Domain.Entities.PurchaseOrderRecieved.PurchaseOrderRecievedMaster> repositoryPORecieved, 
                IGenericRepository<PurchaseOrderMaster> repositoryPurchaseOrder)
            {
                _repository = repository;
                _repositoryPayment = repositoryPayment;
                _repositoryReturnOrder = repositoryReturnOrder;
                _repositorySalesOrder = repositorySalesOrder;
                _repositoryRequestOrder = repositoryRequestOrder;
                _repositoryExpense = repositoryExpense;
                _repositoryStock = repositoryStock;
                _repositoryItem = repositoryItem;
                _repositoryWarehouse = repositoryWarehouse;
                _repositorySalesOrderDetail = repositorySalesOrderDetail;
                _repositoryPORecieved = repositoryPORecieved;
                _repositoryPurchaseOrder = repositoryPurchaseOrder;
            }

            public async Task<List<DashBoardResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var today = DateTime.Today;
                //DateTime today = DateTime.Parse("6/21/2026 12:00:00 AM");
                var last7Days = today.AddDays(-7);
                var last30Days = today.AddDays(-30);

                var returnSales = await _repositoryReturnOrder
                                        .Query()
                                        .Where(x =>
                                            x.Status != StatusEnum.Deleted &&
                                            x.SalesDate >= today &&
                                            x.SalesDate < today.AddDays(1) &&
                                            x.TenantId == request.TenantId)
                                        .SumAsync(x => (decimal?)x.TotalAmount, cancellationToken);

                var todayTotalSales = await _repositorySalesOrder
                                         .Query()
                                         .Where(x =>
                                             x.Status != StatusEnum.Deleted &&
                                             x.OrderDate >= today &&
                                             x.OrderDate < today.AddDays(1) &&
                                             x.TenantId == request.TenantId && x.IsDraft == false)
                                         .SumAsync(x => (decimal?)(x.TotalAmount + x.DiscountAmount), cancellationToken);

                todayTotalSales = todayTotalSales > 0 
                        ? todayTotalSales - returnSales
                        : 0;

                var TodayTotalNonBergerPurchases = await _repositoryPurchaseOrder
                                        .Query()
                                        .Where(x =>
                                            x.Status != StatusEnum.Deleted &&
                                            x.PurchaseDate >= today &&
                                            x.PurchaseDate < today.AddDays(1) &&
                                            !x.PurchaseDetails.Any(pd => pd.Supplier!.Name!.Contains("berger")) &&
                                            x.TenantId == request.TenantId) 
                                        .SumAsync(x => (decimal?)x.TotalAmount, cancellationToken);

                // sum of Non-Berger, but Supplier Berger
                var TodayTotalBergerPurchases = await _repositoryPurchaseOrder
                                        .Query()
                                        .Where(x =>
                                            x.Status != StatusEnum.Deleted &&
                                            x.PurchaseDate >= today &&
                                            x.PurchaseDate < today.AddDays(1) &&
                                            x.PurchaseDetails.Any(pd => pd.Supplier!.Name!.Contains("berger")) &&
                                            x.TenantId == request.TenantId) 
                                        .SumAsync(x => (decimal?)x.TotalAmount, cancellationToken);

                TodayTotalBergerPurchases = TodayTotalBergerPurchases + await _repositoryPORecieved
                                        .Query()
                                        .Where(x =>
                                            x.Status != StatusEnum.Deleted &&
                                            x.RecievedDate >= today &&
                                            x.RecievedDate < today.AddDays(1) &&
                                            x.TenantId == request.TenantId)
                                        .SumAsync(x => (x.BergerTotalPurchaseAmount.HasValue ? x.BergerTotalPurchaseAmount.Value : (decimal?)x.TotalAmount), cancellationToken);

                // Invoices of today's (non-draft) sales orders of this tenant
                var todaySalesInvoices = _repositorySalesOrder
                                        .Query()
                                        .Where(x =>
                                            x.Status != StatusEnum.Deleted &&
                                            x.OrderDate >= today &&
                                            x.OrderDate < today.AddDays(1) && x.IsDraft == false &&
                                            x.TenantId == request.TenantId)
                                        .Select(x => x.InvoiceNo);

                // Today's dues of this tenant: only today's sales invoices,
                // and only the latest payment (by CreatedDate) of each invoice counts
                var todayDues = (await _repositoryPayment
                                        .Query()
                                        .Where(x =>
                                            x.Status != StatusEnum.Deleted &&
                                            x.CreatedDate >= today &&
                                            x.CreatedDate < today.AddDays(1) &&
                                            x.TenantId == request.TenantId &&
                                            todaySalesInvoices.Contains(x.OrderInvoiceNo))
                                        .GroupBy(x => x.OrderInvoiceNo)
                                        .Select(g => g
                                            .OrderByDescending(x => x.CreatedDate)
                                            .ThenByDescending(x => x.Id)
                                            .Select(x => (decimal?)x.DueAmount)
                                            .FirstOrDefault())
                                        .ToListAsync(cancellationToken))
                                        .Sum();
                //var t_payment = await _repositoryPayment.Query()
                //                        .Where(p => p.Status != StatusEnum.Deleted &&
                //                                    p.UserType == UserTypeEnum.Customer &&
                //                                    p.CreatedDate >= today &&
                //                                    p.CreatedDate < today.AddDays(1) &&
                //                                    p.TenantId == request.TenantId)
                //                        .SumAsync(p => (decimal?)p.DueAmount, cancellationToken);
                var latestPayments = _repositoryPayment.Query()
                            .Where(p => p.Status != StatusEnum.Deleted
                                     && p.UserType == UserTypeEnum.Customer
                                     && p.CreatedDate >= today
                                     && p.CreatedDate < today.AddDays(1)
                                     && p.TenantId == request.TenantId)
                            .GroupBy(p => new { p.OrderInvoiceNo, p.TenantId })
                            .Select(g => new
                            {
                                g.Key.OrderInvoiceNo,
                                g.Key.TenantId,
                                MaxDate = g.Max(x => x.CreatedDate)
                            });
                // Same filters on the joined payments, so only this tenant's customer dues are summed
                decimal? TodayTotalSalesDues = await (
                                                 from p in _repositoryPayment.Query()
                                                     .Where(p => p.Status != StatusEnum.Deleted
                                                              && p.UserType == UserTypeEnum.Customer
                                                              && p.TenantId == request.TenantId)
                                                 join l in latestPayments
                                                     on new { p.OrderInvoiceNo, p.TenantId, p.CreatedDate }
                                                     equals new { l.OrderInvoiceNo, l.TenantId, CreatedDate = l.MaxDate }
                                                 select p.DueAmount
                                             ).SumAsync(x => (decimal?)x, cancellationToken) ?? 0;
                
                var latestPaymentIds = await _repositoryPayment.Query()
                        .Where(p =>
                            p.Status != StatusEnum.Deleted &&
                            p.UserType == UserTypeEnum.Customer &&
                            p.TenantId == request.TenantId)
                        .GroupBy(p => new { p.OrderInvoiceNo, p.TenantId })
                        .Select(g => g.Max(x => x.Id))
                        .ToListAsync(cancellationToken);

                                    var receivables = (await (
                                        from p in _repositoryPayment.Query()
                                        join c in _repository.Query()
                                            on p.UserId equals c.Id
                                        where latestPaymentIds.Contains(p.Id)
                                           && c.TenantId == request.TenantId
                                        select new
                                        {
                                            c.Id,
                                            c.Name,
                                            p.DueAmount
                                        })
                                        .ToListAsync(cancellationToken))
                                        .GroupBy(x => new { x.Id, x.Name })
                                        .Select(g => new ListOfReceivable
                                        {
                                            Name = g.Key.Name,
                                            TotalAmount = g.Sum(x => x.DueAmount)
                                        })
                                        .Where(x => x.TotalAmount > 0)
                                        .OrderByDescending(x => x.TotalAmount)
                                        .ToList();

                // Total Receivable: all customers' dues (before the top-100 cut)
                decimal totalReceivable = receivables.Sum(x => x.TotalAmount ?? 0);
                receivables = receivables.Take(100).ToList();

                // Today's Collection: amount paid on today's (non-draft) sales
                decimal todayCollection = await _repositorySalesOrder.Query()
                                        .Where(x =>
                                            x.Status != StatusEnum.Deleted &&
                                            x.IsDraft == false &&
                                            x.TenantId == request.TenantId &&
                                            x.OrderDate >= today &&
                                            x.OrderDate < today.AddDays(1))
                                        .SumAsync(x => x.PaidAmount ?? 0, cancellationToken);

                // Stock Value: qty * weighted average price (fallback: purchase price)
                var stockRows = await (
                                    from stock in _repositoryStock.Query()
                                    join item in _repositoryItem.Query()
                                        on stock.ItemId equals item.Id
                                    where stock.TenantId == request.TenantId
                                          && item.TenantId == request.TenantId
                                          && stock.Status != StatusEnum.Deleted
                                          && item.Status != StatusEnum.Deleted
                                          && stock.Quantity > 0
                                    select new
                                    {
                                        stock.Quantity,
                                        item.WeightedAveragePrice,
                                        item.PurchasePrice
                                    })
                                    .ToListAsync(cancellationToken);

                decimal stockValue = Math.Round(stockRows
                    .Sum(x => x.Quantity * (x.WeightedAveragePrice ?? (decimal)(x.PurchasePrice ?? 0))), 2);
                var expenses = new List<ListOfExpense>
                                            {
                                                new ListOfExpense
                                                {
                                                    TodayTotalExpense = await _repositoryExpense.Query()
                                                        .Where(x => x.ExpenseDate >= today && x.ExpenseDate < today.AddDays(1)
                                                                    && x.TenantId == request.TenantId)
                                                        .SumAsync(x => (decimal?)x.ExpenseAmount, cancellationToken),

                                                    Last7DaysTotalExpense = await _repositoryExpense.Query()
                                                        .Where(x => x.ExpenseDate >= last7Days
                                                                    && x.TenantId == request.TenantId)
                                                        .SumAsync(x => (decimal?)x.ExpenseAmount, cancellationToken),

                                                    Last30DaysTotalExpense = await _repositoryExpense.Query()
                                                        .Where(x => x.ExpenseDate >= last30Days
                                                                    && x.TenantId == request.TenantId)
                                                        .SumAsync(x => (decimal?)x.ExpenseAmount, cancellationToken)
                                                }
                                            };


                var lowStocks = await (
                                    from stock in _repositoryStock.Query()
                                    join item in _repositoryItem.Query()
                                        on stock.ItemId equals item.Id
                                    join warehouse in _repositoryWarehouse.Query()
                                        on stock.WarehouseId equals warehouse.Id
                                    where stock.Quantity <= item.LowStock
                                          && stock.TenantId == request.TenantId
                                          && item.TenantId == request.TenantId
                                          && warehouse.TenantId == request.TenantId
                                          && stock.Quantity != 0
                                    select new LowStock
                                    {
                                        ItemName = item.Name,
                                        MaterialNumber = item.MaterialNumber,
                                        Warehouse = warehouse.Name,
                                        CurrentStock = stock.Quantity
                                    })
                                    .OrderBy(x => x.CurrentStock)
                                    .Take(10)
                                    .ToListAsync(cancellationToken);


                var highestSellProducts = await (
                                 from so in _repositorySalesOrder.Query()
                                 join sod in _repositorySalesOrderDetail.Query()
                                     on so.Id equals sod.SalesOrderId
                                 join i in _repositoryItem.Query()
                                     on sod.ItemId equals i.Id
                                 join w in _repositoryWarehouse.Query()
                                     on so.WarehouseId equals w.Id
                                 where so.TenantId == request.TenantId
                                       //&& sod.TenantId == request.TenantId
                                       && i.TenantId == request.TenantId
                                       && w.TenantId == request.TenantId && so.IsDraft == false
                                 group sod by new
                                 {
                                     i.Name,
                                     i.MaterialNumber,
                                     WarehouseName = w.Name
                                 } into g
                                 select new HighestSellProduct
                                 {
                                     ItemName = g.Key.Name,
                                     MaterialNumber = g.Key.MaterialNumber,
                                     Warehouse = g.Key.WarehouseName,
                                     CurrentStock = g.Sum(x => x.Quantity)
                                 })
                                 .OrderByDescending(x => x.CurrentStock)
                                 .Take(10)
                                 .ToListAsync(cancellationToken);


                var dashboardResponse = new DashBoardResponse
                {
                    TodayTotalSales = todayTotalSales,
                    TodayTotalNonBergerPurchases = TodayTotalNonBergerPurchases,
                    TodayTotalBergerPurchases = TodayTotalBergerPurchases,
                    TodayTotalSalesDues= TodayTotalSalesDues,
                    TodayDues = todayDues,
                    ListOfReceivables = receivables,
                    ListOfExpenses = expenses,
                    LowStocks = lowStocks,
                    HighestSellProducts = highestSellProducts,
                    TodayCollection = todayCollection,
                    TotalReceivable = totalReceivable,
                    StockValue = stockValue
                };

                return new List<DashBoardResponse> { dashboardResponse };


            }
        }
    }
}
