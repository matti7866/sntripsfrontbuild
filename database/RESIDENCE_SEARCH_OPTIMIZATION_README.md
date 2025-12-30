# Residence Search Optimization Guide

## Overview
This guide explains how to optimize residence search performance by adding database indexes and optimizing queries.

## Performance Improvements

### 1. Database Indexes
Run the SQL file to add indexes to commonly searched columns:

```bash
mysql -u root -p sntravels_prod < residence_search_optimization.sql
```

### What the indexes do:
- **Text search indexes**: Speed up LIKE queries on passenger_name, passport_number, uid, emirates_id
- **Foreign key indexes**: Speed up JOINs with customer, company, currency, etc.
- **Filter indexes**: Speed up filtering by step, status, date
- **Composite indexes**: Optimize common query patterns

### 2. Query Optimization
The `list.php` file has been optimized:

**Before (Slow):**
- Used correlated subqueries for each residence record
- Each subquery ran separately for every row
- LOWER() function calls prevented index usage

**After (Fast):**
- Replaced subqueries with LEFT JOINs
- Aggregations done once with GROUP BY
- Removed LOWER() to allow index usage
- Database can use indexes effectively

### Expected Performance Gains:

| Scenario | Before | After | Improvement |
|----------|--------|-------|-------------|
| Search with 2-3 characters | 2-5 seconds | 200-500ms | **10x faster** |
| Load all residences | 3-8 seconds | 500ms-1s | **6x faster** |
| Filter by customer | 1-3 seconds | 100-300ms | **10x faster** |

## Frontend Optimizations

### 1. Debounce Delay
- Reduced from 500ms to 300ms
- Faster response while still preventing excessive requests

### 2. Minimum Search Length
- Requires at least 2 characters
- Prevents overly broad searches that scan entire table

### 3. Visual Feedback
- Loading spinner during search
- Warning for queries < 2 characters
- Info message showing search fields

## How to Apply

### Step 1: Add Database Indexes
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/snt
mysql -u root -p sntravels_prod < database/residence_search_optimization.sql
```

### Step 2: Verify Indexes
```sql
-- Check indexes on residence table
SHOW INDEX FROM residence;

-- Check query performance
EXPLAIN SELECT * FROM residence WHERE passenger_name LIKE '%test%';
```

### Step 3: Test Search
1. Go to `http://127.0.0.1:5174/residence`
2. Type 2-3 characters in search
3. Results should appear in < 500ms

## Monitoring Performance

### Check Query Execution Time:
```sql
-- Enable profiling
SET profiling = 1;

-- Run your search query
SELECT * FROM residence WHERE passenger_name LIKE '%rab%' LIMIT 10;

-- Show profile
SHOW PROFILES;
```

### Check Index Usage:
```sql
-- See if indexes are being used
EXPLAIN SELECT * FROM residence r
LEFT JOIN customer c ON r.customer_id = c.customer_id
WHERE r.passenger_name LIKE '%test%';
```

Look for:
- `type: ref` or `type: range` = Good (using index)
- `type: ALL` = Bad (full table scan)

## Troubleshooting

### If search is still slow:

1. **Check if indexes were created:**
   ```sql
   SHOW INDEX FROM residence WHERE Key_name LIKE 'idx_%';
   ```

2. **Check table size:**
   ```sql
   SELECT COUNT(*) FROM residence;
   ```
   If > 100,000 records, consider partitioning

3. **Check MySQL configuration:**
   ```sql
   SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
   ```
   Should be at least 256M for good performance

4. **Analyze slow queries:**
   ```sql
   -- Enable slow query log
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 1;
   ```

## Additional Optimizations (Optional)

### 1. Full-Text Search (for very large datasets)
```sql
ALTER TABLE residence ADD FULLTEXT INDEX ft_search (passenger_name, passportNumber, uid);
```

Then modify query to use:
```sql
WHERE MATCH(passenger_name, passportNumber, uid) AGAINST ('search term' IN BOOLEAN MODE)
```

### 2. Caching Layer
Consider adding Redis/Memcached for frequently accessed data:
- Customer list
- Currency list
- Company list

### 3. Pagination Optimization
Current pagination is efficient (LIMIT/OFFSET), but for very large offsets, consider:
- Cursor-based pagination
- Keyset pagination

## Notes

- Indexes take up disk space (~10-20% of table size)
- Indexes slightly slow down INSERT/UPDATE operations
- Trade-off is worth it for read-heavy applications
- Run ANALYZE TABLE periodically to update statistics

## Maintenance

Run these commands monthly:
```sql
-- Update table statistics
ANALYZE TABLE residence;
ANALYZE TABLE customer;
ANALYZE TABLE customer_payments;

-- Optimize tables
OPTIMIZE TABLE residence;
```

## Support

If search is still slow after applying these optimizations:
1. Check the slow query log
2. Run EXPLAIN on the slow query
3. Check server resources (CPU, RAM, disk I/O)
4. Consider upgrading database server hardware

