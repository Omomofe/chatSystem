//jshint esversion:6
const userDiv = document.querySelector('#user');
const roomLinks = document.querySelectorAll('.room-name');
const messageDiv = document.querySelectorAll('.message-div');
const messageBox = document.querySelector('.message-box');
var messages = document.getElementById('messages');



var socket = io();
var form = document.getElementById('form');
  var input = document.getElementById('input');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    if (input.value) {

      socket.emit('chat-message', input.value);
      input.value = '';
    }
  });
  var userList ;
  //ONLINE - USERS
  socket.on('user-connect', function(users){
    // REMOVING DUPLICATED USERHANDLES IN CASE THEY ARE CONNECTED FROM DIFFERENT BROWSER TAB.
    const getUserHandle = function(names){

      let userHandles = [];
      names.forEach((item) => {

        userHandles.push(item.user);

      });

      return new Set(userHandles);
    };
    //SEND CONNECTED USERS TO DOM
    if (userList !== undefined) {

      const userL = document.querySelectorAll('.list');

      userL.forEach((list) => {
        list.remove();
      });


    }

    getUserHandle(users).forEach((user) => {

      userList = document.createElement('li');
      userList.classList.add('list');
      userList.innerHTML = `<a href="#" class="nav-links">${user}</a><i class="fas fa-circle " id="online"></i>`;
      userDiv.appendChild(userList);

    });

  });
  //MESSAGES SENT
  const urlParams = window.location.href;

  const currentUser = new URL(urlParams).pathname.replace("/chat/","");


  socket.on('message', function(msg) {
    const div = document.createElement('div');
    div.classList.add('messages');
    div.innerHTML = (`<p class="meta"> ${msg.username} <span> ${msg.time} </span></p>
      <p class="text"> ${msg.text} </p>`);
    const newDiv = document.createElement('div');
    newDiv.classList.add('newDiv');

    newDiv.appendChild(div);
    if (msg.username === currentUser){
       newDiv.style.display = 'flex';
       div.style.background = 'rgb(1,14,54)';
       div.style.background = 'linear-gradient(0deg, rgba(1,14,54,1) 25%, rgba(72,72,163,1) 100%)';

     }
     if (msg.username === 'ADMIN') {
       div.style.textAlign = 'center';
       div.style.color = 'grey';
       div.style.fontStyle = 'italic';
       div.style.background = 'inherit';
       div.style.margin = '2% auto';
       div.style.fontSize = '70%';
     }
    messages.appendChild(newDiv);

    messages.scrollTop = messages.scrollHeight;
  });

//   message.addEventListener('keypress', function(){
//   if(handle.value.length > 0){
//     socket.emit('typing', handle.value);
//   }
// });
  //
  //socket.on('message', function(message){
  //   var item = document.createElement("li");
  //   item.textContent = message;
  //   messages.appendChild(item);
  //   window.scrollTo(0, document.body.scrollHeight);
  // });
