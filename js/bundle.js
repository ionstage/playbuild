require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({"circuit":[function(require,module,exports){
/**
 * circuit v1.1.3
 * (c) 2015 iOnStage
 * Released under the MIT License.
 */

(function(global) {
  'use strict';

  var lastIndexOf = function(array, item) {
    for (var i = array.length - 1; i >= 0; i--) {
      if (array[i] === item)
        return i;
    }
    return -1;
  };

  var map = function(array, func) {
    var len = array.length;
    var results = Array(len);
    for (var i = 0; i < len; i++) {
      results[i] = func(array[i], i, array);
    }
    return results;
  };

  var identity = function(value) {
    return value;
  };

  var circuit = {};

  var CircuitProp = function(initialValue) {
    var self = this;

    var func = function() {
      if (typeof arguments[0] === 'undefined') {
        self.update();
        return self.cache;
      }

      var value = self.value.apply(null, arguments);
      if (value === self.cache)
        return;

      self.updateCache(value);
      self.markDirty();
    };

    func._self = self;

    this.func = func;
    this.targets = [];
    this.sources = [];

    if (typeof initialValue !== 'function') {
      this.cache = initialValue;
      this.value = identity;
      this.dirty = false;
      this.timer = null;
    } else {
      // this.cache is unset until first update
      this.value = initialValue;
      this.dirty = true;
      this.timer = setTimeout(function() {
        self.timer = null;
        self.dirty = true;
        self.update();
      }, 0);
    }

    return func;
  };

  CircuitProp.prototype.update = function() {
    if (!this.dirty)
      return;

    this.dirty = false;

    var sourceValues = map(this.sources, function(source) {
      return source();
    });

    var value = this.value.apply(null, sourceValues);
    if (value === this.cache)
      return;

    this.updateCache(value);
    this.markDirty();
  };

  CircuitProp.prototype.updateCache = function(value) {
    this.cache = value;
    this.dirty = false;
  };

  CircuitProp.prototype.markDirty = function() {
    CircuitProp.markDirtyTargets(this.targets);

    if (!this.dirty)
      return;

    this.dirty = false;

    if (this.timer === null) {
      var self = this;
      this.timer = setTimeout(function() {
        self.timer = null;
        self.dirty = true;
        self.update();
      }, 0);
    }
  };

  CircuitProp.markDirtyTargets = (function() {
    var dirtyTargets = [];
    var timer = null;

    return function(targets) {
      for (var i = 0, len = targets.length; i < len; i++) {
        var target = targets[i];
        var targetSelf = target._self;

        if (targetSelf.dirty)
          continue;

        targetSelf.dirty = true;

        if (lastIndexOf(dirtyTargets, target) === -1)
          dirtyTargets.push(target);

        CircuitProp.markDirtyTargets(targetSelf.targets);
      }

      if (timer !== null)
        return;

      timer = setTimeout(function updateDirtyTargets() {
        var updateTargets = dirtyTargets.slice();
        dirtyTargets = [];

        for (var i = 0, len = updateTargets.length; i < len; i++) {
          var target = updateTargets[i];
          if (target._self.dirty)
            target();
        }

        if (dirtyTargets.length !== 0)
          updateDirtyTargets();

        timer = null;
      }, 0);
    };
  })();

  var CircuitEvent = function(listener) {
    var self = this;

    var func = function(context) {
      var canceled = false;

      if (typeof context === 'undefined')
        context = null;

      var contextProp = function(value) {
        if (typeof value === 'undefined')
          return context;
        context = value;
      };

      var event = {
        cancel: function() {
          canceled = true;
        },
        dispatch: function() {
          self.dispatch(contextProp());
        },
        context: contextProp
      };

      if (typeof listener === 'function')
        listener(event);

      if (canceled)
        return;

      self.dispatch(contextProp());
    };

    func._self = self;

    this.func = func;
    this.targets = [];
    this.sources = [];

    return func;
  };

  CircuitEvent.prototype.dispatch = function(context) {
    var targets = this.targets;
    setTimeout(function() {
      for (var i = 0, len = targets.length; i < len; i++) {
        targets[i](context);
      }
    }, 0);
  };

  circuit.prop = function(initialValue) {
    return new CircuitProp(initialValue);
  };

  circuit.event = function(listener) {
    return new CircuitEvent(listener);
  };

  circuit.bind = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    var sourceSelf = source._self;
    var targetSelf = target._self;

    if (sourceSelf.constructor !== targetSelf.constructor)
      throw new TypeError('Cannot bind prop and event');

    sourceSelf.targets.push(target);
    targetSelf.sources.push(source);

    if (sourceSelf.constructor === CircuitProp) {
      CircuitProp.markDirtyTargets([target]);
      source();
    }
  };

  circuit.unbind = function(source, target) {
    if (!source || !target)
      throw new TypeError('Not enough arguments');

    var sourceSelf = source._self;
    var targetSelf = target._self;

    var targetIndex = lastIndexOf(sourceSelf.targets, target);

    if (targetIndex === -1)
      throw new Error('Already unbound');

    if (targetSelf.constructor === CircuitProp && targetSelf.dirty)
      target();

    var sourceIndex = lastIndexOf(targetSelf.sources, source);

    targetSelf.sources.splice(sourceIndex, 1);
    sourceSelf.targets.splice(targetIndex, 1);
  };

  if (typeof module !== 'undefined' && module.exports)
    module.exports = circuit;
  else
    global.circuit = circuit;
})(this);

},{}],"file-saver":[function(require,module,exports){
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/*global self */
/*jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs || (function(view) {
	"use strict";
	// IE <10 is explicitly unsupported
	if (typeof view === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
		return;
	}
	var
		  doc = view.document
		  // only get URL when necessary in case Blob.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = new MouseEvent("click");
			node.dispatchEvent(event);
		}
		, is_safari = /constructor/i.test(view.HTMLElement) || view.safari
		, is_chrome_ios =/CriOS\/[\d]+/.test(navigator.userAgent)
		, throw_outside = function(ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
		, arbitrary_revoke_timeout = 1000 * 40 // in ms
		, revoke = function(file) {
			var revoker = function() {
				if (typeof file === "string") { // file is an object URL
					get_URL().revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			};
			setTimeout(revoker, arbitrary_revoke_timeout);
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, auto_bom = function(blob) {
			// prepend BOM for UTF-8 XML and text/* types (including HTML)
			// note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
			if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
				return new Blob([String.fromCharCode(0xFEFF), blob], {type: blob.type});
			}
			return blob;
		}
		, FileSaver = function(blob, name, no_auto_bom) {
			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, force = type === force_saveable_type
				, object_url
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
						// Safari doesn't allow downloading of blob urls
						var reader = new FileReader();
						reader.onloadend = function() {
							var url = is_chrome_ios ? reader.result : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
							var popup = view.open(url, '_blank');
							if(!popup) view.location.href = url;
							url=undefined; // release reference before dispatching
							filesaver.readyState = filesaver.DONE;
							dispatch_all();
						};
						reader.readAsDataURL(blob);
						filesaver.readyState = filesaver.INIT;
						return;
					}
					// don't create more object URLs than needed
					if (!object_url) {
						object_url = get_URL().createObjectURL(blob);
					}
					if (force) {
						view.location.href = object_url;
					} else {
						var opened = view.open(object_url, "_blank");
						if (!opened) {
							// Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
							view.location.href = object_url;
						}
					}
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					revoke(object_url);
				}
			;
			filesaver.readyState = filesaver.INIT;

			if (can_use_save_link) {
				object_url = get_URL().createObjectURL(blob);
				setTimeout(function() {
					save_link.href = object_url;
					save_link.download = name;
					click(save_link);
					dispatch_all();
					revoke(object_url);
					filesaver.readyState = filesaver.DONE;
				});
				return;
			}

			fs_error();
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name, no_auto_bom) {
			return new FileSaver(blob, name || blob.name || "download", no_auto_bom);
		}
	;
	// IE 10+ (native saveAs)
	if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
		return function(blob, name, no_auto_bom) {
			name = name || blob.name || "download";

			if (!no_auto_bom) {
				blob = auto_bom(blob);
			}
			return navigator.msSaveOrOpenBlob(blob, name);
		};
	}

	FS_proto.abort = function(){};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined" && module.exports) {
  module.exports.saveAs = saveAs;
} else if ((typeof define !== "undefined" && define !== null) && (define.amd !== null)) {
  define("FileSaver.js", function() {
    return saveAs;
  });
}

},{}],"jcore":[function(require,module,exports){
/**
 * jCore v0.3.1
 * (c) 2016 iOnStage
 * Released under the MIT License.
 */

(function(global) {
  'use strict';

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = function(callback) {
      return setTimeout(callback, 1000 / 60);
    };
  }

  var inherits = function(ctor, superCtor) {
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true,
      },
    });
  };

  var dom = {};

  dom.rect = function(el) {
    return el.getBoundingClientRect();
  };

  dom.offsetLeft = function(el) {
    return dom.rect(el).left - el.scrollLeft - dom.rect(document.body).left;
  };

  dom.offsetTop = function(el) {
    return dom.rect(el).top - el.scrollTop - dom.rect(document.body).top;
  };

  dom.on = function(el, type, listener, useCapture) {
    el.addEventListener(type, listener, !!useCapture);
  };

  dom.off = function(el, type, listener, useCapture) {
    el.removeEventListener(type, listener, !!useCapture);
  };

  dom.supportsTouch = function() {
    return ('ontouchstart' in window || (typeof DocumentTouch !== 'undefined' && document instanceof DocumentTouch));
  };

  dom.changedTouch = function(event) {
    return (dom.supportsTouch() && 'changedTouches' in event ? event.changedTouches[0] : null);
  };

  dom.eventType = function(name) {
    switch (name) {
      case 'start':
        return (dom.supportsTouch() ? 'touchstart' : 'mousedown');
      case 'move':
        return (dom.supportsTouch() ? 'touchmove' : 'mousemove');
      case 'end':
        return (dom.supportsTouch() ? 'touchend' : 'mouseup');
      default:
        throw new Error('Invalid event type');
    }
  };

  dom.pageX = function(event) {
    return (dom.changedTouch(event) || event).pageX;
  };

  dom.pageY = function(event) {
    return (dom.changedTouch(event) || event).pageY;
  };

  dom.clientX = function(event) {
    return (dom.changedTouch(event) || event).clientX;
  };

  dom.clientY = function(event) {
    return (dom.changedTouch(event) || event).clientY;
  };

  dom.identifier = function(event) {
    var touch = dom.changedTouch(event);
    return (touch ? touch.identifier : null);
  };

  dom.Draggable = (function() {
    var Draggable = function(element) {
      this.element = element;
      this.start = this.start.bind(this);
      this.move = this.move.bind(this);
      this.end = this.end.bind(this);
      this.onstart = null;
      this.onmove = null;
      this.onend = null;
      this.lock = false;
      this.identifier = null;
      this.startPageX = 0;
      this.startPageY = 0;
      this.context = {};
    };

    Draggable.prototype.enable = function(listeners) {
      this.onstart = listeners.onstart;
      this.onmove = listeners.onmove;
      this.onend = listeners.onend;
      dom.on(this.element, dom.eventType('start'), this.start);
    };

    Draggable.prototype.disable = function() {
      dom.off(this.element, dom.eventType('start'), this.start);
      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);
      this.onstart = null;
      this.onmove = null;
      this.onend = null;
      this.lock = false;
      this.context = {};
    };

    Draggable.prototype.start = function(event) {
      if (this.lock) {
        return;
      }

      this.lock = true;
      this.identifier = dom.identifier(event);
      this.startPageX = dom.pageX(event);
      this.startPageY = dom.pageY(event);

      var x = dom.clientX(event) - dom.offsetLeft(this.element);
      var y = dom.clientY(event) - dom.offsetTop(this.element);
      this.onstart.call(null, x, y, event, this.context);

      dom.on(document, dom.eventType('move'), this.move);
      dom.on(document, dom.eventType('end'), this.end);
    };

    Draggable.prototype.move = function(event) {
      if (this.identifier && this.identifier !== dom.identifier(event)) {
        return;
      }

      var dx = dom.pageX(event) - this.startPageX;
      var dy = dom.pageY(event) - this.startPageY;
      this.onmove.call(null, dx, dy, event, this.context);
    };

    Draggable.prototype.end = function(event) {
      if (this.identifier && this.identifier !== dom.identifier(event)) {
        return;
      }

      dom.off(document, dom.eventType('move'), this.move);
      dom.off(document, dom.eventType('end'), this.end);

      var dx = dom.pageX(event) - this.startPageX;
      var dy = dom.pageY(event) - this.startPageY;
      this.onend.call(null, dx, dy, event, this.context);

      this.lock = false;
    };

    return Draggable;
  })();

  var Component = function(props) {
    this.element = this.prop(props.element || this.render());
    this.parentElement = this.prop(this.element().parentNode);
    this.relations = [];
    this.cache = {};
    this.listeners = {};
  };

  Component.prototype.findElement = function(selectors) {
    return this.element().querySelector(selectors);
  };

  Component.prototype.prop = function(initialValue) {
    var cache = initialValue;
    return function(value) {
      if (typeof value === 'undefined') {
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
    if (this.relations.indexOf(relation) === -1) {
      this.relations.push(relation);
    }
  };

  Component.prototype.removeRelation = function(relation) {
    var index = this.relations.indexOf(relation);
    if (index !== -1) {
      this.relations.splice(index, 1);
    }
  };

  Component.prototype.on = function(type, listener) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(listener);
  };

  Component.prototype.emit = function() {
    var args = Array.prototype.slice.call(arguments);
    var type = args.shift();
    var listeners = this.listeners[type];
    if (!listeners) {
      return;
    }
    for (var i = 0, len = listeners.length; i < len; i++) {
      listeners[i].apply(this, args);
    }
  };

  Component.prototype.removeAllListeners = function(type) {
    if (this.listeners[type]) {
      delete this.listeners[type];
    } else {
      this.listeners = {};
    }
  };

  Component.prototype.redraw = function() {
    var element = this.element();
    var parentElement = this.parentElement();
    this.onredraw();
    if (parentElement && parentElement !== element.parentNode) {
      this.onappend();
      parentElement.appendChild(element);
    } else if (!parentElement && element.parentNode) {
      this.onremove();
      element.parentNode.removeChild(element);
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
      if (value !== this.cache[key]) {
        this.cache[key] = value;
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
    return document.createElement('div');
  };

  Component.prototype.oninit = function() {};

  Component.prototype.onappend = function() {};

  Component.prototype.onremove = function() {};

  Component.prototype.onredraw = function() {};

  Component.main = (function() {
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
        var relations = component.relations;
        for (var ri = 0, rlen = relations.length; ri < rlen; ri++) {
          relations[ri].update(component);
        }
      }

      // may be inserted other dirty components by updating relations
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
  })();

  Component.inherits = function(initializer) {
    var superCtor = this;
    var ctor = function() {
      var props = (arguments.length !== 0 ? arguments[0] : {});
      superCtor.call(this, props);
      if (typeof initializer === 'function') {
        initializer.call(this, props);
      }
      if (this.constructor === ctor) {
        this.oninit();
      }
    };
    inherits(ctor, superCtor);
    ctor.inherits = superCtor.inherits;
    return ctor;
  };

  var Relation = function() {};

  Relation.prototype.update = function(component) {};

  Relation.inherits = function(initializer) {
    var superCtor = this;
    var ctor = function() {
      if (typeof initializer === 'function') {
        var props = (arguments.length !== 0 ? arguments[0] : {});
        initializer.call(this, props);
      }
    };
    inherits(ctor, superCtor);
    return ctor;
  };

  var Draggable = function(component) {
    this.component = component;
    this.draggable = new dom.Draggable(component.element());
  };

  Draggable.prototype.enable = function() {
    this.draggable.enable({
      onstart: this.onstart.bind(this, this.component),
      onmove: this.onmove.bind(this, this.component),
      onend: this.onend.bind(this, this.component),
    });
  };

  Draggable.prototype.disable = function() {
    this.draggable.disable();
  };

  Draggable.prototype.onstart = function(component, x, y, event, context) {};

  Draggable.prototype.onmove = function(component, dx, dy, event, context) {};

  Draggable.prototype.onend = function(component, dx, dy, event, context) {};

  Draggable.inherits = function() {
    var superCtor = this;
    var ctor = function(component) {
      superCtor.call(this, component);
    };
    inherits(ctor, superCtor);
    return ctor;
  };

  var jCore = {
    Component: Component,
    Relation: Relation,
    Draggable: Draggable,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = jCore;
  } else {
    global.jCore = jCore;
  }
})(this);

},{}]},{},[]);
