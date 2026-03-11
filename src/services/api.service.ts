import axios from "axios";
import { ApiResponse, Incident } from "../types";

const api = axios.create({
  baseURL: "https://jsonplaceholder.typicode.com",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// intercepteurs de requetes
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  },
);

// intercepteurs de reponses
api.interceptors.response.use(
  (response) => {
    console.log(
      `[API Response] ${response.status} from ${response.config.url}`,
    );
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `[API Response Error] ${error.response.status}:`,
        error.response.data,
      );
    } else if (error.request) {
      console.error("[API Network Error] No response received");
    } else {
      console.error("[API Error]", error.message);
    }
    return Promise.reject(error);
  },
);

// fonctions d'API

export const submitIncident = async (
  data: Incident,
): Promise<ApiResponse<Incident>> => {
  try {
    const response = await api.post("/posts", data);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error submitting incident:", error);
    return {
      success: false,
      error: "Failed to submit incident. Please try again.",
    };
  }
};

export default api;
