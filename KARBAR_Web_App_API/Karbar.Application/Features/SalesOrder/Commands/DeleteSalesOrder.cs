using Karbar.Application.Common.Interface;
using Karbar.Application.Features.Stock.Commands;
using Karbar.Domain.Entities.SalesOrder;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Application.Features.SalesOrder.Commands
{
    public static class DeleteSalesOrder
    {
        public sealed class Command : IRequest<string>
        {
            public int SalesOrderId { get; set; }
        }

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<SalesOrderMaster> _masterRepository;
            private readonly IGenericRepository<SalesOrderDetail> _detailRepository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _RepositoryStock;

            public CommandHandler(
                IGenericRepository<SalesOrderMaster> masterRepository,
                IGenericRepository<SalesOrderDetail> detailRepository,
                   IGenericRepository<Karbar.Domain.Entities.Stock> RepositoryStock
                )

            {
                _masterRepository = masterRepository;
                _detailRepository = detailRepository;
                _RepositoryStock = RepositoryStock;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var master = await _masterRepository.Query()
                    .Where(x => x.Id == request.SalesOrderId && x.Status != StatusEnum.Deleted)
                    .FirstOrDefaultAsync(cancellationToken);

                if (master == null)
                    return "Not found";

                var details = await _detailRepository.Query()
                    .Where(d => d.SalesOrderId == master.Id && d.Status != StatusEnum.Deleted)
                    .ToListAsync(cancellationToken);

                foreach (var d in details)
                    await _detailRepository.DeleteAsync(d, cancellationToken);
                // Update Stock 
                if (!master.IsDraft.HasValue)
                {
                    foreach (var i in details)
                    {
                        await StockHelper.IncreaseStockAsync(
                            _RepositoryStock,
                            i.ItemId,
                            null,
                            0,
                            i.Quantity);
                    }
                }
                
                await _masterRepository.DeleteAsync(master, cancellationToken);
                await _masterRepository.SaveChangesAsync(cancellationToken);

                return "Sales order deleted successfully";
            }
        }
    }
}