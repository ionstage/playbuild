export class helper {
  static values(obj) {
    return Object.keys(obj).map(function(key) {
      return obj[key];
    });
  }

  static remove(array, item) {
    var index = array.indexOf(item);
    if (index !== -1) {
      array.splice(index, 1);
    }
  }

  static find(array, callback) {
    for (var i = 0, len = array.length; i < len; i++) {
      if (callback(array[i], i, array)) {
        return array[i];
      }
    }
    return null;
  }

  static wrapper = function() {
    return class Wrapper {
      constructor(self, wrapper) {
        return Object.defineProperty(wrapper, 'unwrap', { value: Wrapper.unwrap.bind(self) });
      }

      static unwrap(key) {
        return (key === Wrapper.KEY ? this : null);
      }

      static KEY = {};
    }
  };
}
