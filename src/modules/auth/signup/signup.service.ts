import bcrypt from 'bcrypt';
import { pool } from '../../../db';
import type { ISignup } from './signup.interface';

const createUserIntoDB = async (payload: ISignup) => {
    const { name, email, password, role } = payload;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const result = await pool.query(`
        INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) 
        RETURNING *`, [name, email, hashedPassword, role]);
    return result;
}

export const signUpService = {
    createUserIntoDB,
};