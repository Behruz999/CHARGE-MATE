const Charge = require("../../../models/charge");
const User = require("../../../models/user");
const Family = require("../../../models/family");
const ObjectId = require("mongoose").Types.ObjectId;

// Scanning, configuring dates whether user provided date details or not
function inspectDate(day, month, year, todayFlag, yesterdayFlag) {
  day = parseInt(day);
  month = parseInt(month);
  year = parseInt(year);

  let startDate, endDate;

  if (todayFlag) {
    const today = new Date();
    startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    endDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    ); // End of the day
  } else if (yesterdayFlag) {
    // Get yesterday's date
    const yesterdayy = new Date();
    yesterdayy.setDate(yesterdayy.getDate() - 1);

    // Set the time to the start of yesterday
    yesterdayy.setHours(0, 0, 0, 0);
    // Set the time to the end of yesterday
    const endOfYesterday = new Date(yesterdayy);
    endOfYesterday.setDate(endOfYesterday.getDate() + 1);
    startDate = yesterdayy;
    endDate = endOfYesterday;
  } else if (day && month && year) {
    startDate = new Date(year, month - 1, day);
    endDate = new Date(year, month - 1, day + 1); // End of the day
  } else if (!day && month && year) {
    startDate = new Date(year, month - 1, 1); // Start of the month
    endDate = new Date(year, month, 0); // End of the month (last day)
  } else {
    return null; // No filters for date, return null
  }

  return { startDate, endDate };
}

// Function to find unique currencies and calculate total amount for each
function calculateTotalAmountPerCurrency(transactions) {
  const totals = {};
  transactions.forEach((transaction) => {
    if (!totals[transaction.currency]) {
      totals[transaction.currency] = 0;
    }
    totals[transaction.currency] += transaction.total;
  });
  // Convert totals object to array of objects
  const result = Object.keys(totals).map((currency) => {
    return { currency, totalAmount: totals[currency] };
  });
  return result;
}

