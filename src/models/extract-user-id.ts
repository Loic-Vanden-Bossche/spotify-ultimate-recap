export const extractUserId = async (
  headers: Headers,
): Promise<string | null> => {
  const cookies = headers.get("cookie");

  if (!cookies) {
    return null;
  }

  const splitted = cookies.split("uuid=");

  if (splitted.length < 2) {
    return null;
  }

  const userUUID = splitted[1].split(";")[0];

  if (!userUUID) {
    return null;
  }

  return userUUID;
};
