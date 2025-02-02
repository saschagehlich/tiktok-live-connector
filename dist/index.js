"use strict";

function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _classPrivateFieldInitSpec(e, t, a) { _checkPrivateRedeclaration(e, t), t.set(e, a); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _classPrivateFieldGet(s, a) { return s.get(_assertClassBrand(s, a)); }
function _classPrivateFieldSet(s, a, r) { return s.set(_assertClassBrand(s, a), r), r; }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
const {
  EventEmitter
} = require('node:events');
const TikTokHttpClient = require('./lib/tiktokHttpClient.js');
const WebcastWebsocket = require('./lib/webcastWebsocket.js');
const WebcastDeserializer = require('./lib/webcastDeserializer.js');
const {
  getRoomIdFromMainPageHtml,
  validateAndNormalizeUniqueId,
  addUniqueId,
  removeUniqueId
} = require('./lib/tiktokUtils.js');
const {
  simplifyObject
} = require('./lib/webcastDataConverter.js');
const {
  deserializeMessage,
  deserializeWebsocketMessage
} = require('./lib/webcastProtobuf.js');
const sleepAsync = ms => new Promise(resolve => setTimeout(resolve, ms));
const Config = require('./lib/webcastConfig.js');
const {
  AlreadyConnectingError,
  AlreadyConnectedError,
  UserOfflineError,
  NoWSUpgradeError,
  InvalidSessionIdError,
  InvalidResponseError,
  ExtractRoomIdError,
  InitialFetchError
} = require('./lib/tiktokErrors');
const ControlEvents = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RAWDATA: 'rawData',
  DECODEDDATA: 'decodedData',
  STREAMEND: 'streamEnd',
  WSCONNECTED: 'websocketConnected',
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_DURATION: 'heartbeatDuration',
  RAWRAWDATA: 'rawRawData'
};
const MessageEvents = {
  CHAT: 'chat',
  MEMBER: 'member',
  GIFT: 'gift',
  ROOMUSER: 'roomUser',
  SOCIAL: 'social',
  LIKE: 'like',
  QUESTIONNEW: 'questionNew',
  LINKMICBATTLE: 'linkMicBattle',
  LINKMICARMIES: 'linkMicArmies',
  LIVEINTRO: 'liveIntro',
  EMOTE: 'emote',
  ENVELOPE: 'envelope',
  SUBSCRIBE: 'subscribe'
};
const CustomEvents = {
  FOLLOW: 'follow',
  SHARE: 'share'
};

/**
 * Wrapper class for TikTok's internal Webcast Push Service
 */
