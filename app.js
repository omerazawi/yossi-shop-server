
require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const cors = require('cors');
const bodyParser = require("body-parser");
const {routesInit} = require('./routes/config_routes');
require("./DB/mongoConnect");

const app = express();
app.use(cors({ origin: '*'}));
app.use(express.urlencoded({ extended: true })); 
app.use(bodyParser.json({ limit: "50mb" })); 
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
routesInit(app);

const server = http.createServer(app);


let port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
