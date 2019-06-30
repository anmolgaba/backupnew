var LocalStrategy   = require("passport-local").Strategy,
    mysql           = require('mysql'),
    bcrypt          = require('bcrypt-nodejs'),
    dbconfig        = require('./database');
var db = mysql.createConnection(dbconfig.connection);
db.query('USE ' + dbconfig.database);

function formverification(username, password, email, name, passwordverify){
    var reg = /^.+@.+\..+$/;
    if(username.length<5)
        return "Username length should be more than 5";
    else if(password.length<5)
        return "Password length should be more than 5";
    else if(reg.test(email) == false)
        return "Improper email format";
    else if(password!=passwordverify)
        return "passwords do not match!";
    else
        return "true";
}

module.exports = function(passport) {
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });
    
    passport.deserializeUser(function(id, done) {
        db.query("SELECT * FROM users WHERE id = ? ",[id], function(err, rows){
            done(err, rows[0]);
        });
    });
    
    passport.use(
        'local-signup',
        new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) {
            var verstatus = formverification(username, password, req.body.email, req.body.name, req.body.passwordverify);
            if(!(verstatus=="true")) {
                return done(null, false, req.flash('signupMessage', verstatus));
            } else {
                db.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows) {
                    if (err)
                        return done(err);
                    if (rows.length) {
                        return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
                    } else {
                        var newUserMysql = {
                            username: username,
                            password: bcrypt.hashSync(password, null, null)  // use the generateHash function in our user model
                        };
    
                        var insertQuery = "INSERT INTO users ( username, password, email, name ) values (?,?,?,?)";
    
                        db.query(insertQuery,[newUserMysql.username, newUserMysql.password, req.body.email, req.body.name],function(err, rows) {
                            if(err)
                                throw err;
                            newUserMysql.id = rows.insertId;
    
                            return done(null, newUserMysql);
                        });
                    }
                });
            }
        })
    );
    
    passport.use(
        'local-login',
        new LocalStrategy({
            usernameField : 'username',
            passwordField : 'password',
            passReqToCallback : true // allows us to pass back the entire request to the callback
        },
        function(req, username, password, done) { // callback with email and password from our form
            db.query("SELECT * FROM users WHERE username = ?",[username], function(err, rows){
                if (err)
                    return done(err);
                if (!rows.length) {
                    return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash
                }

                // if the user is found but the password is wrong
                if (!bcrypt.compareSync(password, rows[0].password))
                    return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

                // all is well, return successful user
                return done(null, rows[0]);
            });
        })
    );
};