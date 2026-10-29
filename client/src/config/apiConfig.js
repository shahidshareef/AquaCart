// Central API base URL for the entire AquaCart frontend.
// Set VITE_API_BASE_URL in the environment for deployment-specific configuration.
const DEFAULT_API_BASE_URL = import.meta.env.PROD
    ? "https://aquacart.onrender.com"
    : "http://localhost:5000";

export const API_BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export default API_BASE_URL;
