using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.CustomerPayment;
using Karbar.Application.Features.CustomerPayment.Commands;
using Karbar.Application.Features.CustomerPayment.Queries;
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
    public class CustomerPaymentController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CustomerPaymentController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] CustomerPaymentQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var getQuery = new GetAllCustomerPayment.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    CustomerId = query.CustomerId,
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
        public async Task<ActionResult> Create(CustomerPaymentRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateCustomerPayment.Command>();
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

        [HttpDelete("{customerPaymentId}")]
        public async Task<ActionResult> Delete(int customerPaymentId)
        {
            var _response = new ApiResponse();
            try
            {
                var command = new DeleteCustomerPayment.Command { CustomerPaymentId = customerPaymentId };
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
