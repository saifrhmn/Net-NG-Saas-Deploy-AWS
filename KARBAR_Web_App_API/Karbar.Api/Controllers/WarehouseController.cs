using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.Warehouse;
using Karbar.Application.Features.Uoms.Queries;
using Karbar.Application.Features.Warehouses.Commands;
using Karbar.Application.Features.Warehouses.Queries;
using Karbar.Common.Shared;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Net;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]

    public class WarehouseController : Controller
    {
        private readonly IMediator _mediator;

        public WarehouseController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAllWarehouse([FromQuery] QueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetAllWarehouse.Query
                {
                    SearchText = query.SearchText,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    TenantId = query.TenantId,
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
                _response.Result = null;
                return BadRequest(_response);
            }
        }

        [HttpGet("{warehouseId}")]
        public async Task<ActionResult> GetWarehouseDetails(int warehouseId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new GetWarehouseDetails.Query()
                {
                    WarehouseId = warehouseId
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
                _response.ErrorMessage = new List<string> { ex.Message };
                _response.Result = null;
                return BadRequest(_response);
            }
        }

        [HttpPost]
        public async Task<ActionResult> CreateWarehouse(WarehouseRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateWarehouse.Command>();
                var result = await _mediator.Send(command);

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = result;

                return Ok(_response);
            }
            catch (ValidationException ex)
            {
                var errorMessages = ex.Errors.Select(error => $"{error.PropertyName}: {error.ErrorMessage}").ToList();
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.BadRequest;
                _response.ErrorMessage = errorMessages;
                _response.Result = null;
                return BadRequest(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = new List<string> { ex.Message };
                _response.Result = null;
                return BadRequest(_response);
            }
        }

        [HttpDelete("{warehouseId}")]
        public async Task<ActionResult> DeleteWarehouse(int warehouseId)
        {
            var _response = new ApiResponse();
            try
            {
                var command = new DeleteWarehouse.Command()
                {
                    WarehouseId = warehouseId
                };
                var result = await _mediator.Send(command);

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
                _response.Result = null;
                return BadRequest(_response);
            }
        }
    }
}