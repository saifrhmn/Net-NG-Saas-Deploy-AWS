using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.PurchaseReturn;
using Karbar.Application.Features.PurchaseReturn.Commands;
using Karbar.Application.Features.PurchaseReturn.Queries;
using Karbar.Application.Features.ReturnOrder.Queries;
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
    //[Authorize]
    public class PurchaseReturnController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PurchaseReturnController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAllPurchaseReturns([FromQuery] PurchaseReturnQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                if (query.TenantId == 0)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessage = new List<string> { "TenantId is required." };
                    return BadRequest(_response);
                }

                var result = await _mediator.Send(new GetAllPurchaseReturns.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate
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
        [HttpPost]
        public async Task<ActionResult> CreatePurchaseReturn(PurchaseReturnRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                if (request == null)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessage = new List<string> { "Request body is required." };
                    return BadRequest(_response);
                }

                if (request.TenantId == 0)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessage = new List<string> { "TenantId is required." };
                    return BadRequest(_response);
                }

                if (request.WarehouseId == 0)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessage = new List<string> { "WarehouseId is required." };
                    return BadRequest(_response);
                }

                if (!request.PurchaseReturnDetails.Any())
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessage = new List<string> { "At least one purchase return detail is required." };
                    return BadRequest(_response);
                }

                var command = request.Adapt<CreatePurchaseReturn.Command>();
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

    }
}