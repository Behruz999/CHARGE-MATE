const router = require("express").Router();
const {
  validateParams,
  validateBody,
  validateBodySignUp,
  validateBodySignIn,
} = require("../validations/user");
const { getAll, getOne, editOne, deleteOne } = require("../controllers/user");
const { signup, signin } = require("../private/user/auth");

router.route("/signup").post(validateBodySignUp, signup);

router.route("/signin").post(validateBodySignIn, signin);

router.route("/").get(getAll);

router.route("/:id").get(validateParams, getOne);

router.route("/:id").patch(validateParams, editOne);

router.route("/:id").delete(validateParams, deleteOne);

module.exports = router;
