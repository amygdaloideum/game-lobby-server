const io = require('socket.io').listen(8099);
const uuid = require('uuid/v1');

let lobby = [];
let users = [];
let sockets = [];

io.sockets.on("connection", socket => {
  const user = {
    id: uuid(),
    name: null,
  };

  sockets.push({socket, user})

  console.log(`User with id ${user.id} has connected`);

  // Lets force this connection into the lobby room.
  socket.join('lobby');

  socket.on('CREATE_GAME', createGame);
  socket.on('SET_USERNAME', setUserName);
  socket.on('SEND_INVITE', sendInvite);
  socket.on("disconnect", unregisterUser);

  function sendInvite(target){
    targetSocket = sockets.find(e => e.user.id === target.id);
    targetSocket && targetSocket.socket.emit('INVITATION', user);
    console.log(`User ${user.name} invited ${target.name} to play.`);
  }

  function setUserName(userName) {
    user.name = userName;
    users.push(user);
    console.log(`User ${user.id} has been assigned name ${user.name}`)
    io.emit('USERS_UPDATE', users);
  }

  function createGame() {
    const gameId = uuid();
    const game = {
      gameId,
      creator: user,
    };
    lobby.push(game);
    io.emit('GAMES_UPDATE', lobby);
    console.log(`User ${user.name || user.id} started a new game with id ${gameId}`);
  }

  function unregisterUser() {
    if (!user.name) {
      return;
    }
    users = users.filter(e => e.name !== user.name);
    io.emit('USERS_UPDATE', users);
    lobby = lobby.filter(e => e.creator.id !== user.id);
    io.emit('GAMES_UPDATE',lobby);
    sockets = sockets.filter(e => e.user.id !== user.id);
    console.log(`User ${user.name} disconnected.`)
  }
});