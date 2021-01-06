import dotenv from 'dotenv';

dotenv.config();

export const DB_TYPE = process.env.DB_TYPE;
export const DB_HOST = process.env.DB_HOST;
export const DB_USERNAME = process.env.DB_USERNAME;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_PORT = process.env.DB_PORT;
export const DB_NAME = process.env.DB_NAME;
export const DB_AUTH_NAME = process.env.DB_AUTH_NAME;
export const APP_PORT = process.env.APP_PORT;
export const PROTOCOL_ACCOUNT = process.env.PROTOCOL_ACCOUNT;

