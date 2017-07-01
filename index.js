// build env for dev env
require('node-env-file')(__dirname + '/.env');
// DB stuff
const db = require('./db');
const Message = require('./models/message');
const User = require('./models/user');
const Event = require('./models/event');
// Server Stuff
const path = require('path');
const flash = require('connect-flash');
const morgan = require('morgan');
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');
const FacebookStrategy = require('passport-facebook').Strategy;
const push = require('./push.js');
const app = express();
module.exports = app;
const {socketUsers, socket, ws, server} = require('./server/socket.js');
const biddingController = require('./server/biddingController.js');


// UNDER(middle)WEAR
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  skip: function (req, res) { return res.statusCode === 304; },
}));
app.use(session({secret: 'recursive raccoon', resave: true, saveUninitialized: false}));
//passport authentication
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(bodyParser.json());
app.use(express.static(path.resolve(__dirname, './node_modules')));
app.use(express.static(path.resolve(__dirname, './home')));

//Passport facebook strategy config:
passport.use(new FacebookStrategy({

  clientID: process.env.FACEBOOK_APP_ID, 
  clientSecret: process.env.FACEBOOK_APP_SECRET, 
  callbackURL: process.env.FACEBOOK_CB_URL,

  profileFields: ['id', 'displayName', 'photos', 'emails']
},
function(accessToken, refreshToken, profile, done) {
  User.findOne({
    'facebook.id': profile.id
  }, function(err, user) {
    if (err) {
      console.error(err);
      return done(err);
    }
    if (!user) {
      console.log('new user created');
      user = new User({
        user: profile.displayName,
        picture: profile.photos[0].value,
        email: profile.emails[0].value,
        facebook: profile._json,
        description: ''
      });
      user.save(function(err) {
        if (err) { console.error(err); }
        return done(null, user);
      });
    } else {
      console.log('user found');
      return done(null, user);
    }
  });
}
));    

// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Facebook profile is serialized
// and deserialized.
passport.serializeUser(function(user, done) {
  done(null, user.facebook.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({'facebook.id': id}, function(err, user) {
    done(err, user);
  });
});

//Get and post methods should be delegated to routes.js file to simplify and modularize
// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback || index
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/account', function(req, res) {
  if (req.isAuthenticated()) { 
    res.send({user: req.user});
  } else {
    res.sendStatus(404);
  }
});

app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/error', function(req, res) {
  res.sendStatus(404);
});

app.get('/timer/:id', function(req, res) {
  var id = req.param.id;
  ObjectId(id).getTimestamp().exec(function(err, data) { //Event.findOne({id: id})
    res.json(200, data);
  });
});

//Get and post methods for messages on event page

app.post('/message', function(req, res) {
  console.log(req.body);
  var newMessage = new Message ({
    user: req.user.user,
    event: req.body.event,
    text: req.body.text,
    picture: req.body.picture
  });
  newMessage.save(function(err, newMessage) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(newMessage);
    }
  });
});

app.post('/rating', function (req, res) {

});

app.get('/message/:eventId', function(req, res) {
  Message.find({event: req.param('eventId')}, function(err, newMessages) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(newMessages);
    }
  });
});

//Get and post methods for events on app/home page

app.post('/events', function(req, res) {
  var newEvent = new Event ({
    name: req.body.name,
    description: req.body.description,
    host: {user: req.user.user, photo: req.user.picture, email: req.user.email, description: req.user.description},
    type: req.body.type,
    time: req.body.time,
    price: req.body.price || 0,
    desiredParticipants: req.body.desiredParticipants,
    location: {address: req.body.location, lng: 0, lat: 0}
  });
  push.sendNotification(req.body.name);

  newEvent.save(function(err, newEvent) {
    if (err) {
      res.status(500).send(err);
    } else {
      newEvent.bids = null;
      res.status(200).send(newEvent);
      User.findById(req.user._id)
        .then ((user) => {
          user.hostedEvents.push(newEvent._id);
          return user.save()
            .catch((err) => console.log(err));
        });
    }
  });
});


app.put('/confirmParticipant', function(req, res) {
  User.findOne({'facebook.email': req.body.participantEmail}, function(err, joiner) {
    if (err) {
      res.status(500).send(err);
    } else {
      var joinerObj = {$push: {confirmedParticipants: {user: joiner.user, photo: joiner.picture, email: joiner.email}},
        $pull: {potentialParticipants: {user: joiner.user}}};
      console.log(req.body);
      Event.update({_id: req.body.eventId}, joinerObj, function(err, updatedEvent) {
        if (err) {
          res.status(500).send(err);
        } else {
          updatedEvent.bids = null;
          res.status(200).send(updatedEvent);
        }
      });
    }
  });
});