var _options = /*#__PURE__*/new WeakMap();
var _uniqueStreamerId = /*#__PURE__*/new WeakMap();
var _roomId = /*#__PURE__*/new WeakMap();
var _roomInfo = /*#__PURE__*/new WeakMap();
var _clientParams = /*#__PURE__*/new WeakMap();
var _httpClient = /*#__PURE__*/new WeakMap();
var _availableGifts = /*#__PURE__*/new WeakMap();
var _heartbeatDuration = /*#__PURE__*/new WeakMap();
var _websocket = /*#__PURE__*/new WeakMap();
var _isConnecting = /*#__PURE__*/new WeakMap();
var _isConnected = /*#__PURE__*/new WeakMap();
var _isPollingEnabled = /*#__PURE__*/new WeakMap();
var _isWsUpgradeDone = /*#__PURE__*/new WeakMap();
var _webcastDeserializer = /*#__PURE__*/new WeakMap();
var _WebcastPushConnection_brand = /*#__PURE__*/new WeakSet();
class WebcastPushConnection extends EventEmitter {
  /**
   * Create a new WebcastPushConnection instance
   * @param {string} uniqueId TikTok username (from URL)
   * @param {object} [options] Connection options
   * @param {boolean} [options[].processInitialData=true] Process the initital data which includes messages of the last minutes
   * @param {boolean} [options[].fetchRoomInfoOnConnect=true] Fetch the room info (room status, streamer info, etc.) on connect (will be returned when calling connect())
   * @param {boolean} [options[].enableExtendedGiftInfo=false] Enable this option to get extended information on 'gift' events like gift name and cost
   * @param {boolean} [options[].enableWebsocketUpgrade=true] Use WebSocket instead of request polling if TikTok offers it
   * @param {boolean} [options[].enableRequestPolling=true] Use request polling if no WebSocket upgrade is offered. If `false` an exception will be thrown if TikTok does not offer a WebSocket upgrade.
   * @param {number} [options[].requestPollingIntervalMs=1000] Request polling interval if WebSocket is not used
   * @param {string} [options[].sessionId=null] The session ID from the "sessionid" cookie is required if you want to send automated messages in the chat.
   * @param {object} [options[].clientParams={}] Custom client params for Webcast API
   * @param {object} [options[].requestHeaders={}] Custom request headers for axios
   * @param {object} [options[].websocketHeaders={}] Custom request headers for websocket.client
   * @param {object} [options[].requestOptions={}] Custom request options for axios. Here you can specify an `httpsAgent` to use a proxy and a `timeout` value for example.
   * @param {object} [options[].websocketOptions={}] Custom request options for websocket.client. Here you can specify an `agent` to use a proxy and a `timeout` value for example.
   * @param {object} [options[].signProviderOptions={}] Custom request options for the TikTok signing server. Here you can specify a `host`, `params`, and `headers`.
   * @param {boolean} [options[].debugWebcastMessages=true] Use this option to log all received webcast messages to the console.
   */

