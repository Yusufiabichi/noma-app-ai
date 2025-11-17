import { config } from 'dotenv';

// config( options: { path: '.env'});
config( { path: `.env.${process.env.NODE_ENV || 'development'}.local` });

export const { PORT, NODE_ENV } = process.env;