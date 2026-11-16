using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.Items.Commands
{
    public static class DeleteItem
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int ItemId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory) 
            {
                RuleFor(v => v.ItemId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }

        #endregion

        #region command handler
        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Item> _repository;
            private readonly IGenericRepository<Karbar.Domain.Entities.Stock> _stkrepository;
            private readonly IValidator<Command> _validator;
            public CommandHandler(
                IGenericRepository<Item> repository, IGenericRepository<Karbar.Domain.Entities.Stock> stkrepository
                ,IValidator<Command> validator)
            {
                _repository = repository;
                _stkrepository = stkrepository;
                _validator = validator;
            }
            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {

                var validationResult = await _validator.ValidateAsync(request, cancellationToken);

                if (!validationResult.IsValid)
                {
                    throw new ValidationException(validationResult.Errors);
                }
                var item = await _repository.GetByIdAsync(x => x.Id == request.ItemId, cancellationToken);
                if (item == null) return "Item not found";

                await _repository.DeleteAsync(item, cancellationToken);
                var stock = await _stkrepository.GetByIdAsync(x => x.ItemId == request.ItemId, cancellationToken);
                await _stkrepository.DeleteAsync(stock, cancellationToken);

                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}