  constructor(uniqueId, options) {
    super();
    _classPrivateMethodInitSpec(this, _WebcastPushConnection_brand);
    _classPrivateFieldInitSpec(this, _options, void 0);
    _classPrivateFieldInitSpec(this, _uniqueStreamerId, void 0);
    _classPrivateFieldInitSpec(this, _roomId, void 0);
    _classPrivateFieldInitSpec(this, _roomInfo, void 0);
    _classPrivateFieldInitSpec(this, _clientParams, void 0);
    _classPrivateFieldInitSpec(this, _httpClient, void 0);
    _classPrivateFieldInitSpec(this, _availableGifts, void 0);
    _classPrivateFieldInitSpec(this, _heartbeatDuration, void 0);
    // Websocket
    _classPrivateFieldInitSpec(this, _websocket, void 0);
    // State
    _classPrivateFieldInitSpec(this, _isConnecting, void 0);
    _classPrivateFieldInitSpec(this, _isConnected, void 0);
    _classPrivateFieldInitSpec(this, _isPollingEnabled, void 0);
    _classPrivateFieldInitSpec(this, _isWsUpgradeDone, void 0);
    _classPrivateFieldInitSpec(this, _webcastDeserializer, void 0);
    _assertClassBrand(_WebcastPushConnection_brand, this, _setOptions).call(this, options || {});
    _classPrivateFieldSet(_heartbeatDuration, this, 0);
    _classPrivateFieldSet(_uniqueStreamerId, this, validateAndNormalizeUniqueId(uniqueId));
    _classPrivateFieldSet(_httpClient, this, new TikTokHttpClient(_classPrivateFieldGet(_options, this).requestHeaders, _classPrivateFieldGet(_options, this).requestOptions, _classPrivateFieldGet(_options, this).signProviderOptions, _classPrivateFieldGet(_options, this).sessionId));
    _classPrivateFieldSet(_clientParams, this, {
      ...Config.DEFAULT_CLIENT_PARAMS,
      ..._classPrivateFieldGet(_options, this).clientParams
    });
    _classPrivateFieldSet(_webcastDeserializer, this, new WebcastDeserializer());
    _classPrivateFieldGet(_webcastDeserializer, this).on('webcastResponse', msg => _assertClassBrand(_WebcastPushConnection_brand, this, _processWebcastResponse).call(this, msg));
    _classPrivateFieldGet(_webcastDeserializer, this).on('heartbeat', () => this.emit(ControlEvents.HEARTBEAT));
    _classPrivateFieldGet(_webcastDeserializer, this).on('heartbeatDuration', duration => {
      if (duration != _classPrivateFieldGet(_heartbeatDuration, this)) {
        _classPrivateFieldSet(_heartbeatDuration, this, duration);
        this.emit(ControlEvents.HEARTBEAT_DURATION, duration);
      }
    });
    _classPrivateFieldGet(_webcastDeserializer, this).on('messageDecodingFailed', err => _assertClassBrand(_WebcastPushConnection_brand, this, _handleError).call(this, err, 'Websocket message decoding failed'));
    _assertClassBrand(_WebcastPushConnection_brand, this, _setUnconnected).call(this);
  }
  /**
   * Connects to the current live stream room
   * @param {string} [roomId] If you want to connect to a specific roomId. Otherwise the current roomId will be retrieved.
   * @returns {Promise} Promise that will be resolved when the connection is established.
   */
  async connect(roomId = null) {
    if (_classPrivateFieldGet(_isConnecting, this)) {
      throw new AlreadyConnectingError('Already connecting!');
    }
    if (_classPrivateFieldGet(_isConnected, this)) {
      throw new AlreadyConnectedError('Already connected!');
    }
    _classPrivateFieldSet(_isConnecting, this, true);

    // add streamerId to uu
    addUniqueId(_classPrivateFieldGet(_uniqueStreamerId, this));
    try {
      // roomId already specified?
      if (roomId) {
        _classPrivateFieldSet(_roomId, this, roomId);
        _classPrivateFieldGet(_clientParams, this).room_id = roomId;
      } else {
        await _assertClassBrand(_WebcastPushConnection_brand, this, _retrieveRoomId).call(this);
      }

      // Fetch room info if option enabled
      if (_classPrivateFieldGet(_options, this).fetchRoomInfoOnConnect) {
        await _assertClassBrand(_WebcastPushConnection_brand, this, _fetchRoomInfo).call(this);

        // Prevent connections to finished rooms
        if (_classPrivateFieldGet(_roomInfo, this).status === 4) {
          throw new UserOfflineError('LIVE has ended');
        }
      }

      // Fetch all available gift info if option enabled
      if (_classPrivateFieldGet(_options, this).enableExtendedGiftInfo) {
        await _assertClassBrand(_WebcastPushConnection_brand, this, _fetchAvailableGifts).call(this);
      }
      try {
        await _assertClassBrand(_WebcastPushConnection_brand, this, _fetchRoomData).call(this, true);
      } catch (ex) {
        var _jsonError;
        let jsonError;
        let retryAfter;
        try {
          var _ex$response$headers;
          jsonError = JSON.parse(ex.response.data.toString());
          retryAfter = (_ex$response$headers = ex.response.headers) !== null && _ex$response$headers !== void 0 && _ex$response$headers['retry-after'] ? parseInt(ex.response.headers['retry-after']) : null;
        } catch (parseErr) {
          throw ex;
        }
        if (!jsonError) throw ex;
        const errorMessage = ((_jsonError = jsonError) === null || _jsonError === void 0 ? void 0 : _jsonError.error) || 'Failed to retrieve the initial room data.';
        throw new InitialFetchError(errorMessage, retryAfter);
      }

      // Sometimes no upgrade to WebSocket is offered by TikTok
      // In that case we use request polling (if enabled and possible)
      if (!_classPrivateFieldGet(_isWsUpgradeDone, this)) {
        if (!_classPrivateFieldGet(_options, this).enableRequestPolling) {
          throw new NoWSUpgradeError('TikTok does not offer a websocket upgrade and request polling is disabled (`enableRequestPolling` option).');
        }
        if (!_classPrivateFieldGet(_options, this).sessionId) {
          // We cannot use request polling if the user has no sessionid defined.
          // The reason for this is that TikTok needs a valid signature if the user is not logged in.
          // Signing a request every second would generate too much traffic to the signing server.
          // If a sessionid is present a signature is not required.
          throw new NoWSUpgradeError('TikTok does not offer a websocket upgrade. Please provide a valid `sessionId` to use request polling instead.');
        }
        _assertClassBrand(_WebcastPushConnection_brand, this, _startFetchRoomPolling).call(this);
      }
      _classPrivateFieldSet(_isConnected, this, true);
      let state = this.getState();
      await sleepAsync(3000);
      this.emit(ControlEvents.CONNECTED, state);
      return state;
    } catch (err) {
      _assertClassBrand(_WebcastPushConnection_brand, this, _handleError).call(this, err, 'Error while connecting');

      // remove streamerId from uu on connect fail
      removeUniqueId(_classPrivateFieldGet(_uniqueStreamerId, this));
      throw err;
    } finally {
      _classPrivateFieldSet(_isConnecting, this, false);
    }
  }

