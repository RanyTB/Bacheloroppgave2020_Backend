const express = require("express");
const app = express();
require('express-async-errors')

//DB
require("./startup/db")();
//Routes
require("./startup/routes")(app);
//Server
require("./startup/server")(app);

module.exports = app; //Exported for integration testing
