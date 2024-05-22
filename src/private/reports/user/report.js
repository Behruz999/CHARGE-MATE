const Charge = require("../../../models/charge");
const User = require("../../../models/user");
const ObjectId = require("mongoose").Types.ObjectId;

// // Scanning, configuring dates whether user provided date details or not
// function inspectDate(day, month, year, todayFlag, yesterdayFlag) {
//   day = parseInt(day);
//   month = parseInt(month);
//   year = parseInt(year);

//   let startDate, endDate;

//   if (todayFlag) {
//     const today = new Date();
//     startDate = new Date(
//       today.getFullYear(),
//       today.getMonth(),
//       today.getDate()
//     );
//     endDate = new Date(
//       today.getFullYear(),
//       today.getMonth(),
//       today.getDate() + 1
//     ); // End of the day
//   } else if (yesterdayFlag) {
//     // Get yesterday's date
//     const yesterdayy = new Date();
//     yesterdayy.setDate(yesterdayy.getDate() - 1);

//     // Set the time to the start of yesterday
//     yesterdayy.setHours(0, 0, 0, 0);
//     // Set the time to the end of yesterday
//     const endOfYesterday = new Date(yesterdayy);
//     endOfYesterday.setDate(endOfYesterday.getDate() + 1);
//     startDate = yesterdayy;
//     endDate = endOfYesterday;
//   } else if (day && month && year) {
//     startDate = new Date(year, month - 1, day);
//     endDate = new Date(year, month - 1, day + 1); // End of the day
//   } else if (!day && month && year) {
//     startDate = new Date(year, month - 1, 1); // Start of the month
//     endDate = new Date(year, month, 0); // End of the month (last day)
//   } else {
//     return null; // No filters for date, return null
//   }

//   return { startDate, endDate };
// }

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
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    startDate = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate()
    );
    endDate = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate() + 1
    ); // End of the day
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

// function inspectDate(day, month, year) {
//   day = parseInt(day);
//   month = parseInt(month);
//   year = parseInt(year);

//   let startDate, endDate;

//   if (day && month && year) {
//     startDate = new Date(year, month - 1, day);
//     endDate = new Date(year, month - 1, day + 1); // End of the day
//   } else if (!day && month && year) {
//     startDate = new Date(year, month - 1, 1); // Start of the month
//     endDate = new Date(year, month, 0); // End of the month (last day)
//   } else if (!day && !month && year) {
//     startDate = new Date(year, 0, 1); // Start of the year
//     endDate = new Date(year + 1, 0, 1); // Start of the next year
//   } else if (!day && month && !year) {
//     startDate = new Date(new Date().getFullYear(), month - 1, 1); // Start of the month for current year
//     endDate = new Date(new Date().getFullYear(), month, 0); // End of the month for current year
//   } else if (day && !month && !year) {
//     startDate = new Date(year, 0, day); // Start of the day for the provided year
//     endDate = new Date(year, 0, day + 1); // End of the day for the provided year
//   } else {
//     return null; // No filters for date, return null
//   }

//   return { startDate, endDate };
// }

