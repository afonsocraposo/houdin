import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

// Initialize TimeAgo with English locale (only once)
let timeAgoInstance: TimeAgo | null = null;

function getTimeAgoInstance(): TimeAgo {
  if (!timeAgoInstance) {
    TimeAgo.addDefaultLocale(en);
    timeAgoInstance = new TimeAgo("en-US");
  }
  return timeAgoInstance;
}

export function formatTimeAgo(timestamp: number | Date): string {
  const date = typeof timestamp === "number" ? new Date(timestamp) : timestamp;
  const timeAgo = getTimeAgoInstance();
  return timeAgo.format(new Date(date));
}
