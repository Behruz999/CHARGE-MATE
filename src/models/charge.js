const { Schema, model } = require("mongoose");

const chargeSchema = new Schema(
  {
    title: {
      type: String,
      index: true,
      required: true,
    },
    category: {
      type: String,
      default: null,
    },
    currency: {
      type: String,
      uppercase: true,
      default: 'UZS',
    },
    quantity: {
      type: Number,
      default: null,
    },
    price: {
      type: Number,
      required: true,
    },
    individual: {
      type: Boolean,
      required: true,
    },
    family: {
      type: Schema.Types.ObjectId,
      ref: "family",
      default: null,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true, versionKey: false }
);

// Define the pre-save middleware
chargeSchema.pre("save", function (next) {
  // Capitalize the first letter of title if not null
  if (this.title) {
    this.title = this.title.charAt(0).toUpperCase() + this.title.slice(1);
  }
  // Capitalize the first letter of category if not null
  if (this.category) {
    this.category =
      this.category.charAt(0).toUpperCase() + this.category.slice(1);
  }
  next();
});

const Charge = model("charge", chargeSchema);

module.exports = Charge;
