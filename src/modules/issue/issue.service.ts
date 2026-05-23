import { pool } from "../../db";
import type { IIssue } from "./issue.interface";

const createIssueIntoDB = async (issue: IIssue) => {
    const { title, description, type, status, reporter_id } = issue;
    const result = await pool.query(`
        INSERT INTO issues (title, description, type, status, reporter_id) VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`, [title, description, type, status, reporter_id]);
    return result;
}

const getAllIssuesFromDB = async (query: { sort?: string; type?: string; status?: string }) => {
    const { sort, type, status } = query;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (type) {
        conditions.push(`type = $${idx++}`);
        values.push(type);
    }
    if (status) {
        conditions.push(`status = $${idx++}`);
        values.push(status);
    }

    const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';
    const orderClause = sort === 'oldest'
        ? 'ORDER BY created_at ASC'
        : 'ORDER BY created_at DESC';
    const issuesResult = await pool.query(
        `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${whereClause}
     ${orderClause}`,
        values
    );
    const issues = issuesResult.rows;

    if (issues.length === 0) return [];
    const uniqueReporterIds = [...new Set(issues.map((i) => i.reporter_id))];
    const placeholders = uniqueReporterIds.map((_, i) => `$${i + 1}`).join(', ');

    const reportersResult = await pool.query(
        `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
        uniqueReporterIds
    );
    const reporterMap = new Map(
        reportersResult.rows.map((r) => [r.id, r])
    );
    return issues.map((issue) => {
        const { reporter_id, ...rest } = issue;
        const reporter = reporterMap.get(reporter_id);

        return {
            ...rest,
            reporter: reporter
                ? { id: reporter.id, name: reporter.name, role: reporter.role }
                : { id: reporter_id, name: 'Deleted User', role: 'N/A' },
        };
    });
}

const updateIssueInDB = async ({payload}: { payload: Partial<IIssue> & { id: number } }) => {
    const { id, title, description, type, status } = payload;
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];
    let index = 1;

    if (title) {
        fieldsToUpdate.push(`title = $${index++}`);
        values.push(title);
    }
    if (description) {
        fieldsToUpdate.push(`description = $${index++}`);
        values.push(description);
    }
    if (type) {
        fieldsToUpdate.push(`type = $${index++}`);
        values.push(type);
    }
    if (status) {
        fieldsToUpdate.push(`status = $${index++}`);
        values.push(status);
    }

    if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
    }

    const query = `
        UPDATE issues SET ${fieldsToUpdate.join(', ')}, updated_at = NOW() WHERE id = $${index} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);
    return result;
}

const getIssueByIdFromDB = async ({payload}: { payload: { id: number } }) => {
    const { id } = payload;
    const result = await pool.query('SELECT * FROM issues WHERE id = $1', [id]);
    return result;
}

const deleteIssueByIdFromDB = async ({payload}: { payload: { id: number } }) => {
    const { id } = payload;
    const result = await pool.query('DELETE FROM issues WHERE id = $1 RETURNING *', [id]);
    return result;
}

const getRepoterByIdFromDB = async ({payload}: { payload: { reporter_id: number } }) => {
    const { reporter_id } = payload;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [reporter_id]);
    return result;
}

export const issueService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    updateIssueInDB,
    getIssueByIdFromDB,
    deleteIssueByIdFromDB,
    getRepoterByIdFromDB,
}