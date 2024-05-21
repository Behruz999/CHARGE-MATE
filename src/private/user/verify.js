const { verify } = require("jsonwebtoken");

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
    req.user = validToken;
    next();
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  authorization,
};
