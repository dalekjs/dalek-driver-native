/*!
 *
 * Copyright (c) 2013 Sebastian Golasch
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

'use strict';

// ext. libs
var fs = require('fs');
var Q = require('q');

// int. libs
var WD = require('dalek-internal-webdriver');

/**
 * @module
 */

/**
 * @constructor
 */

var DalekNative = function (opts) {
  var browsers = opts.config.get('browsers')[0];
  var browserConf = null;
  var browser;


  // TODO: REFACTOR & FINISH
  try {
    browser = require('dalek-browser-' + opts.browser);

    if (browsers[opts.browser]) {
      browserConf = browsers[opts.browser];
    }

  } catch (e) {
    if (browsers[opts.browser] && browsers[opts.browser].actAs) {
      browser = require('dalek-browser-' + browsers[opts.browser].actAs);
      browserConf = browsers[opts.browser];
    }
  }

  // prepare properties
  this.actionQueue = [];
  this.lastCalledUrl = null;
  this.driverStatus = {};
  this.sessionStatus = {};

  // store injcted options in object properties
  this.events = opts.events;
  this.browserName = opts.browser;

  // create a new webdriver client instance
  this.webdriverClient = new WD(browser);

  // issue the kill command to the browser, when all tests are completed
  this.events.on('tests:complete:native:' + this.browserName, browser.kill.bind(browser));
  // clear the webdriver session, when all tests are completed
  this.events.on('tests:complete:native:' + this.browserName, this.webdriverClient.closeSession.bind(this.webdriverClient));

  // launch the browser & when the browser launch
  // promise is fullfilled, issue the driver:ready event
  // for the particular browser
  browser
    .launch(browserConf)
    .then(this.events.emit.bind(this.events, 'driver:ready:native:' + this.browserName));
};

/**
 * Checks if a webdriver session has already been established,
 * if not, create a new one
 *
 * @method start
 * @return {Q.promise}
 */

DalekNative.prototype.start = function () {
  var deferred = Q.defer();

  // check if a session is already active,
  // if so, reuse that one
  if(this.webdriverClient.hasSession()) {
    deferred.resolve();
    return deferred.promise;
  }

  // create a new webdriver session
  // get the driver status
  // get the session status
  // resolve the promise (e.g. let them tests run)
  this.webdriverClient
    .createSession()
    .then(this.webdriverClient.status.bind(this.webdriverClient))
    .then(this._driverStatus.bind(this))
    .then(this.webdriverClient.sessionInfo.bind(this.webdriverClient))
    .then(this._sessionStatus.bind(this))
    .then(deferred.resolve);

  return deferred.promise;
};

/**
 *
 */

DalekNative.prototype.run = function () {};

/**
 *
 */

DalekNative.prototype.end = function () {
  var result = Q.resolve();

  // loop through all promises created by the remote methods
  // this is synchronous, so it waits if a method is finished before
  // the next one will be executed
  this.actionQueue.forEach(function (f) {
    result = result.then(f);
  });

  // flush the queue & fire an event
  // when the queue finished its executions
  result.then(function () {
    // clear the action queue
    this.actionQueue = [];
    // emit the run.complete event
    this.events.emit('driver:message', {key: 'run.complete', value: null});
  }.bind(this));
};

/**
 *
 */

DalekNative.prototype._sessionStatus = function (sessionInfo) {
  var defer = Q.defer();
  this.sessionStatus = JSON.parse(sessionInfo).value;
  this.events.emit('driver:sessionStatus:native:' + this.browserName, this.sessionStatus);
  defer.resolve();
  return defer.promise;
};

/**
 *
 */

DalekNative.prototype._driverStatus = function (statusInfo) {
  var defer = Q.defer();
  this.driverStatus = JSON.parse(statusInfo).value;
  this.events.emit('driver:status:native:' + this.browserName, this.driverStatus);
  defer.resolve();
  return defer.promise;
};

/**
 *
 */

DalekNative.prototype._createNonReturnee = function (fnName) {
  return function (hash, uuid) {
    this.actionQueue.push(this.webdriverClient[fnName].bind(this.webdriverClient));
    this.actionQueue.push(function () {
      var deferred = Q.defer();
      this.events.emit('driver:message', {key: fnName, value: null, uuid: uuid, hash: hash});
      deferred.resolve();
      return deferred.promise;
    }.bind(this));
  }.bind(this);
};

module.exports.isMultiBrowser = function () {
  return true;
};

module.exports.verifyBrowser = function () {
  return true;
};

module.exports.create = function (opts) {
  // load the remote command helper methods
  var dir = __dirname + '/lib/commands/';
  fs.readdirSync(dir).forEach(function (file) {
    require(dir + file)(DalekNative);
  });

  return new DalekNative(opts);
};
