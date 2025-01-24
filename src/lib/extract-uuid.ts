export const extractUuid = (request: Request): string | null => {
  const cookies = request.headers.get("cookie");
  const uuidCookie = cookies && cookies.includes("uuid");

  console.log(cookies);

  if (!cookies || !uuidCookie) {
    return null;
  }

  return cookies.split("uuid=")[1].split(";")[0];
};
