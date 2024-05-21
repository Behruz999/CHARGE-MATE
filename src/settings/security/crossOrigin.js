const cors = require("cors");

const corsOptions = {
  origin: "https://charge-mate-client.vercel.app",
  methods: "GET,HEAD,OPTIONS,POST,PUT",
  allowedHeaders:
    "Origin, X-Requested-With, Content-Type, Accept, Authorization",
};

module.exports = function secureApp(app) {
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // Pre-flight requests
};
