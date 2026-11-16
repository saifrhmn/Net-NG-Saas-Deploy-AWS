using FluentValidation;
using Karbar.Api.Common.Images;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.PurchaseOrder;
using Karbar.Application.Contracts.SalesOrder;
using Karbar.Application.Features.PurchaseOrder.Commands;
using Karbar.Application.Features.PurchaseOrder.Queries;
using Karbar.Application.Features.SalesOrder.Commands;
using Karbar.Application.Features.SalesOrder.Queries;
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

    public class SalesOrderController : ControllerBase
    {
        private readonly IMediator _mediator;

        public SalesOrderController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpGet("InvoiceDetailsFromSAPData")]
        public async Task<ActionResult<List<SapSalesDataResponse>>> GetAll([FromQuery] SalesOrderQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var getAllSOQuery = new GetDeatilByInvoiceNoFromSAPData.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    IsCustomerRecieved = query.IsCustomerRecieved,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                };
                var result = await _mediator.Send(getAllSOQuery);

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
        public async Task<IActionResult> Create(SalesOrderRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateSalesOrder.Command>();
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

        [HttpDelete("{soId}")]
        public async Task<ActionResult> DeleteItem(int soId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new DeleteSalesOrder.Command()
                {
                    SalesOrderId = soId
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
                _response.ErrorMessage = [ex.Message];
                _response.Result = null;
                return BadRequest(_response);
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<SalesOrderResponse>>> GetAll([FromQuery] GetAllSalesOrderQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var getAllSOQuery = new GetAllSalesOrders.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    IsDraft = query.IsDraft,
                    IsReturn = query.IsReturn,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate
                };

                // Send query and capture response
                var result = await _mediator.Send(getAllSOQuery);

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

        [HttpGet("{soId}")]
        public async Task<ActionResult<SalesOrderResponse>> GetDetails(int soId, CancellationToken cancellationToken)
        {
            var _response = new ApiResponse();
            try
            {
                var query = string.Empty;
                new GetSalesOrderDetails.Query()
                {
                    SalesOrderId = soId
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
                _response.ErrorMessage = [ex.Message];
                _response.Result = null;
                return BadRequest(_response);
            }
        }
    }
}