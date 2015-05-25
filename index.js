var express = require('express')
var parseurl = require('parseurl')
var session = require('express-session')
var http = require('http');
var SessionStore = require('express-mysql-session');
var mysql = require('mysql');
var path = require('path');
var bodyParser = require("body-parser");

var app = express();

app.use(bodyParser.urlencoded({extended: false}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'chat'
});

connection.connect();

var sessionStore = new SessionStore({
    expiration: 86400000,
    autoReconnect: true,
    keepAlive: true,
    keepAliveInterval: 30000,
    createDatabaseTable: true
}, connection);

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

function restrict(req, res, next) {
    if (req.session.user && req.session.user.id > 0 && req.session.user.username != '') {
        next();
    } else {
        req.session.error = 'Access denied!';
        res.redirect('/login');
    }
}

app.get('/index', function (req, res, next) {
    res.sendFile(__dirname + '/views/index.html');
});

app.get('/admin', restrict, function (request, response) {
    response.send('Admin area. Hello ' + request.session.user.username + '! click <a href="/logout">here to logout</a>');
});

app.get('/logout', function (req, res) {
    req.session.destroy(function () {
        res.redirect('/index');
    });
});

app.get('/login', function (req, res, next) {
    res.sendFile(__dirname + '/views/login.html');
});

app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var sql_params = [username, password];
    connection.query('SELECT * FROM users WHERE username=? AND password=? AND active=1',
            sql_params,
            function (err, result) {
                if (result[0]) {
                    req.session.regenerate(function () {
                        req.session.user = result[0];
                        res.redirect('admin');
                    });
                } else {
                    res.redirect('login');
                }
            });
});

app.set('port', process.env.PORT || 3001);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});