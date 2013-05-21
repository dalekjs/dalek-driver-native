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

// int. libs
var WD = require('dalek-internal-webdriver');

// globals
var client = null;
var queue = [];
var lastCalledUrl = null;

/**
 * @module
 */

module.exports.isMultiBrowser = function () {
    return true;
};

module.exports.verifyBrowser = function (browser) {
    return true;
};

module.exports.create = function (opts) {
    return new DalekNative(opts);
};

/**
 * @constructor
 */

function DalekNative (opts) {
    var stream = '';
    var browser = require('dalek-browser-' + opts.browser);

    this.events = opts.events;
    client = new WD(browser);

    this.events.on('tests:complete:native:' + opts.browser, function () {
        browser.kill();
    }.bind(this));

    browser.launch().then(function () {
        opts.events.emit('driver:ready:native:' + opts.browser);
    });
};

/**
 *
 */

DalekNative.prototype.start = function () {
    var deferred = Q.defer();

    if(client.options.sessionId) {
        deferred.resolve();
    } else {
        client
            .createSession()
            .then(function () {
                deferred.resolve();
            });
    }

    return deferred.promise;
};

/**
 *
 */

DalekNative.prototype.run = function () {}

/**
 *
 */

DalekNative.prototype.end = function () {
    var result = Q.resolve();

    queue.forEach(function (f) {
        result = result.then(f);
    });

    result.then(function () {
        queue = [];
        this.events.emit('driver:message', {key: 'run.complete', value: null});
    }.bind(this));
};

/**
 *
 */

DalekNative.prototype.open = function (url) {
    lastCalledUrl = url;
    queue.push(client.url.bind(client, url));
    queue.push(function () {
        var deferred = Q.defer();
        this.events.emit('driver:message', {key: 'open', value: url});
        deferred.resolve();
        return deferred.promise;
    }.bind(this));
};

/**
 *
 */

DalekNative.prototype.url = function (expected, hash) {
    queue.push(client.getUrl.bind(client));
    queue.push(function (url) {
        var deferred = Q.defer();
        this.events.emit('driver:message', {key: "url", expected: expected, hash: hash, value: JSON.parse(url).value});
        deferred.resolve();
        return deferred.promise;
    }.bind(this));
};

/**
 *
 */

DalekNative.prototype.title = function (expected, hash) {
    queue.push(client.title.bind(client));
    queue.push(function (title) {
        var deferred = Q.defer();
        this.events.emit('driver:message', {key: "title", expected: expected, hash: hash, value: JSON.parse(title).value});
        deferred.resolve();
        return deferred.promise;
    }.bind(this));
};

/**
 *
 */

DalekNative.prototype.exists = function (selector, hash) {
    queue.push(client.element.bind(client, selector));
    queue.push(function (result) {
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
    queue.push(client.element.bind(client, selector));
    queue.push(client.displayed.bind(client, selector));
    queue.push(function (result) {
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
    queue.push(client.element.bind(client, selector));
    queue.push(client.text.bind(client, selector));
    queue.push(function (result) {
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
    queue.push(client.element.bind(client, selector));
    queue.push(client.getAttribute.bind(client, attribute));
    queue.push(function (result) {
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

DalekNative.prototype.click = function (selector) {
    queue.push(client.element.bind(client, selector));
    queue.push(client.click.bind(client));
    queue.push(function () {
        var deferred = Q.defer();
        this.events.emit('driver:message', {key: 'click', value: selector});
        deferred.resolve();
        return deferred.promise;
    }.bind(this));
};

/**
 *
 */

DalekNative.prototype.waitForElement = function (selector, timeout) {
    queue.push(client.implicitWait.bind(client, timeout));
    queue.push(function () {
        var deferred = Q.defer();
        setTimeout(function () {
            this.events.emit('driver:message', {key: 'waitForElement', selector: selector});
            deferred.resolve();
        }.bind(this), timeout);
        return deferred.promise;
    }.bind(this));
};

/**
 *
 */

DalekNative.prototype.getNumberOfElements = function (selector, expected, hash) {
    queue.push(client.elements.bind(client, selector));
    queue.push(function (res) {
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

/**
 *
 */

DalekNative.prototype.back = function () {
    queue.push(client.back.bind(client));
    queue.push(function () {
        var deferred = Q.defer();
        this.events.emit('driver:message', {key: 'back', value: null});
        deferred.resolve();
        return deferred.promise;
    }.bind(this));
};

/**
 *
 */

DalekNative.prototype.forward = function () {
    queue.push(client.forward.bind(client));
    queue.push(function () {
        var deferred = Q.defer();
        this.events.emit('driver:message', {key: 'forward', value: null});
        deferred.resolve();
        return deferred.promise;
    }.bind(this));
};

/**
 *
 */

DalekNative.prototype.screenshot = function (path, pathname) {
    queue.push(client.screenshot.bind(client));
    queue.push(function (result) {
        var deferred = Q.defer();
        var base64Data = JSON.parse(result).value.replace(/^data:image\/png;base64,/,"");
        require("fs").writeFile(path + pathname, base64Data, 'base64', function(err) {
            this.events.emit('driver:message', {key: 'screenshot', value: path + pathname});
        }.bind(this));
        deferred.resolve();
        return deferred.promise;
    }.bind(this));
};
