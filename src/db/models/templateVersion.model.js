import { Schema, model } from "mongoose";

const templateVersionSchema = new Schema(
  {
    _id: { type: String, required: true },
    templateId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    label: { type: String, required: true },
    sourceVersion: { type: Number, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

templateVersionSchema.virtual("id").get(function getId() {
  return this._id;
});

templateVersionSchema.set("toJSON", { virtuals: true });
templateVersionSchema.set("toObject", { virtuals: true });

export const TemplateVersion = model("TemplateVersion", templateVersionSchema);
