"use strict";

function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
const axios = require('axios');
const TikTokCookieJar = require('./tiktokCookieJar');
const {
  deserializeMessage
} = require('./webcastProtobuf.js');
const {
  signWebcastRequest
} = require('./tiktokSignatureProvider');
const Config = require('./webcastConfig.js');
var _TikTokHttpClient_brand = /*#__PURE__*/new WeakSet();
class TikTokHttpClient {
  constructor(customHeaders, axiosOptions, signProviderOptions, sessionId) {
    _classPrivateMethodInitSpec(this, _TikTokHttpClient_brand);
    const {
      Cookie
    } = customHeaders || {};
    if (Cookie) {
      delete customHeaders['Cookie'];
    }
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: {
        ...Config.DEFAULT_REQUEST_HEADERS,
        ...customHeaders
      },
      ...(axiosOptions || {})
    });
    this.cookieJar = new TikTokCookieJar(this.axiosInstance);
    if (Cookie) {
      Cookie.split('; ').forEach(v => this.cookieJar.processSetCookieHeader(v));
    }
    this.signProviderOptions = signProviderOptions;
    if (sessionId) {
      this.setSessionId(sessionId);
    }
    this.cookieJar.setCookie('tt-target-idc', 'useast2a');
  }
  setSessionId(sessionId) {
    this.cookieJar.setCookie('sessionid', sessionId);
    this.cookieJar.setCookie('sessionid_ss', sessionId);
    this.cookieJar.setCookie('sid_tt', sessionId);
  }
  async getMainPage(path) {
    let response = await _assertClassBrand(_TikTokHttpClient_brand, this, _get).call(this, `${Config.TIKTOK_URL_WEB}${path}`);
    return response.data;
  }
  async getDeserializedObjectFromWebcastApi(path, params, schemaName, shouldSign) {
    let url = await _assertClassBrand(_TikTokHttpClient_brand, this, _buildUrl).call(this, Config.TIKTOK_URL_WEBCAST, path, params, shouldSign);
    let response = await _assertClassBrand(_TikTokHttpClient_brand, this, _get).call(this, url, 'arraybuffer');
    return deserializeMessage(schemaName, response.data);
  }
  async getJsonObjectFromWebcastApi(path, params, shouldSign) {
    let url = await _assertClassBrand(_TikTokHttpClient_brand, this, _buildUrl).call(this, Config.TIKTOK_URL_WEBCAST, path, params, shouldSign);
    let response = await _assertClassBrand(_TikTokHttpClient_brand, this, _get).call(this, url, 'json');
    return response.data;
  }
  async postFormDataToWebcastApi(path, params, formData) {
    let response = await _assertClassBrand(_TikTokHttpClient_brand, this, _post).call(this, `${Config.TIKTOK_URL_WEBCAST}${path}`, params, formData, 'json');
    return response.data;
  }
  async getJsonObjectFromTiktokApi(path, params, shouldSign) {
    let url = await _assertClassBrand(_TikTokHttpClient_brand, this, _buildUrl).call(this, Config.TIKTOK_URL_WEB, path, params, shouldSign);
    let response = await _assertClassBrand(_TikTokHttpClient_brand, this, _get).call(this, url, 'json');
    return response.data;
  }
}
function _get(url, responseType) {
  return this.axiosInstance.get(url, {
    responseType
  });
}
function _post(url, params, data, responseType) {
  return this.axiosInstance.post(url, data, {
    params,
    responseType
  });
}
async function _buildUrl(host, path, params, sign) {
  let fullUrl = `${host}${path}?${new URLSearchParams(params || {})}`;
  if (sign) {
    fullUrl = await signWebcastRequest(fullUrl, this.axiosInstance.defaults.headers, this.cookieJar, this.signProviderOptions);
  }
  return fullUrl;
}
module.exports = TikTokHttpClient;