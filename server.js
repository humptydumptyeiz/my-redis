'use strict';

const net = require('net');
const fs = require('fs/promises');
const {extractCommands, serialiseServer} = require('./parser');

const HOST = '127.0.0.1';
const PORT = 9999;

const clients = {};

let db;
const server = net.createServer();
server.listen(PORT, HOST, async () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
  try {
    db = await fs.readFile('store.json');
    db = JSON.parse(db);
  } catch (err) {
    db = {};
  }
  
})

server.on('connection', socket => {
  const clientFd = socket._handle.fd;
  clients[clientFd] = {data: Buffer.from(''), socket};
  
  socket.on('data', data => {
    const buffer  = Buffer.concat([clients[clientFd].data, data]);
    const [commands, rem] = extractCommands(buffer);
    clients[clientFd].data = rem.length ? rem : Buffer.from('');
    for(let comm of commands) {
      const response = handleCommand(comm);
      const reply = serialiseServer(response);
      socket.write(reply);
    }
  });
  
  socket.on('close', () => {
    delete clients[clientFd];
  });
});

function handleCommand(comm) {
  const {command} = comm;
  return 'GET' === command ? handleGet(comm) : handleSet(comm);
}

function handleGet(comm) {
  const {key} = comm;
  return db[key] || 'nil';
}

function handleSet(comm) {
  const {key, value} = comm;
  db[key] = value;
  return 'OK';
}

async function gracefulShutdown() {
  await fs.writeFile('store.json', JSON.stringify(db));
  for(let {_, socket} of Object.values(clients)){
    socket.end();
  }
  server.close();
  process.exit(0);
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
