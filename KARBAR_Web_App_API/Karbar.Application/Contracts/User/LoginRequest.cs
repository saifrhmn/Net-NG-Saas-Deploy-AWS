using System;

namespace Karbar.Application.Contracts.User
{
    public class LoginRequest
    {
        public string PhoneNo { get; set; }
        public string Password { get; set; }
    }
}