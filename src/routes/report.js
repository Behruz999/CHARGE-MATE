const router = require("express").Router();
const { authorization } = require("../private/user/verify");
const {
  getIndividualCharges,
  getFamilyCharges,
} = require("../private/reports/user/report");

const {
  getIndividualChargesAdmin,
  getFamilyChargesAdmin,
  getComparedFamilies,
} = require("../private/reports/admin/report");

router
  .route("/users/individualcharges")
  .get(authorization, getIndividualCharges);

router.route("/users/familycharges").get(authorization, getFamilyCharges);


router.route("/admins/individualcharges").get(getIndividualChargesAdmin);

router.route("/admins/familycharges").get(getFamilyChargesAdmin);

router.route("/admins/comparedfamilies").get(getComparedFamilies);

module.exports = router;
