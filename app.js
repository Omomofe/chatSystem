//jshint esversion:6
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');

const app = express();
const session = require('express-session');
const passport = require('passport');

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const moment = require('moment');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const {User, Message} = require('./collections/messages.js')


app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());



passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

function formatMessage(username, text){
  const message = new Message ({
    username: username,
    text: text,
    time:moment().format('h:mm a')
  });
  message.save();

  return message;

}




app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static('public'));


let userName = "";

let users = [];
let id = "";

app.get('/', function(req, res){
  res.redirect('/register');
});

app.get("/login", function(req, res){
  res.render("login");
});

app.get('/register', function(req, res){
  res.render('register');
});

app.post('/register', function(req, res){


  User.register({firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username},req.body.password, function(err, user){
      if (err) {

        console.log(err);
        res.render('register');

      } else {

        passport.authenticate('local')(req, res, function(){
          userName = req.body.firstName;
          res.redirect("/chat/" + userName);

        })
      }
    })


  
});
app.post("/login", function(req, res){

  const email = req.body.username;
  const loginUser = new User({

    username: req.body.username,
    password: req.body.password

  });

  req.login(loginUser, function(err){

    if (err) {

      console.log(err);

    } else {

      passport.authenticate('local')(req, res, function(){
        User.findOne({username: email}, function(err, foundUser){

          if(err){

            console.log(err);

          }else{
            if (foundUser) {

              userName = foundUser.firstName;
              res.redirect("/chat/" + userName);

            }
      
          }
        });
      });
    }
  });


});


function saveUser(id, user){

  if (user === userName) {
    users.push({id,user});
  }
  return id;
}

function findUserById(id){

  let user =  users.find (user => user.id === id );
  return user;

}
let name = '';


// socket.on('typing', function(data){
//     socket.broadcast.emit('typing', data);
//  });


io.on('connection', (socket) => {

  id = socket.id;
  roomId = 'room';
  saveUser(id, userName);
  let user = findUserById(id);

  socket.join(roomId);


  users.forEach((eachUser) => {
    if (eachUser.user === userName) {
      Message.find({}, function(err, messages){
        messages.forEach((message) => {
          socket.emit('message',message);
        });
      });
    }
  });

  socket.broadcast.emit('message', formatMessage(archive, `${userName} is connected`));

  socket.on('chat-message', (msg) => {
    console.log(msg);

    if (user) {
      console.log(user);
      io.emit('message', formatMessage(user.user, msg));
    }

  });

  var clients_in_the_room = io.sockets.adapter.rooms;

  var clients = [];
  clients_in_the_room.get(roomId).forEach((client) => {

    clients.push(findUserById(client));
  });

  console.log(users);
  io.emit('user-connect', clients);

socket.on('disconnect', () => {


    io.emit('message', formatMessage(archive, `${user.user} left!.`));
    
    users.forEach((item) => {

      if(user.user === item.user){
        var index = users.indexOf(item);
        users.splice(index,1);
      }

    });

    io.emit('user-connect', users);
    console.log(users);

    console.log(clients);
    console.log(`${user.user} disconnected`);
  });
});

const chatAdmin = 'ADMIN';
app.get("/chat/:username", function(req, res){
  
 name = req.params.username;
  if (req.isAuthenticated()) {
    
    res.render("index",{
      name: chatAdmin
    });
  } else {
    res.redirect('/login');
  }

});


let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

server.listen(port,function(){
  console.log("Server has started on port 3000");
});
