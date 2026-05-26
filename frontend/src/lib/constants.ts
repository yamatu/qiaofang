const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9580/api';
export const API_BASE_URL = apiUrl === '/api' ? '' : apiUrl.replace('/api', '');
