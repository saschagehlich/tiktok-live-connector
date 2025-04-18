"use strict";

const {
  EventEmitter
} = require('node:events');
const {
  deserializeWebsocketMessage,
  serializeMessage
} = require('./webcastProtobuf.js');
class WebcastDeserializer extends EventEmitter {
  constructor() {
    super();
  }
  async process(msg) {
    let decodedContainer;
    try {
      decodedContainer = await deserializeWebsocketMessage(msg);
    } catch (err) {
      this.emit('messageDecodingFailed', err);
      return;
    }
    try {
      if (decodedContainer.id > 0) {
        this.emit('ack', decodedContainer.id);
      }
      if (decodedContainer.type === 'hb') {
        this.emit('heartbeat');
      }

      // Emit 'WebcastResponse' from ws message container if decoding success
      if (typeof decodedContainer.webcastResponse === 'object') {
        if (decodedContainer.webcastResponse.heartbeatDuration) {
          this.emit('heartbeatDuration', decodedContainer.webcastResponse.heartbeatDuration);
        }
        this.emit('webcastResponse', decodedContainer.webcastResponse);
      }
    } catch (err) {
      this.emit('error', err);
    }
  }
}
module.exports = WebcastDeserializer;