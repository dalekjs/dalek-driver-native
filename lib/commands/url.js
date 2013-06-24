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
 * URL related methods
 *
 * @module DalekDriverNative
 * @class URL
 * @namespace DalekDriverNative.Commands
 */

module.exports = function (Driver) {

    /**
     * Navigate to a new URL
     *
     * @method open
     * @params {string} url
     * @params {string} uuid
     * @return {Q.promise}
     */

    Driver.prototype.open = function (url, hash, uuid) {
        this.lastCalledUrl = url;
        this.actionQueue.push(this.webdriverClient.url.bind(this.webdriverClient, url));
        this.actionQueue.push(function () {
            var deferred = Q.defer();
            this.events.emit('driver:message', {key: 'open', value: url, hash: hash, uuid: uuid});
            deferred.resolve();
            return deferred.promise;
        }.bind(this));
    };

    /**
     * Fetches the current url
     *
     * @method url
     * @params {string} expected
     * @params {string} uuid
     * @return {Q.promise}
     */

    Driver.prototype.url = function (expected, hash) {
        this.actionQueue.push(this.webdriverClient.getUrl.bind(this.webdriverClient));
        this.actionQueue.push(function (url) {
            var deferred = Q.defer();
            this.events.emit('driver:message', {key: "url", expected: expected, hash: hash, value: JSON.parse(url).value});
            deferred.resolve();
            return deferred.promise;
        }.bind(this));
    };

    /**
     * Navigate backwards in the browser history, if possible.
     *
     * @method back
     * @params {string} uuid
     * @return {Q.promise}
     */

    Driver.prototype.back = function (hash, uuid) {
        this._createNonReturnee('back')(hash, uuid);
    };

    /**
     * Navigate forwards in the browser history, if possible.
     *
     * @method forward
     * @params {string} uuid
     * @return {Q.promise}
     */

    Driver.prototype.forward = function (hash, uuid) {
        this._createNonReturnee('forward')(hash, uuid);
    };

    /**
     * Refresh the current page
     *
     * @method refresh
     * @params {string} uuid
     * @return {Q.promise}
     */

    Driver.prototype.refresh = function (hash, uuid) {
        this._createNonReturnee('refresh')(hash, uuid);
    };

};