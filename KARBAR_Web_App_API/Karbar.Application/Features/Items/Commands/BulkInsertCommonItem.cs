using FluentValidation;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using NPOI.HSSF.UserModel;
using NPOI.SS.UserModel;
using NPOI.XSSF.UserModel;
using System.Text.Json.Serialization;

namespace Karbar.Application.Features.Items.Commands
{
    // Reads an Excel sheet of Materials and updates Materials.IsCommonItem.
    // Column sequence (row 1 = header):
    // A Id | B MaterialNumber | C MaterialDescription | D MaterialGroup | E MaterialGroupDescription |
    // F MaterialGroupLongDescription | G MaterialType | H BaseUnitOfMeasure | I SizeOrPackSize |
    // J Volume | K IsCommonItem
    public static class BulkInsertCommonItem
    {
        private const int ColMaterialNumber = 1;  // B
        private const int ColIsCommonItem = 10;   // K

        #region Command
        public sealed class Command : IRequest<int>
        {
            [JsonIgnore]
            public Stream FileStream { get; set; } = default!;
            public string FileName { get; set; } = string.Empty;
        }
        #endregion

        #region Validator
        public class Validator : AbstractValidator<Command>
        {
            public Validator()
            {
            }
        }
        #endregion

        #region CommandHandler
        public sealed class CommandHandler : IRequestHandler<Command, int>
        {
            private readonly IGenericRepository<Material> _materialRepository;

            public CommandHandler(IGenericRepository<Material> materialRepository)
            {
                _materialRepository = materialRepository;
            }

            public async Task<int> Handle(Command request, CancellationToken cancellationToken)
            {
                IWorkbook workbook = Path.GetExtension(request.FileName).ToLower() switch
                {
                    ".xls" => new HSSFWorkbook(request.FileStream),
                    ".xlsx" => new XSSFWorkbook(request.FileStream),
                    _ => throw new Exception("Invalid Excel format")
                };

                var sheet = workbook.GetSheetAt(0);
                int updatedCount = 0;

                for (int rowIndex = 1; rowIndex <= sheet.LastRowNum; rowIndex++)
                {
                    var row = sheet.GetRow(rowIndex);
                    if (row == null) continue;

                    string? materialNumber = row.GetCell(ColMaterialNumber)?.ToString()?.Trim();
                    if (string.IsNullOrEmpty(materialNumber)) continue;

                    // 1 => 1, anything else (0, blank, other) => 0
                    int.TryParse(row.GetCell(ColIsCommonItem)?.ToString()?.Trim(), out int cellValue);
                    int isCommonItem = cellValue == 1 ? 1 : 0;

                    // Materials is a keyless view, so update it directly in SQL instead of tracking entities
                    updatedCount += await _materialRepository.Query()
                        .Where(x => x.MaterialNumber == materialNumber)
                        .ExecuteUpdateAsync(s => s.SetProperty(x => x.IsCommonItem, isCommonItem), cancellationToken);
                }

                return updatedCount;
            }
        }
        #endregion
    }
}
