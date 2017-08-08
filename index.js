const express = require('express');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');

// mongoose. not a mammal
const mongoose = require('mongoose');
// bluebird is a promise library. checkout bluebirdjs.org
const bluebird = require('bluebird');
// set mongoose's primise library to be bluebird
mongoose.Promise = bluebird;

const User = require('./models/user');

// create express app
const app = express();

// tell express to use handlebars
app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('views', './views');
app.set('view engine', 'handlebars');

//tell express to use the bodyParser middleware to parse form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(
  session({
    secret: 'keyboard kitten',
    resave: false,
    saveUninitialized: true
  })
);

app.get('/', (req, res) => {
  User.findById(req.session.userId)
    // if I find the user...
    .then(user => {
      if (!user) {
        res.redirect('/login');
      } else {
        res.render('home', { user: user });
      }
    });
});

app.get('/login', (req, res) => {
  res.render('loginForm');
});

app.post('/login', (req, res) => {
  User.authenticate(req.body.email, req.body.password)
    // success
    .then(user => {
      if (user) {
        req.session.userId = user._id;
        res.redirect('/');
      } else {
        res.render('loginForm');
      }
    });
  // // bad login
  // .catch(....)
});

app.get('/register', (req, res) => {
  res.render('registrationForm');
});

app.post('/register', (req, res) => {
  let user = new User(req.body);
  user.setPassword(req.body.password);

  user
    .save()
    // if good...
    .then(() => res.redirect('/'))
    // if bad...
    .catch(err => console.log(err));
});

mongoose
  // connect to mongo via mongoose
  .connect('mongodb://localhost:27017/bcryptExample', { useMongoClient: true })
  // now we can do whatever we want with mongoose.
  // configure session support middleware with express-session
  .then(() => app.listen(3000, () => console.log('ready to roll!!')));
