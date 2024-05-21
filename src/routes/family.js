const router = require("express").Router();
const { authorization } = require("../private/user/verify");
const { validateParams, validateBody } = require("../validations/family");
const {
  add,
  getAll,
  getOne,
  getFamilyInfo,
  editOne,
  deleteOne,
  joinFamily,
  leaveFamily,
} = require("../controllers/family");

router.route("/").post(authorization, validateBody, add);

router.route("/join").post(authorization, joinFamily);

router.route("/leave/:id").post(authorization, leaveFamily);

router.route("/").get(getAll);

router.route("/getinfo").get(authorization, getFamilyInfo);

router.route("/:id").get(validateParams, getOne);

router.route("/:id").patch(validateParams, editOne);

router.route("/:id").delete(validateParams, deleteOne);

module.exports = router;
