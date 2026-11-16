using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PurchaseRecieved : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecievedDate",
                table: "RequestOrderMasters");

            migrationBuilder.AddColumn<int>(
                name: "PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PurchaseOrderRecievedMasters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RecievedOrderId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RecievedNo = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RecievedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DiscountAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Tax = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Vat = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrderRecievedMasters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PurchaseOrderRecievedDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PurchaseOrderDetailId = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ItemId = table.Column<int>(type: "int", nullable: true),
                    UomId = table.Column<int>(type: "int", nullable: true),
                    WarehouseId = table.Column<int>(type: "int", nullable: true),
                    SupplierId = table.Column<int>(type: "int", nullable: true),
                    PurchaseOrderMasterId = table.Column<int>(type: "int", nullable: true),
                    Quantity = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OrderStatus = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PurchaseOrderRecievedMasterId = table.Column<int>(type: "int", nullable: true),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PurchaseOrderRecievedDetails", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PurchaseOrderRecievedDetails_Items_ItemId",
                        column: x => x.ItemId,
                        principalTable: "Items",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseOrderRecievedDetails_PurchaseOrderRecievedMasters_PurchaseOrderRecievedMasterId",
                        column: x => x.PurchaseOrderRecievedMasterId,
                        principalTable: "PurchaseOrderRecievedMasters",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseOrderRecievedDetails_Suppliers_SupplierId",
                        column: x => x.SupplierId,
                        principalTable: "Suppliers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseOrderRecievedDetails_Uoms_UomId",
                        column: x => x.UomId,
                        principalTable: "Uoms",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PurchaseOrderRecievedDetails_Warehouses_WarehouseId",
                        column: x => x.WarehouseId,
                        principalTable: "Warehouses",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderDetails_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails",
                column: "PurchaseOrderRecievedMasterId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRecievedDetails_ItemId",
                table: "PurchaseOrderRecievedDetails",
                column: "ItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRecievedDetails_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderRecievedDetails",
                column: "PurchaseOrderRecievedMasterId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRecievedDetails_SupplierId",
                table: "PurchaseOrderRecievedDetails",
                column: "SupplierId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRecievedDetails_UomId",
                table: "PurchaseOrderRecievedDetails",
                column: "UomId");

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderRecievedDetails_WarehouseId",
                table: "PurchaseOrderRecievedDetails",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderDetails_PurchaseOrderRecievedMasters_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails",
                column: "PurchaseOrderRecievedMasterId",
                principalTable: "PurchaseOrderRecievedMasters",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderDetails_PurchaseOrderRecievedMasters_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropTable(
                name: "PurchaseOrderRecievedDetails");

            migrationBuilder.DropTable(
                name: "PurchaseOrderRecievedMasters");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderDetails_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails");

            migrationBuilder.AddColumn<DateTime>(
                name: "RecievedDate",
                table: "RequestOrderMasters",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }
    }
}
