import { API_BASE_URL } from "../config/apiConfig.js";

export async function adminFetch(path, options = {}) {
    const token = localStorage.getItem("token");

    const headers = new Headers(options.headers || {});

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const url = /^https?:\/\//i.test(path)
        ? path
        : `${API_BASE_URL}${path}`;

    return fetch(url, {
        ...options,
        headers,
    });
}