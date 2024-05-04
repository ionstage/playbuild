(function(app) {
  'use strict';

  var helper = {};

  helper.values = function(obj) {
    return Object.keys(obj).map(function(key) {
      return obj[key];
    });
  };

  helper.remove = function(array, item) {
    var index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
  };

  helper.find = function(array, callback) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (callback(array[i], i, array)) {
        return array[i];
      }
    }
    return null;
  };

  helper.wrapper = function() {
    var Wrapper = function(self, wrapper) {
      return Object.defineProperty(wrapper, 'unwrap', { value: Wrapper.unwrap.bind(self) });
    };

    Wrapper.unwrap = function(key) {
      return (key === Wrapper.KEY ? this : null);
    };

    Wrapper.KEY = {};

    return Wrapper;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = helper;
  } else {
    app.helper = helper;
  }
})(this.app || (this.app = {}));
