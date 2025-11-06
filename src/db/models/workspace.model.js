import { Schema, model } from "mongoose";
import { v4 as uuid } from "uuid";

const memberSchema = new Schema(
  {
    id: { type: String, default: () => uuid() },
    userId: { type: String, required: true, index: true },
    role: {
      type: String,
      required: true,
      enum: ["owner", "editor", "viewer"],
    },
  },
  { _id: false }
);

const workspaceSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    members: { type: [memberSchema], default: [] },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

workspaceSchema.virtual("id").get(function getId() {
  return this._id;
});

workspaceSchema.set("toJSON", { virtuals: true });
workspaceSchema.set("toObject", { virtuals: true });

export const Workspace = model("Workspace", workspaceSchema);
