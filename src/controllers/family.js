const Charge = require("../models/charge");
const Family = require("../models/family");
const User = require("../models/user");
const randomstring = require("randomstring");
const ObjectId = require("mongoose").Types.ObjectId;

// Generate a random string of specified length
function passwordGenerator(res, digit) {
  const randomString = randomstring.generate({
    length: digit != 0 ? digit : 10,
    charset: "alphanumeric",
  });

  if (randomString.length <= 5) {
    return res.status(400).send({ msg: "Password too weak !" });
  }

  return randomString;
}

async function add(req, res) {
  const { name, password, includeMe, generatePassword, digit } = req.body;
  try {
    const existFamily = await Family.findOne({ name });
    if (existFamily) {
      return res.status(400).send({ msg: "Choose different name" });
    }
    const existUser = await User.findById(req.user._id);
    if (!existUser) {
      return res.status(400).send({ msg: "User not found" });
    }

    let users = includeMe ? [existUser._id] : [];
    let passwordValue = generatePassword
      ? await passwordGenerator(res, digit)
      : password;
    const newFamily = new Family({
      name,
      users,
      password: passwordValue,
    });
    await newFamily.save();

    if (includeMe) {
      existUser.individual = false;
      existUser.family = newFamily._id;
      await existUser.save();
    }

    return res.status(201).json(newFamily);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function getAll(req, res) {
  try {
    const allFamilies = await Family.aggregate([
      { $match: {} },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "usersDetails",
        },
      },
      {
        $addFields: {
          usersDetails: {
            $map: {
              input: "$usersDetails",
              as: "userDetail",
              in: {
                _id: "$$userDetail._id",
                nickname: "$$userDetail.nickname",
                // Add any other specific fields you need from usersDetails here
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          users: "$usersDetails",
          members: { $size: "$users" },
          password: 1,
          createdAt: {
            $concat: [
              {
                $dateToString: {
                  format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                  date: "$createdAt", // Date field to format
                },
              },
              " ", // Separator between date and time
              {
                $dateToString: {
                  format: "%H:%M:%S", // Format string for "HH:MM:SS"
                  date: "$createdAt", // Date field to extract time from
                },
              },
            ],
          },
          updatedAt: {
            $concat: [
              {
                $dateToString: {
                  format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                  date: "$updatedAt", // Date field to format
                },
              },
              " ", // Separator between date and time
              {
                $dateToString: {
                  format: "%H:%M:%S", // Format string for "HH:MM:SS"
                  date: "$updatedAt", // Date field to extract time from
                },
              },
            ],
          },
        },
      },
    ]);
    return res.status(200).json(allFamilies);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function getOne(req, res) {
  try {
    const specifiedFamily = await Family.aggregate([
      {
        $match: {
          _id: new ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "usersDetails",
        },
      },
      {
        $addFields: {
          usersDetails: {
            $map: {
              input: "$usersDetails",
              as: "userDetail",
              in: {
                _id: "$$userDetail._id",
                nickname: "$$userDetail.nickname",
                // Add any other specific fields you need from usersDetails here
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          users: '$usersDetails',
          members: { $size: "$users" },
          password: 1,
          createdAt: {
            $concat: [
              {
                $dateToString: {
                  format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                  date: "$createdAt", // Date field to format
                },
              },
              " ", // Separator between date and time
              {
                $dateToString: {
                  format: "%H:%M:%S", // Format string for "HH:MM:SS"
                  date: "$createdAt", // Date field to extract time from
                },
              },
            ],
          },
          updatedAt: {
            $concat: [
              {
                $dateToString: {
                  format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                  date: "$updatedAt", // Date field to format
                },
              },
              " ", // Separator between date and time
              {
                $dateToString: {
                  format: "%H:%M:%S", // Format string for "HH:MM:SS"
                  date: "$updatedAt", // Date field to extract time from
                },
              },
            ],
          },
        },
      },
    ]);
    if (specifiedFamily == null) {
      return res.status(404).send({ msg: "Family not found !" });
    }
    return res.status(200).json(specifiedFamily);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function getFamilyInfo(req, res) {
  try {
    const existUser = await User.findById(req.user._id);
    if (!existUser) {
      return res.status(404).send({ msg: "User not found !" });
    }
    const specifiedFamily = await Family.aggregate([
      {
        $match: {
          users: {
            $elemMatch: { $eq: new ObjectId(existUser._id) },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "users",
          foreignField: "_id",
          as: "usersDetails",
        },
      },
      {
        $addFields: {
          usersDetails: {
            $map: {
              input: "$usersDetails",
              as: "userDetail",
              in: {
                _id: "$$userDetail._id",
                nickname: "$$userDetail.nickname",
                // Add any other specific fields you need from usersDetails here
              },
            },
          },
        },
      },
      {
        $project: {
          name: 1,
          users: "$usersDetails",
          members: { $size: "$users" },
          password: 1,
          createdAt: {
            $concat: [
              {
                $dateToString: {
                  format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                  date: "$createdAt", // Date field to format
                },
              },
              " ", // Separator between date and time
              {
                $dateToString: {
                  format: "%H:%M:%S", // Format string for "HH:MM:SS"
                  date: "$createdAt", // Date field to extract time from
                },
              },
            ],
          },
          updatedAt: {
            $concat: [
              {
                $dateToString: {
                  format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                  date: "$updatedAt", // Date field to format
                },
              },
              " ", // Separator between date and time
              {
                $dateToString: {
                  format: "%H:%M:%S", // Format string for "HH:MM:SS"
                  date: "$updatedAt", // Date field to extract time from
                },
              },
            ],
          },
        },
      },
    ]);
    if (specifiedFamily == null) {
      return res.status(404).send({ msg: "Family not found !" });
    }
    return res.status(200).json(specifiedFamily);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function editOne(req, res) {
  try {
    const modifiedFamily = await Family.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    ).populate("users", "nickname");
    if (modifiedFamily == null) {
      return res.status(404).send({ msg: "Family not found !" });
    }
    return res.status(200).json(modifiedFamily);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function deleteOne(req, res) {
  try {
    const erasedFamily = await Family.findByIdAndDelete(req.params.id);
    if (erasedFamily == null) {
      return res.status(404).send({ msg: "Family not found !" });
    }
    return res.status(200).json(erasedFamily);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function joinFamily(req, res) {
  const { name, password } = req.body;
  try {
    const existFamily = await Family.findOne({ name, password });
    if (!existFamily) {
      return res.status(400).send({ msg: "Check name/password" });
    }
    const existUser = await User.findById(req.user._id);
    if (!existUser) {
      return res.status(400).send({ msg: "User not found !" });
    }
    if (existFamily.users.includes(existUser._id)) {
      return res.status(400).send({ msg: "You've already joined." });
    }

    existFamily.users.push(existUser._id);
    existUser.individual = false;
    existUser.family = existFamily._id;
    await existFamily.save();
    await existUser.save();
    return res.status(200).json(existFamily);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function leaveFamily(req, res) {
  // deleteFamilyToo - indicates user deserves to delete family and family's charges,
  // if user remains last member of family
  const { deleteFamilyDetailsToo } = req.body;
  try {
    let msg = "";
    const existUser = await User.findById(req.user._id);
    if (!existUser) {
      return res.status(400).send({ msg: "User not found !" });
    }

    if (deleteFamilyDetailsToo) {
      const deletedFamily = await Family.findByIdAndDelete(req.params.id);
      if (deletedFamily == null) {
        return res.status(400).send({ msg: "Family not found !" });
      }
      await Charge.deleteMany({
        family: req.params.id,
      });
      existUser.individual = true;
      existUser.family = null;
      await existUser.save();
      msg = `Specified family and associated charges have been deleted.`;
    } else {
      const updatedFamily = await Family.findByIdAndUpdate(
        req.params.id,
        { $pull: { users: existUser._id } },
        { new: true }
      );
      if (updatedFamily == null) {
        return res.status(400).send({ msg: "Family not found !" });
      }
      existUser.individual = true;
      existUser.family = null;
      await existUser.save();
      msg = `You have left the family "${updatedFamily.name}".`;
    }
    return res.status(200).json({ msg });
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  add,
  getAll,
  getOne,
  getFamilyInfo,
  editOne,
  deleteOne,
  joinFamily,
  leaveFamily,
};
