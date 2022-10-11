import axios from "axios";

const REACT_APP_API_URL =  process.env.REACT_APP_API_URL;

export const originUrl = window.location.origin;

const axiosClient = axios.create({
    baseURL: REACT_APP_API_URL,
    headers: {
      'content-type': 'application/json',
    },
    //data: params,
    //paramsSerializer: params => queryString.stringify(params),
});

axiosClient.interceptors.request.use(async (config) => {
    const access_token = localStorage.getItem('access_token');
    try {
        if (access_token) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${access_token} `,
          };
        } 
        
        // else if (window.location.pathname !== '/login'){
        //     window.location.href = '/logout'
        // }
        return config;
      } catch (error) {
        console.log('error: ', error);
        return Promise.reject(error);
      }
})

axiosClient.interceptors.response.use((response) => {
    if (response.data.code === 401) {
        window.location.href = '/logout'
        return Promise.reject();
    }
    if(response && response.result) {
        return response.result
    }
    return response;
}, (error) => {
    if (error?.response?.status === 401) {
      window.location.href = "/logout";
    } else {
      try {
        if (error?.response?.data?.errors)
          error.message = error.response.data.errors[0];
      } catch (error) {

      }
    }
    return Promise.reject(error);
});

export default axiosClient;