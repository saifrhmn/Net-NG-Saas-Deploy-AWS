using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PaymentTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SupplierPayments");

            migrationBuilder.DropColumn(
                name: "CardNumber",
                table: "SalesOrderMasters");

            migrationBuilder.DropColumn(
                name: "DueAmount",
                table: "SalesOrderMasters");

            migrationBuilder.DropColumn(
                name: "MobileBankMethod",
                table: "SalesOrderMasters");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "SalesOrderMasters");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "SalesOrderMasters");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "SalesOrderMasters");

            migrationBuilder.DropColumn(
                name: "CardNumber",
                table: "RequestOrderMasters");

            migrationBuilder.DropColumn(
                name: "DueAmount",
                table: "RequestOrderMasters");

            //migrationBuilder.DropColumn(
            //    name: "MobileBankMethod",
            //    table: "RequestOrderMasters");

            //migrationBuilder.DropColumn(
            //    name: "PaidAmount",
            //    table: "RequestOrderMasters");

            //migrationBuilder.DropColumn(
            //    name: "PaymentMethod",
            //    table: "RequestOrderMasters");

            //migrationBuilder.DropColumn(
            //    name: "PhoneNumber",
            //    table: "RequestOrderMasters");

            //migrationBuilder.DropColumn(
            //    name: "CardNumber",
            //    table: "PurchaseOrderMasters");

            //migrationBuilder.DropColumn(
            //    name: "DueAmount",
            //    table: "PurchaseOrderMasters");

            migrationBuilder.DropColumn(
                name: "MobileBankMethod",
                table: "PurchaseOrderMasters");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "PurchaseOrderMasters");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "PurchaseOrderMasters");

            migrationBuilder.DropColumn(
                name: "PhoneNumber",
                table: "PurchaseOrderMasters");

            migrationBuilder.RenameColumn(
                name: "BankId",
                table: "SalesOrderMasters",
                newName: "PaymentStatus");

            migrationBuilder.RenameColumn(
                name: "BankId",
                table: "RequestOrderMasters",
                newName: "PaymentStatus");

            //migrationBuilder.RenameColumn(
            //    name: "Quantity",
            //    table: "PurchaseOrderRecievedDetails",
            //    newName: "RemainingQty");

            migrationBuilder.RenameColumn(
                name: "BankId",
                table: "PurchaseOrderMasters",
                newName: "PaymentStatus");

            migrationBuilder.AlterColumn<int>(
                name: "TenantId",
                table: "Stocks",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            //migrationBuilder.AddColumn<decimal>(
            //    name: "InvoiceQty",
            //    table: "PurchaseOrderRecievedDetails",
            //    type: "decimal(18,2)",
            //    nullable: false,
            //    defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserType = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: true),
                    PaymentType = table.Column<int>(type: "int", nullable: false),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    OrderInvoiceNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DueAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MobileBankMethod = table.Column<int>(type: "int", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BankName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccountNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsBerger = table.Column<bool>(type: "bit", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Payments");

            migrationBuilder.DropColumn(
                name: "InvoiceQty",
                table: "PurchaseOrderRecievedDetails");

            migrationBuilder.RenameColumn(
                name: "PaymentStatus",
                table: "SalesOrderMasters",
                newName: "BankId");

            migrationBuilder.RenameColumn(
                name: "PaymentStatus",
                table: "RequestOrderMasters",
                newName: "BankId");

            migrationBuilder.RenameColumn(
                name: "RemainingQty",
                table: "PurchaseOrderRecievedDetails",
                newName: "Quantity");

            migrationBuilder.RenameColumn(
                name: "PaymentStatus",
                table: "PurchaseOrderMasters",
                newName: "BankId");

            migrationBuilder.AlterColumn<int>(
                name: "TenantId",
                table: "Stocks",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CardNumber",
                table: "SalesOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DueAmount",
                table: "SalesOrderMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "MobileBankMethod",
                table: "SalesOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "SalesOrderMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "SalesOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "SalesOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CardNumber",
                table: "RequestOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DueAmount",
                table: "RequestOrderMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "MobileBankMethod",
                table: "RequestOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "RequestOrderMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "RequestOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "RequestOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CardNumber",
                table: "PurchaseOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DueAmount",
                table: "PurchaseOrderMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "MobileBankMethod",
                table: "PurchaseOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "PurchaseOrderMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "PurchaseOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNumber",
                table: "PurchaseOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SupplierPayments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    DueAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    IsBerger = table.Column<bool>(type: "bit", nullable: false),
                    OrderInvoiceNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PaymentType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PurchaseOrderDetailId = table.Column<int>(type: "int", nullable: true),
                    PurchaseOrderId = table.Column<int>(type: "int", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    SupplierId = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierPayments", x => x.Id);
                });
        }
    }
}
