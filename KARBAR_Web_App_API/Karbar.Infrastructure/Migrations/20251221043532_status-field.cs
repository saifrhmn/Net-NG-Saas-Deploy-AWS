using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class statusfield : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBerger",
                table: "RequestOrderMasters",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrderStatus",
                table: "RequestOrderMasters",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReceivedDate",
                table: "RequestOrderMasters",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsBerger",
                table: "RequestOrderMasters");

            migrationBuilder.DropColumn(
                name: "OrderStatus",
                table: "RequestOrderMasters");

            migrationBuilder.DropColumn(
                name: "ReceivedDate",
                table: "RequestOrderMasters");
        }
    }
}
