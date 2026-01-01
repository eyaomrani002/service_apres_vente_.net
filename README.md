# Service Apres Vente (.NET)

## Tableau des microservices et roles utilisateurs

### Legende
- `[OK]` : fonctionnalite disponible
- `[WIP]` : partiellement implemente
- `[NO]` : non implemente

### Roles
- **Client** : utilisateur final qui ouvre des reclamations
- **Technicien** : intervenant terrain ou atelier
- **Responsable SAV** : pilote les reclamations et interventions
- **Admin** : administration fonctionnelle et technique

---

## 1. AuthAPI — Authentification et utilisateurs
- **Port** : 7011
- **Description** : Service central JWT et gestion des comptes

| Fonctionnalite | Description | Client | Technicien | Responsable SAV | Admin |
| --- | --- | --- | --- | --- | --- |
| Inscription | Creation de compte client | [OK] Cree compte | [NO] | [NO] | [NO] |
| Connexion | Authentification JWT | [OK] Se connecte | [OK] Se connecte | [OK] Se connecte | [OK] Se connecte |
| Refresh token | Renouvellement token | [OK] Utilise | [OK] Utilise | [OK] Utilise | [OK] Utilise |
| Profil utilisateur | Gestion profil | [OK] Modifie profil | [OK] Modifie profil | [OK] Modifie profil | [OK] Modifie profil |
| Changement mot de passe | Mise a jour mot de passe | [OK] Change mdp | [OK] Change mdp | [OK] Change mdp | [OK] Change mdp |
| Gestion roles | Attribution roles | [NO] | [NO] | [NO] | [OK] Attribue roles |
| Liste utilisateurs | Vue globale | [NO] | [NO] | [WIP] Vue limitee | [OK] Gere tous |
| Activation / desactivation | Gestion comptes | [NO] | [NO] | [OK] Desactive clients | [OK] Gere tous comptes |
| Synchronisation client | Creation auto profil | [OK] Auto cree | [NO] | [NO] | [NO] |

#### Structure des fichiers
- `Program.cs` : configure ASP.NET Core, Identity, EF Core, Swagger et les politiques JWT exposées à tout le service.
- `Controllers/AuthController.cs` : couche HTTP principale (inscription, login, refresh, gestion du profil, rôles) ; `Controllers/WeatherForecastController.cs` reste le stub du template.
- `Services/IAuthService.cs` & `AuthService.cs` : logique métier d'authentification (vérification des credentials, projection d'`AuthModel`).
- `Services/IRefreshTokenService.cs` & `RefreshTokenService.cs` : création/rotation des refresh tokens persistés ; `RoleInitializer.cs` seed les rôles Admin/Responsable.
- `Helpers/JWT.cs` : fabrique et signe les JWT (claims, expirations, clés de configuration).
- `Models/ApplicationDbContext.cs` : contexte EF Core pour Identity + LoginAudit ; `ApplicationUser.cs` étend `IdentityUser` avec les propriétés SAV.
- `Models/RegisterModel.cs`, `LoginAudit.cs`, `UserLoginAttempt.cs`, etc. : DTOs d'entrée/sortie et entités spécialisées (audit connexion, tentatives, tokens).
- `Migrations/` : scripts générés par EF pour créer le schéma Auth (tables AspNet*, audits, tokens).
- `appsettings.json` + `.Development.json` : chaîne SQL Server, paramètres JWT (issuer, audience, key) et politiques e-mail.
- `AuthAPI.csproj` : référence les packages Identity, EF, Swashbuckle.
- `AuthAPI.http` : collection de requêtes REST client pour tester chaque endpoint.
- `Properties/launchSettings.json` : profils http/https alignés avec Ocelot.
- `WeatherForecast.cs` : ressource d'exemple conservée pour tests rapides.

---

## 2. ArticleAPI — Gestion des articles sanitaires / chauffage
- **Port** : 7174
- **Description** : Catalogue produits et statut garantie

