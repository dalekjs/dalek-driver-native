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
 * Execute related methods
 *
 * @module Driver
 * @class Execute
 * @namespace Dalek.DriverNative.Commands
 */

var Execute = {

  execute: function (script, args, hash) {
    this.actionQueue.push(this.webdriverClient.execute.bind(this.webdriverClient, {script: script.toString(), arguments: args}));
    this.actionQueue.push(this._setExecuteCb.bind(this, script.toString(), args, hash));
    return this;
  },

  _setExecuteCb: function (script, args, hash, data) {
    var deferred = Q.defer();
    this.events.emit('driver:message', {key: 'execute', value: JSON.parse(data).value, uuid: hash, hash: hash});
    deferred.resolve();
    return deferred.promise;
  },

  waitFor: function (script, args, timeout, hash) {
    this.actionQueue.push(this.webdriverClient.execute.bind(this.webdriverClient, {script: script.toString(), arguments: args}));
    this.actionQueue.push(this._waitForCb.bind(this, script.toString(), args, timeout, hash));
    return this;
  },

  _waitForCb: function (script, args, timeout, hash, data) {
    var deferred = Q.defer();
    var ret = JSON.parse(data);
    var checker = function (yData) {
    	if (JSON.parse(yData).value.userRet === true) {
	    	this.events.emit('driver:message', {key: 'waitFor', value: '', uuid: hash, hash: hash});
	    	deferred.resolve();    		
    	} else {
	    	Q.when(this.webdriverClient.execute.bind(this.webdriverClient, {script: script, arguments: args})())
	    		.then(checker);    		
    	}
    }.bind(this);

    setTimeout(function () {
    	this.events.emit('driver:message', {key: 'waitFor', value: 'Interrupted by timeout', uuid: hash, hash: hash});
    	deferred.resolve();
    }.bind(this), timeout);

    if (ret.value.userRet === true) {
    	this.events.emit('driver:message', {key: 'waitFor', value: '', uuid: hash, hash: hash});
    	deferred.resolve();
    } else {
    	Q.when(this.webdriverClient.execute.bind(this.webdriverClient, {script: script, arguments: args})())
	    	.then(checker);  
    }

    return deferred.promise;
  },

};

/**
 * Mixes in the script execute methods
 *
 * @param {Dalek.DriverNative} DalekNative Native driver base class
 * @return {Dalek.DriverNative} DalekNative Native driver base class
 */

module.exports = function (DalekNative) {
  // mixin methods
  Object.keys(Execute).forEach(function (fn) {
    DalekNative.prototype[fn] = Execute[fn];
  });

  return DalekNative;
};
