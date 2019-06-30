var mysql       = require('mysql'),
    dbconfig    = require('./config/database'),
    request     = require("request"),
    db = mysql.createConnection(dbconfig.connection);

var api_key = "5c902a2f81b4919088e86511e8246ff9";

db.query('USE ' + dbconfig.database);
module.exports = function(app, passport) {
    
    app.get("/", function(req, res){
        res.redirect("/login");
    });

	app.get("/login", function(req, res) {
		res.render("login", {message: req.flash('loginMessage')});
	});

	app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
		}),
        function(req, res) {
            res.redirect('/');
    });

	app.get("/signup", function(req, res) {
		// render the page and pass in any flash data if it exists
		res.render("signup", { message: req.flash('signupMessage') });
	});

	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));

	app.get('/profile', isLoggedIn, function(req, res) {
	    var sql = "select * from admin where id='1'";
        db.query(sql, function (err, admin) {
            if (err)
                throw err;
            res.render('profile.ejs', {user : req.user, admin: admin});
        });
	});

//==================MEDIA============================
//new media page
    app.get("/new", isLoggedIn, function(req, res){
        var searchtitle = req.query.searchtitle;
        var url = "https://api.themoviedb.org/3/search/multi?api_key="+api_key+"&language=en-US&query="+searchtitle+"&page=1&include_adult=false";
        request(url, function(error, response, body){
            if(!error && response.statusCode==200){
                var data = JSON.parse(body);
                res.render("new", {results: data});
            }
        });
    });

