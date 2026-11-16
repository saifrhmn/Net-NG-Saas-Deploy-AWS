using Karbar.Application.Features.SalesOrder.Commands;
using Karbar.Application.Features.SalesOrder.Models;
using Karbar.Application.Features.SalesOrder.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]

    public class SalesOrderController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SalesOrderController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] SalesOrderCreateRequest model, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new CreateSalesOrder.Command { Model = model }, cancellationToken);
            return Ok(result);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var result = await _mediator.Send(new DeleteSalesOrder.Command { Id = id }, cancellationToken);
            return Ok(result);
        }

        [HttpGet]
        public async Task<ActionResult<List<SalesOrderResponse>>> GetAll(CancellationToken cancellationToken)
        {
            var list = await _mediator.Send(new GetAllSalesOrders.Query(), cancellationToken);
            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<SalesOrderResponse>> GetDetails(int id, CancellationToken cancellationToken)
        {
            var item = await _mediator.Send(new GetSalesOrderDetails.Query { Id = id }, cancellationToken);
            if (item == null) return NotFound();
            return Ok(item);
        }
    }
}