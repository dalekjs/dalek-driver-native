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

// ext. libs
var Q = require('q');

/**
 * Element related methods
 *
 * @module DalekDriverNative
 * @class Element
 * @namespace DalekDriverNative.Commands
 */

module.exports = function (DalekNative) {

    /**
     *
     */

    DalekNative.prototype.exists = function (selector, hash) {
        this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
        this.actionQueue.push(function (result) {
            var deferred = Q.defer();
            this.events.emit('driver:message', {key: "exists", selector: selector, hash: hash, value: (JSON.parse(result).value === -1 ? 'false' : 'true')});
            deferred.resolve();
            return deferred.promise;
        }.bind(this));
    };

    /**
     *
     */

    DalekNative.prototype.visible = function (selector, hash) {
        this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
        this.actionQueue.push(this.webdriverClient.displayed.bind(this.webdriverClient, selector));
        this.actionQueue.push(function (result) {
            var deferred = Q.defer();
            this.events.emit('driver:message', {key: "visible", selector: selector, hash: hash, value: JSON.parse(result).value});
            deferred.resolve();
            return deferred.promise;
        }.bind(this));
    };

    /**
     *
     */

    DalekNative.prototype.text = function (selector, expected, hash) {
        this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
        this.actionQueue.push(this.webdriverClient.text.bind(this.webdriverClient, selector));
        this.actionQueue.push(function (result) {
            var deferred = Q.defer();
            this.events.emit('driver:message', {key: 'text', hash: hash, expected: expected, selector: selector, value: JSON.parse(result).value});
            deferred.resolve();
            return deferred.promise;
        }.bind(this));
    };

    /**
     *
     */

    DalekNative.prototype.attribute = function (selector, attribute, expected, hash) {
        this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
        this.actionQueue.push(this.webdriverClient.getAttribute.bind(this.webdriverClient, attribute));
        this.actionQueue.push(function (result) {
            var deferred = Q.defer();

            if (attribute === 'href' && expected[0] === '#') {
                var res = JSON.parse(result);
                var val = res.value.substring(res.value.lastIndexOf('#'));
                this.events.emit('driver:message', {key: 'attribute', selector: selector, hash: hash, expected: expected, value: val});
            } else {
                this.events.emit('driver:message', {key: 'attribute', selector: selector, expected: expected, value: JSON.parse(result).value });
            }

            deferred.resolve();
            return deferred.promise;
        }.bind(this));
    };

    /**
     *
     */

    DalekNative.prototype.click = function (selector, hash, uuid) {
        this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, selector));
        this.actionQueue.push(this.webdriverClient.click.bind(this.webdriverClient));
        this.actionQueue.push(function () {
            var deferred = Q.defer();
            this.events.emit('driver:message', {key: 'click', value: selector, uuid: uuid, hash: hash});
            deferred.resolve();
            return deferred.promise;
        }.bind(this));
    };

    /**
     *
     */

    DalekNative.prototype.waitForElement = function (selector, timeout, hash, uuid) {
        this.actionQueue.push(this.webdriverClient.implicitWait.bind(this.webdriverClient, timeout));
        this.actionQueue.push(function () {
            var deferred = Q.defer();
            setTimeout(function () {
                this.events.emit('driver:message', {key: 'waitForElement', selector: selector, uuid: uuid, hash: hash});
                deferred.resolve();
            }.bind(this), timeout);
            return deferred.promise;
        }.bind(this));
    };

    /**
     *
     */

    DalekNative.prototype.getNumberOfElements = function (selector, expected, hash) {
        this.actionQueue.push(this.webdriverClient.elements.bind(this.webdriverClient, selector));
        this.actionQueue.push(function (res) {
            var deferred = Q.defer();
            var result = JSON.parse(res);

            if (result.value === -1) {
                this.events.emit('driver:message', {key: 'numberOfElements', hash: hash, selector: selector, expected: expected, value: 0});
            } else {
                this.events.emit('driver:message', {key: 'numberOfElements', selector: selector, expected: expected, hash: hash, value: result.value.length});
            }

            deferred.resolve();
            return deferred.promise;
        }.bind(this));
    };

};