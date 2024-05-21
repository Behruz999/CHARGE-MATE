const Charge = require("../models/charge");
const User = require("../models/user");
const ObjectId = require("mongoose").Types.ObjectId;

async function add(req, res) {
  const { title, category, currency, quantity, price } = req.body;
  try {
    const existUser = await User.findById(req.user._id);
    if (existUser == null) {
      return res.status(404).send({ msg: "User not found !" });
    }
    const newCharge = new Charge({
      title,
      category,
      currency,
      quantity,
      price,
      family: existUser.family,
      individual: existUser.individual != null && existUser.individual,
      user: existUser._id,
    });

    await newCharge.save();
    return res.status(201).json(newCharge);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function getAll(req, res) {
  try {
    const allCharges = await Charge.aggregate([
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
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$familyDetails",
          preserveNullAndEmptyArrays: true, // Include documents even if familyDetails array is empty (no matching documents)
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          category: 1,
          quantity: 1,
          price: 1,
          individual: 1,
          currency: 1,
          family: {
            _id: "$familyDetails._id",
            name: "$familyDetails.name",
          },
          user: {
            _id: "$userDetails._id",
            nickname: "$userDetails.nickname",
            individual: "$userDetails.individual",
          },
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
    return res.status(200).json(allCharges);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function getOne(req, res) {
  try {
    const specifiedCharge = await Charge.aggregate([
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
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$familyDetails",
          preserveNullAndEmptyArrays: true, // Include documents even if familyDetails array is empty (no matching documents)
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          category: 1,
          quantity: 1,
          price: 1,
          individual: 1,
          currency: 1,
          family: {
            _id: "$familyDetails._id",
            name: "$familyDetails.name",
          },
          user: {
            _id: "$userDetails._id",
            nickname: "$userDetails.nickname",
            individual: "$userDetails.individual",
          },
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
    return res.status(200).json(specifiedCharge);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function getAllIndividualCharges(req, res) {
  try {
    const existUser = await User.findById(req.user._id);
    if (!existUser) {
      return res.status(404).send({ msg: "User not found" });
    }
    const specifiedCharge = await Charge.aggregate([
      {
        $match: {
          user: new ObjectId(existUser._id),
          individual: existUser.individual,
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
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$familyDetails",
          preserveNullAndEmptyArrays: true, // Include documents even if familyDetails array is empty (no matching documents)
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          category: 1,
          quantity: 1,
          price: 1,
          individual: 1,
          currency: 1,
          family: {
            _id: "$familyDetails._id",
            name: "$familyDetails.name",
          },
          user: {
            _id: "$userDetails._id",
            nickname: "$userDetails.nickname",
            individual: "$userDetails.individual",
          },
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
    return res.status(200).json(specifiedCharge);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function getAllFamilyCharges(req, res) {
  try {
    const existUser = await User.findById(req.user._id);
    if (!existUser) {
      return res.status(404).send({ msg: "User not found" });
    }
    const specifiedCharge = await Charge.aggregate([
      {
        $match: {
          family: new ObjectId(existUser.family),
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
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: {
          path: "$familyDetails",
          preserveNullAndEmptyArrays: true, // Include documents even if familyDetails array is empty (no matching documents)
        },
      },
      {
        $unwind: {
          path: "$userDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          category: 1,
          quantity: 1,
          price: 1,
          individual: 1,
          currency: 1,
          family: {
            _id: "$familyDetails._id",
            name: "$familyDetails.name",
          },
          user: {
            _id: "$userDetails._id",
            nickname: "$userDetails.nickname",
            individual: "$userDetails.individual",
          },
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
    return res.status(200).json(specifiedCharge);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function editOne(req, res) {
  try {
    const modifiedCharge = await Charge.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    )
    if (modifiedCharge == null) {
      return res.status(404).send({ msg: "Charge not found !" });
    }
    return res.status(200).json(modifiedCharge);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

async function deleteOne(req, res) {
  try {
    const erasedCharge = await Charge.findByIdAndDelete(req.params.id);
    if (erasedCharge == null) {
      return res.status(404).send({ msg: "Charge not found !" });
    }
    return res.status(200).json(erasedCharge);
  } catch (err) {
    return res.status(500).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  add,
  getAll,
  getOne,
  getAllIndividualCharges,
  getAllFamilyCharges,
  editOne,
  deleteOne,
};
