using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations.LogDb
{
    /// <inheritdoc />
    public partial class UpdateApilog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Exception",
                table: "ApiLogs");

            migrationBuilder.DropColumn(
                name: "Level",
                table: "ApiLogs");

            migrationBuilder.DropColumn(
                name: "Message",
                table: "ApiLogs");

            migrationBuilder.DropColumn(
                name: "MessageTemplate",
                table: "ApiLogs");

            migrationBuilder.RenameColumn(
                name: "Properties",
                table: "ApiLogs",
                newName: "EnvironmentName");

            migrationBuilder.AlterColumn<DateTime>(
                name: "TimeStamp",
                table: "ApiLogs",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTimeOffset),
                oldType: "datetimeoffset");

            migrationBuilder.AlterColumn<int>(
                name: "StatusCode",
                table: "ApiLogs",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Duration",
                table: "ApiLogs",
                type: "float",
                nullable: false,
                defaultValue: 0.0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duration",
                table: "ApiLogs");

            migrationBuilder.RenameColumn(
                name: "EnvironmentName",
                table: "ApiLogs",
                newName: "Properties");

            migrationBuilder.AlterColumn<DateTimeOffset>(
                name: "TimeStamp",
                table: "ApiLogs",
                type: "datetimeoffset",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<int>(
                name: "StatusCode",
                table: "ApiLogs",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<string>(
                name: "Exception",
                table: "ApiLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Level",
                table: "ApiLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Message",
                table: "ApiLogs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MessageTemplate",
                table: "ApiLogs",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
