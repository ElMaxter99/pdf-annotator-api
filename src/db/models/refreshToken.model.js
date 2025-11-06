import { Schema, model } from "mongoose";

const refreshTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
  }
);

export const RefreshToken = model("RefreshToken", refreshTokenSchema);
