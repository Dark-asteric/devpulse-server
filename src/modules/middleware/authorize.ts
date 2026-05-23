import type { NextFunction, Request, Response } from "express";

export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Not authenticated.' });
            return;
        }
        
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'You do not have permission to perform this action.',
            });
            return;
        }

        next();
    };
};