  /**
   * Disconnects the connection to the live stream
   */
  disconnect() {
    if (_classPrivateFieldGet(_isConnected, this)) {
      if (_classPrivateFieldGet(_isWsUpgradeDone, this) && _classPrivateFieldGet(_websocket, this).connection.connected) {
        _classPrivateFieldGet(_websocket, this).connection.close();
      }

      // Reset state
      _assertClassBrand(_WebcastPushConnection_brand, this, _setUnconnected).call(this);

      // remove streamerId from uu
      removeUniqueId(_classPrivateFieldGet(_uniqueStreamerId, this));
      this.emit(ControlEvents.DISCONNECTED);
    }
  }

  /**
   * Get the current connection state including the cached room info and all available gifts (if `enableExtendedGiftInfo` option enabled)
   * @returns {object} current state object
   */
  getState() {
    return {
      isConnected: _classPrivateFieldGet(_isConnected, this),
      upgradedToWebsocket: _classPrivateFieldGet(_isWsUpgradeDone, this),
      roomId: _classPrivateFieldGet(_roomId, this),
      roomInfo: _classPrivateFieldGet(_roomInfo, this),
      availableGifts: _classPrivateFieldGet(_availableGifts, this)
    };
  }

  /**
   * Get the current room info (including streamer info, room status and statistics)
   * @returns {Promise} Promise that will be resolved when the room info has been retrieved from the API
   */
  async getRoomInfo() {
    // Retrieve current room_id if not connected
    if (!_classPrivateFieldGet(_isConnected, this)) {
      await _assertClassBrand(_WebcastPushConnection_brand, this, _retrieveRoomId).call(this);
    }
    await _assertClassBrand(_WebcastPushConnection_brand, this, _fetchRoomInfo).call(this);
    return _classPrivateFieldGet(_roomInfo, this);
  }

  /**
   * Get a list of all available gifts including gift name, image url, diamont cost and a lot of other information
   * @returns {Promise} Promise that will be resolved when all available gifts has been retrieved from the API
   */
  async getAvailableGifts() {
    await _assertClassBrand(_WebcastPushConnection_brand, this, _fetchAvailableGifts).call(this);
    return _classPrivateFieldGet(_availableGifts, this);
  }

