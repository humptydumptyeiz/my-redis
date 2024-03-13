'use strict';

class InvalidHeader extends Error {
  constructor(message) {
    const msg = `Invalid Header - ${message.toString('hex')}`;
    super(msg);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor)
  }
}

class IncompletePacket extends Error {
  constructor() {
    super('Incomplete packet');
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor)
  }
}


class InvalidCommand extends Error {
  constructor(command) {
    super(`Invalid Command ${command}. It must be either GET or SET`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor)
  }
}


class InvalidGetArgument extends Error {
  constructor() {
    super(`Invalid number of arguments for GET. Required 1.`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor)
  }
}


class InvalidSetArgument extends Error {
  constructor() {
    super(`Invalid number of arguments for SET. Required 2.`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor)
  }
}


class InvalidKeyName extends Error {
  constructor() {
    super(`Key cannot contain " or '`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}


class InvalidValue extends Error {
  constructor() {
    super(`Malformed value.`);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  InvalidHeader,
  IncompletePacket,
  InvalidCommand,
  InvalidGetArgument,
  InvalidSetArgument,
  InvalidKeyName,
  InvalidValue
};
