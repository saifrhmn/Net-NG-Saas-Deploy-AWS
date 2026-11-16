using System.Net;
using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.Tenant;
using Karbar.Application.Features.Tenants.Commands;
using Karbar.Application.Features.Tenants.Queries;
using Karbar.Application.Features.Uoms.Queries;
using Karbar.Common.Shared;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class TenantController : Controller
    {
        private readonly IMediator _mediator;

        public TenantController(IMediator mediator)
        {
            _mediator = mediator;
        }
        
        [HttpGet]
        public async Task<ActionResult> GetAllTenant([FromQuery] TenantQueryDto query)
        {
            var _response = new ApiResponse();

            try
            {
                var result = await _mediator.Send(new GetAllTenant.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    RoleId = query.RoleId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
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
        
        [HttpGet("{tenantId}")]
        public async Task<ActionResult> GetTenantDetails(int tenantId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new GetTenantDetails.Query()
                {
                    TenantId = tenantId
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
        public async Task<ActionResult> CreateTenant(TenantRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateTenant.Command>();
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
        
        [HttpDelete("{tenantId}")]
        public async Task<ActionResult> DeleteTenant(string tenantId)
        {
            var _response = new ApiResponse();
            try
            {
                var command = new DeleteTenant.Command()
                {
                    TenantId = tenantId
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
