using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ArticleAPI.Migrations
{
    /// <inheritdoc />
    public partial class initialCreat : Migration
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
                    ImageUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    NumeroSerie = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    DateInstallation = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LieuInstallation = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    TypeInstallation = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    EstEnStock = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Articles",
                columns: new[] { "Id", "DateAchat", "DateInstallation", "Description", "DureeGarantieMois", "EstEnStock", "ImageUrl", "LieuInstallation", "Nom", "NumeroSerie", "PrixAchat", "Reference", "Type", "TypeInstallation" },
                values: new object[,]
                {
                    { 1, new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Robinet thermostatique pour salle de bain", 24, true, null, null, "Robinet thermostatique", null, 89.99m, "SAN-001", "Sanitaire", null },
                    { 2, new DateTime(2023, 11, 20, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Radiateur en aluminium 1500W", 36, true, null, null, "Radiateur à eau chaude", null, 249.99m, "CHAU-001", "Chauffage", null },
                    { 3, new DateTime(2022, 6, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "WC suspendu avec réservoir encastré", 24, false, null, null, "WC suspendu", null, 459.99m, "SAN-002", "Sanitaire", null }
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
