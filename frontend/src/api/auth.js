import axios from "axios";

const API_URL = "http://localhost:1337/api";

// On ajoute bien 'export' devant pour que Login.jsx puisse la voir
export const userSignIn = async (identifier, password) => {
  const response = await axios.post(`${API_URL}/auth/local`, {
    identifier,
    password,
  });
  return response.data;
};

export const createNewUser = async (username, email, password) => {
  const response = await axios.post(`${API_URL}/auth/local/register`, {
    username,
    email,
    password,
  });
  return response.data;
};
const api = axios.create({
  baseURL: "http://localhost:1337/api",
});

// CETTE LIGNE EST CELLE QUI MANQUE :
export default api;