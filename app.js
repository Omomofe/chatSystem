//jshint esversion:6

const express = require('express');
const bodyParser = require('body-parser');
const http = require('http');
const md5 = require('md5');
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const moment = require('moment');
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin-mofe:react.node5@chatcluster.itadc.mongodb.net/messageDB?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true});
//
//mongodb://localhost:27017/messageDB
const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  time: String
});
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String
});
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);

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



  const newUser = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: md5(req.body.password)
  });
  newUser.save(function(err){
    if(err){

      console.log(err);

    }else {
      userName = req.body.firstName;
      res.redirect("/chat/" + userName);
    }
  });

});
app.post("/login", function(req, res){


  const email = req.body.email;

  User.findOne({email: email}, function(err, foundUser){

    if(err){
      console.log(err);
    }else{
      if (foundUser) {

        if (foundUser.password === md5(req.body.password)) {
          userName = foundUser.firstName;
          res.redirect("/chat/" + userName);
        }

      }

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
  // console.log(user);

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
  // for (var clientId in clients_in_the_room ) {
  //   console.log( clientId); //Seeing is believing
  //   //var client_socket = io.sockets.connected[clientId];//Do whatever you want with this
  // }
  var clients = [];
  clients_in_the_room.get(roomId).forEach((client) => {

    clients.push(findUserById(client));
  });

  console.log(clients);
  io.emit('user-connect', clients);

socket.on('disconnect', () => {


    io.emit('message', formatMessage(archive, `${user.user} left!.`));
    io.emit('user-connect', clients);
    users.forEach((item) => {
      if(user.user === item.user){
        var index = users.indexOf(item);
        users.splice(index,1);
      }
    });

    console.log(clients);
    console.log(`${user.user} disconnected`);
  });
});

const archive = 'ADMIN';
app.get("/chat/:username", function(req, res){
 name = req.params.username;

  if (userName === "") {
    res.redirect('/login');
  } else {
    res.render("index",{
      name: archive
    });



  }

});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

server.listen(port,function(){
  console.log("Server has started on port 3000");
});
