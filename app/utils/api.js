// utils/api.js
import axios from "axios";
import Cookies from "js-cookie";
const api = axios.create({
  baseURL: "https://meseer.com/dog/",
  headers: {
    Authorization: `Bearer ${Cookies.get(token)}`,
    "Content-Type": "application/json",
  },
});

export default api;
