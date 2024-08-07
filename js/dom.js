export class dom {
  static export(key, value) {
    const g = (typeof global !== 'undefined' ? global : window);
    Object.defineProperty(g, key, { value });
  }

  static body() {
    return document.body;
  }

  static render(s) {
    const el = document.createRange().createContextualFragment(s).firstChild;
    el.parentNode.removeChild(el);
    return el;
  }

  static parent(el) {
    return el.parentNode;
  }

  static find(el, selectors) {
    return el.querySelector(selectors);
  }

  static attr(el, props) {
    for (const key in props) {
      el.setAttribute(key, props[key]);
    }
  }

  static css(el, props) {
    const style = el.style;
    for (const key in props) {
      style[key] = props[key];
    }
  }

  static toggleClass(el, className, force) {
    el.classList.toggle(className, force);
  }

  static hasClass(el, className) {
    return el.classList.contains(className);
  }

  static data(el, key, value) {
    if (typeof value === 'undefined') {
      return el.dataset[key];
    }
    el.dataset[key] = value;
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

  static checked(el) {
    return el.checked;
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

  static translateY(el, y) {
    el.style.transform = `translateY(${y}px)`;
  }

  static on(el, ...args) {
    el.addEventListener(...args);
  }

  static off(el, ...args) {
    el.removeEventListener(...args);
  }

  static once(el, type, listener, useCapture) {
    el.addEventListener(type, listener, {
      capture: (typeof useCapture !== 'undefined' ? useCapture : false),
      once: true,
    });
  }

  static click(el) {
    el.click();
  }

  static target(event) {
    return event.target;
  }

  static key(event) {
    return event.key;
  }

  static cancel(event) {
    event.preventDefault();
  }

  static readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const onfailed = () => {
        reject(new Error(`Failed to read file: ${file.name}`));
      };
      reader.onload = event => {
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

  static location() {
    return document.location;
  }

  static urlQuery(url, key) {
    const s = new URLSearchParams(url.search);
    return s.get(key);
  }

  static load(key, defaultValue) {
    return JSON.parse(localStorage.getItem(key)) || defaultValue;
  }

  static save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}
