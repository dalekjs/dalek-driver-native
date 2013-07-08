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

/**
 * Page related methods
 *
 * @module Driver
 * @class Page
 * @namespace Dalek.DriverNative.Commands
 */

var Page = {

  /**
   * Checks the document title of a page
   *
   * @method title
   * @param {string} expected Expected page title
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  title: function (expected, hash) {
    this.actionQueue.push(this.webdriverClient.title.bind(this.webdriverClient));
    this.actionQueue.push(this._titleCb.bind(this, expected, hash));
    return this;
  },

  /**
   * Sends out an event with the results of the `title` call
   *
   * @method _titleCb
   * @param {string} expected Expected page title
   * @param {string} hash Unique hash of that fn call
   * @param {string} title Serialized JSON with the results of the title call
   * @return {object} promise Title promise
   * @private
   */

  _titleCb: function (expected, hash, title) {
    var deferred = Q.defer();
    this.events.emit('driver:message', {key: 'title', expected: expected, hash: hash, value: JSON.parse(title).value});
    deferred.resolve();
    return deferred.promise;
  }
};

/**
 * Mixes in page methods
 *
 * @param {Dalek.DriverNative} DalekNative Native driver base class
 * @return {Dalek.DriverNative} DalekNative Native driver base class
 */

module.exports = function (DalekNative) {
  // mixin methods
  Object.keys(Page).forEach(function (fn) {
    DalekNative.prototype[fn] = Page[fn];
  });

  return DalekNative;
};
