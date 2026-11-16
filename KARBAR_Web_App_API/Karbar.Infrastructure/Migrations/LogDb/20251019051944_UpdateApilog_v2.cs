using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Karbar.Infrastructure.Migrations.LogDb
{
    /// <inheritdoc />
    public partial class UpdateApilog_v2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Duration",
                table: "ApiLogs");

            migrationBuilder.DropColumn(
                name: "EnvironmentName",
                table: "ApiLogs");

            migrationBuilder.RenameColumn(
                name: "UserName",
                table: "ApiLogs",
                newName: "QueryString");

            migrationBuilder.RenameColumn(
                name: "TimeStamp",
                table: "ApiLogs",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "RequestPath",
                table: "ApiLogs",
                newName: "Path");

            migrationBuilder.RenameColumn(
                name: "RequestMethod",
                table: "ApiLogs",
                newName: "HttpMethod");

            migrationBuilder.RenameColumn(
                name: "MachineName",
                table: "ApiLogs",
                newName: "ErrorMessage");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "QueryString",
                table: "ApiLogs",
                newName: "UserName");

            migrationBuilder.RenameColumn(
                name: "Path",
                table: "ApiLogs",
                newName: "RequestPath");

            migrationBuilder.RenameColumn(
                name: "HttpMethod",
                table: "ApiLogs",
                newName: "RequestMethod");

            migrationBuilder.RenameColumn(
                name: "ErrorMessage",
                table: "ApiLogs",
                newName: "MachineName");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "ApiLogs",
                newName: "TimeStamp");

            migrationBuilder.AddColumn<double>(
                name: "Duration",
                table: "ApiLogs",
                type: "float",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "EnvironmentName",
                table: "ApiLogs",
                type: "nvarchar(max)",
                nullable: true);
        }
    }
}
