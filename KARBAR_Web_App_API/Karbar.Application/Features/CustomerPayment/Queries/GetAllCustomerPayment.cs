using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.CustomerPayment;
using CustomerPaymentEntity = Karbar.Domain.Entities.CustomerPayment.CustomerPayment;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Karbar.Application.Features.CustomerPayment.Queries
{
    public class GetAllCustomerPayment
    {
        public sealed class Query : IRequest<List<CustomerPaymentResponse>>
        {
            public string? SearchText { get; set; }
            public int TenantId { get; set; }
            public int? CustomerId { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<CustomerPaymentResponse>>
        {
            private readonly IGenericRepository<CustomerPaymentEntity> _repository;

            public QueryHandler(IGenericRepository<CustomerPaymentEntity> repository)
            {
                _repository = repository;
            }

            public async Task<List<CustomerPaymentResponse>> Handle(Query request, CancellationToken cancellationToken)
            {
                var query = _repository
                    .Query()
                    .AsQueryable();

                if (request.CustomerId.HasValue)
                {
                    query = query.Where(p => p.CustomerId == request.CustomerId.Value);
                }

                if (request.FromDate.HasValue && request.ToDate.HasValue)
                {
                    query = query.Where(p => p.CreatedDate >= request.FromDate.Value && p.CreatedDate <= request.ToDate.Value);
                }

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();
                    query = query.Where(p => (p.OrderInvoiceNo != null && p.OrderInvoiceNo.ToLower().Contains(search))
                                             || (p.PaymentType != null && p.PaymentType.ToLower().Contains(search))
                                             || p.Amount.ToString().Contains(search));
                }

                var totalCount = await query.CountAsync(cancellationToken);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    query = query.Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                                 .Take(request.PageSize.Value);
                }

                var items = await query.ToListAsync(cancellationToken);

                var response = items.Select(i => new CustomerPaymentResponse
                {
                    Id = i.Id,
                    CustomerId = i.CustomerId,
                    PaymentType = i.PaymentType,
                    RequestOrderId = i.RequestOrderId,
                    RequestOrderDetailId = i.RequestOrderDetailId,
                    OrderInvoiceNo = i.OrderInvoiceNo,
                    TotalAmount = i.TotalAmount,
                    PaidAmount = i.PaidAmount,
                    DueAmount = i.DueAmount,
                    Amount = i.Amount,

                    CreatedDate = i.CreatedDate,
                    CreatedBy = i.CreatedBy,
                    UpdatedDate = i.UpdatedDate,
                    UpdatedBy = i.UpdatedBy,
                    Status = i.Status
                }).ToList();

                return response;
            }
        }
    }
}
