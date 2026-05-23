import type { NextFunction, Request, Response } from "express";
import { issueService } from "./issue.service";
import { responseUtils } from "../utils/response";
import { queryUtils } from "../utils/query";

const createIssue = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { title, description, type, status } = req.body;
        const reporter_id = req.user!.id;

        const result = await issueService.createIssueIntoDB({
            title,
            description,
            type,
            status,
            reporter_id,
        });

        responseUtils.sendSuccess(res, result.rows[0], 'Issue created successfully.', 201);
    } catch (err: unknown) {
        next(err);
    }
};

const getAllIssues = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sort, type, status } = req.query as {
            sort?: string;
            type?: string;
            status?: string;
        };

        if (sort && !['newest', 'oldest'].includes(sort)) {
            responseUtils.sendError(res, "sort must be 'newest' or 'oldest'.", 400);
            return;
        }
        if (type && !['bug', 'feature_request'].includes(type)) {
            responseUtils.sendError(res, "type must be 'bug' or 'feature_request'.", 400);
            return;
        }
        if (status && !['open', 'in_progress', 'resolved'].includes(status)) {
            responseUtils.sendError(res, "status must be 'open', 'in_progress', or 'resolved'.", 400);
            return;
        }

        const issues = await issueService.getAllIssuesFromDB({
            ...(sort && { sort }),
            ...(type && { type }),
            ...(status && { status }),
        });

        responseUtils.sendSuccess(res, issues);
    } catch (err: unknown) {
        next(err);
    }
};

const getIssueById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            responseUtils.sendError(res, 'Issue id must be a number.', 400);
            return;
        }

        // Query 1 — get the issue
        const issue = await issueService.getIssueByIdFromDB({ payload: { id } });

        if (!issue) {
            responseUtils.sendError(res, 'Issue not found.', 404);
            return;
        }

        const reporter = await issueService.getReporterByIdFromDB({
            payload: { reporter_id: issue.reporter_id },
        });

        const reporterData = reporter
            ? { id: reporter.id, name: reporter.name, role: reporter.role }
            : { id: issue.reporter_id, name: 'Deleted User', role: 'N/A' };

        const { reporter_id, ...issueWithoutReporterId } = issue;
        void reporter_id;

        responseUtils.sendSuccess(res, { ...issueWithoutReporterId, reporter: reporterData });
    } catch (err: unknown) {
        next(err);
    }
};

const updateIssueById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const issueId = Number(req.params.id);
        const { title, description, type, status } = req.body;
        const requestingUser = req.user!;

        if (isNaN(issueId)) {
            responseUtils.sendError(res, 'Issue id must be a number.', 400);
            return;
        }

        // Fetch existing issue
        const issueResult = await queryUtils.runQuery(
            'SELECT id, title, description, type, status, reporter_id FROM issues WHERE id = $1',
            [issueId]
        );
        const issue = issueResult.rows[0];

        if (!issue) {
            responseUtils.sendError(res, 'Issue not found.', 404);
            return;
        }

        // Permission check for contributors
        if (requestingUser.role === 'contributor') {
            if (issue.reporter_id !== requestingUser.id) {
                responseUtils.sendError(res, 'You can only edit your own issues.', 403);
                return;
            }
            if (issue.status !== 'open') {
                responseUtils.sendError(res, 'You can only edit issues that are still open.', 409);
                return;
            }
        }

        const result = await issueService.updateIssueInDB({
            payload: { id: issueId, title, description, type, status },
        });

        responseUtils.sendSuccess(res, result.rows[0], 'Issue updated successfully.');
    } catch (err: unknown) {
        if (err instanceof Error && err.message === 'No fields to update') {
            responseUtils.sendError(res, 'No fields provided to update.', 400);
            return;
        }
        next(err);
    }
};

const deleteIssueById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            responseUtils.sendError(res, 'Issue id must be a number.', 400);
            return;
        }

        const issue = await issueService.getIssueByIdFromDB({ payload: { id } });

        if (!issue) {
            responseUtils.sendError(res, 'Issue not found.', 404);
            return;
        }

        await issueService.deleteIssueByIdFromDB({ payload: { id } });

        responseUtils.sendSuccessMessage(res, 'Issue deleted successfully.');
    } catch (err: unknown) {
        next(err);
    }
};

export const issueController = {
    createIssue,
    getAllIssues,
    getIssueById,
    updateIssueById,
    deleteIssueById,
};