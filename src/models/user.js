const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    nickname: {
      type: String,
      minlength: 4,
      maxlength: 15,
      index: true,
      required: true,
    },
    // individual: {
    //   type: Boolean,
    //   default: () => {
    //     return this.role !== "admin";
    //   },
    // },
    individual: {
      type: Boolean,
      default: true,
    },
    password: {
      type: String,
      minlength: 4,
      maxlength: 10,
      required: true,
    },
    family: {
      type: Schema.Types.ObjectId,
      ref: "family",
      // required: function () {
      //   return this.role !== "admin"; // Require family field only if the user is not an admin
      // },
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true, versionKey: false }
);

// Define a virtual property for the individual field
// userSchema.virtual("individual").get(() => {
//   if (this.role === "admin") {
//     // If user is admin, return undefined for individual field
//     return undefined;
//   } else {
//     // Otherwise, return the value based on family presence
//     return !this.family;
//   }
// });

// // Hide the virtual field from JSON output
// userSchema.set("toJSON", { virtuals: true });
// userSchema.set("toObject", { virtuals: true });

const User = model("user", userSchema);

module.exports = User;
