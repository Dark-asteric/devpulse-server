import type { NextFunction, Request, Response } from "express";
import { responseUtils } from "./response";

const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        fn(req, res, next).catch(next);
    };
};
const globalErrorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    console.error('Unhandled error:', err.message);

    responseUtils.sendError(
        res,
        'An unexpected server error occurred.',
        500,
        process.env.NODE_ENV === 'development' ? err.message : undefined
    );
};

export const errorUtils = {
    asyncHandler,
    globalErrorHandler,
};