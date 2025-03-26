export const waitOneSecond = () => wait(1000);
export const wait = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const minutesToHumanReadable = (minutes: number) => {
  const hours = Math.floor(minutes / 60);

  if (hours === 0) {
    return `${minutes}m`;
  }

  return `${hours}h`;
};

export const formatHour = (hour: number, locale: string): string => {
  if (locale === "en") {
    const period = hour >= 12 ? "pm" : "am";
    const convertedHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${convertedHour} ${period}`;
  } else {
    return `${hour}h`;
  }
};

export function convertToTimeZoneISO(dateString: string, timeZone: string) {
  const utcDate = new Date(dateString);

  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(utcDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  const hour = parts.find((p) => p.type === "hour")?.value;
  const minute = parts.find((p) => p.type === "minute")?.value;
  const second = parts.find((p) => p.type === "second")?.value;

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`;
}