  /**
   * Sends a chat message into the current live room using the provided session cookie
   * @param {string} text Message Content
   * @param {string} [sessionId] The "sessionid" cookie value from your TikTok Website if not provided via the constructor options
   * @returns {Promise} Promise that will be resolved when the chat message has been submitted to the API
   */
  async sendMessage(text, sessionId) {
    var _response$data;
    if (sessionId) {
      // Update sessionId
      _classPrivateFieldGet(_options, this).sessionId = sessionId;
    }
    if (!_classPrivateFieldGet(_options, this).sessionId) {
      throw new InvalidSessionIdError('Missing SessionId. Please provide your current SessionId to use this feature.');
    }
    try {
      // Retrieve current room_id if not connected
      if (!_classPrivateFieldGet(_isConnected, this)) {
        await _assertClassBrand(_WebcastPushConnection_brand, this, _retrieveRoomId).call(this);
      }

      // Add the session cookie to the CookieJar
      _classPrivateFieldGet(_httpClient, this).setSessionId(_classPrivateFieldGet(_options, this).sessionId);

      // Submit the chat request
      let requestParams = {
        ..._classPrivateFieldGet(_clientParams, this),
        content: text
      };
      let response = await _classPrivateFieldGet(_httpClient, this).postFormDataToWebcastApi('room/chat/', requestParams, null);

      // Success?
      if ((response === null || response === void 0 ? void 0 : response.status_code) === 0) {
        return response.data;
      }

      // Handle errors
      switch (response === null || response === void 0 ? void 0 : response.status_code) {
        case 20003:
          throw new InvalidSessionIdError('Your SessionId has expired. Please provide a new one.');
        default:
          throw new InvalidResponseError(`TikTok responded with status code ${response === null || response === void 0 ? void 0 : response.status_code}: ${response === null || response === void 0 || (_response$data = response.data) === null || _response$data === void 0 ? void 0 : _response$data.message}`, response);
      }
    } catch (err) {
      throw new InvalidResponseError(`Failed to send chat message. ${err.message}`, err);
    }
  }

