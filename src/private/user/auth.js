const User = require("../../models/user");
// const Family = require("../../models/family");
const { sign } = require("jsonwebtoken");
const env = process.env;

// REGISTER
async function signup(req, res) {
  const { nickname, password, individual } = req.body;
  try {
    // const [existUser, existFamily] = await Promise.all([
    //   User.findOne({ nickname, family }),
    //   // Family.findOne({ name: family }),
    // ]);

    const existUser = await User.findOne({ nickname });

    if (existUser) {
      return res
        .status(409)
        .send({ msg: "Please choose a different username/password." });
    }

    // const newFamily = new Family({
    //   name: family,
    // });
    // const savedFamily = await newFamily.save();

    const newUser = new User({
      nickname,
      password,
      individual,
      // family: savedFamily._id,
    });
    const savedUser = await newUser.save();

    const token = sign(
      {
        _id: savedUser._id,
        nickname: savedUser.nickname,
        password: savedUser.password,
        // family: savedUser.family,
        role: savedUser.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.USER_JWT_EXPIRE }
    );

    return res.status(201).send({
      token,
      msg: `${savedUser.nickname} registration successful. Welcome to our platform !`,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

// LOGIN
async function signin(req, res) {
  const { nickname, password } = req.body;
  try {
    const existUser = await User.findOne({ nickname });
    if (!existUser || existUser.password != password) {
      return res.status(401).send({
        msg: "Invalid username or password. Please check your credentials and try again.",
      });
    }

    const token = sign(
      {
        _id: existUser._id,
        nickname: existUser.nickname,
        password: existUser.password,
        // family: existUser.family,
        role: existUser.role,
      },
      env.JWT_SECRET,
      { expiresIn: env.USER_JWT_EXPIRE }
    );
    return res.status(200).send({
      token,
      msg: `Login successful. Welcome back, ${existUser.nickname} !`,
    });
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  signup,
  signin,
};
