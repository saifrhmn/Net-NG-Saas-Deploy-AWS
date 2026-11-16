using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.Payment;
using Karbar.Application.Features.Payment.Commands;
using Karbar.Application.Features.Payment.Queries;
using Karbar.Common.Shared;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class PaymentController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PaymentController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] PaymentQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var getQuery = new GetAllPayment.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    UserType = query.UserType,
                    UserId = query.UserId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                var result = await _mediator.Send(getQuery);

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = result;
                _response.PageIndex = query.PageIndex;
                _response.PageSize = query.PageSize;
                _response.Count = result.FirstOrDefault()?.TotalCount ?? 0;

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
        public async Task<ActionResult> Create(PaymentRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreatePayment.Command>();
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

        [HttpDelete("{PaymentId}")]
        public async Task<ActionResult> Delete(int PaymentId)
        {
            var _response = new ApiResponse();
            try
            {
                var command = new DeletePayment.Command { PaymentId = PaymentId };
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
