const app = require('../index.js');
const Message = require('../models/message');
const User = require('../models/user');
const Event = require('../models/event');

exports.makeBid = (req, res, next) => {
  let newBid = { curr: 0, max: req.body.bid, user: req.user._id };
  Event.findOne({_id: req.body.event}, function(err, event) {
    if (err) {
      res.send({
        error: err
      });
    } else {
      for (var i = 0; i < event.bids.length; i++) {
        let bid = event.bids[i];
        if (newBid.user === bid.user._id) {
          bid.max = newBid.max;
          newBid = bid;
          break;
        } else if (i === event.bids.length - 1) {
          User.findOne({_id: req.user._id}, function(err, bidder) {
            if (err) {
              res.status(500).send(err);
            } else {
              var bidderObj = {potentialParticipants: {user: bidder.user, photo: bidder.picture, email: bidder.email}};
              event.bids = sortBids(event.bids, newBid, event.desiredParticipants);
              event.potentialParticipants = event.bids.slice(0, event.desiredParticipants)
                .map((bid) => bid.user);
              event.save();
            }
          });
        }
      }
    }
  });
};


const sortBids = (bids, newBid, eventSize) => {
  if (!bids) {
    return [newBid];
  }
  if (bids.length < eventSize) {
    bids.push(newBid);
    return bids;
  }
  if (newBid.max > bids[eventSize].max) {
    var {winningBid, ordered} = escalateBid(bids[eventSize], newBid);
    bids.splice(eventSize, 2, ordered[0], ordered[1]);
    let winners = bids.splice(0, eventSize - 1);
    bids = bids.concat(sortTopBids(winners));
  }
  return bids;
};
const escalateBid = (curr, newBid) => {
  let winningBid = 0;
  let ordered = [];
  let newBidWins = curr.max < newBid.max;

  if (newBidWins) {
    winningBid = curr.max + 1;
    ordered = [newBid, curr];
  } else {
    winningBid = newBid.max + 1;
    ordered = [curr, newBid];
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
