import * as workspaceService from "../services/workspace.service.js";

export const list = async (req, res, next) => {
  try {
    const workspaces = await workspaceService.list(req.user.id);
    res.json(workspaces);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const workspace = await workspaceService.create(req.user.id, req.body);
    res.status(201).json(workspace);
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (req, res, next) => {
  try {
    const member = await workspaceService.inviteMember(req.user.id, req.params.workspaceId, req.body);
    res.status(201).json(member);
  } catch (error) {
    next(error);
  }
};
