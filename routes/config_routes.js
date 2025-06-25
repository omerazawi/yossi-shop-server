const indexR = require('./indexR');
const ProductsR = require('./ProductsR');
const CategoryR = require('./CategoryR');
const PaymentR = require('./Payment');
const OrdersR = require('./Orders');
const AdminR = require('./AdminR');
const AuthR = require('./Auth');
const UsersR = require('./Users');


exports.routesInit = (app) =>{
    app.use('/', indexR);
    app.use('/Products',ProductsR);
    app.use('/Category',CategoryR);
    app.use('/Payment',PaymentR);
    app.use('/orders',OrdersR);
    app.use('/Admin',AdminR);
    app.use('/Auth',AuthR);
    app.use('/Users',UsersR);
}