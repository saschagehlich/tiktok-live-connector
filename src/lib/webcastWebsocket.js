const Config = require('./webcastConfig.js');
const websocket = require('websocket');
const WebcastDeserializer = require('./webcastDeserializer.js');
const { deserializeWebsocketMessage, serializeMessage } = require('./webcastProtobuf.js');

class WebcastWebsocket extends websocket.client {
    #webcastDeserializer;
    constructor(wsUrl, cookieJar, clientParams, wsParams, customHeaders, websocketOptions) {
        super();
        this.pingInterval = null;
        this.connection = null;
        this.wsParams = { ...clientParams, ...wsParams };
        this.wsUrlWithParams = `${wsUrl}?${new URLSearchParams(this.wsParams)}`;
        this.wsHeaders = {
            Cookie: cookieJar.getCookieString(),
            ...(customHeaders || {}),
        };

        this.#webcastDeserializer = new WebcastDeserializer();
        this.#webcastDeserializer.on('*', (event, msg) => this.emit(event, msg));
        this.#webcastDeserializer.on('ack', (id) => this.#sendAck(id));

        this.#handleEvents();
        this.connect(this.wsUrlWithParams, '', Config.TIKTOK_URL_WEB, this.wsHeaders, websocketOptions);
    }

    feedRawData(msg) {
        this.#handleMessage({ binaryData: msg }, true);
    }

    #handleEvents() {
        this.on('connect', (wsConnection) => {
            this.connection = wsConnection;
            this.pingInterval = setInterval(() => this.#sendPing(), 10000);

            wsConnection.on('message', (message) => {
                if (message.type === 'binary') {
                    this.#handleMessage(message);
                }
            });

            wsConnection.on('close', () => {
                clearInterval(this.pingInterval);
            });
        });
    }

    async #handleMessage(message, isFedManally = false) {
        if (!isFedManally) this.emit('rawRawData', message.binaryData);
        this.#webcastDeserializer.process(message.binaryData);
    }

    #sendPing() {
        // Send static connection alive ping
        this.connection.sendBytes(Buffer.from('3A026862', 'hex'));
    }

    #sendAck(id) {
        let ackMsg = serializeMessage('WebcastWebsocketAck', { type: 'ack', id });
        this.connection.sendBytes(ackMsg);
    }
}

module.exports = WebcastWebsocket;
