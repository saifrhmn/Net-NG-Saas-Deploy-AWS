using FluentValidation;
using Karbar.Api.Common.Images;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.Item;
using Karbar.Application.Contracts.StockItems;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Application.Features.Stock.Queries;
using Karbar.Application.Features.StockFeatures.Commands;
using Karbar.Common.Shared;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using System.Net;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]
    public class StockController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly WebRootUtility _host;
        private readonly IImagePathHelper _appPathHelper;

        public StockController(IMediator mediator, WebRootUtility host, IImagePathHelper appPathHelper)
        {
            _mediator = mediator;
            _host = host;
            _appPathHelper = appPathHelper;
        }

        [HttpGet]
        public async Task<ActionResult> GetAllStock([FromQuery] QueryDto query)
        {
            var _response = new ApiResponse();

            try
            {
                // Create the query object properly
                var getAllStockQuery = new GetAllStock.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                };

                // Send query via Mediator
                var Stocks = await _mediator.Send(getAllStockQuery);

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = Stocks;

                return Ok(_response);
            }
            catch (Exception ex)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.InternalServerError;
                _response.ErrorMessage = new List<string> { ex.Message };
                return StatusCode((int)HttpStatusCode.InternalServerError, _response);
            }

        }


        [HttpGet("{stockId}")]
        public async Task<ActionResult> GetStockDetails(string stockId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new GetStockDetails.Query()
                {
                    StockId = stockId
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

        [HttpPost("create")]
        public async Task<ActionResult> CreateStock(StockRequest request)
        {
            var response = new ApiResponse();
            try
            {
                var command = request.Adapt<CreateStock.Command>();
                var result = await _mediator.Send(command);

                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;

                return Ok(response);
            }
            catch (FluentValidation.ValidationException ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessage = ex.Errors
                    .Select(e => $"{e.PropertyName}: {e.ErrorMessage}")
                    .ToList();

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };

                return StatusCode(500, response);
            }
        }

        [HttpPost("warehousetransfer")]
        public async Task<ActionResult> WarehouseTransfer(WarehouseTransferRequest request)
        {
            var response = new ApiResponse();
            try
            {
                var command = request.Adapt<WarehouseTransfer.Command>();
                var result = await _mediator.Send(command);

                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.Result = result;

                return Ok(response);
            }
            catch (FluentValidation.ValidationException ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.BadRequest;
                response.ErrorMessage = ex.Errors
                    .Select(e => $"{e.PropertyName}: {e.ErrorMessage}")
                    .ToList();

                return BadRequest(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };

                return StatusCode(500, response);
            }
        }




        [HttpDelete("{stockId}")]
        public async Task<ActionResult> DeleteItem(int stockId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new DeleteStock.Command()
                {
                    StockId = stockId
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
