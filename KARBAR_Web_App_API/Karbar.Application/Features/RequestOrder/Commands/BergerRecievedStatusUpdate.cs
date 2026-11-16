using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Application.Contracts.RequestOrder;
using Karbar.Application.Contracts.User;
using Karbar.Common.Helpers;
using Karbar.Domain.Entities;
using Karbar.Domain.Entities.RequestOrder;
using Karbar.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Features.RequestOrder.Commands
{
    public static class BergerRecievedStatusUpdate
    {
        #region command

        public sealed class Command : IRequest<string>
        {
            public string InvoiceNo { get; set; }
            public string? BergerRecievedStatus { get; set; }
        }

        #endregion

        #region validator

        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
                RuleFor(v => v.InvoiceNo)
                    .NotEmpty().WithMessage("Invalid Invoice No");
            }
        }

        #endregion

        #region handler

        public sealed class CommandHandler : IRequestHandler<Command, string>
        {
            private readonly IGenericRepository<RequestOrderMaster> _poRepository;
            private readonly IGenericRepository<RequestOrderDetail> _detailRepository;
            private readonly IValidator<Command> _validator;
            
            public CommandHandler(
                IGenericRepository<RequestOrderMaster> poRepository,
                IGenericRepository<RequestOrderDetail> detailRepository,
                IGenericRepository<Karbar.Domain.Entities.Stock> RepositoryStock,
                IValidator<Command> validator)
            {
                _poRepository = poRepository;
                _detailRepository = detailRepository;
                _validator = validator;
            }

            public async Task<string> Handle(Command request, CancellationToken cancellationToken)
            {
                var validationResult = await _validator.ValidateAsync(request, cancellationToken);
                if (!validationResult.IsValid)
                    throw new ValidationException(validationResult.Errors);

                var validInvoiceNo = await _poRepository
                    .GetByIdAsync(x => x.PurchaseInvoiceNo == request.InvoiceNo, cancellationToken);

                if (validInvoiceNo == null)
                    return "Invoice No is not found";

                validInvoiceNo.OrderStatus = request.BergerRecievedStatus; 

                validInvoiceNo.ReceivedDate = DateTime.Now;
                validInvoiceNo.IsBerger = true;

                _poRepository.UpdateAsync(validInvoiceNo);
                await _poRepository.SaveChangesAsync(cancellationToken);

                return "Order Status updated successfully";
            }
        }

        #endregion
    }
}
