using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using AuthAPI.Models;

namespace AuthAPI.Services
{
    public class RoleInitializer
    {
        public static async Task InitializeAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<RoleInitializer>>();

            try
            {
                logger.LogInformation("Début de l'initialisation des rôles...");

                // Rôles SPÉCIFIQUES pour votre application SAV
                string[] roleNames = {
                    "Client",           // Rôle pour les clients
                    "ResponsableSAV",   // Rôle pour les responsables SAV
                    "Admin"             // Rôle admin
                };

                // Création des rôles
                foreach (var roleName in roleNames)
                {
                    if (!await roleManager.RoleExistsAsync(roleName))
                    {
                        await roleManager.CreateAsync(new IdentityRole(roleName));
                        logger.LogInformation($"✅ Rôle '{roleName}' créé avec succès.");
                    }
                    else
                    {
                        logger.LogInformation($"ℹ️ Rôle '{roleName}' existe déjà.");
                    }
                }

                // Créer un responsable SAV par défaut
                await CreateUserIfNotExists(
                    userManager,
                    "responsable",
                    "responsable@sav.com",
                    "Responsable",
                    "SAV",
                    "Responsable@123",
                    "ResponsableSAV",
                    logger
                );

                // Créer un client par défaut
                await CreateUserIfNotExists(
                    userManager,
                    "aya",
                    "aya@gmail.com",
                    "Aya",
                    "Omrani",
                    "Aya@123",
                    "Client",
                    logger
                );

                // Créer un administrateur
                await CreateUserIfNotExists(
                    userManager,
                    "admin",
                    "admin@sav.com",
                    "Admin",
                    "System",
                    "Admin@123",
                    "Admin",
                    logger
                );

                logger.LogInformation("✅ Initialisation des rôles terminée avec succès.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Une erreur est survenue lors de l'initialisation des rôles.");
                throw;
            }
        }

        private static async Task CreateUserIfNotExists(
            UserManager<ApplicationUser> userManager,
            string username,
            string email,
            string firstName,
            string lastName,
            string password,
            string role,
            ILogger logger)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    UserName = username,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    EmailConfirmed = true
                };

                var createResult = await userManager.CreateAsync(user, password);

                if (createResult.Succeeded)
                {
                    logger.LogInformation($"✅ Utilisateur '{email}' créé avec succès.");

                    if (!await userManager.IsInRoleAsync(user, role))
                    {
                        var addRoleResult = await userManager.AddToRoleAsync(user, role);
                        if (addRoleResult.Succeeded)
                        {
                            logger.LogInformation($"✅ Rôle '{role}' attribué à l'utilisateur '{email}'.");
                        }
                        else
                        {
                            logger.LogError($"❌ Erreur lors de l'ajout du rôle {role} à l'utilisateur {email}.");
                        }
                    }
                }
                else
                {
                    var errors = string.Join(", ", createResult.Errors.Select(e => e.Description));
                    logger.LogError($"❌ Erreur lors de la création de l'utilisateur {email}: {errors}");
                }
            }
            else
            {
                logger.LogInformation($"ℹ️ L'utilisateur '{email}' existe déjà.");

                // Vérifier et ajouter le rôle si nécessaire
                if (!await userManager.IsInRoleAsync(user, role))
                {
                    var addRoleResult = await userManager.AddToRoleAsync(user, role);
                    if (addRoleResult.Succeeded)
                    {
                        logger.LogInformation($"✅ Rôle '{role}' ajouté à l'utilisateur existant '{email}'.");
                    }
                }
            }
        }
    }
}