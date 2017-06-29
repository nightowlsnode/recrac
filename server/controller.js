const app = require('../index.js');
const Message = require('../models/message');
const User = require('../models/user');
const Event = require('../models/event');

exports.makeBid = (req, res, next) => {
  let newBid = { curr: 0, max: req.body.bid, user: req.session.passport.user };
  Event.findOne({_id: req.body.event}, function(err, event) {
    if (err) {
      res.send({
        error: err
      });
    } else {
      event.bids = sortBids(event.bids, newBid, event.desiredParticipants);
      event.save();
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
