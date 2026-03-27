import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult } from 'pg';
import { Tables } from './database.tables';

export type Returning = '*' | string[];
export type WhereClause = Record<string, any>;
export type UpdateData = Record<string, any>;
export type InsertData = Record<string, any>;

interface UpdateParams {
    table: Tables,
    data: UpdateData,
    where: WhereClause | null,
    returning?: Returning,
    allowedFields?: string[]
}

interface InsertParams {
    table: Tables,
    data: InsertData,
    returning?: Returning,
    allowedFields?: string[]
}

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

    async select(table: Tables, where: WhereClause | null, returning: Returning = '*') {
        const selectFields = this.buildReturningString(returning, false);
        let sql = `SELECT ${selectFields} FROM ${table}`;

        const { clause, values } = this.buildWhereClause(where);
        if (clause) sql += ` ${clause}`;

        const result = await this.query(sql, values);
        return result;
    }

    async insert(params: InsertParams) {
        let keys = Object.keys(params.data);
        let values = Object.values(params.data);

        if (params.allowedFields && params.allowedFields.length > 0) {
            const safeData: Record<string, any> = {};

            for (const key of params.allowedFields) {
                if (params.data[key] !== undefined) {
                    safeData[key] = params.data[key];
                }
            }

            keys = Object.keys(safeData);
            values = Object.values(safeData);

            if (keys.length === 0) {
                throw new Error("no_valid_fields_provided");
            }
        }

        // Creates "$1, $2, $3"
        const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

        let sql = `INSERT INTO ${params.table} ("${keys.join('", "')}") VALUES (${placeholders})`;

        const returningClause = this.buildReturningString(params.returning, true);
        if (returningClause) sql += ` ${returningClause}`;

        const result = await this.query(sql, values);
        return result;
    }


    async update(params: UpdateParams) {
        let setKeys = Object.keys(params.data);
        let setValues = Object.values(params.data);

        if (params.allowedFields && params.allowedFields.length > 0) {
            const safeData: Record<string, any> = {};

            for (const key of params.allowedFields) {
                if (params.data[key] !== undefined) {
                    safeData[key] = params.data[key];
                }
            }

            setKeys = Object.keys(safeData);
            setValues = Object.values(safeData);

            if (setKeys.length === 0) {
                throw new Error("no_valid_fields_provided");
            }
        }

        // Creates "column1 = $1, column2 = $2"
        const setString = setKeys.map((key, index) => `"${key}" = $${index + 1}`).join(', ');
        let sql = `UPDATE ${params.table} SET ${setString}`;

        // Build where clause starting index after the SET variables
        const { clause: whereClause, values: whereValues } = this.buildWhereClause(params.where, setValues.length + 1);

        if (whereClause) sql += ` ${whereClause}`;

        const returningClause = this.buildReturningString(params.returning, true);
        if (returningClause) sql += ` ${returningClause}`;

        const result = await this.query(sql, [...setValues, ...whereValues]);
        return result;
    }

    async delete(table: Tables, where: WhereClause | null, returning?: Returning) {
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
    private buildWhereClause(where: WhereClause | null, startIndex: number = 1): { clause: string, values: any[] } {
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