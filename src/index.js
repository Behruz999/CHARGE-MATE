const { config } = require("dotenv");
config();
const { Port, DB } = require("./settings/DB/db");
const express = require("express");
const app = express();
const mainRoute = require("./mainRouter");
const { secureApp } = require("./settings/security/crossOrigin");

secureApp(app);

Port(app);

DB();

app.use(express.json());
// intial route for main route
app.use("/", mainRoute);
