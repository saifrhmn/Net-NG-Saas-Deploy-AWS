using System.Security.Cryptography;
using System.Text;

namespace Karbar.Common.Helpers;

public class CryptoHasher
{
    public static string DoHash(string accessToken, int saltLength = 12)
    {
        var saltBytes = new byte[saltLength];
        RandomNumberGenerator.Fill(saltBytes);

        string salt = Convert.ToBase64String(saltBytes).Substring(0, saltLength);

        string saltedToken = salt + accessToken;

        //using var sha256 = new HMACSHA256(Encoding.UTF8.GetBytes(SecurityAlgorithms.Sha256Digest));
        using var sha256 = new HMACSHA256(Encoding.UTF8.GetBytes("SHA256"));
        byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedToken));
        string hash = Convert.ToBase64String(hashBytes);

        return $"{salt}:{hash}";
    }

    public static bool ValidateHash(string accessToken, string storedHash)
    {
        var parts = storedHash.Split(':');
        if (parts.Length != 2)
            throw new ArgumentException("Invalid stored hash format");

        string salt = parts[0];
        string storedHashValue = parts[1];

        string saltedToken = salt + accessToken;

        //using var sha256 = new HMACSHA256(Encoding.UTF8.GetBytes(SecurityAlgorithms.Sha256Digest));
        using var sha256 = new HMACSHA256(Encoding.UTF8.GetBytes("SHA256"));
        byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedToken));
        string computedHash = Convert.ToBase64String(hashBytes);

        return storedHashValue == computedHash;
    }
}
