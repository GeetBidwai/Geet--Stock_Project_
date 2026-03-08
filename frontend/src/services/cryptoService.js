import http from "./http";

export async function getBtcForecast(model = "linear", days = 30) {
  const response = await http.get("/crypto/btc/forecast/", {
    params: { model, days },
  });
  return response.data;
}