async function getIndividualChargesAdmin(req, res) {
  const {
    day,
    month,
    year,
    currency,
    advancedDate,
    today,
    yesterday,
    nickname,
  } = req.query;
  // Call the inspectDate function to obtain startDate and endDate
  const dateRange = inspectDate(day, month, year, today, yesterday);
  try {
    if (!nickname) {
      throw new Error("Provide with user's name !");
    }
    const existUser = await User.findOne({ nickname });
    if (!existUser) {
      throw new Error("User not found !");
    }
    let indvReports = [];

    if (advancedDate) {
      // Construct the $match stage with the combined criteria
      const $match = {
        user: new ObjectId(existUser._id),
        individual: existUser.individual,
      };
      // Initialize an empty match criteria array
      const matchCriteria = [];

      // Add conditions based on user input
      if (day) {
        $match.$expr = {
          $eq: [{ $dayOfMonth: "$createdAt" }, parseInt(day)],
        };
      }
      if (month) {
        matchCriteria.push({
          $expr: { $eq: [{ $month: "$createdAt" }, parseInt(month)] },
        });
      }
      if (year) {
        matchCriteria.push({
          $expr: { $eq: [{ $year: "$createdAt" }, parseInt(year)] },
        });
      }

      if (matchCriteria.length > 0) {
        $match.$or = matchCriteria;
      }

      indvReports = await Charge.aggregate([
        {
          $match,
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
            as: "consumer",
          },
        },
        {
          $unwind: "$familyDetails",
        },
        {
          $unwind: "$consumer",
        },
        {
          $group: {
            _id: { title: "$title", price: "$price", currency: "$currency" },
            qty: { $sum: "$quantity" },
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
            created: { $first: "$createdAt" },
            consumer: { $first: "$consumer" }, // Use $first to keep the first encountered value of 'consumer' within each group
            familys: { $first: "$familyDetails" },
          },
        },
        {
          $project: {
            title: "$_id.title",
            currency: "$_id.currency",
            quantity: "$qty",
            price: "$_id.price",
            total: 1,
            family: {
              _id: "$familys._id",
              name: "$familys.name",
            },
            user: {
              _id: "$consumer._id",
              nickname: "$consumer.nickname",
              individual: "$consumer.individual",
            },
            time: {
              $dateToString: {
                format: "%H:%M:%S", // Format string for "HH:MM:SS"
                date: "$created", // Date field to extract time from
              },
            },
            date: {
              $dateToString: {
                format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                date: "$created", // Date field to format
              },
            },
            _id: 0,
          },
        },
      ]);
    } else if (!dateRange) {
      indvReports = await Charge.aggregate([
        {
          $match: {
            user: new ObjectId(existUser._id),
            individual: existUser.individual,
            ...(currency ? { currency } : {}),
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
            as: "consumer",
          },
        },
        {
          $unwind: "$familyDetails",
        },
        {
          $unwind: "$consumer",
        },
        {
          $group: {
            _id: { title: "$title", price: "$price", currency: "$currency" },
            qty: { $sum: "$quantity" },
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
            created: { $first: "$createdAt" },
            consumer: { $first: "$consumer" }, // Use $first to keep the first encountered value of 'consumer' within each group
            familys: { $first: "$familyDetails" },
          },
        },
        {
          $project: {
            title: "$_id.title",
            currency: "$_id.currency",
            quantity: "$qty",
            price: "$_id.price",
            total: 1,
            family: {
              _id: "$familys._id",
              name: "$familys.name",
            },
            user: {
              _id: "$consumer._id",
              nickname: "$consumer.nickname",
              individual: "$consumer.individual",
            },
            time: {
              $dateToString: {
                format: "%H:%M:%S", // Format string for "HH:MM:SS"
                date: "$created", // Date field to extract time from
              },
            },
            date: {
              $dateToString: {
                format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                date: "$created", // Date field to format
              },
            },
            _id: 0,
          },
        },
      ]);
    }
    // If provides date details
    else {
      const { startDate, endDate } = dateRange;

      indvReports = await Charge.aggregate([
        {
          $match: {
            user: new ObjectId(existUser._id),
            individual: existUser.individual,
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
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
            as: "consumer",
          },
        },
        {
          $unwind: "$familyDetails",
        },
        {
          $unwind: "$consumer",
        },
        {
          $group: {
            _id: { title: "$title", price: "$price", currency: "$currency" },
            qty: { $sum: "$quantity" },
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
            created: { $first: "$createdAt" },
            consumer: { $first: "$consumer" }, // Use $first to keep the first encountered value of 'consumer' within each group
            familys: { $first: "$familyDetails" },
          },
        },
        {
          $project: {
            title: "$_id.title",
            currency: "$_id.currency",
            quantity: "$qty",
            price: "$_id.price",
            total: 1,
            family: {
              _id: "$familys._id",
              name: "$familys.name",
            },
            user: {
              _id: "$consumer._id",
              nickname: "$consumer.nickname",
              individual: "$consumer.individual",
            },
            time: {
              $dateToString: {
                format: "%H:%M:%S", // Format string for "HH:MM:SS"
                date: "$created", // Date field to extract time from
              },
            },
            date: {
              $dateToString: {
                format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
                date: "$created", // Date field to format
              },
            },
            _id: 0,
          },
        },
      ]);
    }

    // Sort the transactions by total in descending order and get the top 3
    const top3ExpensiveTransactions = indvReports
      .slice() // Create a copy of the array to avoid modifying the original
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    // Sort the transactions by quantity in descending order and get the top 3
    const top3LargestQuantityTransactions = indvReports
      .slice() // Create a copy of the array to avoid modifying the original
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    const total = calculateTotalAmountPerCurrency(indvReports);

    const results = {
      reports: indvReports,
      total,
      expensive: top3ExpensiveTransactions,
      largeQty: top3LargestQuantityTransactions,
    };
    return res.status(200).json(results);
  } catch (err) {
    return res.status(400).send({ msg: err.message ? err.message : err });
  }
}

