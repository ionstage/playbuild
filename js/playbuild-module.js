(function(window) {
  'use strict';

  Object.defineProperty(window, 'playbuild', {
    value: Object.create(Object.prototype, {
      Module: { value: window.parent.PlayBuildModule },
      exports: { value: null, writable: true },
    }),
  });
})(this);