  /**
   * Decodes and processes a binary webcast data package that you have received via the `rawData` event (for debugging purposes only)
   * @param {string} messageType
   * @param {Buffer} messageBuffer
   */
  async decodeProtobufMessage(messageType, messageBuffer) {
    switch (messageType) {
      case 'WebcastResponse':
        {
          let decodedWebcastResponse = deserializeMessage(messageType, messageBuffer);
          _assertClassBrand(_WebcastPushConnection_brand, this, _processWebcastResponse).call(this, decodedWebcastResponse);
          break;
        }
      case 'WebcastWebsocketMessage':
        {
          let decodedWebcastWebsocketMessage = await deserializeWebsocketMessage(messageBuffer);
          if (typeof decodedWebcastWebsocketMessage.webcastResponse === 'object') {
            _assertClassBrand(_WebcastPushConnection_brand, this, _processWebcastResponse).call(this, decodedWebcastWebsocketMessage.webcastResponse);
          }
          break;
        }
      default:
        {
          let webcastMessage = deserializeMessage(messageType, messageBuffer);
          _assertClassBrand(_WebcastPushConnection_brand, this, _processWebcastResponse).call(this, {
            messages: [{
              decodedData: webcastMessage,
              type: messageType
            }]
          });
        }
    }
  }
  processRawData(msg) {
    _classPrivateFieldGet(_webcastDeserializer, this).process(msg);
  }
  get roomId() {
    return _classPrivateFieldGet(_roomId, this);
  }
}
function _setOptions(providedOptions) {
  _classPrivateFieldSet(_options, this, Object.assign({
    // Default
    processInitialData: true,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: false,
    enableWebsocketUpgrade: true,
    enableRequestPolling: true,
    requestPollingIntervalMs: 1000,
    sessionId: null,
    clientParams: {},
    requestHeaders: {},
    websocketHeaders: Config.DEFAULT_REQUEST_HEADERS,
    requestOptions: {},
    websocketOptions: {},
    signProviderOptions: {}
  }, providedOptions));
}
function _setUnconnected() {
  _classPrivateFieldSet(_roomInfo, this, null);
  _classPrivateFieldSet(_isConnecting, this, false);
  _classPrivateFieldSet(_isConnected, this, false);
  _classPrivateFieldSet(_isPollingEnabled, this, false);
  _classPrivateFieldSet(_isWsUpgradeDone, this, false);
  _classPrivateFieldGet(_clientParams, this).cursor = '';
  _classPrivateFieldGet(_clientParams, this).internal_ext = '';
}
async function _retrieveRoomId() {
  try {
    let mainPageHtml = await _classPrivateFieldGet(_httpClient, this).getMainPage(`@${_classPrivateFieldGet(_uniqueStreamerId, this)}/live`);
    try {
      let roomId = getRoomIdFromMainPageHtml(mainPageHtml);
      _classPrivateFieldSet(_roomId, this, roomId);
      _classPrivateFieldGet(_clientParams, this).room_id = roomId;
    } catch (err) {
      // Use fallback method
      let roomData = await _classPrivateFieldGet(_httpClient, this).getJsonObjectFromTiktokApi('api-live/user/room/', {
        ..._classPrivateFieldGet(_clientParams, this),
        uniqueId: _classPrivateFieldGet(_uniqueStreamerId, this),
        sourceType: 54
      });
      if (roomData.statusCode) throw new InvalidResponseError(`API Error ${roomData.statusCode} (${roomData.message || 'Unknown Error'})`, undefined);
      _classPrivateFieldSet(_roomId, this, roomData.data.user.roomId);
      _classPrivateFieldGet(_clientParams, this).room_id = roomData.data.user.roomId;
    }
  } catch (err) {
    throw new ExtractRoomIdError(`Failed to retrieve room_id from page source. ${err.message}`);
  }
}
async function _fetchRoomInfo() {
  try {
    let response = await _classPrivateFieldGet(_httpClient, this).getJsonObjectFromWebcastApi('room/info/', _classPrivateFieldGet(_clientParams, this));
    _classPrivateFieldSet(_roomInfo, this, response.data);
  } catch (err) {
    throw new InvalidResponseError(`Failed to fetch room info. ${err.message}`, err);
  }
}
async function _fetchAvailableGifts() {
  try {
    let response = await _classPrivateFieldGet(_httpClient, this).getJsonObjectFromWebcastApi('gift/list/', _classPrivateFieldGet(_clientParams, this));
    _classPrivateFieldSet(_availableGifts, this, response.data.gifts);
  } catch (err) {
    throw new InvalidResponseError(`Failed to fetch available gifts. ${err.message}`, err);
  }
}
async function _startFetchRoomPolling() {
  _classPrivateFieldSet(_isPollingEnabled, this, true);
  let sleepMs = ms => new Promise(resolve => setTimeout(resolve, ms));
  while (_classPrivateFieldGet(_isPollingEnabled, this)) {
    try {
      await _assertClassBrand(_WebcastPushConnection_brand, this, _fetchRoomData).call(this, false);
    } catch (err) {
      _assertClassBrand(_WebcastPushConnection_brand, this, _handleError).call(this, err, 'Error while fetching webcast data via request polling');
    }
    await sleepMs(_classPrivateFieldGet(_options, this).requestPollingIntervalMs);
  }
}
async function _fetchRoomData(isInitial) {
  let webcastResponse = await _classPrivateFieldGet(_httpClient, this).getDeserializedObjectFromWebcastApi('im/fetch/', _classPrivateFieldGet(_clientParams, this), 'WebcastResponse', isInitial);
  let upgradeToWsOffered = !!webcastResponse.wsUrl;
  if (!webcastResponse.cursor) {
    if (isInitial) {
      throw new InvalidResponseError('Missing cursor in initial fetch response.');
    } else {
      _assertClassBrand(_WebcastPushConnection_brand, this, _handleError).call(this, null, 'Missing cursor in fetch response.');
    }
  }

  // Set cursor and internal_ext param to continue with the next request
  if (webcastResponse.cursor) _classPrivateFieldGet(_clientParams, this).cursor = webcastResponse.cursor;
  if (webcastResponse.internalExt) _classPrivateFieldGet(_clientParams, this).internal_ext = webcastResponse.internalExt;
  if (isInitial) {
    // Upgrade to Websocket offered? => Try upgrade
    if (_classPrivateFieldGet(_options, this).enableWebsocketUpgrade && upgradeToWsOffered) {
      await _assertClassBrand(_WebcastPushConnection_brand, this, _tryUpgradeToWebsocket).call(this, webcastResponse);
    }
  }

  // Skip processing initial data if option disabled
  if (isInitial && !_classPrivateFieldGet(_options, this).processInitialData) {
    return;
  }
  _assertClassBrand(_WebcastPushConnection_brand, this, _processWebcastResponse).call(this, webcastResponse);
}
async function _tryUpgradeToWebsocket(webcastResponse) {
  try {
    // Websocket specific params
    let wsParams = {
      compress: 'gzip'
    };
    for (let wsParam of webcastResponse.wsParams) {
      wsParams[wsParam.name] = wsParam.value;
    }

    // This is a temporary fix for the US ban
    const url = new URL(webcastResponse.wsUrl);
    url.hostname = 'webcast16-ws-useast2a.tiktok.com';
    const noUSBanWSUrl = url.toString();

    // Wait until ws connected, then stop request polling
    await _assertClassBrand(_WebcastPushConnection_brand, this, _setupWebsocket).call(this, noUSBanWSUrl, wsParams);
    _classPrivateFieldSet(_isWsUpgradeDone, this, true);
    _classPrivateFieldSet(_isPollingEnabled, this, false);
    this.emit(ControlEvents.WSCONNECTED, _classPrivateFieldGet(_websocket, this));
  } catch (err) {
    _assertClassBrand(_WebcastPushConnection_brand, this, _handleError).call(this, err, 'Upgrade to websocket failed');
  }
}
async function _setupWebsocket(wsUrl, wsParams) {
  return new Promise((resolve, reject) => {
    _classPrivateFieldSet(_websocket, this, new WebcastWebsocket(wsUrl, _classPrivateFieldGet(_httpClient, this).cookieJar, _classPrivateFieldGet(_clientParams, this), wsParams, _classPrivateFieldGet(_options, this).websocketHeaders, _classPrivateFieldGet(_options, this).websocketOptions));
    _classPrivateFieldGet(_websocket, this).on('connect', wsConnection => {
      resolve();
      wsConnection.on('error', err => _assertClassBrand(_WebcastPushConnection_brand, this, _handleError).call(this, err, 'Websocket Error'));
      wsConnection.on('close', () => {
        this.disconnect();
      });
    });
    _classPrivateFieldGet(_websocket, this).on('rawRawData', msg => this.emit(ControlEvents.RAWRAWDATA, msg));
    _classPrivateFieldGet(_websocket, this).on('connectFailed', err => reject(`Websocket connection failed, ${err}`));
    _classPrivateFieldGet(_websocket, this).on('webcastResponse', msg => _assertClassBrand(_WebcastPushConnection_brand, this, _processWebcastResponse).call(this, msg));
    _classPrivateFieldGet(_websocket, this).on('heartbeat', () => this.emit(ControlEvents.HEARTBEAT));
    _classPrivateFieldGet(_websocket, this).on('heartbeatDuration', duration => {
      if (duration != _classPrivateFieldGet(_heartbeatDuration, this)) {
        _classPrivateFieldSet(_heartbeatDuration, this, duration);
        this.emit(ControlEvents.HEARTBEAT_DURATION, duration);
      }
    });
    _classPrivateFieldGet(_websocket, this).on('messageDecodingFailed', err => _assertClassBrand(_WebcastPushConnection_brand, this, _handleError).call(this, err, 'Websocket message decoding failed'));

    // Hard timeout if the WebSocketClient library does not handle connect errors correctly.
    setTimeout(() => reject('Websocket not responding'), 30000);
  });
}
function _processWebcastResponse(webcastResponse) {
  // Emit raw (protobuf encoded) data for a use case specific processing
  webcastResponse.messages.forEach(message => {
    if (_classPrivateFieldGet(_options, this).debugWebcastMessages) {
      console.log('[' + _classPrivateFieldGet(_uniqueStreamerId, this) + '] ' + message.type, message.binary);
    }
    this.emit(ControlEvents.RAWDATA, message.type, message.binary);
  });

  // Process and emit decoded data depending on the the message type
  webcastResponse.messages.filter(x => x.decodedData).forEach(message => {
    var _simplifiedObj$displa, _simplifiedObj$displa2;
    let simplifiedObj = simplifyObject(message.decodedData);
    this.emit(ControlEvents.DECODEDDATA, message.type, simplifiedObj, message.binary);
    switch (message.type) {
      case 'WebcastControlMessage':
        // Known control actions:
        // 3 = Stream terminated by user
        // 4 = Stream terminated by platform moderator (ban)
        const action = message.decodedData.action;
        if ([3, 4].includes(action)) {
          this.emit(ControlEvents.STREAMEND, {
            action
          });
          this.disconnect();
        }
        break;
      case 'WebcastRoomUserSeqMessage':
        this.emit(MessageEvents.ROOMUSER, simplifiedObj);
        break;
      case 'WebcastChatMessage':
        this.emit(MessageEvents.CHAT, simplifiedObj);
        break;
      case 'WebcastMemberMessage':
        this.emit(MessageEvents.MEMBER, simplifiedObj);
        break;
      case 'WebcastGiftMessage':
        // Add extended gift info if option enabled
        if (Array.isArray(_classPrivateFieldGet(_availableGifts, this)) && simplifiedObj.giftId) {
          simplifiedObj.extendedGiftInfo = _classPrivateFieldGet(_availableGifts, this).find(x => x.id === simplifiedObj.giftId);
        }
        this.emit(MessageEvents.GIFT, simplifiedObj);
        break;
      case 'WebcastSocialMessage':
        this.emit(MessageEvents.SOCIAL, simplifiedObj);
        if ((_simplifiedObj$displa = simplifiedObj.displayType) !== null && _simplifiedObj$displa !== void 0 && _simplifiedObj$displa.includes('follow')) {
          this.emit(CustomEvents.FOLLOW, simplifiedObj);
        }
        if ((_simplifiedObj$displa2 = simplifiedObj.displayType) !== null && _simplifiedObj$displa2 !== void 0 && _simplifiedObj$displa2.includes('share')) {
          this.emit(CustomEvents.SHARE, simplifiedObj);
        }
        break;
      case 'WebcastLikeMessage':
        this.emit(MessageEvents.LIKE, simplifiedObj);
        break;
      case 'WebcastQuestionNewMessage':
        this.emit(MessageEvents.QUESTIONNEW, simplifiedObj);
        break;
      case 'WebcastLinkMicBattle':
        this.emit(MessageEvents.LINKMICBATTLE, simplifiedObj);
        break;
      case 'WebcastLinkMicArmies':
        this.emit(MessageEvents.LINKMICARMIES, simplifiedObj);
        break;
      case 'WebcastLiveIntroMessage':
        this.emit(MessageEvents.LIVEINTRO, simplifiedObj);
        break;
      case 'WebcastEmoteChatMessage':
        this.emit(MessageEvents.EMOTE, simplifiedObj);
        break;
      case 'WebcastEnvelopeMessage':
        this.emit(MessageEvents.ENVELOPE, simplifiedObj);
        break;
      case 'WebcastSubNotifyMessage':
        this.emit(MessageEvents.SUBSCRIBE, simplifiedObj);
        break;
    }
  });
}
function _handleError(exception, info) {
  if (this.listenerCount(ControlEvents.ERROR) > 0) {
    this.emit(ControlEvents.ERROR, {
      info,
      exception
    });
  }
}
module.exports = {
  WebcastPushConnection,
  signatureProvider: require('./lib/tiktokSignatureProvider'),
  webcastProtobuf: require('./lib/webcastProtobuf.js')
};