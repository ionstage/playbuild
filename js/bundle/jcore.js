var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/jcore/jcore.js
var require_jcore = __commonJS({
  "node_modules/jcore/jcore.js"(exports, module) {
    (function() {
      "use strict";
      if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
          return setTimeout(callback, 1e3 / 60);
        };
      }
      var inherits = function(ctor, superCtor) {
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
      var dom = {};
      dom.Draggable = function() {
        var Draggable2 = function(el) {
          this.el = el;
          this.onstart = null;
          this.onmove = null;
          this.onend = null;
          this.onmousedown = this.onmousedown.bind(this);
          this.onmousemove = this.onmousemove.bind(this);
          this.onmouseup = this.onmouseup.bind(this);
          this.ontouchstart = this.ontouchstart.bind(this);
          this.ontouchmove = this.ontouchmove.bind(this);
          this.ontouchend = this.ontouchend.bind(this);
          this.pointers = {};
        };
        Draggable2.IDENTIFIER_MOUSE = 0;
        Draggable2.Pointer = function(identifier, pageX, pageY, scroll, onscroll) {
          this.identifier = identifier;
          this.startPageX = pageX;
          this.startPageY = pageY;
          this.startScrollX = scroll.x;
          this.startScrollY = scroll.y;
          this.startScrollWidth = scroll.width;
          this.startScrollHeight = scroll.height;
          this.dScrollX = 0;
          this.dScrollY = 0;
          this.context = {};
          this.onscroll = onscroll;
        };
        Draggable2.debounce = function(func, delay) {
          var t = 0;
          var ctx = null;
          var args = null;
          return function() {
            ctx = this;
            args = arguments;
            if (t) {
              clearTimeout(t);
            }
            t = setTimeout(function() {
              func.apply(ctx, args);
              t = 0;
              ctx = null;
              args = null;
            }, delay);
          };
        };
        Draggable2.supportsTouch = function() {
          return "ontouchstart" in window || typeof DocumentTouch !== "undefined" && document instanceof DocumentTouch;
        };
        Draggable2.getOffset = function(el) {
          var rect = el.getBoundingClientRect();
          var bodyRect = document.body.getBoundingClientRect();
          var bodyStyle = window.getComputedStyle(document.body);
          var x = rect.left - el.scrollLeft - bodyRect.left + parseInt(bodyStyle.marginLeft, 10);
          var y = rect.top - el.scrollTop - bodyRect.top + parseInt(bodyStyle.marginTop, 10);
          return { x, y };
        };
        Draggable2.getScrollOffset = function(el) {
          var x = 0;
          var y = 0;
          var width = 0;
          var height = 0;
          el = el.parentNode;
          while (el && el !== document && el !== document.documentElement) {
            x += el.scrollLeft || 0;
            y += el.scrollTop || 0;
            width += el.scrollWidth - el.clientWidth || 0;
            height += el.scrollHeight - el.clientHeight || 0;
            el = el.parentNode;
          }
          return {
            x,
            y,
            width,
            height
          };
        };
        Draggable2.prototype.createPointer = function(identifier, event) {
          var scroll = Draggable2.getScrollOffset(this.el);
          var onscroll = Draggable2.debounce(this.onscroll.bind(this, identifier), 0);
          return new Draggable2.Pointer(identifier, event.pageX, event.pageY, scroll, onscroll);
        };
        Draggable2.prototype.addPointer = function(p) {
          document.addEventListener("scroll", p.onscroll, true);
          this.pointers[String(p.identifier)] = p;
        };
        Draggable2.prototype.removePointer = function(p) {
          document.removeEventListener("scroll", p.onscroll, true);
          p.context = null;
          p.onscroll = null;
          delete this.pointers[String(p.identifier)];
        };
        Draggable2.prototype.removeAllPointers = function() {
          Object.keys(this.pointers).forEach(function(id) {
            this.removePointer(this.pointers[id]);
          }, this);
        };
        Draggable2.prototype.hasPointer = function() {
          return Object.keys(this.pointers).length !== 0;
        };
        Draggable2.prototype.findPointer = function(identifier) {
          return this.pointers[String(identifier)] || null;
        };
        Draggable2.prototype.resolveUnhandledTouches = function(event) {
          var ids = Object.keys(this.pointers);
          if (ids.length === 0) {
            return;
          }
          ids.forEach(function(id) {
            var p = this.pointers[id];
            for (var i = 0, len = event.touches.length; i < len; i++) {
              if (event.touches[i].identifier === p.identifier) {
                return;
              }
            }
            var dx = event.pageX - p.startPageX + p.dScrollX;
            var dy = event.pageY - p.startPageY + p.dScrollY;
            this.onend.call(null, dx, dy, event, p.context);
            this.removePointer(p);
          }, this);
        };
        Draggable2.prototype.enable = function(listeners) {
          this.onstart = listeners.onstart;
          this.onmove = listeners.onmove;
          this.onend = listeners.onend;
          var type = Draggable2.supportsTouch() ? "touchstart" : "mousedown";
          this.el.addEventListener(type, this["on" + type], { passive: false });
        };
        Draggable2.prototype.disable = function() {
          var supportsTouch = Draggable2.supportsTouch();
          var startType = supportsTouch ? "touchstart" : "mousedown";
          var moveType = supportsTouch ? "touchmove" : "mousemove";
          var endType = supportsTouch ? "touchend" : "mouseup";
          this.el.removeEventListener(startType, this["on" + startType], { passive: false });
          document.removeEventListener(moveType, this["on" + moveType]);
          document.removeEventListener(endType, this["on" + endType]);
          if (!supportsTouch) {
            document.removeEventListener("contextmenu", this.onmouseup);
          }
          this.removeAllPointers();
        };
        Draggable2.prototype.onmousedown = function(event) {
          var offset = Draggable2.getOffset(event.target);
          var x = event.clientX - offset.x;
          var y = event.clientY - offset.y;
          var p = this.createPointer(Draggable2.IDENTIFIER_MOUSE, event);
          this.addPointer(p);
          this.onstart.call(null, x, y, event, p.context);
          document.addEventListener("mousemove", this.onmousemove);
          document.addEventListener("mouseup", this.onmouseup);
          document.addEventListener("contextmenu", this.onmouseup);
        };
        Draggable2.prototype.onmousemove = function(event) {
          var p = this.findPointer(Draggable2.IDENTIFIER_MOUSE);
          var dx = event.pageX - p.startPageX + p.dScrollX;
          var dy = event.pageY - p.startPageY + p.dScrollY;
          this.onmove.call(null, dx, dy, event, p.context);
        };
        Draggable2.prototype.onmouseup = function(event) {
          var p = this.findPointer(Draggable2.IDENTIFIER_MOUSE);
          var dx = event.pageX - p.startPageX + p.dScrollX;
          var dy = event.pageY - p.startPageY + p.dScrollY;
          document.removeEventListener("mousemove", this.onmousemove);
          document.removeEventListener("mouseup", this.onmouseup);
          document.removeEventListener("contextmenu", this.onmouseup);
          this.onend.call(null, dx, dy, event, p.context);
          this.removePointer(p);
        };
        Draggable2.prototype.ontouchstart = function(event) {
          this.resolveUnhandledTouches(event);
          var hasPointer = this.hasPointer();
          var touches = event.changedTouches;
          for (var i = 0, len = touches.length; i < len; i++) {
            var touch = touches[i];
            var offset = Draggable2.getOffset(touch.target);
            var x = touch.clientX - offset.x;
            var y = touch.clientY - offset.y;
            var p = this.createPointer(touch.identifier, touch);
            this.addPointer(p);
            this.onstart.call(null, x, y, event, p.context);
          }
          if (!hasPointer) {
            document.addEventListener("touchmove", this.ontouchmove);
            document.addEventListener("touchend", this.ontouchend);
          }
        };
        Draggable2.prototype.ontouchmove = function(event) {
          var touches = event.changedTouches;
          for (var i = 0, len = touches.length; i < len; i++) {
            var touch = touches[i];
            var p = this.findPointer(touch.identifier);
            if (p === null) {
              continue;
            }
            var dx = touch.pageX - p.startPageX + p.dScrollX;
            var dy = touch.pageY - p.startPageY + p.dScrollY;
            this.onmove.call(null, dx, dy, event, p.context);
          }
        };
        Draggable2.prototype.ontouchend = function(event) {
          var touches = event.changedTouches;
          for (var i = 0, len = touches.length; i < len; i++) {
            var touch = touches[i];
            var p = this.findPointer(touch.identifier);
            if (p === null) {
              continue;
            }
            var dx = touch.pageX - p.startPageX + p.dScrollX;
            var dy = touch.pageY - p.startPageY + p.dScrollY;
            this.onend.call(null, dx, dy, event, p.context);
            this.removePointer(p);
          }
          if (!this.hasPointer()) {
            document.removeEventListener("touchmove", this.ontouchmove);
            document.removeEventListener("touchend", this.ontouchend);
          }
        };
        Draggable2.prototype.onscroll = function(identifier) {
          var p = this.findPointer(identifier);
          if (p === null) {
            return;
          }
          var scrollOffset = Draggable2.getScrollOffset(this.el);
          var dScrollWidth = scrollOffset.width - p.startScrollWidth;
          var dScrollHeight = scrollOffset.height - p.startScrollHeight;
          p.dScrollX = scrollOffset.x - p.startScrollX - dScrollWidth;
          p.dScrollY = scrollOffset.y - p.startScrollY - dScrollHeight;
        };
        return Draggable2;
      }();
      var Component = function(el) {
        this.el = el || this.render();
        this.parentElement = this.prop(this.el.parentNode);
        this._relations = [];
        this._cache = {};
        this._listeners = {};
      };
      Component.prototype.element = function(el) {
        if (typeof el === "undefined") {
          return this.el;
        }
        if (el === this.el) {
          return;
        }
        if (!el) {
          throw new Error("missing element");
        }
        this.el = el;
        this.parentElement(this.el.parentNode);
        this._cache = {};
        this.markDirty();
      };
      Component.prototype.prop = function(initialValue) {
        var cache = initialValue;
        return function(value) {
          if (typeof value === "undefined") {
            return cache;
          }
          if (value === cache) {
            return;
          }
          cache = value;
          this.markDirty();
        };
      };
      Component.prototype.addRelation = function(relation) {
        if (this._relations.indexOf(relation) === -1) {
          this._relations.push(relation);
        }
      };
      Component.prototype.removeRelation = function(relation) {
        var index = this._relations.indexOf(relation);
        if (index !== -1) {
          this._relations.splice(index, 1);
        }
      };
      Component.prototype.on = function(type, listener) {
        if (!this._listeners[type]) {
          this._listeners[type] = [];
        }
        this._listeners[type].push(listener);
      };
      Component.prototype.off = function(type, listener) {
        if (!this._listeners[type]) {
          return;
        }
        var index = this._listeners[type].lastIndexOf(listener);
        if (index !== -1) {
          this._listeners[type].splice(index, 1);
        }
      };
      Component.prototype.emit = function() {
        var args = Array.prototype.slice.call(arguments);
        var type = args.shift();
        var listeners = this._listeners[type];
        if (!listeners) {
          return;
        }
        for (var i = 0, len = listeners.length; i < len; i++) {
          listeners[i].apply(this, args);
        }
      };
      Component.prototype.removeAllListeners = function(type) {
        if (this._listeners[type]) {
          delete this._listeners[type];
        } else {
          this._listeners = {};
        }
      };
      Component.prototype.redraw = function() {
        var el = this.el;
        var parentElement = this.parentElement();
        this.onredraw();
        if (parentElement && parentElement !== el.parentNode) {
          this.onappend();
          parentElement.appendChild(el);
        } else if (!parentElement && el.parentNode) {
          this.onremove();
          el.parentNode.removeChild(el);
        }
      };
      Component.prototype.redrawBy = function() {
        var args = Array.prototype.slice.call(arguments);
        var callback = args.pop();
        var isChanged = false;
        var values = [];
        for (var i = 0, len = args.length; i < len; i++) {
          var key = args[i];
          var value = this[key]();
          if (value !== this._cache[key]) {
            this._cache[key] = value;
            isChanged = true;
          }
          values.push(value);
        }
        if (isChanged) {
          callback.apply(this, values);
        }
      };
      Component.prototype.markDirty = function() {
        Component.main.markDirty(this);
      };
      Component.prototype.render = function() {
        return document.createElement("div");
      };
      Component.prototype.oninit = function() {
      };
      Component.prototype.onappend = function() {
      };
      Component.prototype.onremove = function() {
      };
      Component.prototype.onredraw = function() {
      };
      Component.main = function() {
        var Main = function() {
          this.dirtyComponents = [];
          this.requestID = 0;
        };
        Main.prototype.markDirty = function(component) {
          if (this.dirtyComponents.lastIndexOf(component) === -1) {
            this.dirtyComponents.push(component);
          }
          if (this.requestID) {
            return;
          }
          this.requestID = window.requestAnimationFrame(this.onanimate.bind(this));
        };
        Main.prototype.update = function(index) {
          for (var ci = index, clen = this.dirtyComponents.length; ci < clen; ci++) {
            var component = this.dirtyComponents[ci];
            var relations = component._relations;
            for (var ri = 0, rlen = relations.length; ri < rlen; ri++) {
              relations[ri].update(component);
            }
          }
          if (this.dirtyComponents.length > clen) {
            this.update(clen);
          }
        };
        Main.prototype.onanimate = function() {
          this.update(0);
          for (var i = 0, len = this.dirtyComponents.length; i < len; i++) {
            this.dirtyComponents[i].redraw();
          }
          this.dirtyComponents = [];
          this.requestID = 0;
        };
        return new Main();
      }();
      Component.inherits = function(initializer) {
        var superCtor = this;
        var ctor = function() {
          superCtor.apply(this, arguments);
          if (typeof initializer === "function") {
            initializer.apply(this, arguments);
          }
          if (this.constructor === ctor) {
            this.oninit();
          }
        };
        inherits(ctor, superCtor);
        ctor.inherits = superCtor.inherits;
        return ctor;
      };
      var Relation = function() {
      };
      Relation.prototype.update = function(component) {
      };
      Relation.inherits = function(initializer) {
        var superCtor = this;
        var ctor = function() {
          if (typeof initializer === "function") {
            initializer.apply(this, arguments);
          }
        };
        inherits(ctor, superCtor);
        return ctor;
      };
      var Draggable = function(component) {
        this._component = component;
        this._draggable = new dom.Draggable(component.el);
      };
      Draggable.prototype.enable = function() {
        this._draggable.enable({
          onstart: this.onstart.bind(this, this._component),
          onmove: this.onmove.bind(this, this._component),
          onend: this.onend.bind(this, this._component)
        });
      };
      Draggable.prototype.disable = function() {
        this._draggable.disable();
      };
      Draggable.prototype.onstart = function(component, x, y, event, context) {
      };
      Draggable.prototype.onmove = function(component, dx, dy, event, context) {
      };
      Draggable.prototype.onend = function(component, dx, dy, event, context) {
      };
      Draggable.inherits = function(initializer) {
        var superCtor = this;
        var ctor = function() {
          superCtor.apply(this, arguments);
          if (typeof initializer === "function") {
            initializer.apply(this, arguments);
          }
        };
        inherits(ctor, superCtor);
        return ctor;
      };
      var jCore2 = {
        Component,
        Relation,
        Draggable
      };
      if (typeof module !== "undefined" && module.exports) {
        module.exports = jCore2;
      } else {
        window.jCore = jCore2;
      }
    })();
  }
});

// js/bundle/base/jcore.js
var jCore = require_jcore();
export {
  jCore
};
