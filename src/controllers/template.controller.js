import * as templateService from "../services/template.service.js";

export const list = async (req, res, next) => {
  try {
    const templates = await templateService.list(req.params.workspaceId, req.user.id);
    res.json(templates);
  } catch (error) {
    next(error);
  }
};

export const save = async (req, res, next) => {
  try {
    const result = await templateService.save({
      workspaceId: req.params.workspaceId,
      templateId: req.params.templateId,
      userId: req.user.id,
      body: req.body,
      ifMatch: req.headers["if-match"],
    });

    const status = result.created ? 201 : 200;
    res.status(status).json(result.template);
  } catch (error) {
    next(error);
  }
};

export const remove = async (req, res, next) => {
  try {
    await templateService.remove({
      workspaceId: req.params.workspaceId,
      templateId: req.params.templateId,
      userId: req.user.id,
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const createVersion = async (req, res, next) => {
  try {
    const version = await templateService.createVersion({
      workspaceId: req.params.workspaceId,
      templateId: req.params.templateId,
      userId: req.user.id,
      body: req.body,
    });
    res.status(201).json(version);
  } catch (error) {
    next(error);
  }
};
