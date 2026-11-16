 using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Infrastructure.CentralCacheService
{
    public interface IMaterialCacheService
    {
        Task<List<ItemListResponseDto>> GetMaterialsAsync(int TanentId, int? CatagoryId, int? BrandId,string? SearchText, int? pageindex, int? pagesize, bool? isBergerItem);
        void ClearCache();
    }
}
