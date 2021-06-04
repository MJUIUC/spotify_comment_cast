import axios from 'axios';

const develApiUrl = 'http://localhost:8080/api/spotify';

const AxiosInstance = axios.create();
AxiosInstance.defaults.withCredentials = true;
AxiosInstance.defaults.baseURL = process.env.NODE_ENV === "development"? develApiUrl: null;

export default AxiosInstance;
