//importing libraries and modules
const express= require('express');
const socketio= require('socket.io');
const http= require('http');
const { addUser, removeUser, getUser, getUsersInRoom, users } = require('./users');
const { getRooms }= require('./rooms');
const router= require('./router');
const { Socket } = require('dgram');

/*setting up server*/
const PORT= process.env.PORT || 5000; //port definition
const app= express(); //using express
const server= http.createServer(app); //the server itself

//setting up socket server
const io= socketio(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

app.use(router);

//activating server
server.listen(PORT, ()=>{
    console.log(`Server has started on port: ${PORT}`)
})


/*activating socket server*/ //socket script
io.on('connection', (socket)=>{

    socket.on('join', ({name, room}, callback)=> { //listening for a "join" named event being emitted from the client
        const { error, user } = addUser({ id: socket.id, name, room }); //destructures the returned user and error from the function
        
        const rooms= getRooms(user) //returns an array of all the rooms created on the io
        console.log('rooms: ' + rooms)

        if(error){
            callback(error); //error from the addUser Module is sent by "callback()"
        } 
        /*if the error condition above is false then I have access to the user object from the add user function.*/
        
        socket.emit('message', {text: `${user.name}, welcome to the room: ${user.room}.`}) //welcome message to the user is emmitted
        socket.broadcast.to(user.room).emit('message', {user: 'admin', text: `${user.name} has joined!`}) //the user's joining is broadcasted

        socket.join(user.room); //the particular user socket is added to the room ie. user officially joins room
        
        const users= getUsersInRoom(user.room); //this returns an array of users in the room
        const userNames= users.map(user=> user.name) //this returns an array of usernames only
        io.to(user.room).emit('getUsers', {users: userNames}); //this emits an event to be listened for on the client, payload is the username array

        console.log('users: ' + users); //testing
        console.log('usernames: ' + userNames) //testing


        callback();
    });


    socket.on('sendMessage', (message, callback)=>{
        const user = getUser(socket.id); //getting the particular user instance that is the target emitter
        io.to(user.room).emit('message', { user: user.name, text: message }); //sending message for all the room to see including the user instance

        callback();
    } )

    socket.on('disconnect', ()=>{
        console.log(`user has left!!!`);
        const user= removeUser(socket.id); //disconnects user and returns the user instance for further use
        

        if(user){
            io.to(user.room).emit('message', {user: 'admin', text: `${user.name} has left!`});
            //io.to(user.room).emit('roomData', {room: user.room, users: getUsersInRoom(user.room)});
            const users= getUsersInRoom(user.room);
            const userNames= users.map(user=> user.name);
            io.to(user.room).emit('getUsers', {users: userNames});
        }
    })
})