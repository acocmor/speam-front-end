using DemoSpeam.API;
using DemoSpeam.API.Services;
using Microsoft.AspNetCore.Cors.Infrastructure;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "DemoSpeam", Version = "v1" });
});

// ********************
// Setup CORS
// ********************
var corsBuilder = new CorsPolicyBuilder();
corsBuilder.AllowAnyHeader();
corsBuilder.AllowAnyMethod();
corsBuilder.AllowAnyOrigin(); // For anyone access.
corsBuilder.WithOrigins(builder.Configuration.GetSection("CorsOrigins").Value.Split(','));
corsBuilder.AllowCredentials();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SiteCorsPolicy", corsBuilder.Build());
});


// Setup Service injection
builder.Services.AddScoped<ModelService>();
builder.Services.AddScoped<OAuthService>();
builder.Services.AddScoped<OSSService>();
builder.Services.Configure<ForgeSetting>(builder.Configuration.GetSection("Forge"));


var app = builder.Build();

// Configure the HTTP request pipeline.
// if (app.Environment.IsDevelopment())
// {
//     app.UseSwagger();
//     app.UseSwaggerUI();
// }

app.UseDeveloperExceptionPage();
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "DemoSpeam v1"));

app.UseCors("SiteCorsPolicy");
            
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseRouting();

app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
});

app.Run();