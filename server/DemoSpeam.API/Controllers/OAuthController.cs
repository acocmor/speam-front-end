using DemoSpeam.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DemoSpeam.API.Controllers;

[ApiController]
public class OAuthController : ControllerBase
{
    private OAuthService _oAuthService;
    public OAuthController(OAuthService oAuthService)
    {
        _oAuthService = oAuthService;
    }

    /// <summary>
    /// Get access token with public (viewables:read) scope
    /// </summary>
    [HttpGet]
    [Route("api/forge/oauth/token")]
    public async Task<dynamic> GetPublicAsync()
    {
        return await _oAuthService.GetPublicAsync();
    }

}