//show movies
    app.get("/movies", isLoggedIn, function(req, res){
        var order_by = req.query.order;
        var rating_val = req.query.rating;
        var genre_name = req.query.genre;
        if(order_by === undefined)
            order_by = 'null';
        if(rating_val === undefined)
            rating_val = 0;
        if(genre_name === undefined)
            genre_name = '';
        var sql = "select * from users_entries inner join entertain_entry on users_entries.ext_id = entertain_entry.imdb_id inner join movies on users_entries.ext_id = movies.imdb_id where users_entries.user_id = '"+req.user.id+"' and entertain_entry.imdbRating >="+rating_val+" and entertain_entry.genre like '%"+genre_name+"%' order by "+order_by;
        db.query(sql, function (err, movies) {
            if (err)
                throw err;
            res.render("movies/index", {movies: movies});
        });
    });
    
    app.get("/movies/upcoming", isLoggedIn, function(req, res){
        var url = "https://api.themoviedb.org/3/movie/upcoming?api_key="+api_key+"&language=en-US&page=1&region=IN";
        request(url, function(error, response, body){
            if(!error && response.statusCode==200){
                var data = JSON.parse(body);
                res.render("movies/upcoming", {movies: data["results"]});
            } else {
                console.log(error);
            }
        });
    });
    
    app.get("/tvshows", isLoggedIn, function(req, res){
        var order_by = req.query.order;
        var rating_val = req.query.rating;
        var genre_name = req.query.genre;
        if(order_by === undefined)
            order_by = 'null';
        if(rating_val === undefined)
            rating_val = 0;
        if(genre_name === undefined)
            genre_name = '';
        var sql = "select * from users_entries inner join entertain_entry on users_entries.ext_id = entertain_entry.imdb_id inner join tvshows on users_entries.ext_id = tvshows.imdb_id where users_entries.user_id = '"+req.user.id+"' and entertain_entry.imdbRating >="+rating_val+" and entertain_entry.genre like '%"+genre_name+"%' order by "+order_by;
        db.query(sql, function (err, tvshows) {
            if (err)
                throw err;
            res.render("tvshows/index", {tvshows: tvshows});
        });
    });
    
    //post to movie
    app.post("/movies", isLoggedIn, function(req, res){
        var id = req.body.id;
        var url = "https://api.themoviedb.org/3/movie/"+id+"?api_key="+api_key+"&language=en-US";
        request(url, function(error, response, body){
            if(!error && response.statusCode==200){
                var data = JSON.parse(body);
                //now requesting from omdb within the 1st request call
                var url2 = "https://www.omdbapi.com/?apikey=thewdb&i="+data.imdb_id;
                request(url2, function(error, response, body){
                    if(!error && response.statusCode==200){
                        var data2 = JSON.parse(body);
                        //this format is to properly escape special characters like ' which would cause prob
                        var sql = "insert ignore into users_entries set ?";
                        db.query(sql, {user_id:req.user.id, ext_id:data.imdb_id}, function (err, movies) {
                            if (err)
                                throw err;
                        });
                        sql = "insert ignore into entertain_entry set ?";
                        db.query(sql, {id:data.id, imdb_id:data.imdb_id, imdbRating:data2.imdbRating, overview:data.overview, poster_path:data.poster_path, runtime:data.runtime, title:data.title, genre:data2.Genre, year:data2.Year, language:data2.Language, awards:data2.Awards, media_type:"movie"}, function (err, movies) {
                            if (err)
                                throw err;
                        });
                        sql = "insert ignore into movies set ?";
                        db.query(sql, {imdb_id:data.imdb_id, revenue:data.revenue,  director:data2.Director}, function (err, movies) {
                            if (err)
                                throw err;
                        });
                    } else {
                        console.log(error);
                    }
                });
            } else {
                console.log(error);
            }
        });
        res.redirect("/movies");
    });
    
    //post to tvshow
    app.post("/tvshows", isLoggedIn, function(req, res){
        var id = req.body.id;
        var url = "https://api.themoviedb.org/3/tv/"+id+"?api_key="+api_key+"&language=en-US";
        request(url, function(error, response, body){
            if(!error && response.statusCode==200){
                var data = JSON.parse(body);
                //now requesting from omdb within the 1st request call
                var url2 =  "https://api.themoviedb.org/3/tv/"+id+"/external_ids?api_key="+api_key+"&language=en-US";
                request(url2, function(error, response, body){
                    if(!error && response.statusCode==200){
                        var data2 = JSON.parse(body);
                        var url3 = "https://www.omdbapi.com/?apikey=thewdb&i="+data2.imdb_id;
                        request(url3, function(error, response, body){
                            if(!error && response.statusCode==200){
                                var data3 = JSON.parse(body);
                                //this format is to properly escape special characters like ' which would cause prob
                                var sql = "insert ignore into users_entries set ?";
                                db.query(sql, {user_id:req.user.id, ext_id:data3.imdbID}, function (err, tvshows) {
                                    if (err)
                                        throw err;
                                });
                                sql = "insert ignore into entertain_entry set ?";
                                db.query(sql, {id:data.id, imdb_id:data3.imdbID, imdbRating:data3.imdbRating, overview:data.overview, poster_path:data.poster_path, runtime:data.episode_run_time[0], title:data.name, genre:data3.Genre, year:data3.Year, language:data3.Language, awards:data3.Awards, media_type:"tv"}, function (err, tvshows) {
                                    if (err)
                                        throw err;
                                });
                                sql = "insert ignore into tvshows set ?";
                                db.query(sql, {imdb_id:data3.imdbID, writer:data3.Writer, num_episodes:data.number_of_episodes, num_seasons:data.number_of_seasons}, function (err, tvshows) {
                                    if (err)
                                        throw err;
                                });
                            } else {
                                console.log(error);
                            }
                        });
                    } else {
                        console.log(error);
                    }
                });
            } else {
                console.log(error);
            }
        });
        res.redirect("/tvshows");
    });
    
    
    //movie show page
    app.get("/movies/:id", isLoggedIn, function(req, res){
        //find the movie with the id
        var sql = "select * from entertain_entry inner join movies on entertain_entry.imdb_id = movies.imdb_id where entertain_entry.imdb_id = '" + req.params.id + "'";
        var sql2 = "select * from reviews inner join users on reviews.user_id = users.id where reviews.ext_id='"+req.params.id+"'";
        //render the movie page
        db.query(sql, function (err, movie) {
        if (err)
            throw err;
        db.query(sql2, function(err, review) {
            if(err)
                throw err;
            res.render("movies/show", {movie: movie, reviews:review});
        });
      });
    });
    
    //tvshow show page
    app.get("/tvshows/:id", isLoggedIn, function(req, res){
        //find the tvshow with the id
        var sql = "select * from entertain_entry inner join tvshows on entertain_entry.imdb_id = tvshows.imdb_id where entertain_entry.imdb_id = '" + req.params.id + "'";
        var sql2 = "select * from reviews inner join users on reviews.user_id = users.id where reviews.ext_id='"+req.params.id+"'";
        //render the tvshow page
        db.query(sql, function (err, tvshow) {
        if (err)
            throw err;
        db.query(sql2, function(err, review) {
            if(err)
                throw err;
            res.render("tvshows/show", {tvshow: tvshow, reviews:review});
        });
      });
    });
    
    app.post("/movies/:id", isLoggedIn, function(req, res){
        var sql = "insert ignore into reviews set ?";
        db.query(sql, {review:req.body.review, rating:req.body.rating, ext_id:req.params.id, user_id:req.user.id}, function (err) {
            if(err)
                throw err;
        });
        res.redirect("/movies/"+req.params.id);
    });
    app.post("/tvshows/:id", isLoggedIn, function(req, res){
        var sql = "insert ignore into reviews set ?";
        db.query(sql, {review:req.body.review, rating:req.body.rating, ext_id:req.params.id, user_id:req.user.id}, function (err) {
            if(err)
                throw err;
        });
        res.redirect("/tvshows/"+req.params.id);
    });

	app.get('/logout', function(req, res) {
		req.logout();
		var sql = "update admin set hits=hits+1 where id='1'";
        db.query(sql, function (err) {
            if(err)
                throw err;
        });
		res.redirect('/');
	});
};

// route middleware to make sure
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/');
}