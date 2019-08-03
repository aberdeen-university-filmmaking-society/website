require('dotenv').config();
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require("http");
persist = require('node-persist');
app = express();
var votemanager = require('./managers/votemanager');
var settings = require('./managers/settings');
var pagemanger = require('./managers/custompagemanager');
var productionsmanager = require('./managers/productionsmanager');
var committee = require('./managers/committee');
var bn = require("./managers/breakingnews");

var compression = require('compression');
var minify = require('express-minify');

var passport = require('passport');
var expressSession = require('express-session');
app.use(expressSession({secret: 'mySecretKey'}));
app.use(passport.initialize());
app.use(passport.session());



var GoogleStrategy = require('passport-google-oauth2').Strategy;
passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://aufilmmaking.com/auth/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, cb) {
    if(profile.email=="aufilmmakingsociety@gmail.com"){
      return cb(undefined, profile);
    }
    else{
      return cb();
    }
  }
));
var user_cache = {};
passport.serializeUser(function(user, next) {
  let id = user.id;
  user_cache[id] = user;
  next(null, id);
});

passport.deserializeUser(function(id, next) {
  next(null, user_cache[id]);
});


//load local lists
persist.init();
settings.load();
pagemanger.load();
productionsmanager.load();
committee.load();
bn.load();

//Connect to database
var mysql      = require('mysql');
sqlcon = mysql.createConnection({
  host     : process.env.DATABASE_HOST,
  user     : process.env.DATABASE_USER,
  password : process.env.DATABASE_PASSWORD,
  database : process.env.DATABASE_NAME,
  multipleStatements: true
});
sqlcon.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

app.locals.rmWhitespace = true;

var server = http.createServer(app);
io = require('socket.io').listen(server);
server.listen(80);
io.of('/resultpage').on('connection', client =>{
  console.log("RESULTPAGE");
  votemanager.tryForceResultUpdate();
});
io.on('connection', client => {
  console.log("client connected with IP "+ client.handshake.address.address);
  if(client.handshake.headers.referer.endsWith('/results')){
    votemanager.tryForceResultUpdate(client);
  }
  io.emit("other.connectedcount", io.engine.clientsCount);
  client.on('event', data => {
    console.log(data)
  });
  client.on('disconnect', () => {
    console.log("client disconnected");
    io.emit("other.connectedcount", io.engine.clientsCount);
  });
})

var setsobj = require("./managers/settings");

app.use(function (req, res, next) {
  if(req.method == "GET"){
    res.locals.settings = setsobj.get();
    res.locals.breakingnews = bn.get();
    res.locals.showbreakingnewsNow = bn.now();
    res.locals.cssmods = pagemanger.pages.cssmods,
    res.locals.headerinsert = pagemanger.pages.headerinsert;
    res.locals.homepageinsert = pagemanger.pages.homepageinsert;
    if(req.isAuthenticated()){
      res.locals.authenticated = true;
      console.log("AUTHENTICATED REQUEST");
    }
  }
  if(process.env.LAUNCH_DATE){
    if(req.isAuthenticated() || req.url.startsWith('/images') || req.url.startsWith('/stylesheets') || req.url.startsWith('/javascripts')){
      next();
    }
    else{
      var launch = new Date(process.env.LAUNCH_DATE);
      var now = new Date();
      if(launch>now){
        res.render('countdown', {serverTime:now, launchTime:launch });
      }
      else{
        next();
      }
    }
  }
  else{
    next();
  }
});

var fileupload = require('express-fileupload');
app.use(fileupload());

var index = require('./routes/index');
var admin = require('./routes/admin');
var vote = require('./routes/vote');
var results = require('./routes/result');
var sitemap = require('./routes/sitemap');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(compression());

app.use(minify());

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/admin', admin);
app.use('/vote', vote);
app.use('/results', results);
app.use('/', sitemap);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {page:"error"});
});
