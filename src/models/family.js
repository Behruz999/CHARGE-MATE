const { Schema, model } = require("mongoose");

const familySchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    users: {
      type: [Schema.Types.ObjectId],
      ref: "user",
      default: [],
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

const Family = model("family", familySchema);

module.exports = Family;