| Fonctionnalite | Description | Client | Technicien | Responsable SAV | Admin |
| --- | --- | --- | --- | --- | --- |
| Consultation catalogue | Liste des articles | [OK] Consulte | [OK] Consulte | [OK] Consulte | [OK] Consulte |
| Recherche articles | Recherche par reference | [OK] Recherche | [OK] Recherche | [OK] Recherche | [OK] Recherche |
| Detail article | Fiche produit complete | [OK] Voir details | [OK] Voir details | [OK] Voir details | [OK] Voir details |
| Verification garantie | Statut garantie | [OK] Verifie | [OK] Verifie pour intervention | [OK] Verifie pour decision | [OK] Verifie |
| Ajout article | Nouveau produit | [NO] | [NO] | [OK] Ajoute produits | [OK] Ajoute produits |
| Modification article | Mise a jour fiche | [NO] | [NO] | [OK] Modifie produits | [OK] Modifie produits |
| Suppression article | Retrait catalogue | [NO] | [NO] | [OK] Supprime produits | [OK] Supprime produits |
| Upload image | Photo produit | [NO] | [NO] | [OK] Upload images | [OK] Upload images |
| Statistiques stocks | Analyse inventaire | [NO] | [OK] Voit disponibilite | [OK] Gere stocks | [OK] Analyse complete |

