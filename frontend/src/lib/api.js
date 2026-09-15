import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = {
  zones: () => axios.get(`${API}/zones`).then((r) => r.data),
  footfall: () => axios.get(`${API}/footfall`).then((r) => r.data),
  stats: () => axios.get(`${API}/stats`).then((r) => r.data),
  sensors: (id) => axios.get(`${API}/sensors/${id}`).then((r) => r.data),
  history: () => axios.get(`${API}/history`).then((r) => r.data),
  checkins: () => axios.get(`${API}/checkins`).then((r) => r.data),
  createCheckin: (body) => axios.post(`${API}/checkins`, body).then((r) => r.data),
  reports: () => axios.get(`${API}/reports`).then((r) => r.data),
  createReport: (body) => axios.post(`${API}/reports`, body).then((r) => r.data),
  alerts: () => axios.get(`${API}/alerts`).then((r) => r.data),
  triggerAlert: (body) => axios.post(`${API}/alerts/trigger`, body).then((r) => r.data),
};