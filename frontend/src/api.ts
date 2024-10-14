import axios, { AxiosResponse } from 'axios';
import { jwtDecode } from 'jwt-decode';

const api = axios.create({
  baseURL: 'http://localhost:3001' 
});

const setAuthDetails = (navigate: any, setIsAuthenticated: any) => {
  api.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: any) => {
      console.log('Interceptor called'); 
      if (error.response && error.response.status === 401) {
        console.log('Error 401 detected');
        try {
          await refreshToken(navigate, setIsAuthenticated, error.config);

          const originalRequest = error.config;
          const newAccessToken = localStorage.getItem('access_token');
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

          return api(originalRequest);
        } catch (e) {
          console.error('Error refreshing token', e);
          await handleLogout(navigate, setIsAuthenticated);
          window.location.reload(); 
          return Promise.reject(new Error('Failed to refresh token and forced logout'));
        }
      }
      return Promise.reject(new Error('Failed to refresh token and forced logout'));
    }
  );
};

const refreshToken = async (navigate: any, setIsAuthenticated: any, originalRequest: any): Promise<void> => {
  const token = localStorage.getItem('access_token');

  if (token) {
    const decodedToken: any = jwtDecode(token);
    const userId: string = decodedToken.userId; 

    try {
      const response: AxiosResponse = await api.post('/auth/refresh-token', { userId });

      if (response.data.accessToken) {
        console.log('Successfully refreshed token');
        localStorage.setItem('access_token', response.data.accessToken);

        originalRequest.headers['Authorization'] = `Bearer ${response.data.accessToken}`;

        return api(originalRequest);
      } else {
        console.error('Failed to refresh token');
        throw new Error('Refresh token response did not include a new access token');
      }
    } catch (error) {
      console.error('Error refreshing token', error);
      await handleLogout(navigate, setIsAuthenticated);
      window.location.reload(); 
      throw new Error('Failed to refresh token and forced logout');
    }
  } else {
    console.error('Access token not found');
    await handleLogout(navigate, setIsAuthenticated);
    window.location.reload(); 
    throw new Error('No access token found for refresh');
  }
};

const handleLogout = async (navigate: any, setIsAuthenticated: any): Promise<void> => {
  const token = localStorage.getItem('access_token');

  if (token) {
    const decodedToken: any = jwtDecode(token);
    const userId: string = decodedToken.userId; 

    try {
      await api.post('/auth/logout', { userId });

      localStorage.removeItem('access_token');

      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  } else {
    console.error('Access token not found');
  }
};

const checkRefreshTokenStatus = async (userId: string): Promise<string | null> => {
  try {
    const response = await api.get(`http://localhost:3001/auth/refresh-token-status/${userId}`);
    return response.data.refresh_token;
  } catch (error) {
    console.error('Error checking refresh token status:', error);
    return null;
  }
};

export { api, setAuthDetails, refreshToken, handleLogout, checkRefreshTokenStatus };
