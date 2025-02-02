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
