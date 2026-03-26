export const formatNumToShort = (count: string) => {
  const num = parseInt(count);
  if (isNaN(num)) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

export const formatYouTubeDuration = (duration: string) => {
  const match = duration.match(
    /P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/,
  );
  if (!match) return "";

  const [days, hours, minutes, seconds] = match
    .slice(1)
    .map((x) => parseInt(x) || 0);

  // Convert days into total hours
  const totalHours = days * 24 + hours;

  if (totalHours > 0) {
    return `${totalHours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const openYtExt = (videoId: string, seconds: number = 0) => {
  const t = Math.floor(seconds);
  const url = `https://youtu.be/${videoId}${t > 0 ? `?t=${t}` : ""}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

export const parseISO8601ToSeconds = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0");
  const minutes = parseInt(match[2] || "0");
  const seconds = parseInt(match[3] || "0");
  return hours * 3600 + minutes * 60 + seconds;
};
