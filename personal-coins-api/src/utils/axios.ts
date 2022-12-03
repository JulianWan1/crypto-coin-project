import Axios, { AxiosRequestConfig } from 'axios';

// Setting the axios configuration for livecoinwatch API call
const liveCoinWatchAxiosConfig: AxiosRequestConfig = {
    baseURL: process.env.LIVECOINWATCH_API_BASE_URL,
    headers: {'x-api-key': `${process.env.LIVECOINWATCH_API_KEY}`},
    timeout: 1000 * 60, // 1 minute
  };

  // create the livecoinwatch axios instance for livecoinwatch API
  const liveCoinWatchInstance = Axios.create(liveCoinWatchAxiosConfig);

  // Exporting the axios instances 
  export const liveCoinWatchAxios = liveCoinWatchInstance;