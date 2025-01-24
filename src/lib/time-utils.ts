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
