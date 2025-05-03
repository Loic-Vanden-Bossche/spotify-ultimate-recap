export const encodeMessage = (eventName: string, data: unknown) => {
  return `event: ${eventName}, data: ${JSON.stringify(data)}\n\n`;
};
