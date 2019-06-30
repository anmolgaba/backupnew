var express = require("express");
var app = express();

app.get("/", function(req, res){
   res.send("Hi there, welcome to my assignment!"); 
});

app.get("/speak/:animal", function(req, res){
    var name = req.params.animal;
    var scream;
    
    if(name === "pig")
        scream = "Oink";
    else if(name === "cow")
        scream = "Moo";
    else if(name === "dog")
        scream = "Woof Woof!";
   res.send("The " + name + " says '" + scream + "'"); 
});

app.get("/repeat/:word/:n", function(req, res){
    var word = req.params.word;
    var n = Number(req.params.n);
    var result = "";
    for(var i = 0; i < n; i++)
        result+=word + " ";
    res.send(result);
});

app.get("*", function(req, res){
    res.send("Sorry, page not found .. what are you doing with your life?");
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("Server has started!");
});