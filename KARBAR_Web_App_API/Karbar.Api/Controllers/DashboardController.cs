using Karbar.Api.RequestDTO;
using Karbar.Application.Features.Dashboard.Queries;
using Karbar.Application.Features.Payment.Queries;
using Karbar.Common.Shared;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class DashboardController : Controller
    {
        private readonly IMediator _mediator;

        public DashboardController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] DashboardQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var getQuery = new GetAllDashboardList.Query
                {
                    TenantId = query.TenantId,
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

    }
}
