using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ClientAPI.Migrations
{
    /// <inheritdoc />
    public partial class initialCreat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Clients",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Telephone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Adresse = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DateInscription = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Clients", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Commandes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "En attente"),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Total = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Commandes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Commandes_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Reclamations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETDATE()"),
                    DateResolution = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Statut = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false, defaultValue: "En attente"),
                    ClientId = table.Column<int>(type: "int", nullable: false),
                    ArticleId = table.Column<int>(type: "int", nullable: false),
                    Priorite = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    TypeProbleme = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PhotosUrls = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Reclamations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Reclamations_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CommandeLignes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CommandeId = table.Column<int>(type: "int", nullable: false),
                    ArticleId = table.Column<int>(type: "int", nullable: false),
                    Quantite = table.Column<int>(type: "int", nullable: false),
                    PrixUnitaire = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MontantLigne = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CommandeLignes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CommandeLignes_Commandes_CommandeId",
                        column: x => x.CommandeId,
                        principalTable: "Commandes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ReclamationPiece",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Reference = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Quantite = table.Column<int>(type: "int", nullable: false),
                    Fournie = table.Column<bool>(type: "bit", nullable: false),
                    ReclamationId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReclamationPiece", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ReclamationPiece_Reclamations_ReclamationId",
                        column: x => x.ReclamationId,
                        principalTable: "Reclamations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Clients",
                columns: new[] { "Id", "Adresse", "DateInscription", "Email", "Nom", "Telephone" },
                values: new object[,]
                {
                    { 1, "Tunis, Tunisie", new DateTime(2025, 12, 24, 12, 36, 52, 782, DateTimeKind.Local).AddTicks(5050), "mohamed@example.com", "Mohamed Ben Ali", "12345678" },
                    { 2, "Sousse, Tunisie", new DateTime(2025, 12, 24, 12, 36, 52, 782, DateTimeKind.Local).AddTicks(5104), "fatma@example.com", "Fatma Ahmed", "87654321" }
                });

            migrationBuilder.InsertData(
                table: "Reclamations",
                columns: new[] { "Id", "ArticleId", "ClientId", "DateCreation", "DateResolution", "Description", "PhotosUrls", "Priorite", "Statut", "TypeProbleme" },
                values: new object[,]
                {
                    { 1, 1, 1, new DateTime(2024, 1, 10, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Robinet qui fuit dans la salle de bain", null, "Moyenne", "En cours", "Général" },
                    { 2, 2, 2, new DateTime(2024, 1, 15, 0, 0, 0, 0, DateTimeKind.Unspecified), null, "Radiateur ne chauffe pas correctement", null, "Moyenne", "En attente", "Général" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Clients_Email",
                table: "Clients",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CommandeLignes_ArticleId",
                table: "CommandeLignes",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_CommandeLignes_CommandeId",
                table: "CommandeLignes",
                column: "CommandeId");

            migrationBuilder.CreateIndex(
                name: "IX_Commandes_ClientId",
                table: "Commandes",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Commandes_DateCreation",
                table: "Commandes",
                column: "DateCreation");

            migrationBuilder.CreateIndex(
                name: "IX_ReclamationPiece_ReclamationId",
                table: "ReclamationPiece",
                column: "ReclamationId");

            migrationBuilder.CreateIndex(
                name: "IX_Reclamations_ClientId",
                table: "Reclamations",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Reclamations_DateCreation",
                table: "Reclamations",
                column: "DateCreation");

            migrationBuilder.CreateIndex(
                name: "IX_Reclamations_Statut",
                table: "Reclamations",
                column: "Statut");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CommandeLignes");

            migrationBuilder.DropTable(
                name: "ReclamationPiece");

            migrationBuilder.DropTable(
                name: "Commandes");

            migrationBuilder.DropTable(
                name: "Reclamations");

            migrationBuilder.DropTable(
                name: "Clients");
        }
    }
}
