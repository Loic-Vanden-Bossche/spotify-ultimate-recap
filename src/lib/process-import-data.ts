export const processImportData = async (
  jsonFiles: Record<string, any>[],
  progress: (status: string) => void,
) => {
  progress(`${jsonFiles.length} Fichiers de donnés récupérés`);

  await new Promise((resolve) => setTimeout(resolve, 2000));
};
