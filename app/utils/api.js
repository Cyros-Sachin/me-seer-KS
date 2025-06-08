// utils/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://meseer.com/dog/",
  headers: {
    Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("token") : ""}`,
    "Content-Type": "application/json",
  },
});

export default api;
