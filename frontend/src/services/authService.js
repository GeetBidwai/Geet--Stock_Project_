import http from "./http";

export async function signup(payload) {
  const response = await http.post("/auth/signup/", payload);
  return response.data;
}

export async function login(payload) {
  const response = await http.post("/auth/login/", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await http.get("/auth/me/");
  return response.data;
}

export async function logout() {
  await http.post("/auth/logout/");
}
