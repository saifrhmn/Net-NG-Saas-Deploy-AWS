using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ExpenseCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExpenseCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ExpenseCategoryId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ParentId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpenseCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ItemStockResponse",
                columns: table => new
                {
                    MaterialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ItemName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Brand = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Warehouse = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Unit = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    MRP = table.Column<double>(type: "float", nullable: true),
                    SellingPrice = table.Column<double>(type: "float", nullable: true),
                    WeightedAvgPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    StockDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TotalCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                });

            //migrationBuilder.CreateTable(
            //    name: "SapSalesDatas",
            //    columns: table => new
            //    {
            //        Id = table.Column<int>(type: "int", nullable: false)
            //            .Annotation("SqlServer:Identity", "1, 1"),
            //        Client = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        CompanyCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        Division = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        SoldToParty = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        BillingDocument = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        BillingDate = table.Column<DateTime>(type: "datetime2", nullable: true),
            //        BusinessArea = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        CustomerAccountGroup = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        DistributionChannel = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        MaterialGroup = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        MaterialNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        MaterialGroupDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        SalesOrganization = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        SoldToPartyCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        PayerCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        EmployeeResponsible = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        SalesPerson = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        SalesOffice = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        SalesGroup = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        CustomerClassification = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        BillingItem = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        MaterialDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        BaseUnitOfMeasure = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        VolumeUnit = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        RegionalMarket = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        RegionalStructureGrouping = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        CustomerName = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        DivisionText = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        InvoiceAmount = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        TaxAmount = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        SDAmount = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        GallonOrKG = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        ActualBilledQuantity = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        Volume = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        EntryTime = table.Column<DateTime>(type: "datetime2", nullable: true),
            //        CreditControlArea = table.Column<string>(type: "nvarchar(max)", nullable: true),
            //        CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
            //    },
            //    constraints: table =>
            //    {
            //        table.PrimaryKey("PK_SapSalesDatas", x => x.Id);
            //    });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExpenseCategories");

            migrationBuilder.DropTable(
                name: "ItemStockResponse");

            migrationBuilder.DropTable(
                name: "SapSalesDatas");
        }
    }
}
