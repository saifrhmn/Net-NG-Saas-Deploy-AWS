using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Karbar.Application.Common.Interface
{
    public interface IGenericRepository<T> where T : class
    {
        IQueryable<T> Query();
        Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default);
        Task<T?> GetByIdAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default);
        Task<bool> AddAsync(T entity, CancellationToken cancellationToken = default);
        Task<bool> UpdateAsync(T entity, CancellationToken cancellationToken = default);
        Task DeleteAsync(T entity, CancellationToken cancellationToken = default);
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task<bool> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);
        Task<List<TResult>> ExecuteStoredProcedureAsync<TResult>(string sql, CancellationToken cancellationToken, params object[] parameters) where TResult : class;
        Task Remove(T entity);
        Task RemoveRange(IEnumerable<T> entities);
    }
}
