const mongoose = require('mongoose');
const {config} = require('../config/secret');

main().catch(err => console.log(err));

async function main() {
  mongoose.set('strictQuery', false);
  await mongoose.connect(`mongodb+srv://${config.userDB}:${config.passDB}@cluster0.23js1eo.mongodb.net/Yossi`);
  console.log("mongo connected");
}