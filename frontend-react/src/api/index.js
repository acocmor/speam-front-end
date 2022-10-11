import axiosClient from "./axiosClient";

const api = {
    get: (url, config = {}) => {
        return axiosClient.get(url, config);
    },
    post: (url, data, config = {}) => {
        return axiosClient.post(url, data, config);
    },
    patch: (url, data, config = {}) => {
        return axiosClient.patch(url, data, config)
    },
    delete: (url, config = {}) => {
        return axiosClient.delete(url, config)
    }
}

export default api;