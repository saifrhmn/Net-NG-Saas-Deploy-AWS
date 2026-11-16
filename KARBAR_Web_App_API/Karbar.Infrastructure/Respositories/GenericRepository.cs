using System.Linq.Expressions;
using Karbar.Application.Common.Interface;
using Karbar.Domain.Entities;
using Karbar.Domain.Enums;
using Karbar.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Karbar.Infrastructure.Respositories
{
    public class GenericRepository<T> : IGenericRepository<T> where T : class
    {
        private readonly ApplicationDbContext _context;
        private readonly DbSet<T> _dbSet;
        public GenericRepository(ApplicationDbContext context)
        {
            _context = context;
            _dbSet = _context.Set<T>();
        }

        public IQueryable<T> Query()
        {
            return _dbSet.AsQueryable(); // <-- Returns IQueryable
        }
        public async Task<IEnumerable<T>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            IQueryable<T> query = _dbSet;

            if (typeof(IHasStatus).IsAssignableFrom(typeof(T)))
            {
                query = query.Where(e => ((IHasStatus)e).Status != StatusEnum.Deleted);
            }

            return await query.ToListAsync(cancellationToken);
        }
        public async Task<T?> GetByIdAsync(Expression<Func<T, bool>> predicate, CancellationToken cancellationToken = default)
        {
            return await _dbSet.FirstOrDefaultAsync(predicate, cancellationToken);
        }
        public async Task<bool> AddAsync(T entity, CancellationToken cancellationToken = default)
        {
            var result = await _dbSet.AddAsync(entity, cancellationToken);

            return result != null ? true : false;
        }
        public async Task<bool> UpdateAsync(T entity, CancellationToken cancellationToken = default)
        {
            var result = _dbSet.Update(entity);

            return result != null ? true : false;
        }
        public async Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
        {
            //var entity = await GetByIdAsync(id, cancellationToken);
            if (entity != null)
            {
                if (entity is IHasStatus hasStatusEntity)
                {
                    hasStatusEntity.Status = StatusEnum.Deleted;
                }
                if (entity is IHasUpdatedDate updatedDateEntity)
                {
                    updatedDateEntity.UpdatedDate = DateTime.Now;
                }
                _dbSet.Update(entity);
            }
        }
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return _context.SaveChangesAsync(cancellationToken);
        }
        public async Task<bool> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
        {
            await _dbSet.AddRangeAsync(entities, cancellationToken);
            return true;
        }
        public async Task<List<TResult>> ExecuteStoredProcedureAsync<TResult>(string sql, CancellationToken cancellationToken, params object[] parameters) where TResult : class
        {
            return await _context.Set<TResult>()
                .FromSqlRaw(sql, parameters)
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }

        public Task Remove(T entity)
        {
            _context.Set<T>().Remove(entity);
            return Task.CompletedTask;
        }

        public Task RemoveRange(IEnumerable<T> entities)
        {
            _context.Set<T>().RemoveRange(entities);
            return Task.CompletedTask;
        }
    }
}
