var express     = require("express"),
    app         = express(),
    request     = require("request"),
    passport    = require("passport"),
    session     = require("express-session"),
    cookieParser = require('cookie-parser'),
    bodyParser  = require("body-parser"),
    flash       = require("connect-flash"),
    mysql       = require('mysql');

require('./config/passport')(passport);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());
app.use(express.static(__dirname + "/public"));

app.use(session({
    secret: "maoisthebestcat",
    //set both to false acc to colt
    resave: false,
    saveUninitialized: false
}) );

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

require('./routes.js')(app, passport);

app.listen(process.env.PORT, process.env.IP, function(){
   console.log("MovieTV has started.."); 
});