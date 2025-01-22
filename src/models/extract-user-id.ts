export const extractUserId = async (
  headers: Headers,
): Promise<string | null> => {
  const cookies = headers.get("cookie");

  if (!cookies) {
    return null;
  }

  const userUUID = cookies.split("uuid=")[1].split(";")[0];

  if (!userUUID) {
    return null;
  }

  return userUUID;
};
