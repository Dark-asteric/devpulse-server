import type { Request, Response } from "express";
import { loginService } from "./login.service";
import bcrypt from 'bcrypt';

const login = async (req: Request, res: Response) => {
    try {
        const result = await loginService.loginUserIntoDB(req.body);
        
        const { password: _, ...userWithoutPassword } = result;
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: userWithoutPassword,
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            error: "happened here",
        });
    }
}

export const loginController = {
    login,
};