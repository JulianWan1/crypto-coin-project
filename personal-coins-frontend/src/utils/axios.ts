import Axios, { AxiosRequestConfig } from 'axios';
// import cookie, { COOKIE } from './cookie';

// Setting the axios configuration for self made API call
const axiosConfig: AxiosRequestConfig = {
  baseURL: process.env.VUE_APP_FRONTEND_API_BASE_URL,
  timeout: 1000 * 60, // 1 minute
};

// Setting the axios configuration for livecoinwatch API call
// const liveCoinWatchAxiosConfig: AxiosRequestConfig = {
//   baseURL: process.env.VUE_APP_LIVECOINWATCH_API_BASE_URL,
//   headers: {'x-api-key': `${process.env.VUE_APP_LIVECOINWATCH_API_KEY}`},
//   timeout: 1000 * 60, // 1 minute
// };

// TODO: Understand the requestInterceptor, responseInterceptor & errorInterceptor

// const requestInterceptor = (config: any) => {
//   config.headers = {
//     Authorization: `Bearer ${cookie.get(COOKIE.TOKEN)}`,
//   };
//   return config;
// };

// const responseInterceptor = () => {
//   return (response: AxiosResponse) => {
//     return {
//       ...response,
//     };
//   };
// };

// const errorInterceptor = () => {
//   return ({ response }: any) => {
//     if (response && response.status === 401) {
//       cookie.remove(COOKIE.TOKEN);
//       window.location.href = '/';
//     }
//     return Promise.reject(response);
//   };
// };

// create the general axios instance for self made API
const instance = Axios.create(axiosConfig);

// create the livecoinwatch axios instance for livecoinwatch API
// const liveCoinWatchInstance = Axios.create(liveCoinWatchAxiosConfig);

// instance.interceptors.request.use(requestInterceptor);
// instance.interceptors.response.use(responseInterceptor(), errorInterceptor());

// Exporting the axios instances 
export const axios = instance;

// export const liveCoinWatchAxios = liveCoinWatchInstance
