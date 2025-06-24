const indexR = require('./indexR');
const ProductsR = require('./ProductsR');
const CategoryR = require('./CategoryR');
const PaymentR = require('./Payment');
const OrdersR = require('./Orders');
const AdminR = require('./AdminR');

exports.routesInit = (app) =>{
    app.use('/', indexR);
    app.use('/Products',ProductsR);
    app.use('/Category',CategoryR);
    app.use('/Payment',PaymentR);
    app.use('/orders',OrdersR);
    app.use('/Admin',AdminR)

}