var bodyParser = require("body-parser"),
    methodOverride = require("method-override"),
    expressSanitizer = require("express-sanitizer"),
    mongoose = require("mongoose"),
    express = require("express"),
    app = express();

// APP CONFIG    
mongoose.connect("mongodb://localhost/restful_event_app");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(expressSanitizer());
app.use(methodOverride("_method"));

//MONGOOSE/MODEL CONFIG
var eventSchema = new mongoose.Schema({
    title: String,
    description: String,
    created: {type: Date, default: Date.now},
    cost: Number,
    startdate: Date,
    enddate: Date,
});
var Event = mongoose.model("Event", eventSchema);

//RESTFUL ROUTES
app.get("/", function(req, res){
    res.redirect("/events");
});

//INDEX ROUTE
app.get("/events", function(req, res){
    Event.find({}, function(err, events){
        if(err){
            console.log("ERROR");
        } else {
            res.render("index", {events: events});
        }
    });
});

//NEW ROUTE
app.get("/events/new", function(req, res){
    res.render("new");
});

//CREATE ROUTE
app.post("/events", function(req, res){
    console.log(req.body);
    req.body.event.body = req.sanitize(req.body.event.body);
    console.log("==============================");
    console.log(req.body);
    Event.create(req.body.event, function(err, newEvent){
        if(err){
            res.render("new");
        } else {
            //redirect to index
            res.redirect("/events");
        }
    });
});

//SHOW ROUTE
app.get("/events/:id", function(req, res){
   Event.findById(req.params.id, function(err, foundEvent){
       if(err){
           res.redirect("/events");
       } else {
           res.render("show", {event: foundEvent});
       }
   });
});

//EDIT ROUTE
app.get("/events/:id/edit", function(req, res){
    Event.findById(req.params.id, function(err, foundEvent){
        if(err){
            res.redirect("/events");
        } else {
            res.render("edit", {event: foundEvent});
        }
    });
});

//UPDATE ROUTE
app.put("/events/:id", function(req, res){
    req.body.event.body = req.sanitize(req.body.event.body);
    Event.findByIdAndUpdate(req.params.id, req.body.event, function(err, updatedEvent){
        if(err){
            res.redirect("/events");
        } else {
            res.redirect("/events/" + req.params.id);
        }
    });
});

//DELETE ROUTE
app.delete("/events/:id", function(req, res){
    Event.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/events");
        } else {
            res.redirect("/events");
        }
    });
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server is running..");
});