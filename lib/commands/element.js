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
 * Element related methods
 *
 * @module Driver
 * @class Element
 * @namespace Dalek.DriverNative.Commands
 */

var Element = {

  /**
   * Checks if an element exists
   *
   * @method exists
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  exists: function (selector, hash) {
    this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
    this.actionQueue.push(this._existsCb.bind(this, selector, hash));
    return this;
  },

  /**
   * Sends out an event with the results of the `exists` call
   *
   * @method _existsCb
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @param {string} result Serialized JSON with the reuslts of the exists call
   * @return {object} promise Exists promise
   * @private
   */

  _existsCb: function (selector, hash, result) {
    var deferred = Q.defer();
    this.events.emit('driver:message', {key: 'exists', selector: selector, hash: hash, value: (JSON.parse(result).value === -1 ? 'false' : 'true')});
    deferred.resolve();
    return deferred.promise;
  },

  /**
   * Checks if an element is visible
   *
   * @method visible
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  visible: function (selector, hash) {
    this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
    this.actionQueue.push(this.webdriverClient.displayed.bind(this.webdriverClient, selector));
    this.actionQueue.push(this._visibleCb.bind(this, selector, hash));
    return this;
  },

  /**
   * Sends out an event with the results of the `visible` call
   *
   * @method _visibleCb
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @param {string} result Serialized JSON with the reuslts of the visible call
   * @return {object} promise Visible promise
   * @private
   */

  _visibleCb: function (selector, hash, result) {
    var deferred = Q.defer();
    this.events.emit('driver:message', {key: 'visible', selector: selector, hash: hash, value: JSON.parse(result).value});
    deferred.resolve();
    return deferred.promise;
  },

  /**
   * Checks if an element has the expected text
   *
   * @method text
   * @param {string} selector Selector expression to find the element
   * @param {string} expected The expected text content
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  text: function (selector, expected, hash) {
    this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
    this.actionQueue.push(this.webdriverClient.text.bind(this.webdriverClient, selector));
    this.actionQueue.push(this._textCb.bind(this, selector, hash, expected));
    return this;
  },

  /**
   * Sends out an event with the results of the `text` call
   *
   * @method _textCb
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @param {string} expected The expected text content
   * @param {string} result Serialized JSON with the reuslts of the text call
   * @return {object} promise Text promise
   * @private
   */

  _textCb: function (selector, hash, expected, result) {
    var deferred = Q.defer();
    this.events.emit('driver:message', {key: 'text', hash: hash, expected: expected, selector: selector, value: JSON.parse(result).value});
    deferred.resolve();
    return deferred.promise;
  },

  /**
   * Checks if an element has an attribute with the expected value
   *
   * @method attribute
   * @param {string} selector Selector expression to find the element
   * @param {string} attribute The attribute that should be checked
   * @param {string} expected The expected text content
   * @param {string} hash Unique hash of that fn call
   * @chainable
   */

  attribute: function (selector, attribute, expected, hash) {
    this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
    this.actionQueue.push(this.webdriverClient.getAttribute.bind(this.webdriverClient, attribute));
    this.actionQueue.push(this._attributeCb.bind(this, selector, hash, attribute, expected));
    return this;
  },

  /**
   * Sends out an event with the results of the `attribute` call
   *
   * @method _attributeCb
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @param {string} attribute The attribute that should be checked
   * @param {string} expected The expected attribute content
   * @param {string} result Serialized JSON with the reuslts of the attribute call
   * @return {object} promise Attribute promise
   * @private
   */

  _attributeCb: function (selector, hash, attribute, expected, result) {
    var deferred = Q.defer();

    // check if we deal with an hashed anchor expression
    if (attribute === 'href' && expected[0] === '#') {
      var res = JSON.parse(result);
      var val = res.value.substring(res.value.lastIndexOf('#'));
      this.events.emit('driver:message', {key: 'attribute', selector: selector, hash: hash, expected: expected, value: val});
    } else {
      this.events.emit('driver:message', {key: 'attribute', selector: selector, expected: expected, value: JSON.parse(result).value });
    }

    deferred.resolve();
    return deferred.promise;
  },

  /**
   * Clicks an element
   *
   * @method click
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @param {string} uuid Unique hash of that fn call
   * @chainable
   */

  click: function (selector, hash, uuid) {
    this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
    this.actionQueue.push(this.webdriverClient.click.bind(this.webdriverClient));
    this.actionQueue.push(this._clickCb.bind(this, selector, hash, uuid));
    return this;
  },

  /**
   * Sends out an event with the results of the `click` call
   *
   * @method _clickCb
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @param {string} uuid Unique hash of that fn call
   * @return {object} promise Click promise
   * @private
   */

  _clickCb: function (selector, hash, uuid) {
    var deferred = Q.defer();
    this.events.emit('driver:message', {key: 'click', value: selector, uuid: uuid, hash: hash});
    deferred.resolve();
    return deferred.promise;
  },

  /**
   * Wait for an element for a specific amount of time
   *
   * @method waitForElement
   * @param {string} selector Selector expression to find the element
   * @param {integer} timeout Time to wait in ms
   * @param {string} hash Unique hash of that fn call
   * @param {string} uuid Unique hash of that fn call
   * @chainable
   */

  waitForElement: function (selector, timeout, hash, uuid) {
    this.actionQueue.push(this.webdriverClient.implicitWait.bind(this.webdriverClient, timeout));
    this.actionQueue.push(this._waitForElementCb.bind(this, selector, hash, uuid, timeout));
    return this;
  },

  /**
   * Sends out an event with the results of the `waitForElement` call
   *
   * @method _waitForElementCb
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @param {string} uuid Unique hash of that fn call
   * @param {integer} timeout Time to wait in ms
   * @return {object} promise WaitForElement promise
   * @private
   */

  _waitForElementCb: function (selector, hash, uuid, timeout) {
    var deferred = Q.defer();
    setTimeout(function () {
      this.events.emit('driver:message', {key: 'waitForElement', selector: selector, uuid: uuid, hash: hash});
      deferred.resolve();
    }.bind(this), timeout);
    return deferred.promise;
  },

  /**
   * Returns the number of elements matched by the selector
   *
   * @method getNumberOfElements
   * @param {string} selector Selector expression to find the elements
   * @param {integer} expected Expected number of matched elements
   * @param {string} uuid Unique hash of that fn call
   * @chainable
   */

  getNumberOfElements: function (selector, expected, hash) {
    this.actionQueue.push(this.webdriverClient.elements.bind(this.webdriverClient, selector));
    this.actionQueue.push(this._getNumberOfElementsCb.bind(this, selector, hash, expected));
    return this;
  },

  /**
   * Sends out an event with the results of the `getNumberOfElements` call
   *
   * @method _getNumberOfElementsCb
   * @param {string} selector Selector expression to find the element
   * @param {string} hash Unique hash of that fn call
   * @param {integer} expected Expected number of matched elements
   * @param {string} res Serialized JSON with the results of the getNumberOfElements call
   * @return {object} promise GetNumberOfElements promise
   * @private
   */

  _getNumberOfElementsCb: function (selector, hash, expected, res) {
    var deferred = Q.defer();
    var result = JSON.parse(res);

    // check if the expression matched any element
    if (result.value === -1) {
      this.events.emit('driver:message', {key: 'numberOfElements', hash: hash, selector: selector, expected: expected, value: 0});
    } else {
      this.events.emit('driver:message', {key: 'numberOfElements', selector: selector, expected: expected, hash: hash, value: result.value.length});
    }

    deferred.resolve();
    return deferred.promise;
  }

};

/**
 * Mixes in element methods
 *
 * @param {Dalek.DriverNative} DalekNative Native driver base class
 * @return {Dalek.DriverNative} DalekNative Native driver base class
 */

module.exports = function (DalekNative) {
  // mixin methods
  Object.keys(Element).forEach(function (fn) {
    DalekNative.prototype[fn] = Element[fn];
  });

  return DalekNative;
};
