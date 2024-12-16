// backend/config.js
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'makersahaday!';
const SERVER_PORT = process.env.PORT || 4000; // デプロイ環境では通常PORTが設定されます
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001'; // フロントエンドのURL

module.exports = {
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  SERVER_PORT,
  FRONTEND_URL
};