async function getFamilyChargesAdmin(req, res) {
  const { day, month, year, currency, today, yesterday, familyId } = req.query;
  try {
    if (!familyId) {
      return res.status(400).send({ msg: "Provide with family identifier !" });
    }
    if (familyId.length !== 24) {
      return res.status(400).send({ msg: "Invalid family identifier !" });
    }
    const existFamily = await Family.findById(familyId);
    if (!existFamily) {
      return res.status(404).send({ msg: "Family not found !" });
    }

    // Get today's date
    const todayy = new Date();
    const startOfDay = new Date(
      todayy.getFullYear(),
      todayy.getMonth(),
      todayy.getDate()
    );
    const endOfDay = new Date(
      todayy.getFullYear(),
      todayy.getMonth(),
      todayy.getDate() + 1
    );

    // Get yesterday's date
    const yesterdayy = new Date();
    yesterdayy.setDate(yesterdayy.getDate() - 1);

    // Set the time to the start of yesterday
    yesterdayy.setHours(0, 0, 0, 0);

    // Set the time to the end of yesterday
    const endOfYesterday = new Date(yesterdayy);
    endOfYesterday.setDate(endOfYesterday.getDate() + 1);

    // Now, 'yesterday' represents the start of yesterday, and 'endOfYesterday' represents the end of yesterday

    // Construct the $match stage with the combined criteria
    const $match = {
      family: new ObjectId(existFamily._id),
    };

    // Initialize an empty match criteria array
    const matchCriteria = [];

    // Add conditions based on user input
    if (day) {
      $match.$expr = {
        $eq: [{ $dayOfMonth: "$createdAt" }, parseInt(day)],
      };
    }
    if (month) {
      matchCriteria.push({
        $expr: { $eq: [{ $month: "$createdAt" }, parseInt(month)] },
      });
    }
    if (year) {
      matchCriteria.push({
        $expr: { $eq: [{ $year: "$createdAt" }, parseInt(year)] },
      });
    }
    if (currency) {
      $match.currency = currency; // Filter by currency if provided
    }

    if (today) {
      // Add $match stage to filter documents for yesterday
      $match.createdAt = {
        $gte: startOfDay,
        $lt: endOfDay,
      };
    }

    if (yesterday) {
      // Add $match stage to filter documents for yesterday
      $match.createdAt = {
        $gte: yesterdayy,
        $lt: endOfYesterday,
      };
    }

    if (matchCriteria.length > 0) {
      $match.$or = matchCriteria;
    }

    const familyReports = await Charge.aggregate([
      {
        $match,
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
          as: "consumer",
        },
      },
      {
        $unwind: "$familyDetails",
      },
      {
        $unwind: "$consumer",
      },
      {
        $group: {
          _id: { title: "$title", price: "$price", currency: "$currency" },
          qty: { $sum: "$quantity" },
          total: { $sum: { $multiply: ["$quantity", "$price"] } },
          created: { $first: "$createdAt" },
          consumer: { $first: "$consumer" }, // Use $first to keep the first encountered value of 'consumer' within each group
          familys: { $first: "$familyDetails" },
        },
      },
      {
        $project: {
          title: "$_id.title",
          currency: "$_id.currency",
          quantity: "$qty",
          price: "$_id.price",
          total: 1,
          family: {
            _id: "$familys._id",
            name: "$familys.name",
            // members: { $size: "$familys.users" }, // Get the length of the 'users' array
          },
          user: {
            _id: "$consumer._id",
            nickname: "$consumer.nickname",
            individual: "$consumer.individual",
          },
          time: {
            $dateToString: {
              format: "%H:%M:%S", // Format string for "HH:MM:SS"
              date: "$created", // Date field to extract time from
            },
          },
          date: {
            $dateToString: {
              format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
              date: "$created", // Date field to format
            },
          },
          _id: 0,
        },
      },
    ]);

    // Sort the transactions by total in descending order and get the top 3
    const top3ExpensiveTransactions = familyReports
      .slice() // Create a copy of the array to avoid modifying the original
      .sort((a, b) => b.total - a.total)
      .slice(0, 3);

    // Sort the transactions by quantity in descending order and get the top 3
    const top3LargestQuantityTransactions = familyReports
      .slice() // Create a copy of the array to avoid modifying the original
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 3);

    const total = calculateTotalAmountPerCurrency(familyReports);

    const results = {
      reports: familyReports,
      total,
      expensive: top3ExpensiveTransactions,
      largeQty: top3LargestQuantityTransactions,
    };
    return res.status(200).json(results);
  } catch (err) {
    return res.status(400).send({ msg: err.message ? err.message : err });
  }
}

async function getComparedFamilies(req, res) {
  const { day, month, year, currency } = req.query;
  // Call the inspectDate function to obtain startDate and endDate
  const dateRange = inspectDate(day, month, year);
  try {
    let comparedReports = [];

    if (!dateRange) {
      comparedReports = await Charge.aggregate([
        {
          $match: {
            family: { $ne: null },
          },
        },
        {
          $group: {
            _id: { family: "$family", currency: "$currency" },
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
          },
        },
        {
          $group: {
            _id: "$_id.family",
            totals: {
              $push: {
                currency: "$_id.currency",
                total: "$total",
              },
            },
          },
        },
        {
          $lookup: {
            from: "families",
            localField: "_id",
            foreignField: "_id",
            as: "familyDetails",
          },
        },
        {
          $unwind: "$familyDetails",
        },
        {
          $project: {
            _id: 1,
            name: "$familyDetails.name",
            // family: {
            //   $arrayElemAt: ["$familyDetails", 0],
            // },
            totals: 1,
          },
        },
      ]);
    }
    // If provides date details
    else {
      const { startDate, endDate } = dateRange;

      comparedReports = await Charge.aggregate([
        {
          $match: {
            family: { $ne: null },
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $group: {
            _id: { family: "$family", currency: "$currency" },
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
          },
        },
        {
          $group: {
            _id: "$_id.family",
            totals: {
              $push: {
                currency: "$_id.currency",
                total: "$total",
              },
            },
          },
        },
        {
          $lookup: {
            from: "families",
            localField: "_id",
            foreignField: "_id",
            as: "familyDetails",
          },
        },
        {
          $unwind: "$familyDetails",
        },
        {
          $project: {
            _id: 1,
            name: "$familyDetails.name",
            // family: {
            //   $arrayElemAt: ["$familyDetails", 0],
            // },
            totals: 1,
          },
        },
      ]);
    }

    return res.status(200).json(comparedReports);
  } catch (err) {
    return res.status(400).send({ msg: err.message ? err.message : err });
  }
}

module.exports = {
  getIndividualChargesAdmin,
  getFamilyChargesAdmin,
  getComparedFamilies,
};
