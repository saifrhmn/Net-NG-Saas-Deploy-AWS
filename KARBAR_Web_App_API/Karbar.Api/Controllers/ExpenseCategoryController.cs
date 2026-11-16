using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.ExpenseCategory;
using Karbar.Application.Features.ExpenseCategory.Commands;
using Karbar.Application.Features.ExpenseCategory.Queries;
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
    [Authorize]
    public class ExpenseCategoryController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ExpenseCategoryController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<ActionResult> GetAllExpenseCategory([FromQuery] ExpenseQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetAllExpenseCategory.Query
                {
                    SearchText = query.SearchText,
                    ExpenseCategoryId = query.ExpenseCategoryId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    TenantId=query.TenantId,
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

        [HttpGet("{expenseCategoryId}")]
        public async Task<ActionResult> GetExpenseCategoryDetails(int expenseCategoryId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new GetExpenseCategoryDetails.Query()
                {
                    ExpenseCategoryId = expenseCategoryId
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
        public async Task<ActionResult> CreateExpenseCategory(ExpenseCategoryRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateExpenseCategory.Command>();
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

        [HttpDelete("{expenseCategoryId}")]
        public async Task<ActionResult> DeleteCategory(int expenseCategoryId)
        {
            var _response = new ApiResponse();
            try
            {
                var command = new DeleteExpenseCategory.Command()
                {
                    ExpenseCategoryId = expenseCategoryId
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
