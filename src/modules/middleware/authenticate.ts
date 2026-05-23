import type { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import config from "../../config";

const authenticate = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers.authorization;
        // console.log(token);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }
        try {
            const decoded = jwt.verify(token, config.secret) as jwt.JwtPayload;
            req.user = decoded;
            next();
        } catch {
            res.status(401).json({ success: false, message: 'Invalid or expired token.' });
        }
    }
}
export default authenticate;