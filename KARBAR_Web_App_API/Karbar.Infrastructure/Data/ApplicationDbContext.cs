using Karbar.Application.Contracts.Report;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.CustomerPayment;
using Karbar.Domain.Entities.Payment;
using Karbar.Domain.Entities.PurchaseOrderRecieved;
using Karbar.Domain.Entities.PurchaseReturn;
using Karbar.Domain.Entities.RequestOrder;
using Karbar.Domain.Entities.ReturnOrder;
using Karbar.Domain.Entities.SalesOrder;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Infrastructure.Data
{
    public partial class ApplicationDbContext : IdentityDbContext<User, Role, int>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        #region DbSets
        // Add your DbSet properties here. Example:
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<Item> Items { get; set; }
        public DbSet<Brand> Brands { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }
        public DbSet<Stock> Stocks { get; set; }
        public DbSet<Uom> Uoms { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<PurchaseOrderMaster> PurchaseOrderMasters { get; set; }
        public DbSet<PurchaseOrderDetail> PurchaseOrderDetails { get; set; }
        public DbSet<SalesOrderMaster> SalesOrderMasters { get; set; }
        public DbSet<SalesOrderDetail> SalesOrderDetails { get; set; }
        public DbSet<BankInformation> BankInformations { get; set; }
        public DbSet<ExpenseInformation> ExpenseInformations { get; set; }
        public DbSet<ExpenseCategory> ExpenseCategories { get; set; }
        public DbSet<RequestOrderMaster> RequestOrderMasters { get; set; }
        public DbSet<RequestOrderDetail> RequestOrderDetails { get; set; }
        public DbSet<CustomerPayment> CustomerPayments { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<PurchaseOrderRecievedMaster> PurchaseOrderRecievedMasters { get; set; }
        public DbSet<PurchaseOrderRecievedDetail> PurchaseOrderRecievedDetails { get; set; }
        public DbSet<ReturnOrderMaster> ReturnOrderMasters { get; set; }
        public DbSet<ReturnOrderDetail> ReturnOrderDetails { get; set; }
        public DbSet<SapSalesData> SapSalesDatas { get; set; }
        public DbSet<InvoiceData> InvoiceDatas { get; set; }
        public DbSet<StockTransfersHistory> StockTransfersHistories { get; set; }
        public DbSet<PurchaseReturnMaster> PurchaseReturnMasters { get; set; }
        public DbSet<PurchaseReturnDetail> PurchaseReturnDetails { get; set; }
        public DbSet<Material> Materials { get; set; }
        #endregion


        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            #region Model Configurations


            // If you have specific configurations, you can add them here. Example:
            // modelBuilder.Entity<YourEntity>(entity =>
            // {
            //     entity.ToTable("YourTableName");
            //     entity.HasKey(e => e.Id);
            //     // Other configurations...
            // });

            #endregion

            modelBuilder.Entity<Stock>()
                 .Ignore(x => x.Remarks);
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ItemStockReportResponse>().HasNoKey();
            modelBuilder.Entity<SalesReportResponse>().HasNoKey();
            modelBuilder.Entity<PurchaseReportResponse>().HasNoKey();
            modelBuilder.Entity<RequestOrderReportResponse>().HasNoKey();
            modelBuilder.Entity<GetInventoryMovementReportResponse>().HasNoKey();
            modelBuilder.Entity<PaymentCollectionReportResponse>().HasNoKey();
            modelBuilder.Entity<DatewiseSupplierStatementReportResponse>().HasNoKey();
            modelBuilder.Entity<GetDatewiseSupplierPaybleReportResponse>().HasNoKey();
            modelBuilder.Entity<GetTopSoldItemsReportResponse>().HasNoKey();
            modelBuilder.Entity<GetProfitAndLossReportResponse>().HasNoKey();
            modelBuilder.Entity<GetCustomerReceivableReportResponse>().HasNoKey();
            modelBuilder.Entity<GetStockTransferReportResponse>().HasNoKey();
            modelBuilder.Entity<GetCustomerStatementReportResponse>().HasNoKey();
            modelBuilder.Entity<GetSlowMovingNonMovingDeadStockReportResponse>().HasNoKey();
            modelBuilder.Entity<UserLoginAndInvoiceActivityReportResponse>().HasNoKey();
            modelBuilder.Entity<InventoryValuationReportResponse>().HasNoKey();
            modelBuilder.Entity<ReturnOrderReportResponse>().HasNoKey();

            // Existing [dbo].[Materials] table has no primary key; ToView keeps it out of migrations
            modelBuilder.Entity<Material>().HasNoKey().ToView("Materials", "dbo");
        }
    }
}
