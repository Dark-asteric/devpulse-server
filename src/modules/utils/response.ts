import type { Response } from "express";

const sendSuccess = <T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
): void => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

const sendSuccessMessage = (
    res: Response,
    message: string,
    statusCode: number = 200
): void => {
    res.status(statusCode).json({
        success: true,
        message,
    });
};

const sendError = (
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: unknown
): void => {
    const body: Record<string, unknown> = { success: false, message };
    if (errors !== undefined) body.errors = errors;
    res.status(statusCode).json(body);
};

export const responseUtils = {
    sendSuccess,
    sendSuccessMessage,
    sendError,
};