import type { QueryResultRow } from "pg";
import { pool } from "../../db";

const runQuery = async <T extends QueryResultRow>(
    sql: string,
    params: unknown[] = []
) => {
    return pool.query<T>(sql, params);
};

const firstRow = <T>(result: { rows: T[] }): T | null => {
    return result.rows[0] ?? null;
};

const buildSetClause = (
    fields: Record<string, unknown>,
    startIndex: number = 1
) => {
    const setClauses: string[] = [];
    const values: unknown[] = [];
    let idx = startIndex;

    for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
            setClauses.push(`${key} = $${idx++}`);
            values.push(value);
        }
    }

    setClauses.push('updated_at = NOW()');

    return {
        setClause: setClauses.join(', '),
        values,
        nextIndex: idx,
    };
};

const buildWhereClause = (
    filters: Record<string, unknown>,
    startIndex: number = 1
) => {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = startIndex;

    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null) {
            conditions.push(`${key} = $${idx++}`);
            values.push(value);
        }
    }

    return {
        whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
        values,
        nextIndex: idx,
    };
};

export const queryUtils = {
    runQuery,
    buildSetClause,
    buildWhereClause,
    firstRow
};