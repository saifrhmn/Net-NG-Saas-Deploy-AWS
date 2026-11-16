using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.Payment;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.ReturnOrder;
using Karbar.Domain.Enums;
using Mapster;
using MediatR;
using Microsoft.EntityFrameworkCore;
using PaymentEntity = Karbar.Domain.Entities.Payment.Payment;

namespace Karbar.Application.Features.Payment.Queries
{
    public class GetAllPayment
    {
        public sealed class Query : IRequest<List<PaymentResponse>>
        {
            public string? SearchText { get; set; }
            public int? TenantId { get; set; }
            public int? UserType { get; set; }
            public int? UserId { get; set; }
            public DateTime? FromDate { get; set; }
            public DateTime? ToDate { get; set; }
            public int? PageIndex { get; set; }
            public int? PageSize { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, List<PaymentResponse>>
        {
            private readonly IGenericRepository<PaymentEntity> _repository;
            private readonly IGenericRepository<Supplier> _supplierRepository;
            private readonly IGenericRepository<Customer> _customerRepository;
            private readonly IGenericRepository<ReturnOrderMaster> _returnOrderRepository;

            public QueryHandler(
                IGenericRepository<PaymentEntity> repository,
                IGenericRepository<Supplier> supplierRepository,
                IGenericRepository<Customer> customerRepository,
                IGenericRepository<ReturnOrderMaster> returnOrderRepository)
            {
                _repository = repository;
                _supplierRepository = supplierRepository;
                _customerRepository = customerRepository;
                _returnOrderRepository = returnOrderRepository;
            }

            public async Task<List<PaymentResponse>> Handle(
                        Query request,
                        CancellationToken cancellationToken)
            {
                var query = _repository.Query()
                    .Where(x => x.Status != StatusEnum.Deleted);

                #region Filters

                if (request.TenantId.HasValue)
                    query = query.Where(x => x.TenantId == request.TenantId.Value);

                if (request.UserType.HasValue)
                    query = query.Where(x => x.UserType == (UserTypeEnum)request.UserType.Value);

                if (request.UserId.HasValue)
                    query = query.Where(x => x.UserId == request.UserId.Value);

                if (request.FromDate.HasValue)
                    query = query.Where(x => x.CreatedDate >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(x => x.CreatedDate <= request.ToDate.Value);

                if (!string.IsNullOrWhiteSpace(request.SearchText))
                {
                    var search = request.SearchText.Trim().ToLower();

                    var customerIds = _customerRepository.Query()
                        .Where(c =>
                            (c.Name != null && c.Name.ToLower().Contains(search)) ||
                            (c.Contact != null && c.Contact.Contains(search))  ||
                            (c.Phone != null && c.Phone.Contains(search)))
                        .Select(c => c.Id);

                    var supplierIds = _supplierRepository.Query()
                        .Where(s =>
                            (s.Name != null && s.Name.ToLower().Contains(search)) ||
                            (s.PhoneNo != null && s.PhoneNo.Contains(search)))
                        .Select(s => s.Id);

                    query = query.Where(p =>
                        (p.OrderInvoiceNo != null && p.OrderInvoiceNo.ToLower().Contains(search)) ||
                        (p.AccountNumber != null && p.AccountNumber.ToLower().Contains(search)) ||
                        (p.UserType == UserTypeEnum.Customer && customerIds.Contains(p.UserId)) ||
                        (p.UserType == UserTypeEnum.Supplier && supplierIds.Contains(p.UserId)));
                }

                #endregion

                #region STEP 1: Get latest invoice row per invoice (SAFE)

                var latestInvoiceQuery =
                    from p in query
                    group p by new { p.OrderInvoiceNo, p.TenantId } into g
                    select new
                    {
                        g.Key.OrderInvoiceNo,
                        g.Key.TenantId,
                        MaxDate = g.Max(x => x.CreatedDate)
                    };

                var latestInvoiceKeys = await latestInvoiceQuery
                    .ToListAsync(cancellationToken);

                #endregion

                #region STEP 2: Join back to get single row per invoice

                var paidTotalAmtByInvoice = await query
                          .GroupBy(p => new { p.OrderInvoiceNo, p.TenantId })
                          .Select(g => new
                          {
                              g.Key.OrderInvoiceNo,
                              g.Key.TenantId,
                              PaidAmount = g.Sum(x => x.PaidAmount)
                          })
                          .ToDictionaryAsync(
                              x => $"{x.OrderInvoiceNo}_{x.TenantId}",
                              x => x.PaidAmount,
                              cancellationToken);
                                    latestInvoiceQuery = query
                            .GroupBy(p => new { p.OrderInvoiceNo, p.TenantId })
                            .Select(g => new
                            {
                                g.Key.OrderInvoiceNo,
                                g.Key.TenantId,
                                MaxDate = g.Max(x => x.CreatedDate)
                            });

                var invoiceQuery =
                    from p in query
                    join l in latestInvoiceQuery
                        on new { p.OrderInvoiceNo, p.TenantId, p.CreatedDate }
                        equals new { l.OrderInvoiceNo, l.TenantId, CreatedDate = l.MaxDate }
                    select new PaymentResponse
                    {
                        OrderInvoiceNo = p.OrderInvoiceNo,
                        TenantId = p.TenantId,
                        UserId = p.UserId,
                        PaymentMethod = (PaymentMethodEnum)p.PaymentMethod,
                        //PaymentMethodName = p.PaymentMethodName,
                        //PaymentTypeName = p.PaymentTypeName,
                        UserType = p.UserType,
                        CreatedDate = p.CreatedDate,
                        AccountNumber = p.AccountNumber,
                        TotalAmount = p.TotalAmount,
                        DueAmount = p.DueAmount,
                        PaidAmount = p.PaidAmount,
                        DiscountAmount = p.DiscountAmount,
                        BankName = p.BankName
                    };

                #endregion

                #region Count

                var totalCount = await invoiceQuery.CountAsync(cancellationToken);

                #endregion

                #region STEP 3: Discount Totals (per invoice)

                var discountTotalByInvoice = await query
                    .GroupBy(x => new { x.OrderInvoiceNo, x.TenantId })
                    .Select(g => new
                    {
                        g.Key.OrderInvoiceNo,
                        g.Key.TenantId,
                        DiscountAmount = g.Sum(x => x.DiscountAmount)
                    })
                    .ToDictionaryAsync(
                        x => $"{x.OrderInvoiceNo}_{x.TenantId}",
                        x => x.DiscountAmount,
                        cancellationToken);

                #endregion

                #region STEP 4: Return totals

                var returnTotalByInvoice = await _returnOrderRepository.Query()
                    .Where(x => x.Status != StatusEnum.Deleted)
                    .GroupBy(x => new { x.SalesInvoiceNo, x.TenantId })
                    .Select(g => new
                    {
                        g.Key.SalesInvoiceNo,
                        g.Key.TenantId,
                        ReturnAmount = g.Sum(x => x.TotalAmount)
                    })
                    .ToDictionaryAsync(
                        x => $"{x.SalesInvoiceNo}_{x.TenantId}",
                        x => x.ReturnAmount,
                        cancellationToken);

                #endregion

                #region STEP 5: Pagination

                invoiceQuery = invoiceQuery
                    .OrderByDescending(x => x.CreatedDate);

                if (request.PageIndex.HasValue && request.PageSize.HasValue)
                {
                    invoiceQuery = invoiceQuery
                        .Skip((request.PageIndex.Value - 1) * request.PageSize.Value)
                        .Take(request.PageSize.Value);
                }

                #endregion

                var response = await invoiceQuery.ToListAsync(cancellationToken);

                response.ForEach(x => x.TotalCount = totalCount);

                if (!response.Any())
                    return response;

                #region STEP 6: User Mapping

                var userIds = response.Select(x => x.UserId).Distinct().ToList();

                var customers = await _customerRepository.Query()
                    .Where(x => userIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.Name,
                        Phone = x.Contact ?? "",
                        Address = x.Address+" "+x.AddressLine1+" "+ x.AddressLine2
                    })
                    .ToListAsync(cancellationToken);

                var suppliers = await _supplierRepository.Query()
                    .Where(x => userIds.Contains(x.Id))
                    .Select(x => new
                    {
                        x.Id,
                        x.Name,
                        Phone = x.PhoneNo ?? "",
                        Address = x.Address + " " 
                    })
                    .ToListAsync(cancellationToken);

                var customerDict = customers.ToDictionary(x => x.Id);
                var supplierDict = suppliers.ToDictionary(x => x.Id);

                #endregion

                #region STEP 7: Final Calculation

                foreach (var item in response)
                {
                    var key = $"{item.OrderInvoiceNo}_{item.TenantId}";

                    var returnAmount = returnTotalByInvoice.TryGetValue(key, out var rt) ? rt : 0;
                    var discountAmount = discountTotalByInvoice.TryGetValue(key, out var dt) ? dt : 0;
                    var paidAmount = paidTotalAmtByInvoice.TryGetValue(key, out var pa) ? pa : 0;
                    item.PaidAmount = paidAmount;
                    //item.TotalAmount -= returnAmount;
                    //item.DueAmount -= returnAmount;
                    item.DiscountAmount = discountAmount;

                    if (item.UserType == UserTypeEnum.Customer &&
                        customerDict.TryGetValue(item.UserId, out var customer))
                    {
                        item.UserName = customer.Name;
                        item.UserPhone = customer.Phone;
                        item.UserAddress = customer.Address;
                    }
                    else if (item.UserType == UserTypeEnum.Supplier &&
                             supplierDict.TryGetValue(item.UserId, out var supplier))
                    {
                        item.UserName = supplier.Name;
                        item.UserPhone = supplier.Phone;
                        item.UserAddress = supplier.Address;
                    }
                }

                #endregion

                return response;
            }
        }
    }
}
