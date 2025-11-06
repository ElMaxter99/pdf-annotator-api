export const parseIfMatchVersion = (header) => {
  if (!header) return null;
  const match = header.match(/W\/"(\d+)"/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
};

export const versionConflict = (current) => {
  const err = new Error("La plantilla fue modificada por otro usuario.");
  err.status = 409;
  err.code = "version_conflict";
  err.currentVersion = current;
  return err;
};
