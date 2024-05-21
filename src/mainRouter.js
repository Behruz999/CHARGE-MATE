const router = require("express").Router();
const userRoute = require("./routes/user");
const chargeRoute = require("./routes/charge");
const familyRoute = require("./routes/family");
const adminRoute = require("./routes/admin");
const reportRoute = require("./routes/report");

router.use("/users", userRoute);

router.use("/charges", chargeRoute);

router.use("/families", familyRoute);

router.use("/admins", adminRoute);

router.use("/reports", reportRoute);

module.exports = router;
