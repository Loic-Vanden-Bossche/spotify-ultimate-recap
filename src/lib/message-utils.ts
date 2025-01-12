export const encodeMessage = (eventName: string, data: any) => {
  return `event: ${eventName}, data: ${JSON.stringify(data)}\n\n`;
};
