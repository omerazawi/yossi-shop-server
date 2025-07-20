/* routes/config_routes.js */
const indexR = require("./indexR");
const ProductsR = require("./ProductsR");
const CategoryR = require("./CategoryR");
const OrdersR = require("./Orders");
const AdminR = require("./AdminR");
const AuthR = require("./Auth");
const UsersR = require("./Users");
const StatsR = require('./StatsR');


exports.routesInit = (app) => {
  app.use("/", indexR);
  app.use("/Products",ProductsR);
  app.use("/Category",CategoryR);
  app.use("/orders",  OrdersR);
  app.use("/Admin",   AdminR);
  app.use("/Auth",    AuthR);
  app.use("/Users",   UsersR);
  app.use("/stats",   StatsR);
};