#### Structure des fichiers
- `Program.cs` : câble controllers, Swagger, `ArticleAPIContext`, `IHttpClientFactory` et l'exposition de `wwwroot` pour les uploads.
- `Controllers/ArticlesController.cs` : gère toute la surface REST (CRUD, recherches avancées, upload d'images, stats, notifications via Gateway) ; `Controllers/WeatherForecastController.cs` reste l'exemple du template.
- `Data/ArticleAPIContext.cs` : DbContext EF Core (DbSet<Article>, contraintes, index unique sur `Reference`, données seed).
- `Models/Article.cs` : entité complète avec validations, calcul de garantie et métadonnées SAV (lieu, type d'installation, stock, `FinGarantie`).
- `Models/Repositories/IArticleRepository.cs` : contrat des requêtes (CRUD, filtres, stats) ; `Models/Repositories/ArticleRepository.cs` : implémentation EF (AdvancedSearch, CountByType, ReferenceExists...).
- `Migrations/` : scripts EF générés pour suivre l'évolution du catalogue (columns, seed updates).
- `wwwroot/uploads/articles/` : stockage des images importées, servi directement par Kestrel.
- `appsettings.json` & `.Development.json` : chaîne SQL Server / LocalDB, limites d'upload et autres options métier.
- `ArticleAPI.csproj` : référence EF Core, Swashbuckle, packages I/O nécessaires aux uploads.
- `ArticleAPI.http` : scénario REST Client couvrant GET/POST/PUT/DELETE.
- `Properties/launchSettings.json` : profils http/https (doit rester aligné avec le port 7174 défini dans Ocelot).
- `WeatherForecast.cs` : stub généré conservé pour exemples.

---

## 3. ClientAPI — Gestion clients et reclamations
- **Port** : 7025
- **Description** : Service principal clients, profils et reclamations

| Fonctionnalite | Description | Client | Technicien | Responsable SAV | Admin |
| --- | --- | --- | --- | --- | --- |
| Creation compte client | Profil client | [OK] Cree profil | [NO] | [OK] Cree pour client | [OK] Cree pour client |
| Modification profil | Mise a jour infos | [OK] Modifie profil | [NO] | [OK] Modifie client | [OK] Modifie client |
| Creation reclamation | Nouvelle reclamation | [OK] Cree reclamation | [NO] | [OK] Cree pour client | [OK] Cree pour client |
| Suivi reclamation | Etat reclamation | [OK] Suit son etat | [OK] Voit interventions | [OK] Suit tous etats | [OK] Suit tous |
| Upload photos | Photos probleme | [OK] Upload photos | [OK] Upload preuve | [OK] Consulte photos | [OK] Consulte photos |
| Ajout pieces necessaires | Liste pieces | [NO] | [OK] Ajoute pieces | [OK] Valide liste | [OK] Consulte |
| Recherche reclamations | Filtrage avance | [OK] Ses reclamations | [OK] Par technicien | [OK] Tous criteres | [OK] Tous criteres |
| Dashboard reclamations | Statistiques | [OK] Ses stats | [OK] Ses interventions | [OK] Tableau complet | [OK] Analytics complet |
| Creation commande | Achat pieces | [OK] Commande pieces | [OK] Commande pour reparation | [OK] Valide commandes | [OK] Consulte |
| Assignation technicien | Attribution intervention | [NO] | [NO] | [OK] Assigne technicien | [OK] Assigne technicien |
| Changement statut | Mise a jour etats | [NO] | [OK] Met a jour "En cours" | [OK] Change tous statuts | [OK] Change tous statuts |

#### Structure des fichiers
- `Program.cs` : registre `ClientAPIContext`, repositories, AutoMapper (si présent) et CORS pour le front SAV.
- `Controllers/ClientsController.cs` : CRUD profils + recherche avancée ; `CommandesController.cs` : création/suivi commandes et lignes ; `ReclamationsController.cs` : cycle de vie des réclamations ; `WeatherForecastController.cs` est le stub d'origine.
- `Data/ClientAPIContext.cs` : DbContext EF (DbSet<Client>, Reclamation, Commande, CommandeLigne) + configuration de seed éventuelle.
- `Models/Client.cs`, `Reclamation.cs`, `Commande.cs`, `CommandeLigne.cs` : entités métier avec validations ; `Models/Repositories/*.cs` : couples interface/implémentation pour chaque agrégat (client, commande, réclamation).
- `Migrations/` : scripts EF alignés sur l’évolution des schémas Client/reclamation/commande.
- `appsettings.json` & `.Development.json` : chaînes SQL, tailles max d’upload photo, paramètres de notifications.
- `ClientAPI.csproj` : référence EF Core, Swashbuckle, éventuellement FluentValidation.
- `ClientAPI.http` : requêtes exemples pour tester clients, commandes et réclamations depuis VS Code.
- `Properties/launchSettings.json` : profils http/https (port 7025 requis par Ocelot).
- `WeatherForecast.cs` : fichier exemple généré par le template.

---

## 4. InterventionAPI — Interventions techniques et facturation
- **Port** : 7228
- **Description** : Gestion interventions sur site et facturation

| Fonctionnalite | Description | Client | Technicien | Responsable SAV | Admin |
| --- | --- | --- | --- | --- | --- |
| Creation intervention | Planification reparation | [NO] | [OK] Cree apres assignation | [OK] Cree manuellement | [OK] Cree manuellement |
| Verification garantie | Calcul gratuite | [OK] Verifie | [OK] Verifie avant intervention | [OK] Consulte statut | [OK] Consulte statut |
| Calcul couts | Estimation reparation | [OK] Voit estimation | [OK] Calcule couts reels | [OK] Valide estimation | [OK] Consulte |
| Suivi intervention | Etat avancement | [OK] Suit progression | [OK] Met a jour etats | [OK] Surveille tous | [OK] Surveille tous |
| Saisie solution | Description reparation | [NO] | [OK] Decrit solution | [OK] Consulte solution | [OK] Consulte solution |
| Gestion factures | Creation factures | [OK] Consulte factures | [NO] | [OK] Genere factures | [OK] Genere factures |
| Paiement factures | Reglement | [OK] Paie en ligne | [NO] | [OK] Enregistre paiement | [OK] Enregistre paiement |
| Statut facturation | Suivi paiements | [OK] Suit paiements | [NO] | [OK] Suit tous paiements | [OK] Suit tous paiements |
| Interventions en retard | Alertes | [OK] Est notifie | [OK] Voit ses retards | [OK] Gere retards | [OK] Analyse causes |
| Rapports techniques | Documentation | [OK] Consulte rapport | [OK] Redige rapport | [OK] Valide rapport | [OK] Archive rapport |
| Statistiques financieres | Analyse revenus | [NO] | [OK] Ses performances | [OK] Chiffre d'affaires | [OK] Analytics financier |

#### Structure des fichiers
- `Program.cs` : enregistre `InterventionAPIContext`, repositories, HttpClient pour parler au reste du SI, configuration CORS/Swagger.
- `Controllers/InterventionsController.cs` : planification, suivi, facturation, rapports ; `TechniciensController.cs` : gestion des techniciens et affectations ; `WeatherForecastController.cs` : stub initial.
- `Data/InterventionAPIContext.cs` : DbContext EF (DbSet<Intervention>, Facture, Technicien) + seeds.
- `Models/Intervention.cs`, `Facture.cs`, `Technicien.cs` : entités principales ; `Models/DTOs/InterventionDTO.cs` & `ExternalDTOs.cs` : charges de transfert vers/depuis d'autres microservices.
- `Models/Repositories/IInterventionRepository.cs` + `InterventionRepository.cs` : accès données, calculs de coûts, filtres (retards, garanties).
- `Migrations/` : scripts EF pour créer les tables d'interventions/factures/techniciens.
- `appsettings.json` & `.Development.json` : connexions SQL, paramètres financiers (TVA, délais, pénalités) ou URLs externes.
- `InterventionAPI.csproj` : références EF Core, Swashbuckle et packages additionnels (par ex. AutoMapper s'il est ajouté).
- `InterventionAPI.http` : requêtes REST Client (création intervention, maj statut, facturation).
- `Properties/launchSettings.json` : profils http/https (port 7228 attendu par Ocelot).
- `WeatherForecast.cs` : placeholder dotnet standard.

---

## 5. CalendarAPI — Planification des interventions
- **Port** : 7212
- **Description** : Calendrier des rendez-vous et gestion des agendas

| Fonctionnalite | Description | Client | Technicien | Responsable SAV | Admin |
| --- | --- | --- | --- | --- | --- |
| Planification RDV | Creation rendez-vous | [OK] Propose creneaux | [OK] Consulte agenda | [OK] Planifie interventions | [OK] Planifie interventions |
| Visualisation calendrier | Vue agenda | [OK] Ses RDV | [OK] Son agenda complet | [OK] Tous agendas | [OK] Tous agendas |
| Verification disponibilite | Creneaux libres | [OK] Voit dispos | [OK] Voit ses dispos | [OK] Voit dispos techniciens | [OK] Voit toutes dispos |
| Modification RDV | Reorganisation | [OK] Modifie RDV | [OK] Modifie ses RDV | [OK] Reorganise tous RDV | [OK] Reorganise tous RDV |
| Annulation RDV | Suppression | [OK] Annule RDV | [OK] Annule ses RDV | [OK] Annule tous RDV | [OK] Annule tous RDV |
| Notifications RDV | Rappels | [OK] Recoit rappels | [OK] Recoit rappels | [OK] Recoit rappels | [OK] Recoit rappels |
| Conflits d'agenda | Detection chevauchements | [NO] | [OK] Voit conflits | [OK] Resout conflits | [OK] Resout conflits |

#### Structure des fichiers
- `Program.cs` : bootstrap calendrier (DbContext, services métier, Swagger, CORS, hosted services éventuels).
- `Controllers/CalendarController.cs` : expose création/modif/annulation de rendez-vous et recherche disponibilité ; `WeatherForecastController.cs` : stub template.
- `Data/CalendarAPIContext.cs` : DbContext EF pour `Appointment` et autres entités planifiées.
- `Models/Appointment.cs` & `ScheduleRequest.cs` : représentation des rendez-vous et payloads d'API ; `Models/Repositories/IAppointmentRepository.cs` & `AppointmentRepository.cs` : accès aux données planifiées.
- `Services/ICalendarService.cs` & `InMemoryCalendarService.cs` : logique de résolution des conflits, règles métiers d'agenda, notifications internes.
- `Migrations/` : scripts EF pour construire la base calendrier.
- `appsettings.json` + `.Development.json` : connexions SQL et paramètres d'horaires par défaut.
- `CalendarAPI.csproj` : références EF Core, Swashbuckle, packages éventuels de scheduling.
- `CalendarAPI.http` : scénarios REST Client couvrant création de RDV, recherche de slots et annulations.
- `Properties/launchSettings.json` : profils http/https (port 7212 coté gateway).
- `WeatherForecast.cs` : exemple généré.

---

## 6. NotificationAPI — Systeme de notifications
- **Port** : 7163
- **Description** : Emails, SMS et push SAV

| Fonctionnalite | Description | Client | Technicien | Responsable SAV | Admin |
| --- | --- | --- | --- | --- | --- |
| Notifications reclamation | Mise a jour statut | [OK] Recoit mises a jour | [OK] Recoit assignations | [OK] Recoit alertes | [OK] Recoit alertes |
| Notifications RDV | Rappels rendez-vous | [OK] Recoit rappels | [OK] Recoit rappels | [OK] Recoit rappels | [OK] Recoit rappels |
| Notifications facturation | Alertes paiement | [OK] Recoit factures | [NO] | [OK] Recoit paiements | [OK] Recoit paiements |
| SMS urgents | Communications rapides | [OK] Recoit SMS | [OK] Recoit SMS urgents | [OK] Envoie SMS | [OK] Envoie SMS |
| Preferences notifications | Configuration | [OK] Configure prefs | [OK] Configure prefs | [OK] Configure prefs | [OK] Configure prefs |
| Historique notifications | Consultation historique | [OK] Son historique | [OK] Son historique | [OK] Tous historiques | [OK] Tous historiques |

#### Structure des fichiers
- `Program.cs` : configure DbContext notification, services d'envoi (email/SMS), CORS, Swagger et options queue.
- `Controllers/NotificationsController.cs` : endpoints REST (envoi, historique, préférences) ; `WeatherForecastController.cs` : stub.
- `Data/NotificationAPIContext.cs` : persistance EF Core de `Notification`, `NotificationMetrics`, préférences.
- `Models/Notification.cs`, `NotificationMetrics.cs`, `SendNotificationRequest.cs`, `SmsSettings.cs` : entités persistées + DTOs d'appel.
- `Models/Repositories/INotificationRepository.cs` & `NotificationRepository.cs` : gestion des historiques et métriques côté base.
- `Services/INotificationService.cs`, `NotificationService.cs`, `InMemoryNotificationService.cs` : orchestration d'envoi multi-canaux ; `ISmsSender.cs`, `TwilioSmsSender.cs`, `SmsResult.cs` : abstractions/délégations SMS.
- `Migrations/` : scripts EF pour la base notifications.
- `appsettings.json` & `.Development.json` : chaînes SQL + secrets SMTP/SMS (Twilio, SendGrid...).
- `NotificationAPI.csproj` : référence MailKit/Twilio/EF/Swagger.
- `NotificationAPI.http` : requêtes de test (send, list, stats) pour REST Client.
- `Properties/launchSettings.json` : profils http/https (port 7163 via gateway).
- `WeatherForecast.cs` : stub par défaut.

---

## 7. ReportingAPI — Generation de rapports
- **Port** : 7091
- **Description** : Service de reporting et analytics SAV

| Fonctionnalite | Description | Client | Technicien | Responsable SAV | Admin |
| --- | --- | --- | --- | --- | --- |
| Rapport reclamations | Statistiques reclamations | [OK] Ses rapports | [OK] Ses interventions | [OK] Rapports complets | [OK] Rapports complets |
| Rapport financier | Analyse revenus | [OK] Ses factures | [NO] | [OK] CA par periode | [OK] Analytics financiers |
| Rapport performance | Performance techniciens | [NO] | [OK] Sa performance | [OK] Performance equipe | [OK] Performance globale |
| Rapport satisfaction | Feedback clients | [OK] Donne feedback | [OK] Voit feedback | [OK] Analyse satisfaction | [OK] Analyse satisfaction |
| Export donnees | Export multi formats | [OK] Export ses donnees | [OK] Export ses donnees | [OK] Export toutes donnees | [OK] Export toutes donnees |
| Dashboard temps reel | Tableaux de bord | [NO] | [NO] | [OK] Dashboard SAV | [OK] Dashboard admin |

#### Structure des fichiers
- `Program.cs` : enregistre `ReportingAPIContext`, repositories, `IHttpClientFactory`, CORS et Swagger.
- `Controllers/ReportsController.cs` : expose tous les endpoints (recent, client, technicien, financial, export, PDF) en s'appuyant sur le repository et les clients externes.
- `Data/ReportingAPIContext.cs` : DbContext EF pour `Report` (+ ensure created au démarrage).
- `Models/Report.cs`, `ReportRequest.cs`, `ReportResponse.cs`, `DTOs/ReportDto.cs` : entités persistées + formes de transfert.
- `Models/Repositories/IReportRepository.cs` & `ReportRepository.cs` : encapsulent les requêtes EF (GetRecent, FindByClient, ExportAll...).
- `Services/IReportingService.cs` & `DummyReportingService.cs` : couche métier optionnelle pour agréger plusieurs sources.
- `Migrations/` : scripts EF pour la base reporting.
- `appsettings.json` & `.Development.json` : chaînes SQL/LocalDB et paramètres du module reporting.
- `ReportingAPI.csproj` : référence iTextSharp (PDF), EF Core, HttpClient.
- `ReportingAPI.http` : collection REST Client (GET/POST, export, PDF) pour debug.
- `Properties/launchSettings.json` : profils http/https (port 7091).
- `WeatherForecast.cs` : fichier exemple.

---

## 8. API Gateway — Point d'entree unique (Ocelot)
- **Port** : 7076
- **Description** : Router, securisation et observations cross services

| Fonctionnalite | Description | Tous utilisateurs |
| --- | --- | --- |
| Routage requests | Redirection vers le bon service | [OK] Transparent |
| Authentification centralisee | Validation JWT | [OK] Authentifie une fois |
| Rate limiting | Protection surcharge | [OK] Limite selon role |
| Logging centralise | Traces des requetes | [OK] Logs pour audit |
| CORS management | Gestion origines | [OK] Acces controle |
| Load balancing | Distribution charge | [OK] Performance optimisee |

#### Structure des fichiers
- `Program.cs` : démarre Ocelot, ajoute Serilog (si configuré), CORS global et délègue toutes les requêtes entrantes vers les downstreams.
- `Ocelot.json` : cartographie exhaustive upstream (`/apigateway/*`) -> downstream (ports 7011, 7174, etc.), règles d'authentification, timeouts, QoS.
- `Controllers/WeatherForecastController.cs` : stub (peut servir de health-check interne si nécessaire).
- `appsettings.json` & `.Development.json` : config additionnelle (logging, CORS, instrumentation) pour le gateway.
- `GatewayAPI.csproj` : référence Ocelot, Polly, Swashbuckle/Serilog.
- `GatewayAPI.http` : requêtes exemple qui passent par le routeur (utile pour reproduire un flow complet depuis VS Code).
- `Properties/launchSettings.json` : profils http/https (port 7076 devant rester aligné avec le front).
- `WeatherForecast.cs` : stub template.

---

## Annexe : roles des fichiers standards backend
- `bin/` / `obj/` : sorties de compilation et intermediaires MSBuild (ne pas versionner).
- `Properties/` : contient `launchSettings.json` pour definir ports/profils.
- `*.csproj` : decrit SDK, frameworks cibles et dependances NuGet.
- `*.http` : fichiers VS Code/REST Client pour declencher des appels API.
- `appsettings.json` : configuration par defaut (connexion, options metier) ; `appsettings.Development.json` surcharge locale.
- `WeatherForecast.cs` : exemple genere par `dotnet new`, utile pour tests rapides.

## Recap flux utilisateurs

### Client
1. S'inscrit et se connecte via AuthAPI.
2. Consulte le catalogue via ArticleAPI.
3. Cree une reclamation dans ClientAPI avec photos.
4. Recoit des notifications depuis NotificationAPI.
5. Planifie ses RDV via CalendarAPI.
6. Suit la progression et les couts dans InterventionAPI.
7. Paie les factures hors garantie.
8. Donne son feedback dans ReportingAPI.

### Technicien
1. Se connecte via AuthAPI.
2. Consulte les interventions assignees dans InterventionAPI.
3. Verifie la garantie via ArticleAPI.
4. Pilote son agenda via CalendarAPI.
5. Documente la reparation dans InterventionAPI.
6. Commande les pieces via ClientAPI.
7. Redige le rapport technique et met a jour les statuts.

### Responsable SAV
1. Gere les reclamations dans ClientAPI.
2. Assigne les techniciens et planifie via CalendarAPI.
3. Valide les estimations et factures dans InterventionAPI.
4. Surveille les performances via ReportingAPI.
5. Coordonne les ressources et notifications.

### Admin
1. Gere les comptes et roles via AuthAPI.
2. Supervise les services et donnees.
3. Configure les politiques globales (gateway, CORS, rate limiting).
4. Analyse les performances globales et exporte les donnees completes.

---

## Flux d'interactions entre services
```
Client -> AuthAPI (login) -> JWT Token
Client -> ClientAPI (creer reclamation) -> NotificationAPI (alerte SAV)
Responsable SAV -> ClientAPI (assigner technicien) -> CalendarAPI (planifier RDV)
Technicien -> InterventionAPI (verifier garantie) -> ArticleAPI (statut garantie)
Si hors garantie -> InterventionAPI (calcul couts) -> Facturation
Intervention terminee -> ReportingAPI (generer rapport) -> NotificationAPI (notifier client)
```

Ce README peut etre reference directement dans Git afin de partager l'etat fonctionnel des microservices SAV.
