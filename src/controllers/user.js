const User = require("../models/user");
const Family = require("../models/family");
const ObjectId = require("mongoose").Types.ObjectId;

async function getAll(req, res) {
  try {
    const allUsers = await User.aggregate([
      { $match: {} },
      {
        $lookup: {
          from: "families",
          localField: "family",
          foreignField: "_id",
          as: "familyDetails",
        },
      },
      {
        $unwind: {
          path: "$familyDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          nickname: 1,
          password: 1,
          individual: 1,
          family: {
            $cond: {
              if: { $eq: ["$familyDetails", {}] }, // Check if familyDetails is an empty object
              then: null, // Replace familyDetails with null if it's an empty object
              else: {
                _id: "$familyDetails._id",
                name: "$familyDetails.name",
              },
            },
          },
          role: 1,
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
    return res.status(200).json(allUsers);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function getOne(req, res) {
  try {
    const specifiedUser = await User.aggregate([
      {
        $match: {
          _id: new ObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "families",
          localField: "family",
          foreignField: "_id",
          as: "familyDetails",
        },
      },
      {
        $unwind: {
          path: "$familyDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          nickname: 1,
          password: 1,
          individual: 1,
          family: {
            $cond: {
              if: { $eq: ["$familyDetails", {}] }, // Check if familyDetails is an empty object
              then: null, // Replace familyDetails with null if it's an empty object
              else: {
                _id: "$familyDetails._id",
                name: "$familyDetails.name",
              },
            },
          },
          role: 1,
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

    return res.status(200).json(specifiedUser);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function editOne(req, res) {
  try {
    const modifiedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("family", "name");

    if (modifiedUser == null) {
      return res.status(404).send({ msg: "User not found !" });
    }
    return res.status(200).json(modifiedUser);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function deleteOne(req, res) {
  try {
    // Find the user document
    const erasedUser = await User.findById(req.params.id);
    if (!erasedUser) {
      return res.status(404).send({ msg: "User not found!" });
    }

    const familyId = erasedUser.family;

    // Update the family document to remove the user's _id from the users array
    await Family.updateOne(
      { _id: familyId },
      { $pull: { users: req.params.id } }
    );

    // Delete the user document using findByIdAndDelete
    await User.findByIdAndDelete(req.params.id);

    return res.status(200).send({ msg: "User deleted successfully." });
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  getAll,
  getOne,
  editOne,
  deleteOne,
};
