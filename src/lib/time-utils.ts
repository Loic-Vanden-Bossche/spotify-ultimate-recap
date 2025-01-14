export const waitOneSecond = () =>
  new Promise((resolve) => setTimeout(resolve, 1000));

export const minutesToHumanReadable = (minutes: number) => {
  // if less than 60 minutes, display in minutes
  // if less than 24 hours, display in hours
  // if less than 7 days, display in days
  // if less than 30 days, display in weeks

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} heure${hours === 1 ? "" : "s"}`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} jour${days === 1 ? "" : "s"}`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 30) {
    return `${weeks} semaine${weeks === 1 ? "" : "s"}`;
  }

  const months = Math.floor(weeks / 4);

  return `${months} mois`;
};
