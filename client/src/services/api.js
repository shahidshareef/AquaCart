import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig.js";

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
});

api.interceptors.request.use(
    function (config) {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    function (error) {
        return Promise.reject(error);
    }
);

export default api;