const User = require("../../models/user");
const { sign } = require("jsonwebtoken");

// REGISTER FOR OWNER
async function signup(req, res) {
  const { nickname, password } = req.body;
  try {
    const existOwner = await User.findOne({ nickname });
    if (existOwner) {
      return res
        .status(409)
        .send({ msg: "Please choose a different username/password." });
    }
    const newOwner = new User({
      nickname,
      password,
      role: "admin",
    });
    await newOwner.save();
    const token = sign(
      {
        _id: null,
        nickname: newOwner.nickname,
        password: newOwner.password,
        role: "admin",
      },
      env.JWT_SECRET,
      { expiresIn: env.ADMIN_JWT_EXPIRE }
    );
    return res.status(201).send({
      token,
      msg: "Admin registration successful. Welcome to platform !",
    });
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

// LOGIN FOR OWNER
async function signin(req, res) {
  const { nickname, password } = req.body;
  try {
    const existOwner = await User.findOne({ nickname });
    if (!existOwner || existOwner.password != password) {
      return res.status(401).send({
        msg: "Invalid username or password. Please check your credentials and try again.",
      });
    }

    const token = sign(
      {
        _id: null,
        nickname: existOwner.nickname,
        password: existOwner.password,
        role: existOwner.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.USER_JWT_EXPIRE }
    );
    return res.status(200).send({
      token,
      msg: `Login successful. Welcome back, ${existOwner.nickname} !`,
    });
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  signup,
  signin,
};
