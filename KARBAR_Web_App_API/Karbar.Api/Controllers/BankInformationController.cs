using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.BankInformation;
using Karbar.Application.Features.BankInformations.Commands;
using Karbar.Application.Features.BankInformations.Queries;
using Karbar.Common.Shared;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Net;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class BankInformationController : ControllerBase
    {
        private readonly IMediator _mediator;

        public BankInformationController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] QueryDto query)
        {
            var response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetAllBankInformation.Query
                {
                    SearchText = query.SearchText,
                    TenantId =  query.TenantId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                });

                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;

                return Ok(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };

                return BadRequest(response);
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetDetails(int id)
        {
            var response = new ApiResponse();
            try
            {
                var query = new GetBankInformationDetails.Query { BankInformationId = id };
                var result = await _mediator.Send(query);

                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;

                return Ok(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };

                return BadRequest(response);
            }
        }

        [HttpPost]
        public async Task<ActionResult> Create(BankInformationRequest request)
        {
            var response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateBankInformation.Command>();
                var result = await _mediator.Send(command);

                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;

                return Ok(response);
            }
            catch (ValidationException ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessage = ex.Errors.Select(e => $"{e.PropertyName}: {e.ErrorMessage}").ToList();

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };

                return BadRequest(response);
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var response = new ApiResponse();
            try
            {
                var command = new DeleteBankInformation.Command { Id = id };
                var result = await _mediator.Send(command);

                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;

                return Ok(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };

                return BadRequest(response);
            }
        }
    }
}
