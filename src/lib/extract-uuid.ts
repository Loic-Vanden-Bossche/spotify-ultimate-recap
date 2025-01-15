export const extractUuid = (request: Request): string | null => {
  const cookies = request.headers.get("cookie");
  const uuidCookie = cookies && cookies.includes("uuid");

  return uuidCookie ? cookies.split("uuid=")[1].split(";")[0] : null;
};
