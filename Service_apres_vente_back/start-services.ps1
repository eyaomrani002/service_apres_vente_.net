# Lancement concurrent des microservices SAV
# Ajuster la liste si certains projets n'existent pas ou pour en ajouter

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$projects = @(
    "AuthAPI/AuthAPI.csproj",
    "ArticleAPI/ArticleAPI.csproj",
    "ClientAPI/ClientAPI.csproj",
    "InterventionAPI/InterventionAPI.csproj",
    "NotificationAPI/NotificationAPI.csproj",
    "CalendarAPI/CalendarAPI.csproj",
    "ReportingAPI/ReportingAPI.csproj",
    "GatewayAPI/GatewayAPI.csproj"
)

# Utiliser systématiquement le profil https pour aligner les ports avec Ocelot (ex: interventions sur 7228)
$launchProfile = "https"

function Start-Microservice {
    param(
        [string]$ProjectPath
    )
    $name = $ProjectPath
    Write-Host "Starting $name" -ForegroundColor Cyan
    Start-Job -Name $name -ScriptBlock {
        param($rootDir, $proj, $profile)
        Set-Location $rootDir
        dotnet run --launch-profile $profile --project $proj
    } -ArgumentList $root, $ProjectPath, $launchProfile | Out-Null
}

foreach ($p in $projects) {
    $full = Join-Path $root $p
    if (Test-Path $full) {
        Start-Microservice -ProjectPath $p
    }
    else {
        Write-Warning "Projet introuvable: $p (ignoré)"
    }
}

Write-Host "Jobs lancés. Liste des jobs actifs:" -ForegroundColor Green
Get-Job
Write-Host "Pour voir les logs d'un job: Receive-Job -Name 'GatewayAPI/GatewayAPI.csproj' -Keep" -ForegroundColor Yellow
Write-Host "Pour arrêter tous les jobs: Stop-Job *; Remove-Job *" -ForegroundColor Yellow
