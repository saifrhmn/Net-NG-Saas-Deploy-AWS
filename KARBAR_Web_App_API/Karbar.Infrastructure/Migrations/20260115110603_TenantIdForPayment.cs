using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class TenantIdForPayment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderRecievedDetails_PurchaseOrderRecievedMasters_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderRecievedDetails");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderRecievedDetails_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderRecievedDetails");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderRecievedDetails");

            //migrationBuilder.AddColumn<bool>(
            //    name: "IsCustomerRecieved",
            //    table: "SapSalesDatas",
            //    type: "bit",
            //    nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Vat",
                table: "PurchaseOrderRecievedMasters",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "PurchaseOrderRecievedMasters",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "Tax",
                table: "PurchaseOrderRecievedMasters",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<DateTime>(
                name: "RecievedDate",
                table: "PurchaseOrderRecievedMasters",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<decimal>(
                name: "DiscountAmount",
                table: "PurchaseOrderRecievedMasters",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            //migrationBuilder.AddColumn<decimal>(
            //    name: "PaidAmount",
            //    table: "PurchaseOrderRecievedMasters",
            //    type: "decimal(18,2)",
            //    nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "UnitPrice",
                table: "PurchaseOrderRecievedDetails",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "PurchaseOrderRecievedDetails",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "RemainingQty",
                table: "PurchaseOrderRecievedDetails",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "InvoiceQty",
                table: "PurchaseOrderRecievedDetails",
                type: "decimal(18,2)",
                nullable: true,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<int>(
                name: "TenantId",
                table: "Payments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRecievedDetails_PurchaseOrderMasterId",
                table: "PurchaseOrderRecievedDetails",
                column: "PurchaseOrderMasterId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderRecievedDetails_PurchaseOrderRecievedMasters_PurchaseOrderMasterId",
                table: "PurchaseOrderRecievedDetails",
                column: "PurchaseOrderMasterId",
                principalTable: "PurchaseOrderRecievedMasters",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderRecievedDetails_PurchaseOrderRecievedMasters_PurchaseOrderMasterId",
                table: "PurchaseOrderRecievedDetails");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderRecievedDetails_PurchaseOrderMasterId",
                table: "PurchaseOrderRecievedDetails");

            migrationBuilder.DropColumn(
                name: "IsCustomerRecieved",
                table: "SapSalesDatas");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "PurchaseOrderRecievedMasters");

            migrationBuilder.DropColumn(
                name: "TenantId",
                table: "Payments");

            migrationBuilder.AlterColumn<decimal>(
                name: "Vat",
                table: "PurchaseOrderRecievedMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "PurchaseOrderRecievedMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Tax",
                table: "PurchaseOrderRecievedMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "RecievedDate",
                table: "PurchaseOrderRecievedMasters",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "DiscountAmount",
                table: "PurchaseOrderRecievedMasters",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "UnitPrice",
                table: "PurchaseOrderRecievedDetails",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "TotalAmount",
                table: "PurchaseOrderRecievedDetails",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "RemainingQty",
                table: "PurchaseOrderRecievedDetails",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "InvoiceQty",
                table: "PurchaseOrderRecievedDetails",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderRecievedDetails",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRecievedDetails_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderRecievedDetails",
                column: "PurchaseOrderRecievedMasterId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderRecievedDetails_PurchaseOrderRecievedMasters_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderRecievedDetails",
                column: "PurchaseOrderRecievedMasterId",
                principalTable: "PurchaseOrderRecievedMasters",
                principalColumn: "Id");
        }
    }
}
