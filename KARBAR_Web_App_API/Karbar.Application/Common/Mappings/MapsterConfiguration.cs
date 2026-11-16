namespace Karbar.Application.Common.Mappings
{
    public static class MapsterConfiguration
    {
        public static void Configure()
        {
            //TypeAdapterConfig<Product, ProductResponse>.NewConfig();
            //TypeAdapterConfig<ProductRequest, Product>.NewConfig();
        }

        private static bool? ConvertToNullableBool(string value)
        {
            if (string.IsNullOrEmpty(value))
                return null;

            if (bool.TryParse(value, out bool result))
                return result;

            return null;
        }

        private static DateTime? ConvertToNullableDateTime(string value)
        {
            if (string.IsNullOrEmpty(value) || value == "0000-00-00")
                return null;

            if (DateTime.TryParse(value, out DateTime result))
                return result;

            return null;
        }

        static decimal? ConvertToNullableDecimal(string value)
        {
            if (string.IsNullOrEmpty(value))
                return 0;

            if (decimal.TryParse(value, out decimal result))
                return result;

            return 0;
        }
    }
}
