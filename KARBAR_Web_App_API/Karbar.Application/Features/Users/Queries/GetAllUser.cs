using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Customer;
using Karbar.Application.Contracts.User;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Users.Queries
{
    public class GetAllUser
    {
        public sealed class Query : IRequest<List<UserResponse>>
        {
            public string SearchText { get; set; }
            public int? TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<UserResponse>>
        {
            private readonly IGenericRepository<User> _repository;
            private readonly IGenericRepository<Tenant> _tenantRepository;
            public QueryHandler(IGenericRepository<User> repository, IGenericRepository<Tenant> tenantRepository)
            {
                _repository = repository;
                _tenantRepository = tenantRepository;
            }

            public async Task<List<UserResponse>> Handle(Query request, CancellationToken cancellationToken)
            {

                //var query = _repository.Query()
                //  .Where(x => x.Status != StatusEnum.Deleted);

                //if (!(request.TenantId == 0 || request.TenantId == null))
                //{
                //    query = query.Where(p =>
                //        p.ParentTenantId == request.TenantId ||
                //        p.TenantId == request.TenantId);
                //}

                //if (!string.IsNullOrWhiteSpace(request.SearchText))
                //{
                //    var search = request.SearchText.Trim().ToLower();

                //    query = query.Where(p =>
                //        p.Name.ToLower().Contains(search) ||
                //        p.PhoneNumber.ToLower().Contains(search) ||
                //        p.Email.ToLower().Contains(search));
                //}

                //query = query.OrderByDescending(x => x.Id);

                //var totalCount = await query.CountAsync(cancellationToken);

                //if (request.PageIndex.HasValue && request.PageSize.HasValue)
                //{
                //    query = query
                //        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                //        .Take(request.PageSize.Value);
                //}
                //var result = await query.ToListAsync(cancellationToken);

                //var response = result.Select(u =>
                //{
                //    var userResponse = u.Adapt<UserResponse>();

                //    userResponse.RoleName = u.RoleId switch
                //    {
                //        1 => "System-Admin",
                //        2 => "Admin",
                //        3 => "Dealer",
                //        _ => "Dealer-Manager"
                //    };

                //    userResponse.TotalCount = totalCount;

                //    return userResponse;
                var baseQuery = _repository.Query()
                            .Where(x => x.Status != StatusEnum.Deleted);

                // Tenant filter
                if (!(request.TenantId == 0 || request.TenantId == null))
                {
                    baseQuery = baseQuery.Where(p =>
                        p.ParentTenantId == request.TenantId ||
                        p.TenantId == request.TenantId);
                }

                // Search filter
                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();

                    baseQuery = baseQuery.Where(p =>
                        p.Name.ToLower().Contains(search) ||
                        p.PhoneNumber.ToLower().Contains(search) ||
                        p.Email.ToLower().Contains(search));
                }

                // Order
                baseQuery = baseQuery.OrderByDescending(x => x.Id);

                // Total count (before pagination)
                var totalCount = await baseQuery.CountAsync(cancellationToken);

                // Pagination
                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    baseQuery = baseQuery
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }
                // ✅ JOIN AFTER FILTERING + PAGING
                var query = from u in baseQuery
                            join t in _tenantRepository.Query()
                                on u.TenantId equals t.Id into tenantGroup
                            from t in tenantGroup.DefaultIfEmpty()
                            select new { u, t };

                var result = await query.ToListAsync(cancellationToken);


                // ✅ Mapping
                var response = result.Select(x =>
                {
                    var userResponse = x.u.Adapt<UserResponse>();

                    userResponse.RoleName = x.u.RoleId switch
                    {
                        1 => "System-Admin",
                        2 => "Admin",
                        3 => "Dealer",
                        _ => "Dealer-Manager"
                    };

                    userResponse.TotalCount = totalCount;

                    // ✅ Add TenantCustomerNo
                    userResponse.TenantCustomerNo = x.t?.TenantCustomerNo;
                    userResponse.AddressLine1 = x.t?.AddressLine1;
                    userResponse.AddressLine2 = x.t?.AddressLine2;
                    return userResponse;
                }).OrderByDescending(p => p.Id).ToList();

                return response;
            }
        }
    }
}