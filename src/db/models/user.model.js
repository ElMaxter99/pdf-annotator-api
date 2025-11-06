import bcrypt from "bcryptjs";
import { Schema, model } from "mongoose";

const SALT_ROUNDS = 12;

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

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.pre("findOneAndUpdate", async function hashUpdatedPassword(next) {
  const update = this.getUpdate();
  if (!update) {
    return next();
  }

  const password = update.password ?? update.$set?.password;
  if (!password) {
    return next();
  }

  try {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    if (update.password) {
      update.password = hashed;
    } else if (update.$set?.password) {
      update.$set.password = hashed;
    }
    return next();
  } catch (error) {
    return next(error);
  }
});

export const User = model("User", userSchema);
