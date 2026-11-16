using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Contracts.DashBoard
{
    public class DashBoardResponse
    {
        public decimal? TodayTotalSales { get; set; }
        public decimal? TodayTotalNonBergerPurchases { get; set; }
        public decimal? TodayTotalBergerPurchases { get; set; }
        public decimal? TodayTotalSalesDues { get; set; }
        public decimal? TodayDues { get; set; }
        public List<ListOfReceivable>? ListOfReceivables { get; set; }
        public List<ListOfExpense>? ListOfExpenses { get; set; }
        public List<LowStock>? LowStocks { get; set; }
        public List<HighestSellProduct>? HighestSellProducts { get; set; }
        public decimal TodayCollection { get; set; }
        public decimal TotalReceivable { get; set; }
        public decimal StockValue { get; set; }
    }
    public class ListOfReceivable
    {
        public string? Name { get; set; }
        public decimal? TotalAmount { get; set; }
    }
    public class ListOfExpense
    {
        public decimal? TodayTotalExpense { get; set; }
        public decimal? Last7DaysTotalExpense { get; set; }
        public decimal? Last30DaysTotalExpense { get; set; }
    }
    public class LowStock
    {
        public string? ItemName { get; set; }
        public string? MaterialNumber { get; set; }
        public string? Warehouse { get; set; }
        public decimal? CurrentStock { get; set; }
    }
    public class HighestSellProduct
    {
        public string? ItemName { get; set; }
        public string? MaterialNumber { get; set; }
        public string? Warehouse { get; set; }
        public decimal? CurrentStock { get; set; }
    }
}
