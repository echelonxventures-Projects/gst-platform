export const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'gst_platform',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  },
  api: {
    port: parseInt(process.env.API_PORT) || 3000,
    host: process.env.API_HOST || '0.0.0.0'
  },
  storage: {
    documentsPath: process.env.STORAGE_PATH || './storage/documents'
  }
};
