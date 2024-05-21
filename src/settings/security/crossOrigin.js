const cors = require("cors");

const allowedOrigins = [
  "http://localhost:4000",
  "https://charge-mate-client.vercel.app",
  "https://charge-mate-client.vercel.app/charge-mate.railway.internal",
];

module.exports = function secureApp(app) {
  app.use(
    cors({
      origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          console.log("Not allowed by CORS");
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 600,
    })
  );
};
