using DemoSpeam.API.Models;
using DemoSpeam.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace DemoSpeam.API.Controllers;

[ApiController]
public class OSSController : ControllerBase
{
    private OSSService _ossService;

    public OSSController(OSSService ossService)
    {
        _ossService = ossService;
    }

    /// <summary>
    /// Return list of buckets (id=#) or list of objects (id=bucketKey)
    /// </summary>
    [HttpGet]
    [Route("api/forge/oss/buckets")]
    public async Task<IList<TreeNode>> GetOSSAsync(string id)
    {
        return await _ossService.GetOSSAsync(id);
    }

        
    /// <summary>
    /// Create a new bucket 
    /// </summary>
    [HttpPost]
    [Route("api/forge/oss/buckets")]
    public async Task<dynamic> CreateBucket([FromBody]CreateBucketModel bucket)
    {
        return await _ossService.CreateBucket(bucket);
    }

    /// <summary>
    /// Receive a file from the client and upload to the bucket
    /// </summary>
    /// <returns></returns>
    [HttpPost]
    [Route("api/forge/oss/objects")]
    public async Task<dynamic> UploadObject([FromForm]UploadFile input)
    {
        return await _ossService.UploadObject(input);
    }

}