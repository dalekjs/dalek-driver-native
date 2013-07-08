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
var Q = require('q');
var fs = require('fs');

/**
 * Screenshot related methods
 *
 * @module Driver
 * @class Screenshot
 * @namespace Dalek.DriverNative.Commands
 */

var Screenshot = {

  /**
   * Makes an screenshot of the current page
   *
   * @method screenshot
   * @param {string} path Root directory path
   * @param {string} pathname Pathname of the screenshot path
   * @param {string} hash Unique hash of that fn call
   * @param {string} uuid Unique hash of that fn call
   * @chainable
   */

  screenshot: function (path, pathname, hash, uuid) {
    this.actionQueue.push(this.webdriverClient.screenshot.bind(this.webdriverClient));
    this.actionQueue.push(this._screenshotCb.bind(this, path, pathname, hash, uuid));
    return this;
  },

  /**
   * Sends out an event with the results of the `screenshot` call
   * and stores the screenshot in the filesystem
   *
   * @method _screenshotCb
   * @param {string} path Root directory path
   * @param {string} pathname Pathname of the screenshot path
   * @param {string} hash Unique hash of that fn call
   * @param {string} uuid Unique hash of that fn call
   * @param {string} result Serialized JSON result of the screenshot call
   * @return {object} promise Screenshot promise
   * @private
   */

  _screenshotCb: function (path, pathname, hash, uuid, result) {
    var deferred = Q.defer();
    // replace base64 metadata
    var base64Data = JSON.parse(result).value.replace(/^data:image\/png;base64,/,'');
    // figure out the path & filename for the screenshot file
    var filename = path + pathname.replace('.png', '_' + this.browserName + '.png');
    // write the screenshot
    fs.writeFile(filename, base64Data, 'base64', function() {
      this.events.emit('driver:message', {key: 'screenshot', value: filename, uuid: uuid, hash: hash});
    }.bind(this));
    deferred.resolve();
    return deferred.promise;
  }

};

/**
 * Mixes in screenshot methods
 *
 * @param {Dalek.DriverNative} DalekNative Native driver base class
 * @return {Dalek.DriverNative} DalekNative Native driver base class
 */

module.exports = function (DalekNative) {
  // mixin methods
  Object.keys(Screenshot).forEach(function (fn) {
    DalekNative.prototype[fn] = Screenshot[fn];
  });

  return DalekNative;
};
