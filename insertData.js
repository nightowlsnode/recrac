const env = require('node-env-file');
env(__dirname + '/.env');

const data = require('./data.json');
const Event = require('./models/event');
const db = require('./db');



const insertData = function() {
  data.forEach((item) => {
    const newEvent = new Event({
      name: item.name,
      description: item.description,
      host: item.host,
      type: item.type,
      location: { address: item.location.address, lng: 0, lat: 0 },
      desiredParticipants: item.desiredParticipants,
      time: item.time,
      price: item.price,
      confirmedParticipants: item.confirmedParticipants,
      potentialParticipants: item.potentialParticipants,
      rating: item.rating,
      rateAmount: item.rateAmount,
      ratingParticipants: item.ratingParticipants
    });
    newEvent.save(function (err, newEvent) {
      if (err) {
        console.error('Error is ', err);
        return handleError(err);
      }
      console.log('Success: ', newEvent);
    });
  });
};

insertData();