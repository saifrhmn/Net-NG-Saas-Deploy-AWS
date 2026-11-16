using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Tenant;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Tenants.Queries
{
    public class GetAllTenant
    {
        public sealed class Query : IRequest<List<TenantResponse>>
        {
            public string SearchText { get; set; }
            public int TenantId { get; set; }
            public int? RoleId { get; set; }
            public string DepotCode { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<TenantResponse>>
        {
            private readonly IGenericRepository<Tenant> _repository;
            private readonly IGenericRepository<User> _userRepository;
            private readonly IGenericRepository<Role> _role_repository;
            public QueryHandler(
                IGenericRepository<Tenant> repository, 
                IGenericRepository<User> userRepository, 
                IGenericRepository<Role> role_repository)
            {
                _repository = repository;
                _userRepository = userRepository;
                _role_repository = role_repository;
            }

            public async Task<List<TenantResponse>> Handle(Query request, CancellationToken cancellationToken)
            {

                var query = from t in _repository.Query()
                            join u in _userRepository.Query()
                                on t.Id equals u.TenantId
                            join r in _role_repository.Query()
                                on u.RoleId equals r.Id
                            where t.Status != StatusEnum.Deleted
                            select new TenantResponse
                            {
                                Id = t.Id,
                                TenantId = t.TenantId,
                                Name = u.Name,
                                Contact = u.PhoneNumber,
                                Email = t.Email,
                                AddressLine1 = t.AddressLine1,
                                AddressLine2 = t.AddressLine2,
                                RoleId = r.Id,
                                RoleName = r.Name,
                                Phone = t.Phone,
                                TenantCustomerNo = t.TenantCustomerNo,
                                Domain = t.Domain,
                                DepotCode = t.DepotCode
                            };

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    query = query.Where(p => p.Name.ToLower().Trim().Contains(request.SearchText.Trim().ToLower()) 
                            || p.Contact.Trim().Contains(request.SearchText.Trim().ToLower()) 
                            || p.Email.Trim().ToLower().Contains(request.SearchText.Trim().ToLower()));
                }
                if (request.TenantId > 0)
                {
                    query = query.Where(p => p.Id == request.TenantId);
                }
                if (!string.IsNullOrWhiteSpace(request.DepotCode))
                {
                    query = query.Where(p => p.DepotCode.Contains(request.DepotCode));
                }
                if (request.RoleId > 0)
                {
                    query = query.Where(p => p.RoleId == request.RoleId);
                }
                var totalCount = await query.CountAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query.Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                                 .Take(request.PageSize.Value);
                }

                var response = await query.ToListAsync(cancellationToken);

                if (response.Count > 0)
                {
                    response[0].TotalCount = totalCount;
                }

                return response.OrderByDescending(p => p.Name).ToList();
            }
        }
    }
}
