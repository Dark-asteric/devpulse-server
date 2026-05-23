
import { queryUtils } from "../utils/query";
import type { IIssue } from "./issue.interface";

/* ─── Create Issue ───────────────────────────────────────────── */

const createIssueIntoDB = async (issue: IIssue) => {
    const { title, description, type, status, reporter_id } = issue;

    const result = await queryUtils.runQuery(
        `INSERT INTO issues (title, description, type, status, reporter_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [title, description, type, status ?? 'open', reporter_id]
    );

    return result;
};

/* ─── Get All Issues ─────────────────────────────────────────── */

const getAllIssuesFromDB = async (query: {
    sort?: string;
    type?: string;
    status?: string;
}) => {
    const { sort, type, status } = query;

    // buildWhereClause handles conditions and $idx automatically
    const { whereClause, values } = queryUtils.buildWhereClause({
        ...(type && { type }),
        ...(status && { status }),
    });

    const orderClause = sort === 'oldest'
        ? 'ORDER BY created_at ASC'
        : 'ORDER BY created_at DESC';

    const issuesResult = await queryUtils.runQuery(
        `SELECT id, title, description, type, status, reporter_id, created_at, updated_at
     FROM issues
     ${whereClause}
     ${orderClause}`,
        values
    );

    const issues = issuesResult.rows;
    if (issues.length === 0) return [];

    // Batch fetch reporters — no JOIN, no N+1
    const uniqueReporterIds = [...new Set(issues.map((i) => i.reporter_id))];
    const placeholders = uniqueReporterIds.map((_, i) => `$${i + 1}`).join(', ');

    const reportersResult = await queryUtils.runQuery(
        `SELECT id, name, role FROM users WHERE id IN (${placeholders})`,
        uniqueReporterIds
    );

    // Build lookup map for O(1) access
    const reporterMap = new Map(
        reportersResult.rows.map((r) => [r.id, r])
    );

    // Merge reporter into each issue
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
};

/* ─── Update Issue ───────────────────────────────────────────── */

const updateIssueInDB = async ({
    payload,
}: {
    payload: Partial<IIssue> & { id: number };
}) => {
    const { id, title, description, type, status } = payload;

    // buildSetClause builds SET clause and tracks $idx automatically
    const { setClause, values, nextIndex } = queryUtils.buildSetClause({
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(status && { status }),
    });

    if (values.length === 0) {
        throw new Error('No fields to update');
    }

    values.push(id); // WHERE id = $nextIndex

    const result = await queryUtils.runQuery(
        `UPDATE issues
     SET ${setClause}
     WHERE id = $${nextIndex}
     RETURNING *`,
        values
    );

    return result;
};

/* ─── Get Issue By ID ────────────────────────────────────────── */

const getIssueByIdFromDB = async ({
    payload,
}: {
    payload: { id: number };
}) => {
    const { id } = payload;

    const result = await queryUtils.runQuery(
        'SELECT * FROM issues WHERE id = $1',
        [id]
    );

    return queryUtils.firstRow(result); // returns row or null — no more result.rows[0]
};

/* ─── Delete Issue ───────────────────────────────────────────── */

const deleteIssueByIdFromDB = async ({
    payload,
}: {
    payload: { id: number };
}) => {
    const { id } = payload;

    const result = await queryUtils.runQuery(
        'DELETE FROM issues WHERE id = $1 RETURNING *',
        [id]
    );

    return queryUtils.firstRow(result); // returns deleted row or null
};

/* ─── Get Reporter By ID ─────────────────────────────────────── */

const getReporterByIdFromDB = async ({
    payload,
}: {
    payload: { reporter_id: number };
}) => {
    const { reporter_id } = payload;

    const result = await queryUtils.runQuery(
        'SELECT id, name, role FROM users WHERE id = $1', // only select needed fields
        [reporter_id]
    );

    return queryUtils.firstRow(result); // returns reporter or null
};

export const issueService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    updateIssueInDB,
    getIssueByIdFromDB,
    deleteIssueByIdFromDB,
    getReporterByIdFromDB,
};