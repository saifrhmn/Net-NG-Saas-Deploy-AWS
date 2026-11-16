using FluentValidation;
using Karbar.Api.Common.Images;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.Item;
using Karbar.Application.Contracts.PurchaseOrder;
using Karbar.Application.Contracts.RequestOrder;
using Karbar.Application.Features.Brands.Commands;
using Karbar.Application.Features.Brands.Queries;
using Karbar.Application.Features.Items.Commands;
using Karbar.Application.Features.Items.Queries;
using Karbar.Application.Features.RequestOrder.Commands;
using Karbar.Application.Features.RequestOrder.Queries;
using Karbar.Application.Features.Users.Queries;
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
    public class RequestOrderController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly WebRootUtility _host;
        private readonly IImagePathHelper _appPathHelper;

        public RequestOrderController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAllRequestOrder([FromQuery] OrderRequestQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var getAllPOQuery = new GetAllRO.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    IsBerger = query.IsBerger,
                    OrderStatus = query.OrderStatus,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                // Send query and capture response
                var result = await _mediator.Send(getAllPOQuery);

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


        [HttpGet("{roId}")]
        public async Task<ActionResult> GetRequestOrderDetails(int roId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = string.Empty;
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

        [HttpPost]
        public async Task<ActionResult> CreateRequestOrder(RequestOrderRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateRO.Command>();
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

        [HttpPost("bergerRecievedStatusUpdate")]
        public async Task<ActionResult> BergerRecievedStatusUpdate(BergerRecievedStatusUpdateRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<BergerRecievedStatusUpdate.Command>();
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

        [HttpDelete("{roId}")]
        public async Task<ActionResult> DeleteItem(int roId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new DeleteRO.Command()
                {
                    PurchaseOrderId = roId
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
