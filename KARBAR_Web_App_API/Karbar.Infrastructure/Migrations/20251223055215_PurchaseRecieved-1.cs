using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PurchaseRecieved1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderDetails_PurchaseOrderRecievedMasters_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropIndex(
                name: "IX_PurchaseOrderDetails_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails");

            migrationBuilder.DropColumn(
                name: "PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PurchaseOrderDetails_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails",
                column: "PurchaseOrderRecievedMasterId");

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderDetails_PurchaseOrderRecievedMasters_PurchaseOrderRecievedMasterId",
                table: "PurchaseOrderDetails",
                column: "PurchaseOrderRecievedMasterId",
                principalTable: "PurchaseOrderRecievedMasters",
                principalColumn: "Id");
        }
    }
}
