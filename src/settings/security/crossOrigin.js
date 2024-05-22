const cors = require("cors");

const allowedOrigins = [
  "https://charge-mate-client.vercel.app",
  "http://localhost:4000",
];

const corsOptions = {
  origin: allowedOrigins,
  methods: "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE",
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
};

module.exports = function secureApp(app) {
  app.use(cors(corsOptions));
  app.options("*", cors()); // Allow preflight requests for all routes
};
