const env = process.env;
const { connect } = require("mongoose");

function Port(app) {
  app.listen(env.PORT, () => {
    console.log(`${env.PORT}'s port online...`);
  });
}

async function DB() {
  try {
    await connect(env.DB_URL);
    console.log("DB's online...");
  } catch (err) {
    throw new Error(err.message ? err.message : err);
  }
}

module.exports = {
  Port,
  DB,
};
