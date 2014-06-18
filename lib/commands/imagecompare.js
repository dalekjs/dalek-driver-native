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

var ImageCompare = { 
    imagecompare: function (path1, path2, hash) {
      this.actionQueue.push(this._imagecompareCb.bind(this, path1, path2, hash));
      return this;
    },

    _imagecompareCb: function (path1, path2, hash) {
      var deferred = Q.defer(); 

      var cb = function (result) {
        this.events.emit('driver:message', {key: 'imagecompare', value: result, uuid: hash, hash: hash});
        deferred.resolve();
      };

      this._sameImage(path1, path2, cb.bind(this));

      return deferred.promise;
    },

    _sameImage: function (image_a, image_b, cb) {
      var pngparse = require('pngparse');
      pngparse.parseFile(image_a, function(err, a) {
        if (err) {
          console.log('Where the first file? ' + image_a + ' is not it.');
          process.exit(2);
        }
        pngparse.parseFile(image_b, function(err, b) {
          if (err) {
            console.log('Where the second file? ' + image_b + ' is not it.');
            process.exit(3);
          }
     
          // easy stuffs first
          if (a.data.length !== b.data.length) {
            return cb(false);
          }
     
          // loop over pixels, but
          // skip 4th thingie (alpha) as these images should not be transparent
          for (var i = 0, len = a.data.length; i < len; i += 4) {
            if (a.data[i]     !== b.data[i] ||
                a.data[i + 1] !== b.data[i + 1] ||
                a.data[i + 2] !== b.data[i + 2]) {
              return cb(false);
            }
          }
          return cb(true);
        });
      });
    }
};

module.exports = function (DalekNative) {
  // mixin methods
  Object.keys(ImageCompare).forEach(function (fn) {
    DalekNative.prototype[fn] = ImageCompare[fn];
  });

  return DalekNative;
};

