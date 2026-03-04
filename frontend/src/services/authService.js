import http from "./http";

export async function signup(payload) {
  const response = await http.post("/signup/", payload);
  return response.data;
}

export async function login(payload) {
  const response = await http.post("/login/", payload);
  return response.data;
}

export async function getCurrentUser() {
  const response = await http.get("/me/");
  return response.data;
}
