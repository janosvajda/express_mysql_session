var express = require('express')
var parseurl = require('parseurl')
var session = require('express-session')
var http = require('http');
var SessionStore = require('express-mysql-session');
var mysql = require('mysql');
var path = require('path');
var bodyParser = require("body-parser");

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.set('port', process.env.PORT || 3001);

app.use(bodyParser.urlencoded({extended: false}));

var db_connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat'
});

db_connection.connect();

app.set('db_connection', db_connection);

var sessionStore = new SessionStore({
    expiration: 86400000,
    autoReconnect: true,
    keepAlive: true,
    keepAliveInterval: 30000,
    createDatabaseTable: true
}, db_connection);

app.use(session({
    store: sessionStore,
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}))

app.use(function (req, res, next) {
    var views = req.session.views
    if (!views) {
        views = req.session.views = {}
    }
    var pathname = parseurl(req).pathname
    views[pathname] = (views[pathname] || 0) + 1
    next()
})

app.get('/index', function (req, res, next) {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/views/index.html');
});


var is_restricted_area = function restrict(req, res, next) {
    if (req.session.user && req.session.user.id > 0 && req.session.user.username != '') {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}
app.set('is_restricted_area', is_restricted_area);

var routes_login = require('./routes/user.js')(app);
var routes_admin = require('./routes/admin.js')(app);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});