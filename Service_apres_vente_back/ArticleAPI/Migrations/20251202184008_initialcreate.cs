using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ArticleAPI.Migrations
{
    /// <inheritdoc />
    public partial class initialcreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Type = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    DateAchat = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DureeGarantieMois = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PrixAchat = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    EstEnStock = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Articles",
                columns: new[] { "Id", "DateAchat", "Description", "DureeGarantieMois", "EstEnStock", "Nom", "PrixAchat", "Reference", "Type" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), "Robinet thermostatique pour salle de bain", 24, true, "Robinet thermostatique", 89.99m, "SAN-001", "Sanitaire" },
                    { 2, new DateTime(2023, 11, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), "Radiateur en aluminium 1500W", 36, true, "Radiateur à eau chaude", 249.99m, "CHAU-001", "Chauffage" },
                    { 3, new DateTime(2022, 6, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), "WC suspendu avec réservoir encastré", 24, false, "WC suspendu", 459.99m, "SAN-002", "Sanitaire" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Reference",
                table: "Articles",
                column: "Reference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Articles");
        }
    }
}
