# HARMONY AT - DEMO
<br/>
This is a solution Speam project demo.

## Technologies
* [ASP.NET Core 6](https://docs.microsoft.com/en-us/aspnet/core/introduction-to-aspnet-core?view=aspnetcore-6.0)
* [Autodesk Forge API](https://forge.autodesk.com/)

## Getting Started
1. Install the latest [.NET 6 SDK](https://dotnet.microsoft.com/download/dotnet/6.0)
2. Navigate to project directory
3. Open terminal and Start project using `dotnet run`
4. Now app listening on: http://localhost:5000. Swagger API: http://localhost:5000/swagger/index.html

### Forge Configuration
You will need register Forge Account <a href="https://forge.autodesk.com/">HERE.</a>
And you will need to update **DemoSpeam/appsettings.json** as follows:
```json
    ...
    "Forge": {
        "ClientId": "",
        "ClientSecret": "",
        "CallbackUrl": "",
        "Region": ""
    }
    ...
```

`ClientId`: Client Id on Forge App

`ClientSecret`: Client Secret on Forge App

`CallbackUrl`: Callback oauth url your website coincides with on the Forge App. E.g: `http://localhost:5000/api/forge/callback/oauth`

`Region`: `US` or `EMEA`

### Origin CORS Configuration
And you will need to update **DemoSpeam/appsettings.json** as follows:
```json
    ...
    "CorsOrigins": "",
    ...
```

## Copyright
Copyright (c) 2022, Speam