"use strict";

function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
const Config = require('./webcastConfig.js');
const websocket = require('websocket');
const {
  deserializeWebsocketMessage,
  serializeMessage
} = require('./webcastProtobuf.js');
var _WebcastWebsocket_brand = /*#__PURE__*/new WeakSet();
class WebcastWebsocket extends websocket.client {
  constructor(wsUrl, cookieJar, clientParams, wsParams, customHeaders, websocketOptions) {
    super();
    _classPrivateMethodInitSpec(this, _WebcastWebsocket_brand);
    this.pingInterval = null;
    this.connection = null;
    this.wsParams = {
      ...clientParams,
      ...wsParams
    };
    this.wsUrlWithParams = `${wsUrl}?${new URLSearchParams(this.wsParams)}`;
    this.wsHeaders = {
      Cookie: cookieJar.getCookieString(),
      ...(customHeaders || {})
    };
    _assertClassBrand(_WebcastWebsocket_brand, this, _handleEvents).call(this);
    this.connect(this.wsUrlWithParams, '', Config.TIKTOK_URL_WEB, this.wsHeaders, websocketOptions);
  }
}
function _handleEvents() {
  this.on('connect', wsConnection => {
    this.connection = wsConnection;
    this.pingInterval = setInterval(() => _assertClassBrand(_WebcastWebsocket_brand, this, _sendPing).call(this), 10000);
    wsConnection.on('message', message => {
      if (message.type === 'binary') {
        _assertClassBrand(_WebcastWebsocket_brand, this, _handleMessage).call(this, message);
      }
    });
    wsConnection.on('close', () => {
      clearInterval(this.pingInterval);
    });
  });
}
async function _handleMessage(message) {
  try {
    let decodedContainer = await deserializeWebsocketMessage(message.binaryData);
    if (decodedContainer.id > 0) {
      _assertClassBrand(_WebcastWebsocket_brand, this, _sendAck).call(this, decodedContainer.id);
    }

    // Emit 'WebcastResponse' from ws message container if decoding success
    if (typeof decodedContainer.webcastResponse === 'object') {
      this.emit('webcastResponse', decodedContainer.webcastResponse);
    }
  } catch (err) {
    this.emit('messageDecodingFailed', err);
  }
}
function _sendPing() {
  // Send static connection alive ping
  this.connection.sendBytes(Buffer.from('3A026862', 'hex'));
}
function _sendAck(id) {
  let ackMsg = serializeMessage('WebcastWebsocketAck', {
    type: 'ack',
    id
  });
  this.connection.sendBytes(ackMsg);
}
module.exports = WebcastWebsocket;