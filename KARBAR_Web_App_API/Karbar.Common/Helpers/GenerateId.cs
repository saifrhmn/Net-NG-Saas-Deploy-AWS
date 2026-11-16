namespace Karbar.Common.Helpers
{
    public class GenerateId
    {
        public static string MakeId()
        {
            return Guid.NewGuid().ToString().Substring(0, 20).ToUpper();
        }

        public static string MakeRandomUniqueNumber(int length, string prefix = null, string suffix = null)
        {
            Random random = new();
            string characters = "0123456789";
            char[] result = new char[length];

            for (int i = 0; i < length; i++)
            {
                result[i] = characters[random.Next(characters.Length)];
            }

            return $"{prefix}{new string(result)}{suffix}";
        }
    }
}
