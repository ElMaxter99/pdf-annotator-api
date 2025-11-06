import { Schema, model } from "mongoose";

const guideSettingsSchema = new Schema(
  {
    showGrid: { type: Boolean, default: false },
    snapToGrid: { type: Boolean, default: false },
    gridSize: { type: Number, default: 12 },
  },
  { _id: false }
);

const pageSchema = new Schema(
  {
    num: { type: Number, required: true },
    fields: { type: [Schema.Types.Mixed], default: [] },
  },
  { _id: false }
);

const templateSchema = new Schema(
  {
    _id: { type: String, required: true },
    workspaceId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    version: { type: Number, required: true },
    guidesEnabled: { type: Boolean, default: false },
    guideSettings: { type: guideSettingsSchema, default: () => ({}) },
    pages: { type: [pageSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

templateSchema.virtual("id").get(function getId() {
  return this._id;
});

templateSchema.set("toJSON", { virtuals: true });
templateSchema.set("toObject", { virtuals: true });

export const Template = model("Template", templateSchema);
