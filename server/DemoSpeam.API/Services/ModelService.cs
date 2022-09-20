using Autodesk.Forge;
using Autodesk.Forge.Model;
using DemoSpeam.API.Models;
using Microsoft.AspNetCore.Mvc;

namespace DemoSpeam.API.Services;

public class ModelService
{
    private OAuthService _oAuthService;

    public ModelService(OAuthService oAuthService)
    {
        _oAuthService = oAuthService;
    }
        
    public async Task<dynamic> TranslateObject([FromBody]TranslateObjectModel objModel)
    {
        dynamic oauth = await _oAuthService.GetInternalAsync();

        // prepare the payload
        List<JobPayloadItem> outputs = new List<JobPayloadItem>()
        {
            new JobPayloadItem(
                JobPayloadItem.TypeEnum.Svf,
                new List<JobPayloadItem.ViewsEnum>()
                {
                    JobPayloadItem.ViewsEnum._2d,
                    JobPayloadItem.ViewsEnum._3d
                })
        };
        JobPayload job = new JobPayload(new JobPayloadInput(objModel.objectName), new JobPayloadOutput(outputs));

        // start the translation
        DerivativesApi derivative = new DerivativesApi();
        derivative.Configuration.AccessToken = oauth.access_token;
        dynamic jobPosted = await derivative.TranslateAsync(job);
        return jobPosted;
    }
}