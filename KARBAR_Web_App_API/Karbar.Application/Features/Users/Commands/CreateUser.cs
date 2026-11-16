using System;
using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using System.Security.Claims;

namespace Karbar.Application.Features.Users.Commands
{
    public static class CreateUser
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int Id { get; set; }
            public string UserId { get; set; } = null;
            public string UserName { get; set; }
            public string Name { get; set; }
            public string Email { get; set; } = null;
            public string? PhoneNumber { get; set; }
            public string? Password { get; set; }
            public int TenantId { get; set; }
            public int? ParentTenantId { get; set; }
            public int RoleId { get; set; }
            public int Status { get; set; }
            public string? ImagePath { get; set; }
            public string? SignatureImagePath { get; set; }
            public string? AddressLine1 { get; set; }
            public string? AddressLine2 { get; set; }
            public string? Phone { get; set; }
            public string? TenantCustomerNo { get; set; }
            public string? RawPassword { get; set; }

        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.UserName)
                    .NotEmpty().WithMessage("UserName is required.")
                    .MaximumLength(256).WithMessage("UserName must not exceed 256 characters.");

                RuleFor(v => v.Email)
                    .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email)).WithMessage("Email is not valid.");

                RuleFor(v => v.Password)
                    .MinimumLength(6).When(x => !string.IsNullOrEmpty(x.Password)).WithMessage("Password must be at least 6 characters.");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<User> _repository;
            private readonly IGenericRepository<Tenant> _t_repository;
            private readonly IGenericRepository<Warehouse> _whRepository;
            private readonly IValidator<Command> _validator;
            private readonly IHttpContextAccessor _httpContextAccessor;

            public CommandHandler(
                IGenericRepository<User> repository,
                IGenericRepository<Tenant> t_repository,
                IGenericRepository<Warehouse> whRepository,
                IValidator<Command> validator,
                IHttpContextAccessor httpContextAccessor)
            {
                _repository = repository;
                _t_repository = t_repository;
                _whRepository = whRepository;
                _validator = validator;
                _httpContextAccessor = httpContextAccessor;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                //var actorUserId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                //var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                //if (!validationResult.IsValid)
                //{
                //    throw new ValidationException(validationResult.Errors);
                //}

                //string userGenId = GenerateId.MakeId();
                //Tenant entity_t = null;

                //if (request.RoleId != 1 && request.RoleId != 2)
                //{
                //    if (string.IsNullOrEmpty(request.TenantCustomerNo))
                //    {
                //        return "SAP number is required.";
                //    }
                //    if (!string.IsNullOrEmpty(request.TenantCustomerNo) && (request.Id == 0))
                //    {


                //        var duplicateTenant = await _t_repository.GetByIdAsync(
                //            x => x.TenantCustomerNo == request.TenantCustomerNo,
                //            cancellationToken);

                //        if (duplicateTenant != null)
                //        {
                //            return "SAP number already exists.";
                //        }
                //    }

                //}
                //entity_t = await _t_repository.GetByIdAsync(
                //       x => x.Id == request.TenantId,
                //       cancellationToken);
                //if (entity_t == null)
                //    {
                //        entity_t = new Tenant
                //        {
                //            TenantId = GenerateId.MakeId(),
                //            CreatedBy = userGenId,
                //            CreatedDate = DateTime.Now,
                //            Status = StatusEnum.Active,
                //            Name = request.Name,
                //            Contact = request.PhoneNumber,
                //            Email = request.Email,
                //            AddressLine1 = request.AddressLine1,
                //            AddressLine2 = request.AddressLine2,
                //            Phone = request.Phone,
                //            TenantCustomerNo = request.TenantCustomerNo
                //        };

                //        await _t_repository.AddAsync(entity_t, cancellationToken);
                //    }
                //    else
                //    {
                //        entity_t.Name = request.Name;
                //        entity_t.Contact = request.PhoneNumber;
                //        entity_t.Email = request.Email;
                //        entity_t.AddressLine1 = request.AddressLine1;
                //        entity_t.AddressLine2 = request.AddressLine2;
                //        entity_t.Phone = request.Phone;
                //        entity_t.TenantCustomerNo = request.TenantCustomerNo;

                //        entity_t.UpdatedBy = userGenId;
                //        entity_t.UpdatedDate = DateTime.Now;

                //        _t_repository.UpdateAsync(entity_t);
                //    }

                //    await _t_repository.SaveChangesAsync(cancellationToken);

                //User entity;
                //if (!string.IsNullOrEmpty(request.UserId))
                //{
                //    entity = await _repository.GetByIdAsync(x => x.UserId == request.UserId, cancellationToken);

                //    if (entity == null)
                //        return "User not found";

                //    entity.UpdatedDate = DateTime.Now;
                //    entity.UpdatedBy = actorUserId;
                //    entity.TenantId = request.TenantId;
                //    entity.Status = (StatusEnum)request.Status;
                //}
                //else
                //{
                //    entity = new User
                //    {
                //        UserId = userGenId,
                //        CreatedBy = actorUserId,
                //        CreatedDate = DateTime.Now,
                //        Status = StatusEnum.Active,
                //        TenantId = entity_t.Id                        
                //    };
                //}

                //entity.UserName = request.UserName;
                //entity.Name = request.UserName;
                //entity.RoleId = request.RoleId;
                //entity.Email = request.Email;
                //entity.PhoneNumber = request.PhoneNumber;
                //entity.ParentTenantId = request.ParentTenantId;
                //if (!string.IsNullOrEmpty(request.ImagePath)) { entity.ImageUrl = request.ImagePath; }
                //if (!string.IsNullOrEmpty(request.SignatureImagePath)) { entity.SignatureImageUrl = request.SignatureImagePath; }
                //if (!string.IsNullOrWhiteSpace(request.Password))
                //{
                //    entity.PasswordHash = CryptoHasher.DoHash(request.Password);
                //}

                //var res = string.Empty;
                //if (!string.IsNullOrEmpty(request.UserId))
                //{
                //    await _repository.UpdateAsync(entity, cancellationToken);
                //    res = "Updated Successfully";
                //}
                //else
                //{
                //    await _repository.AddAsync(entity, cancellationToken);
                //    res = "Created Successfully";
                //}
                //await _repository.SaveChangesAsync(cancellationToken);


                //return res;
                var actorUserId = _httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);

                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                {
                    throw new ValidationException(validationResult.Errors);
                }

                string userGenId = GenerateId.MakeId();

                #region Duplicate Phone / Email

                // Login looks users up by phone or email, so these must be unique
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                {
                    var duplicatePhone = await _repository.GetByIdAsync(
                        x => x.PhoneNumber == request.PhoneNumber
                             && x.UserId != request.UserId
                             && x.Status != StatusEnum.Deleted,
                        cancellationToken);

                    if (duplicatePhone != null)
                    {
                        return "Phone number already exists.";
                    }
                }

                if (!string.IsNullOrWhiteSpace(request.Email))
                {
                    var duplicateEmail = await _repository.GetByIdAsync(
                        x => x.Email == request.Email
                             && x.UserId != request.UserId
                             && x.Status != StatusEnum.Deleted,
                        cancellationToken);

                    if (duplicateEmail != null)
                    {
                        return "Email already exists.";
                    }
                }

                #endregion

                #region Tenant Validation

                // Dealer only
                if (request.RoleId == 3)
                {
                    if (string.IsNullOrWhiteSpace(request.TenantCustomerNo))
                    {
                        return "SAP number is required.";
                    }

                    var duplicateTenant = await _t_repository.GetByIdAsync(
                        x => x.TenantCustomerNo == request.TenantCustomerNo
                             && x.Id != request.TenantId,
                        cancellationToken);

                    if (duplicateTenant != null)
                    {
                        return "SAP number already exists.";
                    }
                }

                #endregion

                #region Create / Update Tenant

                Tenant entity_t = null;

                if (request.TenantId > 0)
                {
                    entity_t = await _t_repository.GetByIdAsync(
                        x => x.Id == request.TenantId,
                        cancellationToken);
                }

                if (entity_t == null)
                {
                    entity_t = new Tenant
                    {
                        TenantId = GenerateId.MakeId(),
                        CreatedBy = actorUserId,
                        CreatedDate = DateTime.Now,
                        Status = StatusEnum.Active,
                        Name = request.Name,
                        Contact = request.PhoneNumber,
                        Email = request.Email,
                        AddressLine1 = request.AddressLine1,
                        AddressLine2 = request.AddressLine2,
                        Phone = request.Phone,
                        TenantCustomerNo = request.RoleId == 3 ? request.TenantCustomerNo : null
                    };

                    await _t_repository.AddAsync(entity_t, cancellationToken);
                }
                else
                {
                    entity_t.Name = request.Name;
                    entity_t.Contact = request.PhoneNumber;
                    entity_t.Email = request.Email;
                    entity_t.AddressLine1 = request.AddressLine1;
                    entity_t.AddressLine2 = request.AddressLine2;
                    entity_t.Phone = request.Phone;

                    if (request.RoleId == 3)
                    {
                        entity_t.TenantCustomerNo = request.TenantCustomerNo;
                    }
                    else
                    {
                        entity_t.TenantCustomerNo = null;
                    }

                    entity_t.UpdatedBy = actorUserId;
                    entity_t.UpdatedDate = DateTime.Now;

                    await _t_repository.UpdateAsync(entity_t, cancellationToken);
                }

                await _t_repository.SaveChangesAsync(cancellationToken);

                #endregion

                #region Default Warehouse (Dealer only)

                if (request.RoleId == 3)
                {
                    const string warehouseName = "MainShop";

                    var warehousefind = await _whRepository.GetByIdAsync(
                        x => x.TenantId == entity_t.Id
                             && x.Name == warehouseName
                             && x.Status != StatusEnum.Deleted,
                        cancellationToken);

                    if (warehousefind == null)
                    {
                        warehousefind = new Warehouse
                        {
                            WarehouseId = GenerateId.MakeId(),
                            Name = warehouseName,
                            TenantId = entity_t.Id,
                            CreatedDate = DateTime.Now,
                            CreatedBy = actorUserId,
                            Status = StatusEnum.Active,
                        };
                        await _whRepository.AddAsync(warehousefind, cancellationToken);
                        await _whRepository.SaveChangesAsync(cancellationToken);
                    }
                }

                #endregion

                #region Create / Update User

                User entity;

                if (!string.IsNullOrWhiteSpace(request.UserId))
                {
                    entity = await _repository.GetByIdAsync(
                        x => x.UserId == request.UserId,
                        cancellationToken);

                    if (entity == null)
                    {
                        return "User not found.";
                    }  
                    entity.UpdatedBy = actorUserId;
                    entity.UpdatedDate = DateTime.Now;
                    entity.Status = (StatusEnum)request.Status;
                }
                else
                {
                    entity = new User
                    {
                        UserId = userGenId,
                        CreatedBy = actorUserId,
                        CreatedDate = DateTime.Now,
                        Status = StatusEnum.Active
                    };
                }

                entity.TenantId = entity_t.Id;
                entity.UserName = request.UserName;
                entity.Name = request.UserName;
                entity.RoleId = request.RoleId;
                entity.Email = request.Email;
                entity.PhoneNumber = request.PhoneNumber;
                entity.ParentTenantId = request.ParentTenantId;

                if (!string.IsNullOrWhiteSpace(request.ImagePath))
                {
                    entity.ImageUrl = request.ImagePath;
                }

                if (!string.IsNullOrWhiteSpace(request.SignatureImagePath))
                {
                    entity.SignatureImageUrl = request.SignatureImagePath;
                }

                if (!string.IsNullOrWhiteSpace(request.Password))
                {
                    entity.PasswordHash = CryptoHasher.DoHash(request.Password);
                    // Plain-text copy of the password in AspNetUsers.RawPassword
                    entity.RawPassword = request.Password;
                }

                string result;

                if (!string.IsNullOrWhiteSpace(request.UserId))
                {
                    await _repository.UpdateAsync(entity, cancellationToken);
                    result = "Updated Successfully";
                }
                else
                {
                    await _repository.AddAsync(entity, cancellationToken);
                    result = "Created Successfully";
                }

                await _repository.SaveChangesAsync(cancellationToken);

                #endregion

                return result;
            }
        }

        #endregion
    }
}