using System.Linq;
using Microsoft.OpenApi.Any;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Karbar.Api.Common
{
    public class NullExampleSchemaFilter : ISchemaFilter
    {
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            if (schema?.Properties == null) return;

            // Loop through each property and set Example to OpenApiNull, and mark as nullable
            foreach (var kv in schema.Properties.ToList())
            {
                var propSchema = kv.Value;
                if (propSchema == null) continue;

                if (propSchema.Type == "string")
                {
                    propSchema.Nullable = true;
                    propSchema.Example = new OpenApiNull();
                }
            }
        }
    }
}
