export class dom {
  static export(key, value) {
    var g = (typeof global !== 'undefined' ? global : window);
    Object.defineProperty(g, key, { value: value });
  }

  static body() {
    return document.body;
  }

  static render(s) {
    var el = document.createRange().createContextualFragment(s).firstChild;
    el.parentNode.removeChild(el);
    return el;
  }

  static attr(el, props) {
    Object.keys(props).forEach(function(key) {
      el.setAttribute(key, props[key]);
    });
  }

  static css(el, props) {
    var style = el.style;
    Object.keys(props).forEach(function(key) {
      style[key] = props[key];
    });
  }

  static toggleClass(el, className, force) {
    if (force) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  }

  static text(el, s) {
    el.textContent = s;
  }

  static value(el, s) {
    if (typeof s === 'undefined') {
      return el.value;
    }
    el.value = s;
  }

  static disabled(el, disabled) {
    el.disabled = disabled;
  }

  static focus(el) {
    el.focus();
  }

  static blur(el) {
    el.blur();
  }

  static file(el) {
    return el.files[0];
  }

  static contentWindow(iframe) {
    return iframe.contentWindow;
  }

  static contentHeight(iframe) {
    return iframe.contentDocument.documentElement.scrollHeight;
  }

  static on(el, type, listener, useCapture) {
    el.addEventListener(type, listener, !!useCapture);
  }

  static off(el, type, listener, useCapture) {
    el.removeEventListener(type, listener, !!useCapture);
  }

  static once(el, type, listener, useCapture) {
    var wrapper = function() {
      dom.off(el, type, wrapper, useCapture);
      listener.apply(null, arguments);
    };
    dom.on(el, type, wrapper, useCapture);
  }

  static click(el) {
    el.click();
  }

  static target(event) {
    return event.target;
  }

  static cancel(event) {
    event.preventDefault();
  }

  static readFile(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();

      var onfailed = function() {
        reject(new Error('Failed to read file: ' + file.name));
      };

      reader.onload = function(event) {
        resolve(event.target.result);
      };

      reader.onerror = onfailed;
      reader.onabort = onfailed;

      reader.readAsText(file);
    });
  }

  static fileName(file) {
    return file.name;
  }

  static ajax(opt) {
    var type = opt.type;
    var url = opt.url;

    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();

      var onfailed = function() {
        reject(new Error('Failed to load resource: ' + type + ' ' + url));
      };

      req.onload = function() {
        if (req.status >= 200 && req.status < 400) {
          resolve(req.response);
        } else {
          onfailed();
        }
      };

      req.onerror = onfailed;
      req.onabort = onfailed;

      req.open(type, url, true);
      req.send();
    });
  }

  static load(key, defaultValue) {
    return JSON.parse(localStorage.getItem(key)) || defaultValue;
  }

  static save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
