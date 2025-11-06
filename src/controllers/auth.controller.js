import * as authService from "../services/auth.service.js";

export const createSession = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const data = await authService.refresh(req.body.refreshToken);
    res.json(data);
  } catch (e) {
    next(e);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user);
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
