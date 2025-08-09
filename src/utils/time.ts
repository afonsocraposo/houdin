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

export function formatTimeAgo(timestamp: number): string {
  const timeAgo = getTimeAgoInstance();
  return timeAgo.format(new Date(timestamp));
}
