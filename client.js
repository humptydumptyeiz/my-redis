'use strict';

const net = require('net');
const readline = require('readline');
const { stdin: input, stdout: output } = require('process');

const { serialiseClient, extractCommands} = require('./parser');
const { InvalidCommand, InvalidGetArgument, InvalidSetArgument, InvalidValue} = require('./errors');

const GET_COMMAND = 'GET';
const SET_COMMAND = 'SET';

const HOST = '127.0.0.1';
const PORT = 9999;

let socketData = '';

const socket = new net.Socket();

socket.connect(PORT, HOST, () => {
  console.log('Connected to redis server');
  
  const rl = readline.createInterface({ input, output });
  
  rl.on('line', data => {
    try {
      const command = prepareCommand(data.trim());
      const serComm = serialiseClient(command);
      socket.write(serComm);
    } catch (err) {
      console.error(err.message);
    }
  });
  rl.on('close', () => {
    console.log('Exiting Client.');
    !socket.destroyed && socket.end( () => {
      process.exit();
    });
  });
  
  socket.on('close', () => {
    console.log('Server terminated.')
    rl.close(() => {
      process.exit();
    });
  });
});

socket.on('data', data => {
  socketData = Buffer.concat([socketData || Buffer.from(''), Buffer.from(data)]);
  console.log(socketData);
  const [serverPayload, rem] = extractCommands(socketData, 'server');
  
  socketData = Buffer.from(rem);
  
  for(let payload of serverPayload){
    console.log(payload);
  }
});

function prepareCommand(data) {
  const re = /(SET|GET|\w+)\s+(\w+)/gi;
  const matches = [...data.matchAll(re)];
  if(matches.length) {
    const match = matches[0];
    const command = match[1].toUpperCase();
    const key = match[2];
    const rest = data.substring(data.indexOf(key) + key.length);
    
    switch(command) {
      case GET_COMMAND:
        return prepareGetCommand(key, rest);
      case SET_COMMAND:
        return prepareSetCommand(key, rest);
      default:
        throw new InvalidCommand(command);
    }
  }
}

function prepareGetCommand(key, rest){
  if(rest.length) {
    throw new InvalidGetArgument();
  }
  return {
    command: GET_COMMAND,
    key
  };
}

function prepareSetCommand(key, rest){
  if(!rest.length) {
    throw new InvalidSetArgument();
  }
  rest = rest.trim();
  if(rest.includes(' ') &&
    ((rest.startsWith('"') && !rest.endsWith('"')) ||
      (rest.startsWith("'") && !rest.endsWith("'"))
    )) {
    throw new InvalidValue();
  }
  return {
    command: SET_COMMAND,
    key,
    value: rest
  };
}
