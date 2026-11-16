using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities.SalesOrder;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Karbar.Application.Contracts.SalesOrder;

namespace Karbar.Application.Features.SalesOrder.Queries
{
    public static class GetSalesOrderDetails
    {
        public sealed class Query : IRequest<SalesOrderResponse>
        {
            public int SalesOrderId { get; set; }
        }

        public sealed class QueryHandler : IRequestHandler<Query, SalesOrderResponse?>
        {
            private readonly IGenericRepository<SalesOrderMaster> _masterRepository;

            public QueryHandler(IGenericRepository<SalesOrderMaster> masterRepository)
            {
                _masterRepository = masterRepository;
            }

            public async Task<SalesOrderResponse?> Handle(Query request, CancellationToken cancellationToken)
            {
                var m = await _masterRepository.Query()
                    .Include(x => x.SalesOrderDetails)
                    .FirstOrDefaultAsync(x => x.Id == request.SalesOrderId, cancellationToken);

                if (m == null) return null;

                return new SalesOrderResponse
                {
                    Id = m.Id,
                    InvoiceNo = m.InvoiceNo,
                    OrderDate = m.OrderDate.ToString("MM/dd/yy"),
                    CustomerId = m.CustomerId,
                    TotalAmount = m.TotalAmount,
                    DiscountAmount = m.DiscountAmount,
                    Vat = m.Vat,
                    Tax = m.Tax,
                    //PaidAmount = m.PaidAmount,
                    //DueAmount = m.DueAmount,
                    //MobileBankMethod = m.MobileBankMethod,
                    //BankId = m.BankId,
                    //PaymentMethod = m.PaymentMethod,
                    //CardNumber = m.CardNumber,
                    SalesOrderDetails = m.SalesOrderDetails?.Select(d => new SalesOrderDetailResponse
                    {
                        Id = d.Id,
                        ItemId = d.ItemId,
                        UomId = d.UomId,
                        Quantity = d.Quantity,
                        UnitPrice = d.UnitPrice,
                    }).ToList() ?? new List<SalesOrderDetailResponse>()
                };
            }
        }
    }
}