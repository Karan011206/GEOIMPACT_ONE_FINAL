export function getAqiColor(aqi = 0) {
  if (aqi <= 50) return { bg: "#EAF3DE", text: "#27500A", border: "#639922" };
  if (aqi <= 100) return { bg: "#FAEEDA", text: "#633806", border: "#EF9F27" };
  if (aqi <= 150) return { bg: "#FAECE7", text: "#712B13", border: "#D85A30" };
  if (aqi <= 200) return { bg: "#FCEBEB", text: "#791F1F", border: "#E24B4A" };
  return { bg: "#F7C1C1", text: "#501313", border: "#A32D2D" };
}

export function getAqiLevel(aqi = 0) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Poor";
  if (aqi <= 200) return "Unhealthy";
  return "Hazardous";
}

export function getAqiRecommendation(aqi = 0) {
  if (aqi <= 50) return "Air quality is good. Safe for all outdoor activities.";
  if (aqi <= 100) return "Acceptable air quality. Sensitive groups should limit prolonged outdoor exertion.";
  if (aqi <= 150) return "Sensitive groups should reduce outdoor activity. General public may feel discomfort.";
  if (aqi <= 200) return "Everyone may begin to experience health effects. Avoid prolonged outdoor exposure.";
  return "Health emergency. Avoid all outdoor activity. Wear N95 mask if going outside.";
}

export function toRelativeTime(dateString) {
  if (!dateString) return "now";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
