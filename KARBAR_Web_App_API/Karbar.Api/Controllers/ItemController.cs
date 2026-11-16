using FluentValidation;
using Karbar.Api.Common.Images;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.Item;
using Karbar.Application.Features.Items.Commands;
using Karbar.Application.Features.Items.Queries;
using Karbar.Application.Features.Materials.Commands;
using Karbar.Application.Features.Materials.Queries;
using Karbar.Common.Shared;
using Karbar.Domain.Entities;
using Karbar.Infrastructure.CentralCacheService;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using System.Net;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class ItemController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly WebRootUtility _host;
        private readonly IImagePathHelper _appPathHelper;
        private readonly IMaterialCacheService _materialCacheService;

        public ItemController(IMediator mediator, WebRootUtility host, IImagePathHelper appPathHelper, IMaterialCacheService materialCacheService)
        {
            _mediator = mediator;
            _host = host;
            _appPathHelper = appPathHelper;
            _materialCacheService = materialCacheService;
        }
        
        [HttpGet]
        public async Task<ActionResult> GetAllItem([FromQuery] ItemQueryDto query)
        {
            var _response = new ApiResponse();

            try
            {
                // Create the query object properly
                var getAllItemQuery = new GetAllItem.Query
                {
                    SearchText = query.SearchText,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    TenantId = query.TenantId,
                    CategoryId= query.CategoryId,
                    BrandId = query.BrandId,
                    IsBergerItem=query.IsBergerItem
                };
                //var items = await _mediator.Send(getAllItemQuery);
                List<ItemListResponseDto> mappedItems = await _materialCacheService.GetMaterialsAsync(query.TenantId, query.CategoryId, query.BrandId, query.SearchText,query.PageIndex,query.PageSize,query.IsBergerItem);
                mappedItems = mappedItems.Select(img => new ItemListResponseDto
                {
                    Id = img.Id,
                    ItemId = img.ItemId,
                    MaterialNumber = img.MaterialNumber,
                    Name = img.Name,
                    MRP = img.MRP,
                    InvoicePrice = img.InvoicePrice,
                    SellingPrice = img.SellingPrice,
                    PurchasePrice = img.PurchasePrice,
                    Barcode = img.Barcode,
                    CategoryId = img.CategoryId,
                    CategoryName = img.CategoryName,
                    BrandId = img.BrandId,
                    BrandName = img.BrandName,
                    UomId = img.UomId,
                    UomName = img.UomName,
                    WarehouseId = img.WarehouseId,
                    WarehouseName = img.WarehouseName,
                    TenantId = img.TenantId,
                    Status = img.Status,
                    LowStock = img.LowStock,
                    WeightedAveragePrice = img.WeightedAveragePrice,
                    WeightedAveragePriceUpdatetdDate = img.WeightedAveragePriceUpdatetdDate,
                    ImageUrl = _appPathHelper.ToImageUrl(img.ImageUrl),
                    Warehousestk = img.Warehousestk,
                    TotalCount = img.TotalCount
                }).ToList();

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = mappedItems;
                //_response.Result = items;
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = new List<string> { ex.Message };
                return StatusCode((int)HttpStatusCode.InternalServerError, _response);
            }

        }


        [HttpGet("material-groups")]
        public async Task<ActionResult> GetAllMaterialGroup([FromQuery] MaterialQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetAllMaterialGroup.Query
                {
                    SearchText = query.SearchText,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                });

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = result;
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = new List<string> { ex.Message };
                return StatusCode((int)HttpStatusCode.InternalServerError, _response);
            }
        }

        [HttpGet("materials")]
        public async Task<ActionResult> GetAllMaterial([FromQuery] MaterialQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetAllMaterial.Query
                {
                    SearchText = query.SearchText,
                    MaterialGroup = query.MaterialGroup,
                    IsCommonItem = query.IsCommonItem,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                });

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = result;
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = new List<string> { ex.Message };
                return StatusCode((int)HttpStatusCode.InternalServerError, _response);
            }
        }

        [HttpPost("assign-materials")]
        public async Task<ActionResult> AssignMaterialToTenant([FromBody] AssignMaterialToTenant.Command command)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(command);
                _materialCacheService.ClearCache();

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = result;
                return Ok(_response);
            }
            catch (FluentValidation.ValidationException ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.BadRequest;
                _response.ErrorMessage = ex.Errors.Select(e => e.ErrorMessage).ToList();
                return BadRequest(_response);
            }
            catch (KeyNotFoundException ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.NotFound;
                _response.ErrorMessage = new List<string> { ex.Message };
                return NotFound(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = new List<string> { ex.Message };
                return StatusCode((int)HttpStatusCode.InternalServerError, _response);
            }
        }

        [HttpGet("{itemId}")]
        public async Task<ActionResult> GetItemDetails(int itemId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new GetItemDetails.Query()
                {
                    ItemId = itemId
                };
                var result = await _mediator.Send(query);
                if (result != null && !string.IsNullOrEmpty(result.ImageUrl))
                {
                    result.ImageUrl = _appPathHelper.ToImageUrl(result.ImageUrl);
                }

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = result;
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = [ex.Message];
                _response.Result = null;
                return BadRequest(_response);
            }
        }

        [HttpPost]
        public async Task<ActionResult> CreateItem(ItemRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                _materialCacheService.ClearCache();
                string imagePath = string.Empty;

                if (!string.IsNullOrEmpty(request.ImageBase64))
                {
                    imagePath = await Base64ToImage.UploadImageAsync(
                        request.ImageBase64,
                        "Item" + "/"+request.TenantId,
                        $"{request.MaterialNumber ?? request.Name}",
                        _host.GetWwwRootPath()
                    );
                }

                // Map request to CQRS command
                var command = request.Adapt<CreateItem.Command>();

                // Set uploaded image path
                command.ImagePath = imagePath;

                // Send to handler
                var result = await _mediator.Send(command);

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = result;

                return Ok(_response);
            }
            catch (FluentValidation.ValidationException ex)
            {
                var errorMessages = ex.Errors.Select(e => $"{e.PropertyName}: {e.ErrorMessage}");
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.BadRequest;
                _response.ErrorMessage = errorMessages.ToList();
                _response.Result = null;

                return BadRequest(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = new List<string> { ex.Message };
                _response.Result = null;

                return StatusCode(500, _response);
            }
        }

        [HttpPost("bulk-insert")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> BulkInsertItems([FromForm] BulkInsertItemRequest dto)
        {
            var response = new ApiResponse();

            if (dto.File == null || dto.File.Length == 0)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessage = new() { "Excel file is required" };
                return BadRequest(response);
            }

            using var memoryStream = new MemoryStream();
            await dto.File.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            var command = new BulkInsertItem.Command
            {
                FileStream = memoryStream,
                FileName = dto.File.FileName
            };

            var result = await _mediator.Send(command);

            response.IsSuccess = true;
            response.StatusCode = HttpStatusCode.OK;
            response.Result = result+" Items inserted";

            return Ok(response);
        }

        [HttpPost("common-item-bulk")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CommonItemBulk([FromForm] BulkInsertItemRequest dto)
        {
            var response = new ApiResponse();

            if (dto.File == null || dto.File.Length == 0)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessage = new() { "Excel file is required" };
                return BadRequest(response);
            }

            using var memoryStream = new MemoryStream();
            await dto.File.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            var command = new BulkInsertCommonItem.Command
            {
                FileStream = memoryStream,
                FileName = dto.File.FileName
            };

            var result = await _mediator.Send(command);

            response.IsSuccess = true;
            response.StatusCode = HttpStatusCode.OK;
            response.Result = result + " Materials updated";

            return Ok(response);
        }

        [HttpPost("bulk-brand-catagory-update")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> BulkUpdateBrandCatagoryItems([FromForm] BulkInsertItemRequest dto)
        {
            var response = new ApiResponse();

            if (dto.File == null || dto.File.Length == 0)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessage = new() { "Excel file is required" };
                return BadRequest(response);
            }

            using var memoryStream = new MemoryStream();
            await dto.File.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            var command = new BulkUpdateBrandCatagoryItem.Command
            {
                FileStream = memoryStream,
                FileName = dto.File.FileName
            };

            var result = await _mediator.Send(command);

            response.IsSuccess = true;
            response.StatusCode = HttpStatusCode.OK;
            response.Result = result + " Items inserted";

            return Ok(response);
        }


        [HttpDelete("{itemId}")]
        public async Task<ActionResult> DeleteItem(int itemId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new DeleteItem.Command()
                {
                    ItemId = itemId
                };
                var result = await _mediator.Send(query);

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = result;
                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = [ex.Message];
                _response.Result = null;
                return BadRequest(_response);
            }
        }
    }
}
