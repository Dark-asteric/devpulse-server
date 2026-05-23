import { pool } from "../../../db";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import config from "../../../config";

const loginUserIntoDB = async (payload: { email: string , password: string }) => {
    const {email, password} = payload;
    const userData = await pool.query(`SELECT * FROM users WHERE email = $1`, [email.toLowerCase().trim()]);

    const user = userData.rows[0];
    if(userData.rows.length === 0) {
        throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

    // generate JWT token

    const jwtPayload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(jwtPayload, config.secret, { expiresIn: "15m" });
    const refreshToken = jwt.sign(jwtPayload, config.refreshSecret, { expiresIn: "7d" });
    // console.log(user);
    return { ...user, token, refreshToken };
}

export const loginService = {
    loginUserIntoDB,
};
