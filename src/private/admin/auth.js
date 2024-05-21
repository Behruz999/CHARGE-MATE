const { verify } = require("jsonwebtoken");
const { jwtDecode } = require("jwt-decode");

async function authorization(req, res, next) {
  try {
    const headerToken = req.headers["authorization"];
    if (!headerToken) {
      return res.status(401).send({
        msg: "Authentication required. Please provide a valid authentication token.",
      });
    }
    const validToken = verify(headerToken, process.env.JWT_SECRET);
    if (!validToken) {
      return res.status(401).send({
        msg: "Invalid or expired authentication token. Please log in again.",
      });
    }
    const admin = jwtDecode(validToken);
    if (!admin) {
      return res.status(403).send({
        msg: "Access forbidden. This action requires administrator privileges.",
      });
    }
    next();
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  authorization,
};
