(function(app) {
  'use strict';

  var dom = app.dom || require('./dom.js');
  var CircuitModule = app.CircuitModule || require('./models/circuit-module.js');
  var Main = app.Main || require('./components/main.js');

  dom.export('OrderModule', CircuitModule.OrderModule);
  app.main = new Main({ element: dom.body() });
})(this.app || (this.app = {}));
