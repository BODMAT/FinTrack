process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/fintrack_test?schema=public";
process.env.ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "test_access_secret";
process.env.API_KEY_ENCRYPTION_SECRET =
  process.env.API_KEY_ENCRYPTION_SECRET ||
  "test_api_key_encryption_secret_123456";
process.env.CORS_ORIGINS =
  process.env.CORS_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173";
process.env.GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID ||
  "test-google-client-id.apps.googleusercontent.com";
