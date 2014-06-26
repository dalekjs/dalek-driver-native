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
  imagecompare: function (image_a, image_b, hash) {
    console.log(image_a);
    this.actionQueue.push(this._imagecompareCb.bind(this, image_a, image_b, hash));
    return this;
  },
  imagecut : function (opts, hash) {
    console.log('Go screenshotelement');
    var position = {},
      path = opts.realpath;

    this.actionQueue.push(this.webdriverClient.element.bind(this.webdriverClient, opts.selector)); 
    console.log('Go screenshotelement 1');     
    this.actionQueue.push(this.webdriverClient.location.bind(this.webdriverClient, opts.selector));
    
    this.actionQueue.push(function (result) {
    console.log('Go screenshotelement 4', result);  
      var value = JSON.parse(result);
      position.x = value.value.x;
      position.y = value.value.y;
    });

    this.actionQueue.push(this.webdriverClient.size.bind(this.webdriverClient, opts.selector));
    console.log('Go screenshotelement 2'); 
    this.actionQueue.push(this._imagecutCb.bind(this, opts, hash, position));
    
    return this;
  },
  _imagecutCb: function (opts, hash, position, result) {
    console.log('Go _imagecutCb');
    var rect, 
      size = JSON.parse(result),
      deferred = Q.defer(); 
      console.log('Go conver 1',position, size.value);
      rect = this._convertToRect(position, size.value);
      console.log('Go conver 2 ');
    var cb = function () {
      console.log('Go cb');
      this.events.emit('driver:message', {key: 'screenshotelement', value: rect, uuid: hash, hash: hash});
      deferred.resolve();
    };

    this._doImagecut(opts.realpath, opts.selector, rect, cb.bind(this));

    return deferred.promise;
   },
   _doImagecut: function (path, element, rect, cb) {
    console.log('Go _imagecut');
    this._parseImage(path).then(function (image) {
      var pngDst = new PNG({
        width: rect.width,
        height:rect.height
      });

      image.png.bitblt(pngDst, rect.x, rect.y, rect.width, rect.height, 0, 0);
      this._saveImage(image.path, pngDst, cb);
      
    }.bind(this));
   },
   _convertToRect: function (position, size) {
    console.log(position, size);
    return {
      x:position.x,
      y:position.y,
      width : size.width,
      height: size.height
    };
   },
  _imagecompareCb: function (opts, image_b, hash) {
    var image_a = opts.realpath;
    var deferred = Q.defer(); 
    console.log('_imagecompareCb 1', image_a);
    var cb = function (result, diffPath) {
      console.log('_imagecompareCb 2',result, diffPath);
      this.events.emit('driver:message', {key: 'imagecompare', value: result, uuid: hash, hash: hash, diff: diffPath});
      deferred.resolve();
    };

    this._doImagecompare(image_a, image_b, cb.bind(this));

    return deferred.promise;
  },
  _doImagecompare: function (image_a, image_b, cb) {
    var promises = [this._parseImage(image_a), this._parseImage(image_b)];
console.log('_doImagecompare 1');
    Q.all(promises)
    .then(function (images) {
      var result  = this._isImagesTheSameAndMakeDiff(images[0], images[1]);
      console.log('res compare', result);
      if (!result) {
        var imageDiffPath = images[1].path.replace('.png', '.diff.png');
        this._saveImage(imageDiffPath, images[1].png, cb.bind(this, result, imageDiffPath));   
      } else {
        cb(result); 
      }
    }.bind(this),
    function (errors) {
      console.log('errors compare', errors );
      cb(false);
    });
  },
  _isImagesTheSame : function (a, b) {
    if (a.data.length !== b.data.length) {
      console.log('!');
      return false;
    }

    for (var i = 0, len = a.data.length; i < len; i += 4) {
      if (a.data[i]     !== b.data[i] ||
          a.data[i + 1] !== b.data[i + 1] ||
          a.data[i + 2] !== b.data[i + 2]) {
        console.log('!!');
        return false;
      }
    }

    return true;
  },
  _parseImage: function (path) {
    var deferred = Q.defer(); 
    fs.createReadStream(path)
    .pipe(new PNG({
        filterType: 1
    }))
    .on('parsed', function() {
      var paresedImage = {
        path   : path,
        height : this.height,
        width  : this.width,
        data   : this.data,
        png    : this
      };

      deferred.resolve(paresedImage);  
    })
    .on('error', function (event) {
      console.log('Not Parse', path);
      deferred.reject(event);  
    });

    return deferred.promise;
  },
  _isImagesTheSameAndMakeDiff : function (a, b) {
    var errorPixelColor = { // Color for Error Pixels. Between 0 and 255.
      red: 255,
      green: 0,
      blue: 255,
      alpha: 255
    };

    if (a.data.length !== b.data.length) {
      return false;
    }

    var result = true;
    for (var i = 0, len = a.data.length; i < len; i += 4) {
      if (a.data[i]     !== b.data[i] ||
          a.data[i + 1] !== b.data[i + 1] ||
          a.data[i + 2] !== b.data[i + 2]) {
        result = false;
        b.data[i]     = errorPixelColor.red; 
        b.data[i + 1] = errorPixelColor.green; 
        b.data[i + 2] = errorPixelColor.blue;
        b.data[i + 3] = errorPixelColor.alpha;          
      }
    }

    return result;
  },
  _saveImage : function (filePath, png, cb) {
    console.log('Go save',filePath, png);
    png
    .pack()
    .pipe(fs.createWriteStream(filePath, {flags: 'w'}))
    .on('end', function () {
      console.log('GoEnd!');
      if (typeof cb === 'function') {
        cb();
      }
    })
    .on('error', function (errors) {
      console.log('Err',errors);
    })
    .on('close', function () {
      console.log('Close');
      if (typeof cb === 'function') {
        cb();
      }
    });
  }
};

module.exports = function (DalekNative) {
  // mixin methods
  
  Object.keys(Image).forEach(function (fn) {
    DalekNative.prototype[fn] = Image[fn];
  });

  return DalekNative;
};

