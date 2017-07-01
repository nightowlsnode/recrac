const app = require('../index.js');
const Message = require('../models/message');
const User = require('../models/user');
const Event = require('../models/event');
const {socketUsers, socket, ws} = require('./socket.js');

exports.getUserBidInfo = (req, res, next) => {
  let {eventID} = req.params;
  let userID = req.user.id;
  Event.findOne({_id: eventID}, function(err, event) {
    if (err) {
      res.send({
        error: err
      });
    } else {
      let userBid = null;
      for (var i = 0; i < event.desiredParticipants; i++) {
        let bid = event.bids[i];
        userBid = bid.user.id === userID ? bid.max : userBid;
        break;
      }
      userBid !== null ? res.send({maxBid: userBid}) : res.status(404).send('notFound');
    }
  });
};

exports.makeBid = (req, res, next) => {
  let uhoh = socketUsers.slice();
  let five = 5;
  if (!req.user) { res.status(401).send('Please Login'); }
  let newBid = { curr: 0, max: req.body.bid, user: req.user.id };
  Event.findOne({_id: req.body.event}, function(err, event) {
    if (err) {
      res.send({
        error: err
      });
    } else {
      let eventSize = event.desiredParticipants;
      User.findOne({_id: newBid.user}, function(err, bidder) {
        if (err) {
          res.status(500).send(err);
        } else if (!bidder) {
          console.log('could not find user in db', newBid.user);
        } else {
          var bidderObj = {id: bidder.id, user: bidder.user, photo: bidder.picture, email: bidder.email, curr: null};
          newBid.user = bidderObj;
          event.bids = sortBids(event.bids, newBid, eventSize, event);
          event.potentialParticipants = event.bids.slice(0, eventSize)
            .map((bid) => bid.user);
          event.save();
          // event.bids = null;
          if (event.bids.length >= eventSize) {
            event.price = event.bids[0].curr;
          }
          res.send(event);
        }
      });
    }
  });
};


const sortBids = (bids, newBid, eventSize, event) => {
  if (!bids.length) {
    return [newBid];
  }
  for (var i = 0; i < bids.length; i++) {
    let bid = bids[i];
    if (newBid.user.id === bid.user.id) {
      bid.max = newBid.max;
      newBid = bid;
      bids.splice(i, 1);
      break;
    }
  }
  if (bids.length < eventSize) {
    bids.push(newBid);
  } else if (newBid.max > bids[eventSize - 1].max) {
    var {winningBid, ordered} = escalateBid(bids[eventSize - 1], newBid, event);
    bids.splice(eventSize - 1, 2, ordered[0], ordered[1]);
    for (let i = eventSize - 1; i >= 0; i--) {
      bids[i].curr = winningBid;
      bids[i].user.curr = winningBid;
    } 
  } else {
    //FAILED BID -- NO CHANGES
  }
  let winners = bids.splice(0, eventSize);
  bids = bids.concat(sortTopBids(winners));
  return bids;
};
const escalateBid = (curr, newBid, event) => {
  let winningBid = 0;
  let ordered = [];
  let newBidWins = curr.max < newBid.max;

  if (!newBidWins) {
    winningBid = curr.max + 1;
    ordered = [newBid, curr];
  } else {
    winningBid = newBid.max + 1;
    ordered = [curr, newBid];
  }
  if (ordered[0].max === curr.max) {
    for (var i = 0; i < socketUsers.length; i++) {
      let user = socketUsers[i];
      if (user.email === curr.user.email) {
        ws.to(user.socketId).emit('outbidAlert', {user: user.user, eventName: event.name});
        break;
      }
    }
  }
  return {winningBid, ordered};
};
const sortTopBids = (bids) => {
  for (let i = 0; i < bids.length; i++) {
    if (bids[i].max < bids[bids.length - 1].max) {
      let holder = bids.pop();
      bids.splice(i, 0, holder);
      return bids;
    }
  }
  return bids;
};
