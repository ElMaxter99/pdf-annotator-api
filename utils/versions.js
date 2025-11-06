export const versionConflict = (current) => {
  const err = new Error("La plantilla fue modificada por otro usuario.");
  err.status = 409;
  err.code = "version_conflict";
  err.currentVersion = current;
  return err;
};
