using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClientAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToClient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "Clients",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DateInscription", "UserId" },
                values: new object[] { new DateTime(2025, 12, 30, 1, 25, 50, 124, DateTimeKind.Local).AddTicks(5117), null });

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DateInscription", "UserId" },
                values: new object[] { new DateTime(2025, 12, 30, 1, 25, 50, 124, DateTimeKind.Local).AddTicks(5196), null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Clients");

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 1,
                column: "DateInscription",
                value: new DateTime(2025, 12, 24, 12, 36, 52, 782, DateTimeKind.Local).AddTicks(5050));

            migrationBuilder.UpdateData(
                table: "Clients",
                keyColumn: "Id",
                keyValue: 2,
                column: "DateInscription",
                value: new DateTime(2025, 12, 24, 12, 36, 52, 782, DateTimeKind.Local).AddTicks(5104));
        }
    }
}
