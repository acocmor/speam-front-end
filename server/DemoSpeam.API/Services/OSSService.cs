using Autodesk.Forge;
using Autodesk.Forge.Model;
using DemoSpeam.API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace DemoSpeam.API.Services;

public class OSSService
{
    private IWebHostEnvironment _env;
    private OAuthService _oAuthService;
    private ForgeSetting _forgeSetting;

    public OSSService(IWebHostEnvironment env, OAuthService oAuthService, IOptionsMonitor<ForgeSetting> forgeSetting)
    {
        _env = env;
        _oAuthService = oAuthService;
        _forgeSetting = forgeSetting.CurrentValue;
    }

    public async Task<dynamic> CreateBucket([FromBody] CreateBucketModel bucket)
    {
        BucketsApi buckets = new BucketsApi();
        dynamic token = await _oAuthService.GetInternalAsync();
        buckets.Configuration.AccessToken = token.access_token;
        PostBucketsPayload bucketPayload = new PostBucketsPayload(
            string.Format("{0}-{1}", _forgeSetting.ClientId, bucket.bucketKey.ToLower()), null,
            PostBucketsPayload.PolicyKeyEnum.Persistent);
        return await buckets.CreateBucketAsync(bucketPayload, _forgeSetting.Region);
    }

    public async Task<dynamic> UploadObject([FromForm] UploadFile input)
    {
        // save the file on the server
        var fileSavePath = Path.Combine(_env.WebRootPath, Path.GetFileName(input.fileToUpload.FileName));
        using (var stream = new FileStream(fileSavePath, FileMode.Create))
            await input.fileToUpload.CopyToAsync(stream);


        // get the bucket...
        dynamic oauth = await _oAuthService.GetInternalAsync();
        ObjectsApi objects = new ObjectsApi();
        objects.Configuration.AccessToken = oauth.access_token;

        // upload the file/object, which will create a new object
        dynamic uploadedObj;
        using (StreamReader streamReader = new StreamReader(fileSavePath))
        {
            uploadedObj = await objects.UploadObjectAsync(input.bucketKey,
                Path.GetFileName(input.fileToUpload.FileName), (int)streamReader.BaseStream.Length,
                streamReader.BaseStream,
                "application/octet-stream");
        }

        // cleanup
        System.IO.File.Delete(fileSavePath);

        return uploadedObj;
    }

    public async Task<IList<TreeNode>> GetOSSAsync(string id)
    {
        IList<TreeNode> nodes = new List<TreeNode>();
        dynamic oauth = await _oAuthService.GetInternalAsync();

        if (id == "#") // root
        {
            // in this case, let's return all buckets
            BucketsApi appBckets = new BucketsApi();
            appBckets.Configuration.AccessToken = oauth.access_token;

            // to simplify, let's return only the first 100 buckets
            dynamic buckets = await appBckets.GetBucketsAsync(_forgeSetting.Region, 100);
            foreach (KeyValuePair<string, dynamic> bucket in new DynamicDictionaryItems(buckets.items))
            {
                nodes.Add(new TreeNode(bucket.Value.bucketKey,
                    bucket.Value.bucketKey.Replace(_forgeSetting.ClientId + "-", string.Empty), "bucket", true));
            }
        }
        else
        {
            // as we have the id (bucketKey), let's return all 
            ObjectsApi objects = new ObjectsApi();
            objects.Configuration.AccessToken = oauth.access_token;
            var objectsList = await objects.GetObjectsAsync(id, 100);
            foreach (KeyValuePair<string, dynamic> objInfo in new DynamicDictionaryItems(objectsList.items))
            {
                nodes.Add(new TreeNode(Base64Encode((string)objInfo.Value.objectId),
                    objInfo.Value.objectKey, "object", false));
            }
        }

        return nodes;
    }

    /// <summary>
    /// Base64 enconde a string
    /// </summary>
    public static string Base64Encode(string plainText)
    {
        var plainTextBytes = System.Text.Encoding.UTF8.GetBytes(plainText);
        return System.Convert.ToBase64String(plainTextBytes);
    }
}