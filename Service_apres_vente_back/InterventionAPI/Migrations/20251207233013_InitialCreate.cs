using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace InterventionAPI.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Interventions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReclamationId = table.Column<int>(type: "int", nullable: false),
                    TechnicienId = table.Column<int>(type: "int", nullable: false),
                    TechnicienNom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    DateIntervention = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    Statut = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "Planifiée"),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Observations = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    SolutionApportee = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CoutPieces = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    CoutMainOeuvre = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    EstGratuite = table.Column<bool>(type: "bit", nullable: false),
                    DateFin = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Interventions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Factures",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    InterventionId = table.Column<int>(type: "int", nullable: false),
                    NumeroFacture = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    DateFacture = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    ClientNom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ClientAdresse = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ClientEmail = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    MontantHT = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    TVA = table.Column<decimal>(type: "decimal(5,4)", nullable: false),
                    Statut = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "En attente"),
                    DatePaiement = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ModePaiement = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    DescriptionServices = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Factures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Factures_Interventions_InterventionId",
                        column: x => x.InterventionId,
                        principalTable: "Interventions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Interventions",
                columns: new[] { "Id", "CoutMainOeuvre", "CoutPieces", "DateFin", "DateIntervention", "Description", "EstGratuite", "Observations", "ReclamationId", "SolutionApportee", "Statut", "TechnicienId", "TechnicienNom" },
                values: new object[,]
                {
                    { 1, 45.00m, 15.50m, new DateTime(2024, 1, 20, 15, 30, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 20, 14, 0, 0, 0, DateTimeKind.Unspecified), "Intervention pour réparer un robinet qui fuit", false, "Joint usé à remplacer", 1, "Remplacement du joint défectueux", "Terminée", 101, "Jean Dupont" },
                    { 2, null, null, null, new DateTime(2024, 2, 10, 10, 0, 0, 0, DateTimeKind.Unspecified), "Diagnostic du radiateur", true, "", 2, "", "Planifiée", 102, "Marie Martin" }
                });

            migrationBuilder.InsertData(
                table: "Factures",
                columns: new[] { "Id", "ClientAdresse", "ClientEmail", "ClientNom", "DateFacture", "DatePaiement", "DescriptionServices", "InterventionId", "ModePaiement", "MontantHT", "NumeroFacture", "Statut", "TVA" },
                values: new object[] { 1, "Tunis, Tunisie", "mohamed@example.com", "Mohamed Ben Ali", new DateTime(2024, 1, 21, 0, 0, 0, 0, DateTimeKind.Unspecified), new DateTime(2024, 1, 25, 0, 0, 0, 0, DateTimeKind.Unspecified), "Réparation robinet thermostatique - Remplacement joint", 1, "Virement", 60.50m, "FACT-2024-001", "Payée", 0.19m });

            migrationBuilder.CreateIndex(
                name: "IX_Factures_DateFacture",
                table: "Factures",
                column: "DateFacture");

            migrationBuilder.CreateIndex(
                name: "IX_Factures_InterventionId",
                table: "Factures",
                column: "InterventionId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Factures_NumeroFacture",
                table: "Factures",
                column: "NumeroFacture",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Factures_Statut",
                table: "Factures",
                column: "Statut");

            migrationBuilder.CreateIndex(
                name: "IX_Interventions_DateIntervention",
                table: "Interventions",
                column: "DateIntervention");

            migrationBuilder.CreateIndex(
                name: "IX_Interventions_EstGratuite",
                table: "Interventions",
                column: "EstGratuite");

            migrationBuilder.CreateIndex(
                name: "IX_Interventions_ReclamationId",
                table: "Interventions",
                column: "ReclamationId");

            migrationBuilder.CreateIndex(
                name: "IX_Interventions_Statut",
                table: "Interventions",
                column: "Statut");

            migrationBuilder.CreateIndex(
                name: "IX_Interventions_TechnicienId",
                table: "Interventions",
                column: "TechnicienId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Factures");

            migrationBuilder.DropTable(
                name: "Interventions");
        }
    }
}
