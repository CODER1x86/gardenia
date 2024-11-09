/**
 * Query Builder Service
 * Builds SQL queries for database operations
 */
class QueryBuilder {
    constructor() {
        this.query = '';
        this.params = [];
        this.tablePrefix = 'gb_'; // gardenia-budget prefix
    }

    reset() {
        this.query = '';
        this.params = [];
        return this;
    }

    select(fields = ['*']) {
        this.query = `SELECT ${fields.join(', ')}`;
        return this;
    }

    from(table) {
        this.query += ` FROM ${this.tablePrefix}${table}`;
        return this;
    }

    where(conditions) {
        if (Object.keys(conditions).length === 0) return this;

        const clauses = [];
        Object.entries(conditions).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                clauses.push(`${key} IN (${value.map(() => '?').join(',')})`);
                this.params.push(...value);
            } else if (value === null) {
                clauses.push(`${key} IS NULL`);
            } else if (typeof value === 'object') {
                Object.entries(value).forEach(([operator, operand]) => {
                    clauses.push(`${key} ${this.getOperator(operator)} ?`);
                    this.params.push(operand);
                });
            } else {
                clauses.push(`${key} = ?`);
                this.params.push(value);
            }
        });

        this.query += ` WHERE ${clauses.join(' AND ')}`;
        return this;
    }

    getOperator(operator) {
        const operators = {
            eq: '=',
            ne: '!=',
            gt: '>',
            gte: '>=',
            lt: '<',
            lte: '<=',
            like: 'LIKE',
            notLike: 'NOT LIKE',
            between: 'BETWEEN',
            in: 'IN',
            notIn: 'NOT IN'
        };
        return operators[operator] || operator;
    }

    join(table, conditions, type = 'INNER') {
        this.query += ` ${type} JOIN ${this.tablePrefix}${table} ON ${conditions}`;
        return this;
    }

    leftJoin(table, conditions) {
        return this.join(table, conditions, 'LEFT');
    }

    rightJoin(table, conditions) {
        return this.join(table, conditions, 'RIGHT');
    }

    groupBy(fields) {
        if (Array.isArray(fields)) {
            this.query += ` GROUP BY ${fields.join(', ')}`;
        } else {
            this.query += ` GROUP BY ${fields}`;
        }
        return this;
    }

    having(conditions) {
        this.query += ` HAVING ${conditions}`;
        return this;
    }

    orderBy(field, direction = 'ASC') {
        this.query += ` ORDER BY ${field} ${direction}`;
        return this;
    }

    limit(limit, offset = 0) {
        this.query += ` LIMIT ${limit} OFFSET ${offset}`;
        return this;
    }

    insert(table, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);
        const placeholders = new Array(fields.length).fill('?').join(', ');

        this.query = `INSERT INTO ${this.tablePrefix}${table} (${fields.join(', ')}) VALUES (${placeholders})`;
        this.params = values;
        return this;
    }

    update(table, data, conditions) {
        const sets = Object.keys(data).map(key => `${key} = ?`);
        this.query = `UPDATE ${this.tablePrefix}${table} SET ${sets.join(', ')}`;
        this.params = Object.values(data);

        if (conditions) {
            return this.where(conditions);
        }
        return this;
    }

    delete(table, conditions) {
        this.query = `DELETE FROM ${this.tablePrefix}${table}`;
        if (conditions) {
            return this.where(conditions);
        }
        return this;
    }

    raw(query, params = []) {
        this.query = query;
        this.params = params;
        return this;
    }

    getQuery() {
        return {
            text: this.query,
            params: this.params
        };
    }

    // Utility methods for common queries
    count(table, conditions = {}) {
        return this.select(['COUNT(*) as count'])
                   .from(table)
                   .where(conditions);
    }

    findById(table, id) {
        return this.select()
                   .from(table)
                   .where({ id });
    }

    findOne(table, conditions) {
        return this.select()
                   .from(table)
                   .where(conditions)
                   .limit(1);
    }

    // Transaction support
    beginTransaction() {
        return 'BEGIN TRANSACTION';
    }

    commit() {
        return 'COMMIT';
    }

    rollback() {
        return 'ROLLBACK';
    }

    // Special queries for financial operations
    getMonthlyBalance(year, month) {
        return this.raw(`
            WITH monthly_totals AS (
                SELECT 
                    COALESCE(SUM(CASE WHEN type = 'revenue' THEN amount ELSE 0 END), 0) as total_revenue,
                    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses
                FROM ${this.tablePrefix}transactions
                WHERE strftime('%Y', date) = ? 
                AND strftime('%m', date) = ?
            )
            SELECT 
                total_revenue,
                total_expenses,
                (total_revenue - total_expenses) as net_balance
            FROM monthly_totals
        `, [year.toString(), month.toString().padStart(2, '0')]);
    }
}

export default new QueryBuilder();