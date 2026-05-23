import type { Request, Response } from "express";
import { signUpService } from "./signup.service";

const createUser = async (req: Request, res: Response) => {
    const { name, email, password, role } = req.body;
    try {
        const result = await signUpService.createUserIntoDB({ name, email, password, role });
        const { password: _, ...userWithoutPassword } = result.rows[0];
        // console.log(result);
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: userWithoutPassword,
        });
    } catch (err: any) {
        res.status(500).json({
            success: false,
            message: err.message,
            error: err,
        });
    }
}

export const signUpController = {
    signUp: createUser,
};