import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { encripPassword } from "../helpers/bcrypt.js";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "The name is required"],
    trim: true,
    uppercase: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    uppercase: true,
    trim: true,
    unique: [true, "The Email is already registered"],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  password: {
    type: String,
    required: [true, "Password is required"],
  },
  image: {
    type: String,
  },
  role: {
    type: Number,
    default: 1,
  },
});

userSchema.plugin(mongoosePaginate);

userSchema.pre("save", async function (next) {
  try {
    if (this.isNew) {
      this.password = await encripPassword(this.password);
      next();
    }
  } catch (error) {
    console.log(error);
  }
});

userSchema.methods.toJSON = function () {
  const { password, __v, ...user } = this.toObject();
  return user;
};

export default mongoose.model("User", userSchema);
