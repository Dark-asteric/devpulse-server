import { Pool } from "pg";
import config from "../config";

export const pool = new Pool({
    connectionString: config.connection_string,
});

export const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role user_role NOT NULL DEFAULT 'contributor',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            );
        `);
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS issues (
                id SERIAL PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
                status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
                reporter_id INTEGER NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `); 
        console.log('Database initialized successfully');
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
}
