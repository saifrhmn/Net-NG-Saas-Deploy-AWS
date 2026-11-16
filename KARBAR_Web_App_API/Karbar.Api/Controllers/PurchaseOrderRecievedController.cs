using System.Collections.Generic;
using System.Linq;
using System.Net;
using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.PurchaseOrderRecieved;
using Karbar.Application.Features.PurchaseOrderRecieved.Commands;
using Karbar.Application.Features.PurchaseOrderRecieved.Queries;
using Karbar.Common.Shared;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static Karbar.Application.Features.PurchaseOrderRecieved.Commands.ReceiveRemainingQty;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class PurchaseOrderRecievedController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PurchaseOrderRecievedController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] PurchaseOrderRecievedQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var getQuery = new GetAllPOR.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    IsCompleted = query.IsCompleted,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                var result = await _mediator.Send(getQuery);

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
        public async Task<ActionResult> Create(PurchaseOrderRecievedRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreatePOR.Command>();
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

        [HttpPost("ReceiveRemaining")]
        public async Task<ActionResult> ReceiveRemaining([FromBody] ReceiveRemainingRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<ReceiveRemainingQty.Command>();
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

        [HttpDelete("{recievedId}")]
        public async Task<ActionResult> Delete(int recievedId)
        {
            var _response = new ApiResponse();
            try
            {
                var command = new DeletePOR.Command { PurchaseRecievedId = recievedId };
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
