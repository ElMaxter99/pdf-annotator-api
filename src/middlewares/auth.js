import { User } from "../db/models/user.model.js";
import { verifyToken } from "../utils/jwt.js";

export const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_token", message: "Authorization header is required" });
  }

  const token = header.split(" ")[1];

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean().exec();

    if (!user) {
      return res.status(401).json({ error: "invalid_token", message: "User not found" });
    }

    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      roles: payload.roles,
      defaultWorkspaceId: payload.defaultWorkspaceId,
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: "invalid_token", message: "Token is invalid or expired" });
  }
};
