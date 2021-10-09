const {getUsersInRoom}= require('./users');

const rooms= [];

function spliceEmptyRoom(room){
    rooms.splice(rooms.indexOf(room), 1)
}

const getRooms= (user)=>{
    if(rooms.indexOf(user.room) === -1){
        rooms.push(user.room)
    }
    else if(getUsersInRoom(user.room)=== []){
        spliceEmptyRoom(user.room)
    }
    else{null}

    
    return rooms;
}

    
module.exports= {getRooms};