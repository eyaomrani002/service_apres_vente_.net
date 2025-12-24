using Microsoft.EntityFrameworkCore;
using ArticleAPI.Data;
using ArticleAPI.Models.Repositories;

var builder = WebApplication.CreateBuilder(args);

// Ensure consistent web root when the working directory differs
var webRootCandidate = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
if (!Directory.Exists(webRootCandidate))
{
    webRootCandidate = Path.Combine(AppContext.BaseDirectory, "wwwroot");
}
builder.Environment.WebRootPath = webRootCandidate;

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register HttpClient factory for cross-service calls
builder.Services.AddHttpClient();

// Configure database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ArticleAPIContext>(options =>
    options.UseSqlServer(connectionString));

// Register repositories
builder.Services.AddScoped<IArticleRepository, ArticleRepository>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.AllowAnyOrigin()
                          .AllowAnyMethod()
                          .AllowAnyHeader());
});

var app = builder.Build();

// Configure pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowAll");
app.UseStaticFiles();
app.UseAuthorization();
app.MapControllers();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ArticleAPIContext>();
    dbContext.Database.EnsureCreated();
}

app.Run();