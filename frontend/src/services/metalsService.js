import http from "./http";

export async function getMetalsAnalytics(range = "1mo") {
  const response = await http.get("/metals/history/", {
    params: { range },
  });
  return response.data;
}
