using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.ExpenseInformation;
using Karbar.Application.Features.ExpenseInformations.Commands;
using Karbar.Application.Features.ExpenseInformations.Queries;
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
    public class ExpenseInformationController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ExpenseInformationController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] QueryDto query)
        {
            var response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetAllExpenseInformation.Query
                {
                    SearchText = query.SearchText,
                    TenantId=query.TenantId,
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
                var query = new GetExpenseInformationDetails.Query { ExpenseInformationId = id };
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
        public async Task<ActionResult> Create(ExpenseInformationRequest request)
        {
            var response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateExpenseInformation.Command>();
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
                var command = new DeleteExpenseInformation.Command { Id = id };
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
