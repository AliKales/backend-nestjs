import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';
import { Tables } from './database.tables';

export type Returning = '*' | string[];
export type WhereClause = Record<string, any>;
export type UpdateData = Record<string, any>;
export type InsertData = Record<string, any>;

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool: Pool;

    constructor(private readonly configService: ConfigService) {
        const connectionString = this.configService.get<string>('DATABASE_URL');
        this.pool = new Pool({
            connectionString: connectionString,
        });
    }

    async onModuleInit() {
        console.log('Database connection initialized');
    }

    async onModuleDestroy() {
        await this.pool.end();
    }

    async query(text: string, params?: any[]): Promise<QueryResult> {
        return this.pool.query(text, params);
    }

    // --- ORM METHODS ---

    async select(table: Tables, where?: WhereClause, returning: Returning = '*') {
        const selectFields = this.buildReturningString(returning, false);
        let sql = `SELECT ${selectFields} FROM ${table}`;

        const { clause, values } = this.buildWhereClause(where);
        if (clause) sql += ` ${clause}`;

        const result = await this.query(sql, values);
        return result;
    }

    async insert(table: Tables, data: InsertData, returning?: Returning) {
        const keys = Object.keys(data);
        const values = Object.values(data);

        // Creates "$1, $2, $3"
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

        let sql = `INSERT INTO ${table} ("${keys.join('", "')}") VALUES (${placeholders})`;

        const returningClause = this.buildReturningString(returning, true);
        if (returningClause) sql += ` ${returningClause}`;

        const result = await this.query(sql, values);
        return result;
    }

    async update(table: Tables, data: UpdateData, where?: WhereClause, returning?: Returning) {
        const setKeys = Object.keys(data);
        const setValues = Object.values(data);

        // Creates "column1 = $1, column2 = $2"
        const setString = setKeys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
        let sql = `UPDATE ${table} SET ${setString}`;

        // Build where clause starting index after the SET variables
        const { clause: whereClause, values: whereValues } = this.buildWhereClause(where, setValues.length + 1);

        if (whereClause) sql += ` ${whereClause}`;

        const returningClause = this.buildReturningString(returning, true);
        if (returningClause) sql += ` ${returningClause}`;

        const result = await this.query(sql, [...setValues, ...whereValues]);
        return result;
    }

    async delete(table: Tables, where?: WhereClause, returning?: Returning) {
        let sql = `DELETE FROM ${table}`;

        const { clause, values } = this.buildWhereClause(where);
        if (clause) sql += ` ${clause}`;

        const returningClause = this.buildReturningString(returning, true);
        if (returningClause) sql += ` ${returningClause}`;

        const result = await this.query(sql, values);
        return result;
    }

    // --- QUERY BUILDER HELPERS ---

    /**
     * Converts an object like { id: 1, status: 'active' } into
     * clause: "WHERE id = $1 AND status = $2"
     * values: [1, 'active']
     */
    private buildWhereClause(where?: WhereClause, startIndex: number = 1): { clause: string, values: any[] } {
        if (!where || Object.keys(where).length === 0) {
            return { clause: '', values: [] };
        }

        const keys = Object.keys(where);
        const values = Object.values(where);

        const conditions = keys.map((key, index) => `"${key}" = $${startIndex + index}`);

        return {
            clause: `WHERE ${conditions.join(' AND ')}`,
            values: values
        };
    }

    /**
     * Converts '*' or ['id', 'name'] into proper SQL strings.
     * If isMutation is true, it prepends "RETURNING ".
     */
    private buildReturningString(returning?: Returning, isMutation: boolean = false): string {
        if (!returning) return '';

        const fields = Array.isArray(returning) ? `"${returning.join('", "')}"` : returning;
        return isMutation ? `RETURNING ${fields}` : fields;
    }
}