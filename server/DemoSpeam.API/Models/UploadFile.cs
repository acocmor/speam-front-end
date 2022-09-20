namespace DemoSpeam.API.Models;

/// <summary>
/// UploadFile model
/// </summary>
public class UploadFile
{
    public string bucketKey { get; set; }
    public IFormFile fileToUpload { get; set; }
}