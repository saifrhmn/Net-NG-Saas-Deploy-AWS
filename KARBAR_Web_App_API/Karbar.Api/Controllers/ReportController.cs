using FluentValidation;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.Warehouse;
using Karbar.Application.Features.Reports;
using Karbar.Application.Features.ReturnOrder.Queries;
using Karbar.Application.Features.Warehouses.Commands;
using Karbar.Application.Features.Warehouses.Queries;
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

    public class ReportController : Controller
    {
        private readonly IMediator _mediator;

        public ReportController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("ItemStock")]
        public async Task<ActionResult> GetItemStock([FromQuery] ItemStockReportQuery query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetItemStockReport.Query
                {
                    TenantId = query.TenantId,
                    ItemId = query.ItemId,
                    BrandId = query.BrandId,
                    CategoryId = query.CategoryId,
                    WarehouseId = query.WarehouseId,
                    MaterialNo = query.MaterialNo,
                    ItemName = query.ItemName,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
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

        [HttpGet("Sales")]
        public async Task<ActionResult> GetSalesReport([FromQuery] SalesReportQuery query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetSalesReport.Query
                {
                    TenantId = query.TenantId,
                    ItemId = query.ItemId,
                    CategoryId = query.CategoryId,
                    BrandId = query.BrandId,
                    WarehouseId = query.WarehouseId,
                    SearchText = query.SearchText,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
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

        [HttpGet("Purchase")]
        public async Task<ActionResult> GetPurchaseReport([FromQuery] PurchaseReportQuery query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetPurchaseReport.Query
                {
                    TenantId = query.TenantId,
                    ItemId = query.ItemId,
                    CategoryId = query.CategoryId,
                    BrandId = query.BrandId,
                    WarehouseId = query.WarehouseId,
                    InvoiceNo = query.InvoiceNo,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    SearchMaterial = query.SearchMaterial
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

        [HttpGet("ReturnOrderReport")]
        public async Task<ActionResult> GetAllReturnOrderReport([FromQuery] ReturnOrderReportQuery query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetAllReturnOrderReport.Query
                {
                    TenantId = query.TenantId,
                    SearchText = query.SearchText,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                });

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

        [HttpGet("RequestOrder")]
        public async Task<ActionResult> GetRequestOrderReport([FromQuery] PurchaseReportQuery query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetRequestOrderReport.Query
                {
                    TenantId = query.TenantId,
                    ItemId = query.ItemId,
                    CategoryId = query.CategoryId,
                    BrandId = query.BrandId,
                    WarehouseId = query.WarehouseId,
                    InvoiceNo = query.InvoiceNo,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    SupplierType = query.SupplierType,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    SearchMaterial = query.SearchMaterial
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

        [HttpGet("InventoryMovementReport")]
        public async Task<ActionResult> GetInventoryMovementReport([FromQuery] InventoryMovementQuery query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetInventoryMovementReport.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    Month = query.Month,
                    Year = query.Year,
                    CategoryId = query.CategoryId,
                    BrandId = query.BrandId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    ItemName = query.ItemName
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

        [HttpGet("PaymentCollectionReport")]
        public async Task<ActionResult> GetPaymentCollectionReport([FromQuery] PaymentCollectionReportQuery query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetPaymentCollectionReport.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize,
                    SearchText = query.SearchText,
                    PartyType = query.PartyType,
                });

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.PageIndex = query.PageIndex;
                _response.PageSize = query.PageSize;
                _response.Count = result.FirstOrDefault()?.TotalCount ?? 0;
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

        [HttpGet("SupplierStatementReport")]
        public async Task<ActionResult> GetDatewiseSupplierStatementReport(
          [FromQuery] Karbar.Api.RequestDTO.GetDatewiseSupplierStatementReport query)
        {
            var response = new ApiResponse();

            try
            {
                var result = await _mediator.Send(
                    new Karbar.Application.Features.Reports.GetDatewiseSupplierStatementReport.Query
                    {
                        TenantId = query.TenantId,
                        SearchText = query.SearchText,
                        FromDate = query.FromDate,
                        ToDate = query.ToDate,
                        PageIndex = query.PageIndex,
                        PageSize = query.PageSize
                    });
                if (result.Count == 1 &&
    result[0].Reference == "Opening Balance")
                {
                    result.Clear();
                }
                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.PageIndex = query.PageIndex;
                response.PageSize = query.PageSize;
                response.Count = result.FirstOrDefault()?.TotalCount ?? 0;
                response.Result = result;

                return Ok(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };
                response.Result = null;

                return BadRequest(response);
            }
        }

        [HttpGet("SupplierPaybleReport")]
        public async Task<ActionResult> GetDatewiseSupplierPaybleReport([FromQuery] GetDatewiseSupplierPaybleReportQuery query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetDatewiseSupplierPaybleReport.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    SearchText = query.SearchText,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
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

        [HttpGet("SalesReturnReport")]
        public async Task<ActionResult> GetDatewiseSalesReturnReport([FromQuery] ReturnOrderQueryDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetAllReturnOrders.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    SearchText = query.SearchText,
                    ToDate = query.ToDate,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                });

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

        [HttpGet("TopSoldItemsReport")]
        public async Task<IActionResult> TopSoldItemsReport(
               [FromQuery] GetTopSoldItemsReportDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetTopSoldItemsReport.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    BrandId = query.BrandId,
                    CategoryId = query.CategoryId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
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

        [HttpGet("CustomerReceivablReport")]
        public async Task<ActionResult> GetDatewiseCustomerReceivablReport([FromQuery] CustomerReceivablReportDto query)
        {
            var _response = new ApiResponse();
            try
            {
                var result = await _mediator.Send(new GetCustomerReceivableReport.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    SearchText = query.SearchText,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
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

        [HttpGet("ProfitAndLossReport")]
        public async Task<ActionResult> GetProfitAndLossReport(
                  [FromQuery] ProfitAndLossReportDto query)
        {
            var response = new ApiResponse();

            try
            {
                var result = await _mediator.Send(new GetProfitAndLossReport.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
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
                response.Result = null;

                return BadRequest(response);
            }
        }

        [HttpGet("StockTransferReport")]
        public async Task<ActionResult> GetStockTransferReport(
                  [FromQuery] StockTransferReportDto query)
        {
            var response = new ApiResponse();

            try
            {
                var result = await _mediator.Send(new GetStockTransferReport.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    //FromWarehouseId = query.FromWarehouseId,
                    //ToWarehouseId = query.ToWarehouseId,
                    //ItemId = query.ItemId,
                    //TransferRefNo = query.TransferRefNo,
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
                response.Result = null;

                return BadRequest(response);
            }
        }
        [HttpGet("CustomerStatementReport")]
        public async Task<ActionResult> GetCustomerStatementReport(
                  [FromQuery] CustomerStatementReportDto query)
        {
            var response = new ApiResponse();

            try
            {
                var result = await _mediator.Send(new GetCustomerStatementReport.Query
                {
                    TenantId = query.TenantId,
                    FromDate = query.FromDate,
                    ToDate = query.ToDate,
                    SearchText = query.SearchText,
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
                response.Result = null;

                return BadRequest(response);
            }
        }
        [HttpGet("SlowMovingNonMovingDeadStockReport")]
        public async Task<ActionResult> GetSlowMovingNonMovingDeadStockReport(
                  [FromQuery] SlowMovingNonMovingDeadStockReportDto query)
        {
            var response = new ApiResponse();

            try
            {
                var result = await _mediator.Send(
                    new GetSlowMovingNonMovingDeadStockReport.Query
                    {
                        TenantId = query.TenantId,
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
                response.Result = null;

                return BadRequest(response);
            }
        }

        [HttpGet("UserLoginAndInvoiceActivityReport")]
        public async Task<ActionResult> GetUserLoginAndInvoiceActivityReport(
                  [FromQuery] UserLoginAndInvoiceActivityReportDto query)
        {
            var response = new ApiResponse();

            try
            {
                var result = await _mediator.Send(
                    new GetUserLoginAndInvoiceActivityReport.Query
                    {
                        TenantId = query.TenantId,
                        FromDate = query.FromDate,
                        ToDate = query.ToDate,  
                        PageIndex = query.PageIndex,
                        PageSize = query.PageSize
                    });

                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.PageIndex = query.PageIndex;
                response.PageSize = query.PageSize;
                response.Count = result.Count;
                response.Result = result;

                return Ok(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };
                response.Result = null;

                return BadRequest(response);
            }
        }
        [HttpGet("InventoryValuationReport")]
        public async Task<ActionResult> GetInventoryValuationReport(
             [FromQuery] InventoryValuationReportDto query)
        {
            var response = new ApiResponse();

            try
            {
                var result = await _mediator.Send(
                    new InventoryValuationReport.Query
                    {
                        TenantId = query.TenantId,
                        WarehouseId = query.WarehouseId,
                        SearchText = query.SearchText,
                        FromDate = query.FromDate,
                        ToDate = query.ToDate,
                        PageIndex = query.PageIndex,
                        PageSize = query.PageSize
                    });

                response.IsSuccess = true;
                response.StatusCode = HttpStatusCode.OK;
                response.PageIndex = query.PageIndex;
                response.PageSize = query.PageSize;
                response.Count = result.FirstOrDefault()?.TotalRecords ?? 0;
                response.Result = result;
                return Ok(response);
            }
            catch (Exception ex)
            {
                response.IsSuccess = false;
                response.StatusCode = HttpStatusCode.InternalServerError;
                response.ErrorMessage = new List<string> { ex.Message };
                response.Result = null;

                return BadRequest(response);
            }
        }
    }
}