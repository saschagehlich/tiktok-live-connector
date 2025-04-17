"use strict";

const {
  EventEmitter
} = require('node:events');
const {
  getUuc
} = require('./tiktokUtils');
const pkg = require('../../package.json');
const {
  SignatureError
} = require('./tiktokErrors');
const axios = require('axios').create({
  timeout: 5000,
  headers: {
    'User-Agent': `${pkg.name}/${pkg.version} ${process.platform}`
  }
});
let config = {
  enabled: true,
  signProviderHost: 'https://tiktok.eulerstream.com/',
  extraParams: {}
};
let signEvents = new EventEmitter();
async function fetchWebcastResponse(params, signProviderOptions) {
  let fullParams = {
    ...params,
    client: 'ttlive-node',
    ...config.extraParams,
    ...(signProviderOptions === null || signProviderOptions === void 0 ? void 0 : signProviderOptions.params)
  };
  fullParams.uuc = getUuc();
  let response = await axios.get(config.signProviderHost + 'webcast/fetch', {
    params: fullParams,
    headers: signProviderOptions === null || signProviderOptions === void 0 ? void 0 : signProviderOptions.headers,
    responseType: 'arraybuffer'
  });
  return response;
}
function signWebcastRequest(url, headers, cookieJar, signProviderOptions) {
  return signRequest('webcast/sign_url', url, headers, cookieJar, signProviderOptions);
}
async function signRequest(providerPath, url, headers, cookieJar, signProviderOptions) {
  if (!config.enabled) {
    return url;
  }
  let params = {
    url,
    client: 'ttlive-node',
    ...config.extraParams,
    ...(signProviderOptions === null || signProviderOptions === void 0 ? void 0 : signProviderOptions.params)
  };
  params.uuc = getUuc();
  let signHost;
  let signError;
  let signResponse;
  try {
    var _signResponse$data;
    try {
      signResponse = await axios.get(config.signProviderHost + providerPath, {
        params,
        headers: signProviderOptions === null || signProviderOptions === void 0 ? void 0 : signProviderOptions.headers,
        responseType: 'json'
      });
    } catch (err) {
      signError = err;
    }
    if (!signResponse) {
      throw new SignatureError(`Failed to sign request: ${signError.message}; URL: ${url}`, signError);
    }
    if (signResponse.status !== 200) {
      throw new SignatureError(`Status Code: ${signResponse.status}`);
    }
    if (!((_signResponse$data = signResponse.data) !== null && _signResponse$data !== void 0 && _signResponse$data.signedUrl)) {
      throw new SignatureError('missing signedUrl property');
    }
    if (headers) {
      headers['User-Agent'] = signResponse.data['User-Agent'];
    }
    if (cookieJar) {
      cookieJar.setCookie('msToken', signResponse.data['msToken']);
    }
    signEvents.emit('signSuccess', {
      signHost,
      originalUrl: url,
      signedUrl: signResponse.data.signedUrl,
      headers,
      cookieJar
    });
    return signResponse.data.signedUrl;
  } catch (error) {
    signEvents.emit('signError', {
      signHost,
      originalUrl: url,
      headers,
      cookieJar,
      error
    });

    // If a sessionid is present, the signature is optional => Do not throw an error.
    if (cookieJar.getCookieByName('sessionid')) {
      return url;
    }
    throw new SignatureError(`Failed to sign request: ${error.message}; URL: ${url}`);
  }
}
module.exports = {
  config,
  signEvents,
  signWebcastRequest,
  fetchWebcastResponse
};