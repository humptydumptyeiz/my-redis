'use strict';

const {InvalidHeader, IncompletePacket} = require('./errors');

const HEADER = Buffer.from([255,254]);
const COMMAND_INDEX = 3;
const KEY_LENGTH_INDEX = 4;
const KEY_START_INDEX = 5;
const SERVER_PAYLOAD_START_INDEX = 3;
const COMMANDS = {
  1: 'GET',
  2: 'SET',
  GET: 1,
  SET: 2
};

/**
 * Valid string structure of GET/SET command  -
 * ff fe <length of packet including length bit> 01 <length of key> <key in hex>
 *   eg - GET key1 - ff fe 09 01 04 6b 65 79 31
 *
 * Valid string structure for server payload -
 * ff fe <length of packet including length bit> <payload in hex>
 */

function isValid(buffer) {
  return HEADER.compare(buffer) === 0;
}

function deserialiseClient(buffer) {
  const pktHeader = buffer.subarray(0,2)
  if(!isValid(pktHeader)){
    throw new InvalidHeader(pktHeader);
  } else {
    const commLength = Number(buffer[2]);
    if(buffer.length < commLength) {
      throw new IncompletePacket();
    }
    
    const [commPkt, rest] = [buffer.subarray(0, commLength), buffer.subarray(commLength)];
    const desCommand = {
      command: COMMANDS[commPkt[COMMAND_INDEX]]
    };
    
    const keyEndIndex = KEY_START_INDEX + Number(commPkt[KEY_LENGTH_INDEX]);
    desCommand.key = commPkt.subarray(KEY_START_INDEX, keyEndIndex).toString('utf8');
    
    if(desCommand.command === 'SET') {
      desCommand.value = commPkt.subarray(keyEndIndex).toString('utf8');
    }
    return [
      desCommand,
      rest
    ];
  }
}

function deserialiseServer(buffer) {
  const pktHeader = buffer.subarray(0,2)
  if(!isValid(pktHeader)){
    throw new InvalidHeader(pktHeader);
  } else {
    const commLength = Number(buffer[2]);
    if (buffer.length < commLength) {
      throw new IncompletePacket();
    }
    
    const [serverPkt, rest] = [buffer.subarray(0, commLength), buffer.subarray(commLength)];
    const serverPayload = serverPkt.subarray(SERVER_PAYLOAD_START_INDEX, commLength).toString('utf8');
    return [
      serverPayload,
      rest
    ];
  }
}

function extractCommands(buffer, target = 'client') {
  const commands = [];
  let remBuffer = buffer;
  do {
    try {
      const [desComm, rest] = target === 'client' ?
        deserialiseClient(remBuffer) :
        deserialiseServer(remBuffer);
      commands.push(desComm);
      remBuffer = rest;
    } catch(err) {
      if(err.name === InvalidHeader.name) {
        remBuffer = '';
        break;
      } else if(err.name === IncompletePacket.name) {
        break;
      }
    }
  } while(remBuffer.length);
  
  return [
    commands,
    remBuffer.length ? remBuffer : ''
  ];
}

function serialiseClient(commandData) {
  const {command, key, value} = commandData;
  const commBuff = Buffer.from([COMMANDS[command]]);
  const keyBuff = Buffer.from(key);
  const keyLenBuff = Buffer.from([keyBuff.length]);
  
  const keyBuffComm = Buffer.concat([
    commBuff,
    keyLenBuff,
    keyBuff
  ]);
  
  if(value !== undefined) {
    const valueBuff = Buffer.from(value);
    return Buffer.concat([
      HEADER,
      Buffer.from([3 + keyBuffComm.length + valueBuff.length]),
      keyBuffComm,
      valueBuff
    ]);
  } else {
    return Buffer.concat([
      HEADER,
      Buffer.from([3 + keyBuffComm.length]),
      keyBuffComm
    ]);
  }
}

function serialiseServer(payload) {
  const payloadBuffer = Buffer.from(payload);
  return Buffer.concat([
    HEADER,
    Buffer.from([3 + payloadBuffer.length]),
    payloadBuffer
  ]);
}


module.exports = {
  extractCommands,
  serialiseClient,
  serialiseServer
};