app.put('/events', function(req, res) {
  User.findOne({_id: req.user._id}, function(err, joiner) {
    if (err) {
      res.status(500).send(err);
    } else {
      var joinerObj = {$push: {potentialParticipants: {user: joiner.user, photo: joiner.picture, email: joiner.email}}};
      console.log(req.body);
      Event.update({_id: req.body.eventData}, joinerObj, function(err, updatedEvent) {
        if (err) {
          res.status(500).send(err);
        } else {
          updatedEvent.bids = null;
          res.status(200).send(updatedEvent);
        }
      });
    }
  });
});

app.put('/events/:id', function(req, res) {
  // Geting the event to update
  console.log('request is ', req.user.email);
  Event.findOne({_id: req.param('id')}, function(err, newEvent) {
    // Updating all the information f rom the event
    // **********************************************************************
    // if (req.body.name) {
    //   newEvent.name = req.body.name;   
    // }
    // if (req.body.description) {
    //   newEvent.description = req.body.description;
    // }
    
    // if (req.user) {
    //   newEvent.host = req.user.user;
    // }
    
    // if (req.body.type) {
    //   newEvent.type = req.body.type;
    // }
    
    // if (req.body.time) {
    //   newEvent.time = req.body.time;
    // }
    // if (req.body.price) {
    //   newEvent.price = req.body.price || 0;
    // }
    // if (req.body.desiredParticipants) {
    //   newEvent.desiredParticipants = req.body.desiredParticipants;
    // }
    
    // if (req.body.location) {
    //   newEvent.location = {
    //     address: req.body.location,
    //     lng: 0, 
    //     lat: 0
    //   };
    // }
    
    function isConfirmedParticipant(event, email) {
      for (var i = 0; i < event.confirmedParticipants.length; i++) {
        var confirmed = event.confirmedParticipants[i];
        if (confirmed.email === email) {
          console.log('CONFIRMED');
          return true;
        }
      }
      return false;
    }

    if ((newEvent.ratingParticipants.indexOf(req.user.email) === -1) && isConfirmedParticipant(newEvent, req.user.email)) {
      newEvent.ratingParticipants.push(req.user.email);
      newEvent.rateAmount += 1;
      newEvent.rating = ((newEvent.rating * (newEvent.rateAmount - 1)) + Number(req.body.rating)) / newEvent.rateAmount;
    
      
      
    
      // **********************************************************************
    
      // Saving the changed fields
      newEvent.save(); 
      res.status(200).send(newEvent);
    
    } else {
      res.status(400).send('Already Rated');
    }
  });
});

app.get('/events', function(req, res) {
  Event.find({}, function(err, events) {
    if (err) {
      res.status(500).send(err);
    } else {
      events.forEach((event) => event.bids = null);
      res.status(200).send(events);
    }
  });
});

app.get('/events/:id', function(req, res) {
  Event.findOne({_id: req.param('id')}, function(err, newEvent) {
    if (err) {
      res.send({
        error: err
      });
    } else { 
      newEvent.bids = null;
      res.send(newEvent);
    }
  });
});

app.put('/user/:id', function(req, res) { //email: email, number:number, description: description
  // Geting the event to update
  User.findOne({'facebook.id': req.param('id')}, function(err, newUser) {
    // Updating all the information from the event
    // **********************************************************************
    newUser.email = req.body.email;
    newUser.number = req.body.number;
    newUser.description = req.body.description;
    // **********************************************************************
    
    // Saving the changed fields
    newUser.save(function(err, updatedUser) {
      if (err) { console.error(err); }
      res.send(updatedUser);
    });
  });
});

app.post('/bid', biddingController.makeBid);
app.get('/bid/:eventID', biddingController.getUserBidInfo);

app.post('/subs', (req, res) => {
  User.findById(req.body._id)
    .then(user => {
      console.log(user);
      user.pushSub = req.body.subscription;
      return user.save();
    })
    .then((updatedUser) => {
      console.log(updatedUser);
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});
ws.on('connection', function(socket) {
  socket.on('getUserInfo', (info) => {
    info.data.user.socketId = socket.id;
    socketUsers.push(info.data.user);
  });

  socket.on('postComment', (comment) => {
    const {id } = comment;
    socketUsers.forEach((user) => {
      if (user.hostedEvents.includes (id)) {
        ws.to(user.socketId).emit('addAlert', {user: comment.user.user, eventName: comment.eventName, comment });
      }  
    });
  });
});

//Server init to listen on port 3000 -> Needs to be altered for deployment
server.listen(process.env.PORT);
console.log(`RECRAC server running on :${process.env.PORT}`);
