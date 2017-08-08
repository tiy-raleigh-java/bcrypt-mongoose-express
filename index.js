const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');
const flash = require('express-flash-messages');

// require stuff for passport
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

// mongoose. not a mammal
const mongoose = require('mongoose');
// bluebird is a promise library. checkout bluebirdjs.org
const bluebird = require('bluebird');

const User = require('./models/user');

// configure passport
passport.use(
  new LocalStrategy(function(email, password, done) {
    console.log('LocalStrategy', email, password);
    User.authenticate(email, password)
      // success!!
      .then(user => {
        if (user) {
          done(null, user);
        } else {
          done(null, null, { message: 'There was no user with this email and password.' });
        }
      })
      // there was a problem
      .catch(err => done(err));
  })
);

// use passport with Twitter
passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_API_KEY,
      consumerSecret: process.env.TWITTER_API_SECRET,
      callbackURL: 'http://localhost:3000/auth/twitter/callback'
    },
    function(token, tokenSecret, profile, done) {
      // function to get a user from the returned data
      User.findOrCreate(
        {
          provider: profile.provider,
          providerId: profile.id
        },
        {
          name: profile.displayName
        },
        (err, user) => {
          console.log(err);
          if (err) {
            return done(err);
          }
          done(null, user);
        }
      );
    }
  )
);

// store the user's id in the session
passport.serializeUser((user, done) => {
  console.log('serializeUser');
  done(null, user.id);
});

// get the user from the session based on the id
passport.deserializeUser((id, done) => {
  console.log('deserializeUser');
  User.findById(id).then(user => done(null, user));
});

// set mongoose's primise library to be bluebird
mongoose.Promise = bluebird;

// create express app
const app = express();

// tell express to use handlebars
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('views', './views');
app.set('view engine', 'handlebars');

app.use(
  session({
    secret: 'keyboard kitten',
    resave: false,
    saveUninitialized: true
  })
);

// connect passport to express boilerplate
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//tell express to use the bodyParser middleware to parse form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// this middleware function will check to see if we have a user in the session.
// if not, we redirect to the login form.
const requireLogin = (req, res, next) => {
  console.log('req.user', req.user);
  if (req.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

app.get('/', requireLogin, (req, res) => {
  res.render('home', { user: req.user });
});

// local login form
app.get('/login', (req, res) => {
  //console.log('errors:', res.locals.getMessages());
  res.render('loginForm', { failed: req.query.failed });
});

// login via twitter
app.get('/auth/twitter', passport.authenticate('twitter'));

// this is the callback called by twitter after a login
app.get(
  '/auth/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect: '/',
    failureRedirect: '/login?failed=true'
  })
);

// endpoint for local login sumbit
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?failed=true',
    failureFlash: true
  })
);

app.get('/register', (req, res) => {
  res.render('registrationForm');
});

app.post('/register', (req, res) => {
  let user = new User(req.body);
  user.provider = 'local';
  user.setPassword(req.body.password);

  user
    .save()
    // if good...
    .then(() => res.redirect('/'))
    // if bad...
    .catch(err => console.log(err));
});

// log out!!!!!
app.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

mongoose
  // connect to mongo via mongoose
  .connect('mongodb://localhost:27017/bcryptExample', { useMongoClient: true })
  // now we can do whatever we want with mongoose.
  // configure session support middleware with express-session
  .then(() => app.listen(3000, () => console.log('ready to roll!!')));
