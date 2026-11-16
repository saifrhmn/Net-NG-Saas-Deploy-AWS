using FluentValidation;
using FluentValidation.Results;

namespace Karbar.Api.Common.Images
{
    public class Base64ToImage
    {
        public static async Task<string> CheckinUploadImageAsync(string base64String, string folderName, string fileName, string WebRootPath)
        {
            string fileExtension = ".png";
            string imageName = fileName.Replace(" ", string.Empty) + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff") + fileExtension;
            string folderPath = Path.Combine(WebRootPath, "Images", "Checkins", folderName, fileName.Replace(" ", string.Empty));

            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            string imagePath = Path.Combine(folderPath, imageName);

            byte[] imageBytes = Convert.FromBase64String(base64String);

            using (var stream = new FileStream(imagePath, FileMode.Create))
            {
                await stream.WriteAsync(imageBytes, 0, imageBytes.Length);
                await stream.FlushAsync();
            }

            string fullPath = Path.GetFullPath(imagePath);

            double sizeInMB = (double)imageBytes.Length / (1024 * 1024);

            if (sizeInMB > 3)
            {
                throw new Exception("The image size must not be more than 3MB");
            }

            return fullPath;
        }

        public static async Task<string> UploadImageAsync(string base64String, string folderName, string fileName, string WebRootPath)
        {
            string fileExtension = ".png";
            string baseName = fileName.Replace(" ", string.Empty);
            // Unique name per upload so the stored path (and URL) changes and clients don't show a cached old image
            string imageName = baseName + "_" + DateTime.Now.ToString("yyyyMMddHHmmssfff") + fileExtension;
            string folderPath = Path.Combine(WebRootPath, "Images", folderName);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }
            byte[] imageBytes = Convert.FromBase64String(base64String);
            double sizeInMB = (double)imageBytes.Length / (1024 * 1024);
            if (sizeInMB > 3)
            {
                throw new Exception("The image size must not be more than 3MB");
            }

            // Remove previous images for the same name (old fixed-name file and earlier timestamped ones)
            var oldFiles = Directory.GetFiles(folderPath, baseName + fileExtension)
                .Concat(Directory.GetFiles(folderPath, baseName + "_*" + fileExtension));
            foreach (var oldFile in oldFiles)
            {
                File.Delete(oldFile);
            }

            string imagePath = Path.Combine(folderPath, imageName);
            await File.WriteAllBytesAsync(imagePath, imageBytes);
            return imagePath;

        }
    }
}
