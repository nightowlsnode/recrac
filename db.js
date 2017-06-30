const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI);

//Need to change to no local host before deployment.

const db = mongoose.connection;
db.on('error', (err) => console.error('Mongo connection problem:', err));
db.once('open', () => console.log('Mongo connection sucessful!'));

module.exports = db;
