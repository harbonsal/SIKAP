import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Handle session timeout
window.axios.interceptors.response.use(
    (response) => response,
    (error) => {
        // 401 Unauthorized or 419 Session Expired
        if (error.response && (error.response.status === 401 || error.response.status === 419)) {
            // Save current URL to return after login
            const currentUrl = window.location.pathname + window.location.search;
            sessionStorage.setItem('intended_url', currentUrl);
            
            // Redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
