import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("venueiq_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("venueiq_token");
      window.location.href = "/login";
    }
    return Promise.reject(err.response?.data || err);
  }
);

// Auth
export const authApi = {
  login: (data) => api.post("/auth/login", data).then((r) => r.data),
  register: (data) => api.post("/auth/register", data).then((r) => r.data),
  me: () => api.get("/auth/me").then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats").then((r) => r.data),
  activity: () => api.get("/dashboard/activity").then((r) => r.data),
  crowdTrend: () => api.get("/dashboard/crowd-trend").then((r) => r.data),
};

// Venues
export const venuesApi = {
  list: () => api.get("/venues").then((r) => r.data),
  get: (id) => api.get(`/venues/${id}`).then((r) => r.data),
  create: (data) => api.post("/venues", data).then((r) => r.data),
};

// Crowd
export const crowdApi = {
  zones: () => api.get("/crowd/zones").then((r) => r.data),
  alerts: () => api.get("/crowd/alerts").then((r) => r.data),
  updateZone: (zoneId, data) =>
    api.put(`/crowd/zones/${zoneId}/update`, data).then((r) => r.data),
  resolveAlert: (alertId) =>
    api.post(`/crowd/alerts/${alertId}/resolve`).then((r) => r.data),
  analyze: (data) => api.post("/crowd/analyze", data).then((r) => r.data),
};

// Navigation
export const navigationApi = {
  route: (data) => api.post("/navigation/route", data).then((r) => r.data),
  map: (venueId) => api.get(`/navigation/map/${venueId}`).then((r) => r.data),
  pois: () => api.get("/navigation/pois").then((r) => r.data),
};

// Chat
export const chatApi = {
  history: () => api.get("/chat/history").then((r) => r.data),
  sendMessage: (data) => api.post("/chat/message", data).then((r) => r.data),
  clearHistory: () => api.delete("/chat/history").then((r) => r.data),
};

// Decisions
export const decisionsApi = {
  query: (data) => api.post("/decisions/query", data).then((r) => r.data),
};

// Admin
export const adminApi = {
  users: () => api.get("/admin/users").then((r) => r.data),
  updateUser: (userId, data) =>
    api.patch(`/admin/users/${userId}`, data).then((r) => r.data),
  deleteUser: (userId) =>
    api.delete(`/admin/users/${userId}`).then((r) => r.data),
  createVenue: (data) =>
    api.post("/admin/venues", data).then((r) => r.data),
};

export default api;
