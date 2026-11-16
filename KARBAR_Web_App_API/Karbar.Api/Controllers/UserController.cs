using FluentValidation;
using Karbar.Api.Common.Images;
using Karbar.Api.RequestDTO;
using Karbar.Application.Contracts.User;
using Karbar.Application.Features.Customers.Queries;
using Karbar.Application.Features.Users.Commands;
using Karbar.Application.Features.Users.Queries;
using Karbar.Common.Shared;
using Karbar.Domain.Entities;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using NPOI.SS.Formula.Functions;
using System.Collections.Generic;
using System.Linq;
using System.Net;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    //[Authorize]

    public class UserController : Controller
    {
        private readonly IMediator _mediator;
        private readonly WebRootUtility _host;
        private readonly IImagePathHelper _appPathHelper;

        public UserController(IMediator mediator, WebRootUtility host, IImagePathHelper appPathHelper)
        {
            _mediator = mediator;
            _host = host;
            _appPathHelper = appPathHelper;
        }
        [HttpGet]
        public async Task<ActionResult> GetAllUser([FromQuery] UserQueryDto query)
        {
            var _response = new ApiResponse();
            if (query.TenantId == 0)
            {
                _response.IsSuccess = false;
                _response.StatusCode = HttpStatusCode.BadRequest;
                _response.ErrorMessage = new List<string> { "TenantId is required." };
                return BadRequest(_response);
            }

            try
            {
                var result = await _mediator.Send(new GetAllUser.Query
                {
                    SearchText = query.SearchText,
                    TenantId = query.TenantId,
                    PageIndex = query.PageIndex,
                    PageSize = query.PageSize
                });
                var mappedUsers = result.Select(u => new
                {
                    Id = u.Id,
                    UserId = u.UserId,
                    UserName = u.UserName,
                    PhoneNumber = u.PhoneNumber,
                    RoleId = u.RoleId,
                    RoleName = u.RoleName,
                    TenantId = u.TenantId,

                    // Convert image paths to full URLs if not null
                    ImageBase64 = _appPathHelper.ToImageUrl(u.ImageUrl),

                    SignatureImageBase64 = _appPathHelper.ToImageUrl(u.SignatureImageUrl),

                    Status = u.Status,
                    TenantCustomerNo = u.TenantCustomerNo,
                    AddressLine1 = u.AddressLine1,
                    AddressLine2 = u.AddressLine2,
                    Count =u.TotalCount,
                }).ToList();

                _response.IsSuccess = true;
                _response.StatusCode = HttpStatusCode.OK;
                _response.Result = mappedUsers;
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

        [HttpGet("{userId}")]
        public async Task<ActionResult> GetUserDetails(int userId)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new GetUserDetails.Query()
                {
                    UserId = userId
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
        public async Task<ActionResult> CreateUser(UserRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                string imagePath = string.Empty, s_imagePath=string.Empty;
                if (!string.IsNullOrEmpty(request.ImageBase64))
                {
                    imagePath = await Base64ToImage.UploadImageAsync(
                        request.ImageBase64,
                        "User",
                        $"{request.PhoneNumber}",
                        _host.GetWwwRootPath()
                    );
                }
                if (!string.IsNullOrEmpty(request.SignatureImageBase64))
                {
                    s_imagePath = await Base64ToImage.UploadImageAsync(
                        request.SignatureImageBase64,
                        "UserSignature",
                        $"{request.PhoneNumber}",
                        _host.GetWwwRootPath()
                    );
                }
                var command = request.Adapt<CreateUser.Command>();
                command.ImagePath = imagePath;
                command.SignatureImagePath = s_imagePath;
                var result = await _mediator.Send(command);
                if (result == "SAP number is required.")
                {
                    var errorMessages = "SAP number is required.";
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessage = new List<string> { errorMessages };
                    _response.Result = null;
                    return BadRequest(_response);
                }
                if (result == "SAP number already exists.")
                {
                    var errorMessages = "SAP number already exists.";
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.BadRequest;
                    _response.ErrorMessage = new List<string> { errorMessages };
                    _response.Result = null;
                    return BadRequest(_response);
                }
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
        [Authorize]
        [HttpDelete("{userId}")]
        public async Task<ActionResult> DeleteUser(int userId)
        {
            var _response = new ApiResponse();
            try
            {
                var command = new DeleteUser.Command()
                {
                    UserId = userId
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
        //[Authorize]
        [HttpPut("reset-password")]
        public async Task<ActionResult> ResetPassword(UserResetPasswordRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var command = new ResetPassword.Command
                {
                    PhoneNumber = request.PhoneNumber,
                    NewPassword = request.NewPassword,
                    ConfirmPassword = request.ConfirmPassword,
                    RawPassword = request.RawPassword
                };
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
    }
}