const cors = require("cors");

const allowedOrigins = ["http://localhost:4000", "https://charge-mate-client.vercel.app"];

export function secureApp(app) {
  app.use(
    cors({
      origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      maxAge: 600,
    })
  );
}
