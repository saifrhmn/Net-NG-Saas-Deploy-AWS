using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Security.Claims;
using System.Text.Json.Serialization;

namespace Karbar.Application.Features.Items.Commands
{
    public static class BulkUpdateBrandCatagoryItem
    {
        #region Command
        public sealed class Command : IRequest<int>
        {
            [JsonIgnore]
            public Stream FileStream { get; set; } = default!;
            public string FileName { get; set; } = string.Empty;
        }
        #endregion

        #region Validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {

            }

        }
        #endregion

        #region CommandHandler
        public sealed class CommandHandler : IRequestHandler<Command, int>
        {
            private readonly IGenericRepository<Item> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _stockRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Brand> _brandRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Category> _categoryRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Uom> _uomRepository;
            private readonly IGenericRepository<Warehouse> _whRepository;
            private readonly IHttpContextAccessor _httpContextAccessor = new HttpContextAccessor();

            public CommandHandler(
                IGenericRepository<Item> repository,
                IGenericRepository<Karbar.Domain.Entities.Stock> stockRepository,
                IGenericRepository<Warehouse> whRepository,
                IGenericRepository<Karbar.Domain.Entities.Brand> brandRepository,
                IGenericRepository<Karbar.Domain.Entities.Category> categoryRepository,
                IGenericRepository<Karbar.Domain.Entities.Uom> uomRepository,
            IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _stockRepository = stockRepository;
                _whRepository = whRepository;
                _brandRepository = brandRepository;
                _categoryRepository = categoryRepository;
                _uomRepository = uomRepository;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<int> Handle(Command request, CancellationToken cancellationToken)
            {
                //var userId = _httpContextAccessor.HttpContext?
                //    .User?.FindFirstValue(ClaimTypes.NameIdentifier)
                //    ?? throw new UnauthorizedAccessException("User not found");

                int processedCount = 0;

                IWorkbook workbook = Path.GetExtension(request.FileName).ToLower() switch
                {
                    ".xls" => new HSSFWorkbook(request.FileStream),
                    ".xlsx" => new XSSFWorkbook(request.FileStream),
                    _ => throw new Exception("Invalid Excel format")
                };
                
                var sheet = workbook.GetSheetAt(0);
                List<Domain.Entities.Brand> oldBrands = new List<Domain.Entities.Brand>();
                List<Domain.Entities.Category> oldCategories = new List<Domain.Entities.Category>();

                for (int rowIndex = 1; rowIndex <= sheet.LastRowNum; rowIndex++)
                {
                    try
                    {
                        var row = sheet.GetRow(rowIndex);
                        if (row == null) continue;

                        string materialNumber = row.GetCell(0)?.ToString()?.Trim();
                        string categoryName = row.GetCell(5)?.ToString()?.Trim();
                        string brandName = row.GetCell(6)?.ToString()?.Trim();
                        
                        if (!int.TryParse(row.GetCell(9)?.ToString()?.Trim(), out int tenantId))
                            continue;

                        
                        #region Delete All Brand And Category
                        if (rowIndex == 1) 
                        {
                             oldBrands = await _brandRepository.Query()
                                .Where(x => x.TenantId == tenantId)
                                .ToListAsync(cancellationToken);

                             oldCategories = await _categoryRepository.Query()
                                .Where(x => x.TenantId == tenantId)
                                .ToListAsync(cancellationToken);
                        }
                        #endregion

                        Domain.Entities.Category category = null;
                        Domain.Entities.Brand brand = null;

                        #region CATEGORY

                        if (!string.IsNullOrWhiteSpace(categoryName))
                        {
                            category = await _categoryRepository.Query()
                                .FirstOrDefaultAsync(x =>
                                    x.Name == categoryName &&
                                    x.TenantId == tenantId,
                                    cancellationToken);

                            if (category == null)
                            {
                                category = new Domain.Entities.Category
                                {
                                    CategoryId = GenerateId.MakeId(),
                                    Name = categoryName,
                                    TenantId = tenantId,
                                    CreatedDate = DateTime.Now,
                                    Status = StatusEnum.Active
                                };

                                await _categoryRepository.AddAsync(category, cancellationToken);
                                await _categoryRepository.SaveChangesAsync(cancellationToken);
                            }
                            else
                            {
                                category.UpdatedDate = DateTime.Now;
                                await _categoryRepository.SaveChangesAsync(cancellationToken);
                            }
                        }

                        #endregion

                        #region BRAND

                        if (!string.IsNullOrWhiteSpace(brandName))
                        {
                            brand = await _brandRepository.Query()
                                .FirstOrDefaultAsync(x =>
                                    x.Name == brandName &&
                                    x.TenantId == tenantId,
                                    cancellationToken);

                            if (brand == null)
                            {
                                brand = new Domain.Entities.Brand
                                {
                                    BrandId = GenerateId.MakeId(),
                                    Name = brandName,
                                    TenantId = tenantId,
                                    CreatedDate = DateTime.Now,
                                    Status = StatusEnum.Active
                                };

                                await _brandRepository.AddAsync(brand, cancellationToken);
                                await _brandRepository.SaveChangesAsync(cancellationToken);
                            }
                            else
                            {
                                brand.UpdatedDate = DateTime.Now;
                                await _brandRepository.SaveChangesAsync(cancellationToken);
                            }
                        }

                        #endregion

                        #region ITEM UPDATE

                        if (!string.IsNullOrWhiteSpace(materialNumber))
                        {
                            var item = await _repository.Query()
                                .FirstOrDefaultAsync(x =>
                                    x.MaterialNumber == materialNumber &&
                                    x.TenantId == tenantId,
                                    cancellationToken);

                            if (item != null)
                            {
                                if (category != null)
                                    item.CategoryId = category.Id;

                                if (brand != null)
                                    item.BrandId = brand.Id;

                                item.UpdatedDate = DateTime.Now;

                                await _repository.SaveChangesAsync(cancellationToken);
                            }
                        }

                        #endregion
                        
                        processedCount++;
                        
                    }
                    catch (Exception ex)
                    {
                        throw;
                    }
                }
                _brandRepository.RemoveRange(oldBrands);
                await _brandRepository.SaveChangesAsync(cancellationToken);

                _categoryRepository.RemoveRange(oldCategories);
                await _categoryRepository.SaveChangesAsync(cancellationToken);


                return processedCount;
            }
        }

        #endregion
    }
}
