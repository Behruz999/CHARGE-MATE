const cors = require("cors");

const corsOptions = {
  origin: "https://charge-mate-client.vercel.app",
  methods: "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE", // Include DELETE method
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
};

module.exports = function secureApp(app) {
  app.use(cors(corsOptions));
  app.options("*", cors()); // Allow preflight requests for all routes
};
