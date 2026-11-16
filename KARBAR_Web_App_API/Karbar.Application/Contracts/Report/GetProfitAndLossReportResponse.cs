namespace Karbar.Application.Contracts.Report
{
    public class GetProfitAndLossReportResponse
    {
        public int Sl { get; set; }

        public string Particulars { get; set; } = string.Empty;

        public decimal? Amount1 { get; set; }

        public decimal? Amount2 { get; set; }

        public int TotalCount { get; set; }
    }
}