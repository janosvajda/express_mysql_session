module.exports = function(app) {

    app.get('/admin', app.get('is_restricted_area'), function (request, response) {
        response.send('Admin area. Hello ' + request.session.user.username + '! click <a href="/logout">here to logout</a>');
    });
} 