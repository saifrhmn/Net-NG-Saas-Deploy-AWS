using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Customer;
using Karbar.Application.Contracts.Supplier;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Karbar.Application.Features.Customers.Queries
{
    public class GetAllCustomer
    {
        public sealed class Query : IRequest<List<CustomerResponse>>
        {
            public string SearchText { get; set; }
            public int TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<CustomerResponse>>
        {
            private readonly IGenericRepository<Customer> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Payment.Payment> _repositoryPayment;
            public QueryHandler(IGenericRepository<Customer> repository, IGenericRepository<Karbar.Domain.Entities.Payment.Payment> repositoryPayment)
            {
                _repository = repository;
                _repositoryPayment = repositoryPayment;
            }

            public async Task<List<CustomerResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                     .Query()
                     .Where(x => x.Status != StatusEnum.Deleted);

                if (request.TenantId > 1 || request.TenantId == -1)
                {
                    query = query.Where(p => p.TenantId == request.TenantId);
                }

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p =>
                        p.Name.ToLower().Contains(search) ||
                        p.Contact.ToLower().Contains(search) ||
                        p.Address.ToLower().Contains(search));
                }
                query = query.OrderByDescending(p => p.CreatedDate);
                var totalCount = await query.CountAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var result = await query.ToListAsync(cancellationToken);
                var customerIds = result.Select(x => x.Id).ToList();
                var latestPaymentsPerInvoice = await _repositoryPayment
                                    .Query()
                                    .Where(p =>
                                        //p.Status == StatusEnum.Active &&
                                        p.UserType == UserTypeEnum.Customer &&   // clearer than (UserTypeEnum)1
                                        customerIds.Contains(p.UserId))
                                    .GroupBy(p => new { p.UserId, p.OrderInvoiceNo })
                                    .Select(g => g
                                        .OrderByDescending(x => x.CreatedDate)
                                        .ThenByDescending(x => x.Id)
                                        .First())
                                    .ToListAsync(cancellationToken);

                var dueAmounts = latestPaymentsPerInvoice
                                    .GroupBy(x => x.UserId)
                                    .Select(g => new
                                    {
                                        CustomerId = g.Key,
                                        TotalDue = g.Sum(x => x.DueAmount)
                                    })
                                    .ToList();
                var dueDict = dueAmounts.ToDictionary(x => x.CustomerId, x => x.TotalDue);
                
                var response = result.Adapt<List<CustomerResponse>>() ?? new List<CustomerResponse>();

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;
                response.ForEach(item =>
                        item.TotalDueAmount = dueDict.TryGetValue(item.Id, out var due) ? due : 0);
                return response;
            }
        }
    }
}