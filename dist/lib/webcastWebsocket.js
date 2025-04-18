"use strict";

function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
const Config = require('./webcastConfig.js');
const websocket = require('websocket');
const WebcastDeserializer = require('./webcastDeserializer.js');
const {
  deserializeWebsocketMessage,
  serializeMessage
} = require('./webcastProtobuf.js');
var _webcastDeserializer = /*#__PURE__*/new WeakMap();
var _WebcastWebsocket_brand = /*#__PURE__*/new WeakSet();
class WebcastWebsocket extends websocket.client {
  constructor(wsUrl, cookieJar, clientParams, wsParams, customHeaders, websocketOptions) {
    super();
    _classPrivateMethodInitSpec(this, _WebcastWebsocket_brand);
    _classPrivateFieldInitSpec(this, _webcastDeserializer, void 0);
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
    _classPrivateFieldSet(_webcastDeserializer, this, new WebcastDeserializer());
    _classPrivateFieldGet(_webcastDeserializer, this).on('webcastResponse', msg => this.emit('webcastResponse', msg));
    _classPrivateFieldGet(_webcastDeserializer, this).on('heartbeat', () => this.emit('heartbeat'));
    _classPrivateFieldGet(_webcastDeserializer, this).on('heartbeatDuration', duration => this.emit('heartbeatDuration', duration));
    _classPrivateFieldGet(_webcastDeserializer, this).on('messageDecodingFailed', err => this.emit('messageDecodingFailed', err));
    _classPrivateFieldGet(_webcastDeserializer, this).on('ack', id => _assertClassBrand(_WebcastWebsocket_brand, this, _sendAck).call(this, id));
    _classPrivateFieldGet(_webcastDeserializer, this).on('error', err => this.emit('error', err));
    _assertClassBrand(_WebcastWebsocket_brand, this, _handleEvents).call(this);
    this.connect(this.wsUrlWithParams + '&version_code=180800', '', Config.TIKTOK_URL_WEB, this.wsHeaders, websocketOptions);
  }
  feedRawData(msg) {
    _assertClassBrand(_WebcastWebsocket_brand, this, _handleMessage).call(this, {
      binaryData: msg
    }, true);
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
async function _handleMessage(message, isFedManally = false) {
  if (!isFedManally) this.emit('rawRawData', message.binaryData);
  _classPrivateFieldGet(_webcastDeserializer, this).process(message.binaryData);
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