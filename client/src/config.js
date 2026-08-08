// Auto-detect: use local API when running on localhost, Render production API otherwise
var isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isLocal ? 'http://localhost:5000' : 'https://stock-analyzer-api-n9mz.onrender.com');
