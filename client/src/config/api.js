import axios from 'axios';

// Base API URL configuration supporting both Production Render API and Localhost
export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.PROD ? 'https://stock-analyzer-api-n9mz.onrender.com' : 'http://localhost:5000');

axios.defaults.baseURL = API_BASE_URL;

export default API_BASE_URL;
