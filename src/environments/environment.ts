const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

export const environment = {
  production: !isLocal,
  
  apiBase: isLocal 
    ? 'http://localhost:8000/api' 
    : ' https://gestor-php-last.onrender.com/api',  
  
  apiUrl: isLocal 
    ? 'http://localhost:8000/api' 
    : ' https://gestor-php-last.onrender.com/api',
  
};