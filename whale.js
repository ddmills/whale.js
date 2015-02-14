(function () {
  /* establish root object (typically window) */
  var root = this;

  /* save previous value of root.whale */
  var previousWhale = root.whale;

  /* safe reference to whale */
  var whale = function (obj) {
    if (obj instanceof whale) return whale;
    if (! (this instanceof whale)) return new whale (obj);
    this._Wrapped = obj;
  };

  /* should probably do checking for node and require */
  root.whale = whale;

  /* current version of whale */
  whale.VERSION = '0.0.1';

  /* offer a no conflict option to remove from root */
  whale.noConflict = function () {
    root.whale = previousWhale;
    return this;
  }

  /* Class inheritance by
   * John Resig http://ejohn.org/
   * MIT Licensed
   */
  var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
  var INITIALIZING;
  var Class = whale.Class = function () {};
  Class.extend = function (prop) {
    var _super, prototype, name;

    _super = this.prototype;

    INITIALIZING = true;
    prototype = new this;
    INITIALIZING = false;

    for (name in prop) {
      prototype[name] =
        typeof prop[name] == 'function' &&
        typeof _super[name] == 'function' &&
        fnTest.test (prop[name])
        ? (function (name, fn) {
            return function () {
              var tmp, ret;
              tmp = this._super;
              this._super = _super[name];
              ret = fn.apply (this, arguments);
              this._super = tmp;
              return ret;
            };
          }) (name, prop[name])
        : prop[name];
    }

    function Class() {
      if (!INITIALIZING && this.init) this.init.apply (this, arguments);
    }

    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = arguments.callee;

    return Class;
  }

  var registered = {};

  var get = whale.get = function (key) {
    if (!registered[key]) {
      throw 'whale inject cannot resolve given dependency "' + key + '"... ' +
            'could not find it in list registered dependencies';
    }
    return registered[key];
  }

  var register = whale.register = function (key, value) {
    registered[key] = value;
    return registered[key];
  }

  var inject = whale.inject = function (deps, obj) {
    var args, i;

    args = [];

    /* retrieve all dependencies */
    for (i = 0; i < deps.length; i++) {
      args.push (whale.get (deps[i]));
    }

    /* return a wrapper to the object with dependencies injected */
    return obj.extend({
      init: function () {
        this._super.apply (this, args.concat (Array.prototype.slice.call (arguments, 0)));
      }
    });
  }

  var Factory = whale.Factory = function (name, deps, proto) {
    var obj = Class.extend (proto);

    obj = inject (deps, obj);

    if (name != null) {
      return register (name, obj);
    }

    return obj;
  }

  var Service = whale.Service = function (name, deps, proto) {
    var obj = Class.extend (proto);
    obj = new (inject (deps, obj));
    if (name != null) {
      return register (name, obj);
    }
    return obj;
  }



}.call(this));