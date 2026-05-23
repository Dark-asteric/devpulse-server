import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service";
import { pool } from "../../db";

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, type, status } = req.body;
        const reporter_id = req.user?.id;
        // console.log("reporter_id:", reporter_id);
        const result = await issueService.createIssueIntoDB({ title, description, type, status, reporter_id });
        res.status(201).json({
            success: true,
            message: 'Issue created successfully',
            data: result.rows[0],
        });
    } catch (err: any) {
        next(err);
    }
}

const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sort, type, status } = req.query as {
            sort?: string;
            type?: string;
            status?: string;
        };
        if (sort && !['newest', 'oldest'].includes(sort)) {
            res.status(400).json({ success: false, message: "sort must be 'newest' or 'oldest'." });
            return;
        }
        if (type && !['bug', 'feature_request'].includes(type)) {
            res.status(400).json({ success: false, message: "type must be 'bug' or 'feature_request'." });
            return;
        }
        if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
            res.status(400).json({ success: false, message: "status must be 'open', 'in_progress', or 'resolved'." });
            return;
        }
        const issues = await issueService.getAllIssuesFromDB({
            ...(sort && { sort }),
            ...(type && { type }),
            ...(status && { status }),
        });

        res.status(200).json({
            success: true,
            data: issues,
        });
    } catch (err: unknown) {
        next(err);
    }
}

const updateIssueById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const issueId = Number(req.params.id);
        const { title, description, type , status} = req.body;
        const requestingUser = req.user!;
        const issueResult = await pool.query(
            'SELECT id, title, description, type, status, reporter_id FROM issues WHERE id = $1',
            [issueId]
        );
        const issue = issueResult.rows[0];
        if (!issue) {
            res.status(404).json({ success: false, message: 'Issue not found.' });
            return;
        }
        if (requestingUser.role === 'contributor') {
            if (issue.reporter_id !== requestingUser.id) {
                res.status(403).json({
                    success: false,
                    message: 'You can only edit your own issues.',
                });
                return;
            }
            if (issue.status !== 'open') {
                res.status(409).json({
                    success: false,
                    message: 'You can only edit issues that are still open.',
                });
                return;
            }
        }
        const fields: string[] = [];
        const values: unknown[] = [];
        let idx = 1;

        if (title !== undefined) {
            fields.push(`title = $${idx++}`);
            values.push(title);
        }
        if (description !== undefined) {
            fields.push(`description = $${idx++}`);
            values.push(description);
        }
        if (type !== undefined) {
            fields.push(`type = $${idx++}`);
            values.push(type);
        }
        if (status !== undefined) {
            fields.push(`status = $${idx++}`);
            values.push(status);
        }

        if (fields.length === 0) {
            res.status(400).json({ success: false, message: 'No fields provided to update.' });
            return;
        }

        fields.push(`updated_at = NOW()`);
        values.push(issueId);

        const updateResult = await pool.query(
            `UPDATE issues
            SET ${fields.join(', ')}
            WHERE id = $${idx}
            RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
            values
        );
        res.status(200).json({
            success: true,
            message: 'Issue updated successfully',
            data: updateResult.rows[0],
        });
    } catch (err: any) {
        next(err);
    }
}

const getIssueById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            res.status(400).json({ success: false, message: 'Issue id must be a number.' });
            return;
        }
        const issue = await issueService.getIssueByIdFromDB({ payload: { id } });
        // console.log("issue:", issue.rows[0]);
        if (!issue) {
            res.status(404).json({ success: false, message: 'Issue not found.' });
            return;
        }
        const reporterResult = await issueService.getRepoterByIdFromDB({ payload: { reporter_id: issue.rows[0].reporter_id } });

        const reporterName = reporterResult.rows[0]?.name || "Unknown";
        const reporterId = reporterResult.rows[0]?.id || null;
        const reporterRole = reporterResult.rows[0]?.role || null;
        const issueWithReporter = {
            ...issue.rows[0],
            reporter_id: {
                reporter_id: reporterId,
                reporter_name: reporterName,
                reporter_role: reporterRole,
            }
        }
        // console.log("reporterResult:", reporterResult.rows[0]);
        res.status(200).json({
            success: true,
            data: issueWithReporter,
        });
    } catch (err: unknown) {
        next(err);
    }
}


const deleteIssueById = async (req: Request, res: Response, next: NextFunction) => {

    const id = Number(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ success: false, message: 'Issue id must be a number.' });
        return;
    }
    const issue = await issueService.getIssueByIdFromDB({ payload: { id } });

    if (!issue) {
        res.status(404).json({ success: false, message: 'Issue not found.' });
        return;
    }
    const result = await issueService.deleteIssueByIdFromDB({ payload: { id } });
    res.status(200).json({
        success: true,
        message: 'Issue deleted successfully',
        data: result.rows[0],
    });
}

export const issueController = {
    createIssue,
    getAllIssues,
    updateIssueById,
    getIssueById,
    deleteIssueById,
}
