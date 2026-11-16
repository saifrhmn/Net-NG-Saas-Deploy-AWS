namespace Karbar.Application.Contracts.ExpenseCategory
{
    public class ExpenseCategoryRequest
    {
        public string ExpenseCategoryId { get; set; }
        public string ParentId { get; set; }
        public string Name { get; set; }
        public int TenantId { get; set; }
        public int Status { get; set; }
    }
}
