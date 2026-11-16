using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class PR2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RequestOrderNo",
                table: "PurchaseOrderRecievedMasters",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequestOrderNo",
                table: "PurchaseOrderRecievedMasters");
        }
    }
}
