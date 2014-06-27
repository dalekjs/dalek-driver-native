'use strict';

// ext. libs
var Q = require('q');
var fs = require('fs');
var PNG = require('node-pngjs').PNG;

/**
 * Execute related methods
 *
 * @module Driver
 * @class Image
 * @namespace Dalek.DriverNative.Image
 */

var Image = { 
  imagecompare : function (opts, expected, makediff, hash) {
    this.actionQueue.push(this._imagecompareCb.bind(this, opts, expected, makediff, hash));
    return this;
  },
  imagecut : function (opts, hash) {
    var position = {},
      path = opts.realpath;

    this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, opts.selector)); 
    this.actionQueue.push(this.webdriverClient.location.bind(this.webdriverClient, opts.selector));
    
    /* get left top positions of element*/
    this.actionQueue.push(function (result) {
      var value = JSON.parse(result).value;
      position.x = value.x;
      position.y = value.y;
    });

    this.actionQueue.push(this.webdriverClient.size.bind(this.webdriverClient, opts.selector)); 
    this.actionQueue.push(this._imagecutCb.bind(this, opts, hash, opts.selector, position));
    
    return this;
  },
  _imagecutCb: function (opts, hash, selector, position, result) {
    var rect, 
      size = JSON.parse(result),
      deferred = Q.defer(); 
      rect = this._convertToRect(position, size.value);
    var cb = function () {
      this.events.emit('driver:message', {key: 'imagecut', value: selector, uuid: hash, hash: hash});
      deferred.resolve();
    };

    this._doImagecut(opts.realpath, opts.selector, rect, cb.bind(this));

    return deferred.promise;
   },
   _doImagecut: function (path, element, rect, cb) {
    this._parsePNG(path).then(function (image) {
      var pngDst = new PNG({
        width: rect.width,
        height:rect.height
      });

      image.png.bitblt(pngDst, rect.x, rect.y, rect.width, rect.height, 0, 0);
      this._savePNG(pngDst, image.path).then(cb);
      
    }.bind(this));
   },
  _imagecompareCb: function (opts, expected, makediff, hash) {
    var current = opts.realpath;
    var deferred = Q.defer(); 

    var cb = function (result) {
      this.events.emit('driver:message', {key: 'imagecompare', value: result, uuid: hash, hash: hash});
      deferred.resolve();
    };

    this._doImagecompare(current, expected, makediff, cb.bind(this));

    return deferred.promise;
  },
  _doImagecompare: function (image_a, image_b, makediff, cb) {
    var promises = [this._parsePNG(image_a), this._parsePNG(image_b)];
    Q.all(promises)
    .then(function (images) {
      var result = this._checkIfImagesTheSameAndMakeDiff(images[0], images[1], makediff);
      if (result === 'Images are different' && makediff) {
        var imageDiffPath = images[1].path.replace('.png', '.diff.png');
        this._savePNG(images[1].png, imageDiffPath)
        .then(function () {
          var cbresult = result + '. See differences by path ' + imageDiffPath;
          cb(cbresult);   
        },
        function (error) {
          cb('error ' + JSON.stringify(error));
        });
      } else {
        cb(result); 
      }
    }.bind(this),
    function (errors) {
      cb(errors);
    });
  },
  _checkIfImagesTheSameAndMakeDiff : function (a, b, makediff) {

    if (a.data.length !== b.data.length) {
      return 'Images have different sizes';
    }

    var result = 'equal';

    for (var i = 0, len = a.data.length; i < len; i += 4) {
      if (a.data[i]     !== b.data[i] ||
          a.data[i + 1] !== b.data[i + 1] ||
          a.data[i + 2] !== b.data[i + 2]) {
        result = 'Images are different';
        if (makediff) {
          this._setErrorPixel(b.data, i);
        } else {
          return result;
        }
      }
    }

    return result;
  },
  _parsePNG: function (path) {
    var deferred = Q.defer();
    fs.createReadStream(path)
    .pipe(new PNG({
        filterType: 1
    }))
    .on('parsed', function() {
      var paresedImage = {
        path   : path,
        data   : this.data,
        png    : this
      };

      deferred.resolve(paresedImage);  
    })
    .on('error', function (event) {
      deferred.reject(event);  
    });

    return deferred.promise;
  },
  _savePNG : function (png, filePath) {
    var deferred = Q.defer(); 
    png
    .pack()
    .pipe(fs.createWriteStream(filePath, {flags: 'w'}))
    .on('error', function (errors) {
      deferred.reject(errors);  
    })
    .on('close', function () {
      deferred.resolve();  
    });

    return deferred.promise;
  },
  _setErrorPixel : function (dst, index) {
    var errorPixelColor = { // Color for Error Pixels. Between 0 and 255.
      red: 255,
      green: 0,
      blue: 255,
      alpha: 255
    };

    dst[index]     = errorPixelColor.red; 
    dst[index + 1] = errorPixelColor.green; 
    dst[index + 2] = errorPixelColor.blue;
    dst[index + 3] = errorPixelColor.alpha; 
  },
  _convertToRect: function (position, size) {
    return {
      x:position.x,
      y:position.y,
      width : size.width,
      height: size.height
    };
   }
};

module.exports = function (DalekNative) {
  // mixin methods
  
  Object.keys(Image).forEach(function (fn) {
    DalekNative.prototype[fn] = Image[fn];
  });

  return DalekNative;
};