async function getIndividualCharges(req, res) {
  const { day, month, year, currency, advancedDate, today, yesterday } =
    req.query;
  // Call the inspectDate function to obtain startDate and endDate
  const dateRange = inspectDate(day, month, year, today, yesterday);
  try {
    const existUser = await User.findById(req.user._id);
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
        matchCriteria.push({
          $expr: { $eq: [{ $dayOfMonth: "$createdAt" }, parseInt(day)] },
        });
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
        $match.$and = matchCriteria;
      }

      // Aggregation pipeline
      indvReports = await Charge.aggregate([
        {
          $match,
        },
        {
          $lookup: {
            from: "families",
            let: { familyId: "$family" },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$familyId"] } } }],
            as: "familyDetails",
          },
        },
        {
          $addFields: {
            familyDetails: { $arrayElemAt: ["$familyDetails", 0] },
            family: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$familyDetails", null] },
                    { $eq: ["$familyDetails", []] },
                  ],
                },
                then: null,
                else: {
                  _id: "$familyDetails._id",
                  name: "$familyDetails.name",
                },
              },
            },
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
          $unwind: {
            path: "$consumer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: { title: "$title", price: "$price", currency: "$currency" },
            qty: { $sum: "$quantity" },
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
            created: { $first: "$createdAt" },
            consumer: { $first: "$consumer" },
            family: { $first: "$family" },
          },
        },
        {
          $project: {
            title: "$_id.title",
            currency: "$_id.currency",
            quantity: "$qty",
            price: "$_id.price",
            total: 1,
            family: 1,
            user: {
              _id: "$consumer._id",
              nickname: "$consumer.nickname",
              individual: "$consumer.individual",
            },
            time: {
              $dateToString: {
                format: "%H:%M:%S",
                date: "$created",
              },
            },
            date: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$created",
              },
            },
            _id: 0,
          },
        },
      ]);
      // // Construct the $match stage with the combined criteria
      // const $match = {
      //   user: new ObjectId(existUser._id),
      //   individual: existUser.individual,
      // };
      // // Initialize an empty match criteria array
      // const matchCriteria = [];

      // // Add conditions based on user input
      // if (day) {
      //   $match.$expr = {
      //     $eq: [{ $dayOfMonth: "$createdAt" }, parseInt(day)],
      //   };
      // }
      // if (month) {
      //   matchCriteria.push({
      //     $expr: { $eq: [{ $month: "$createdAt" }, parseInt(month)] },
      //   });
      // }
      // if (year) {
      //   matchCriteria.push({
      //     $expr: { $eq: [{ $year: "$createdAt" }, parseInt(year)] },
      //   });
      // }

      // if (matchCriteria.length > 0) {
      //   $match.$or = matchCriteria;
      // }

      // indvReports = await Charge.aggregate([
      //   {
      //     $match,
      //   },
      //   {
      //     $lookup: {
      //       from: "families",
      //       localField: "family",
      //       foreignField: "_id",
      //       as: "familyDetails",
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "user",
      //       foreignField: "_id",
      //       as: "consumer",
      //     },
      //   },
      //   {
      //     $unwind: "$familyDetails",
      //   },
      //   {
      //     $unwind: "$consumer",
      //   },
      //   {
      //     $group: {
      //       _id: { title: "$title", price: "$price", currency: "$currency" },
      //       qty: { $sum: "$quantity" },
      //       total: { $sum: { $multiply: ["$quantity", "$price"] } },
      //       created: { $first: "$createdAt" },
      //       consumer: { $first: "$consumer" }, // Use $first to keep the first encountered value of 'consumer' within each group
      //       familys: { $first: "$familyDetails" },
      //     },
      //   },
      //   {
      //     $project: {
      //       title: "$_id.title",
      //       currency: "$_id.currency",
      //       quantity: "$qty",
      //       price: "$_id.price",
      //       total: 1,
      //       family: {
      //         _id: "$familys._id",
      //         name: "$familys.name",
      //       },
      //       user: {
      //         _id: "$consumer._id",
      //         nickname: "$consumer.nickname",
      //         individual: "$consumer.individual",
      //       },
      //       time: {
      //         $dateToString: {
      //           format: "%H:%M:%S", // Format string for "HH:MM:SS"
      //           date: "$created", // Date field to extract time from
      //         },
      //       },
      //       date: {
      //         $dateToString: {
      //           format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
      //           date: "$created", // Date field to format
      //         },
      //       },
      //       _id: 0,
      //     },
      //   },
      // ]);
    } else if (!dateRange) {
      // const matchCriteria = {
      //   user: new ObjectId(existUser._id),
      //   individual: existUser.individual,
      // };

      // if (currency) {
      //   matchCriteria.currency = currency;
      // }

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
            let: { familyId: "$family" },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$familyId"] } } }],
            as: "familyDetails",
          },
        },
        {
          $addFields: {
            familyDetails: { $arrayElemAt: ["$familyDetails", 0] },
            family: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$familyDetails", null] },
                    { $eq: ["$familyDetails", []] },
                  ],
                },
                then: null,
                else: {
                  _id: "$familyDetails._id",
                  name: "$familyDetails.name",
                },
              },
            },
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
          $unwind: {
            path: "$consumer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: { title: "$title", price: "$price", currency: "$currency" },
            qty: { $sum: "$quantity" },
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
            created: { $first: "$createdAt" },
            consumer: { $first: "$consumer" },
            family: { $first: "$family" },
          },
        },
        {
          $project: {
            title: "$_id.title",
            currency: "$_id.currency",
            quantity: "$qty",
            price: "$_id.price",
            total: 1,
            family: 1,
            user: {
              _id: "$consumer._id",
              nickname: "$consumer.nickname",
              individual: "$consumer.individual",
            },
            time: {
              $dateToString: {
                format: "%H:%M:%S",
                date: "$created",
              },
            },
            date: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$created",
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
            ...(currency ? { currency } : {}),
            createdAt: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        },
        {
          $lookup: {
            from: "families",
            let: { familyId: "$family" },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$familyId"] } } }],
            as: "familyDetails",
          },
        },
        {
          $addFields: {
            familyDetails: { $arrayElemAt: ["$familyDetails", 0] },
            family: {
              $cond: {
                if: {
                  $or: [
                    { $eq: ["$familyDetails", null] },
                    { $eq: ["$familyDetails", []] },
                  ],
                },
                then: null,
                else: {
                  _id: "$familyDetails._id",
                  name: "$familyDetails.name",
                },
              },
            },
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
          $unwind: {
            path: "$consumer",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: { title: "$title", price: "$price", currency: "$currency" },
            qty: { $sum: "$quantity" },
            total: { $sum: { $multiply: ["$quantity", "$price"] } },
            created: { $first: "$createdAt" },
            consumer: { $first: "$consumer" },
            family: { $first: "$family" },
          },
        },
        {
          $project: {
            title: "$_id.title",
            currency: "$_id.currency",
            quantity: "$qty",
            price: "$_id.price",
            total: 1,
            family: 1,
            user: {
              _id: "$consumer._id",
              nickname: "$consumer.nickname",
              individual: "$consumer.individual",
            },
            time: {
              $dateToString: {
                format: "%H:%M:%S",
                date: "$created",
              },
            },
            date: {
              $dateToString: {
                format: "%d-%m-%Y",
                date: "$created",
              },
            },
            _id: 0,
          },
        },
      ]);

      // indvReports = await Charge.aggregate([
      //   {
      //     $match: {
      //       user: new ObjectId(existUser._id),
      //       individual: existUser.individual,
      //       createdAt: {
      //         $gte: startDate,
      //         $lte: endDate,
      //       },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "families",
      //       localField: "family",
      //       foreignField: "_id",
      //       as: "familyDetails",
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: "users",
      //       localField: "user",
      //       foreignField: "_id",
      //       as: "consumer",
      //     },
      //   },
      //   {
      //     $unwind: "$familyDetails",
      //   },
      //   {
      //     $unwind: "$consumer",
      //   },
      //   {
      //     $group: {
      //       _id: { title: "$title", price: "$price", currency: "$currency" },
      //       qty: { $sum: "$quantity" },
      //       total: { $sum: { $multiply: ["$quantity", "$price"] } },
      //       created: { $first: "$createdAt" },
      //       consumer: { $first: "$consumer" }, // Use $first to keep the first encountered value of 'consumer' within each group
      //       familys: { $first: "$familyDetails" },
      //     },
      //   },
      //   {
      //     $project: {
      //       title: "$_id.title",
      //       currency: "$_id.currency",
      //       quantity: "$qty",
      //       price: "$_id.price",
      //       total: 1,
      //       family: {
      //         _id: "$familys._id",
      //         name: "$familys.name",
      //       },
      //       user: {
      //         _id: "$consumer._id",
      //         nickname: "$consumer.nickname",
      //         individual: "$consumer.individual",
      //       },
      //       time: {
      //         $dateToString: {
      //           format: "%H:%M:%S", // Format string for "HH:MM:SS"
      //           date: "$created", // Date field to extract time from
      //         },
      //       },
      //       date: {
      //         $dateToString: {
      //           format: "%d-%m-%Y", // Format string for "DD-MM-YYYY"
      //           date: "$created", // Date field to format
      //         },
      //       },
      //       _id: 0,
      //     },
      //   },
      // ]);
    }

    // Find the most expensive transaction
    // const mostExpensiveTransaction = indvReports.reduce(
    //   (maxTransaction, transaction) => {
    //     return transaction.price > maxTransaction.price
    //       ? transaction
    //       : maxTransaction;
    //   },
    //   indvReports[0]
    // );

    // Find the transaction with the largest quantity
    // const largestQuantityTransaction = indvReports.reduce(
    //   (maxTransaction, transaction) => {
    //     return transaction.quantity > maxTransaction.quantity
    //       ? transaction
    //       : maxTransaction;
    //   },
    //   indvReports[0]
    // );

    // console.log("Most expensive transaction:", mostExpensiveTransaction);
    // console.log(
    //   "Transaction with the largest quantity:",
    //   largestQuantityTransaction
    // );

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

    // console.log(
    //   "Top 3 most expensive transactions:",
    //   top3ExpensiveTransactions
    // );
    // console.log(
    //   "Top 3 transactions with the largest quantity:",
    //   top3LargestQuantityTransactions
    // );

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

async function getFamilyCharges(req, res) {
  const { day, month, year, currency, today, yesterday } = req.query;
  try {
    const existUser = await User.findById(req.user._id);
    if (!existUser) {
      return res.status(404).send({ msg: "User not found !" });
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

    // Construct the $match stage with the combined criteria
    const $match = {
      family: existUser.family,
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
      // Add $match stage to filter documents for today
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

module.exports = {
  getIndividualCharges,
  getFamilyCharges,
};
