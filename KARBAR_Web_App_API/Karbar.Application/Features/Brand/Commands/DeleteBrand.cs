using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.Extensions.DependencyInjection;

namespace Karbar.Application.Features.Brands.Commands
{
    public static class DeleteBrand
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public int BrandId { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator(IServiceScopeFactory serviceScopeFactory)
            {
                RuleFor(v => v.BrandId)
                    .NotEmpty().WithMessage("invalid request");
            }
        }

        #endregion

        #region command handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<Karbar.Domain.Entities.Brand> _repository;
            private readonly IValidator<Command> _validator;

            public CommandHandler(
                IGenericRepository<Karbar.Domain.Entities.Brand> repository,
                IValidator<Command> validator)
            {
                _repository = repository;
                _validator = validator;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);

                if (!validationResult.IsValid)
                {
                    throw new ValidationException(validationResult.Errors);
                }

                var brand = await _repository.GetByIdAsync(x => x.Id == request.BrandId, cancellationToken);
                if (brand == null) return "Brand not found";

                await _repository.DeleteAsync(brand, cancellationToken);
                await _repository.SaveChangesAsync(cancellationToken);

                return "Deleted Successfully";
            }
        }

        #endregion
    }
}