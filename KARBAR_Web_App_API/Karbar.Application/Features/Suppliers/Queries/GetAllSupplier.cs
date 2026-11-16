using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Supplier;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.Suppliers.Queries
{
    public class GetAllSupplier
    {
        public sealed class Query : IRequest<List<SupplierResponse>>
        {
            public string SearchText { get; set; }  
            public int TenantId { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<SupplierResponse>>
        {
            private readonly IGenericRepository<Supplier> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Payment.Payment> _repositoryPayment;


            public QueryHandler(IGenericRepository<Supplier> repository, IGenericRepository<Domain.Entities.Payment.Payment> repositoryPayment)
            {
                _repository = repository;
                _repositoryPayment = repositoryPayment;
            }

            public async Task<List<SupplierResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                    .Query().Where(x => x.Status != StatusEnum.Deleted);

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
                        p.PhoneNo.ToLower().Contains(search) ||
                        p.Email.ToLower().Contains(search));
                }

                var totalCount = await query.CountAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                var result = await query.ToListAsync(cancellationToken);
                var supplierIds = result.Select(x => x.Id).ToList();
                var dueAmounts = await _repositoryPayment
                                    .Query()
                                    .Where(p =>
                                        p.Status != StatusEnum.Deleted &&
                                        p.UserType == UserTypeEnum.Supplier &&   
                                        supplierIds.Contains(p.UserId))
                                    .GroupBy(p => p.UserId)
                                    .Select(g => new
                                    {
                                        CustomerId = g.Key,
                                        TotalDue = g.Sum(x => x.DueAmount)
                                    })
                                    .ToListAsync(cancellationToken);
                var dueDict = dueAmounts.ToDictionary(x => x.CustomerId, x => x.TotalDue);

                var response = result.Adapt<List<SupplierResponse>>() ?? new List<SupplierResponse>();

                if (response.Count > 0)
                    response[0].TotalCount = totalCount;
                response.ForEach(item =>
                        item.TotalDueAmount = dueDict.TryGetValue(item.Id, out var due) ? due : 0);

                return response;
            }
        }
    }
}
