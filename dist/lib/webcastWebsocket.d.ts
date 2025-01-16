export = WebcastWebsocket;
declare class WebcastWebsocket {
    constructor(wsUrl: any, cookieJar: any, clientParams: any, wsParams: any, customHeaders: any, websocketOptions: any);
    pingInterval: NodeJS.Timeout;
    connection: any;
    wsParams: any;
    wsUrlWithParams: string;
    wsHeaders: any;
    #private;
}
//# sourceMappingURL=webcastWebsocket.d.ts.map