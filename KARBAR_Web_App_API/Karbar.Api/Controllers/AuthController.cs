using Azure.Core;
using FluentValidation;
using Karbar.Application.Contracts.User;
using Karbar.Application.Features.Users.Commands;
using Karbar.Application.Features.Users.Queries;
using Karbar.Common.Shared;
using Mapster;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Net;
using System.Threading;

namespace Karbar.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : Controller
    {
        private readonly IMediator _mediator;

        public AuthController(IMediator mediator)
        {
            _mediator = mediator;
        }
        [HttpPost("login")]
        public async Task<ActionResult> LogIn(LoginRequest request)
        {
            var _response = new ApiResponse();
            try
            {
                var query = new LogIn.Query
                {
                    PhoneNoOrEmail = request.PhoneNo,
                    Password = request.Password
                };

                var result = await _mediator.Send(query);

                if (result == null)
                {
                    _response.IsSuccess = false;
                    _response.StatusCode = HttpStatusCode.Unauthorized;
                    _response.ErrorMessage = new List<string> { "Login Failed" };
                    _response.Result = null;
                    return Unauthorized(_response);
                }

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

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var token = HttpContext.Request.Headers["Authorization"]
            .ToString()
            .Replace("Bearer ", "");

            if (string.IsNullOrEmpty(token))
                return BadRequest(new { message = "Token is missing." });

            // Extract expiry date from JWT
            var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
            var exp = jwt.ValidTo;

            // Send command/query to blacklist or expire refresh token
            var result = await _mediator.Send(new Logout.Query
            {
                Token = token,
                ExpiredAt = exp
            });

            if (!result.IsSuccess)
                return BadRequest(new { message = result.Message });

            return Ok(new { message = "Successfully logged out." });
        }
    }
}
