module.exports = function(app) {

    app.get('/login', function (req, res, next) {
        res.sendFile( app.get('views') + '/login.html');
    });

    app.post('/login', function (req, res) {
        var username = req.body.username;
        var password = req.body.password;
        var sql_params = [username, password];
        app.get('db_connection').query('SELECT * FROM users WHERE username=? AND password=? AND active=1',
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

    app.get('/logout', function (req, res) {
        req.session.destroy(function () {
            res.redirect('/index');
        });
    });

}