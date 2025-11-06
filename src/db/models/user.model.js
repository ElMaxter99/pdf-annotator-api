import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, default: null },
    name: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    defaultWorkspaceId: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

userSchema.virtual("id").get(function getId() {
  return this._id;
});

userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

export const User = model("User", userSchema);
