const router = require("express").Router();
const { validateBody } = require("../validations/admin");
const { signup, signin } = require("../private/admin/admin");

router.route("/signup").post(validateBody, signup);

router.route("/signin").post(validateBody, signin);

module.exports = router;
