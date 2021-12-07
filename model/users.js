import mongoose from "mongoose";

const Schema = mongoose.Schema;

const user_schema = new Schema({
  email: {
    type: String,
    required: true,
    unique:true,
  },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: String,
  phone: Number,
  address: { type: String },
  tokens: [
    {
      token_id: { type: String, unique: true },
      created_at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

export default mongoose.model("users", user_schema);
