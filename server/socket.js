const app = require('../index.js');
const httpServer = require('http').Server;
const server = httpServer(app);
const socket = require('socket.io');
const ws = socket(server);
const socketUsers = [];

module.exports = {
  ws,
  socket,
  socketUsers,
  server
};
