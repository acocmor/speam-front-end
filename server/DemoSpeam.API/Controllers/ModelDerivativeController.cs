using DemoSpeam.API.Models;
using DemoSpeam.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DemoSpeam.API.Controllers;

[ApiController]
public class ModelDerivativeController : ControllerBase
{
    private ModelService _modelService;


    public ModelDerivativeController(ModelService modelService)
    {
        _modelService = modelService;
    }
        
    /// <summary>
    /// Start the translation job for a give bucketKey/objectName
    /// </summary>
    /// <param name="objModel"></param>
    /// <returns></returns>
    [HttpPost]
    [Route("api/forge/modelderivative/jobs")]
    public async Task<dynamic> TranslateObject([FromBody]TranslateObjectModel objModel)
    {
        return await _modelService.TranslateObject(objModel);
    }

}