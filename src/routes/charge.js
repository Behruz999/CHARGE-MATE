const router = require("express").Router();
const { authorization } = require("../private/user/verify");
const { validateParams, validateBody } = require("../validations/charge");
const {
  add,
  getAll,
  getOne,
  getAllIndividualCharges,
  getAllFamilyCharges,
  editOne,
  deleteOne,
} = require("../controllers/charge");

router.route("/").get(getAll);

router
  .route("/getindividualcharges")
  .get(authorization, getAllIndividualCharges);

router.route("/getfamilycharges").get(authorization, getAllFamilyCharges);

router.route("/:id").get(validateParams, getOne);

router.route("/:id").patch(validateParams, editOne);

router.route("/:id").delete(validateParams, deleteOne);

router.use(authorization);

router.route("/").post(validateBody, add);

module.exports = router;
