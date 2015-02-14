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

  /* Class inheritance idea from John Resig http://ejohn.org/
   * modified to include initialize()
   */
  var fnTest = /xyz/.test (function(){xyz;}) ? /\b_super\b/ : /.*/;
  var INITIALIZING;
  var Class = whale.Class = function () {};
  Class.prototype.initialize = function () {
    /* all objects should have a unique id */
    this._id = genId();
  },

  Class.extend = function (prop) {
    var _super, prototype, name;

    _super = this.prototype;

    INITIALIZING = true;
    prototype = new this;
    INITIALIZING = false;

    for (name in prop) {
      prototype[name] =
        name != 'initialize' &&
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
      if (name == 'initialize') {
        prototype[name] = function () {
          _super.initialize.apply (this);
          prop.initialize.apply (this);
        }
      }
    }

    function Class() {
      if (!INITIALIZING) {
         if (this.initialize) this.initialize.apply (this, arguments);
         if (this.construct) this.construct.apply (this, arguments);
       }
    }

    Class.prototype = prototype;
    Class.prototype.constructor = Class;
    Class.extend = arguments.callee;

    return Class;
  }


  var ID_COUNT = 0;
  var genId = whale.genId = function (prefix) {
    var id = ++ID_COUNT + '';
    return prefix ? prefix + id : id;
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
    return obj.extend ({
      construct: function () {
        this._super.apply (this, args.concat (Array.prototype.slice.call (arguments, 0)));
      }
    });
  }

  var Factory = whale.Factory = function (name, deps, proto) {
    /* Factory injects and saves the class */
    var obj = inject (deps, Class.extend (proto));
    if (name != null) return register (name, obj);
    return obj;
  }

  var Service = whale.Service = function (name, deps, proto) {
    /* Service gets instantiated right away */
    var obj = new (inject (deps, Class.extend (proto)));
    if (name != null) return register (name, obj);
    return obj;
  }

  var Dispatcher = whale.Dispatcher = Class.extend ({
    initialize: function () {
      this._events = [];
    },
    _dispatch: function (name) {
      if (!this._events[name]) return this;
      for (var i = 0; i < this._events[name].length; i++) {
        var listener = this._events[name][i];
        if (typeof listener.action === 'function') {
          listener.action.call (listener.ctx, this);
        } else {
          var fn = listener.ctx[listener.action];
          fn.call (listener.ctx, this);
        }
      }
      return this;
    },
    trigger: function () {
      for (var i = 0; i < arguments.length; i++)
        this._dispatch (arguments[i]);
      return this;
    },
    when: function (evnt, action, ctx) {
      var events = this._events[evnt] || (this._events[evnt] = []);
      ctx = ctx || this;
      events.push ({ action: action, ctx: ctx });
      return this;
    },
    stop: function (evnt, action, ctx) {
      var events, i;

      if (!evnt && !action && !ctx) {
        this._events = [];
        return this;
      }

      evntKeys = evnt ? [evnt] : Object.keys(this._events);
      for (i = 0; i < evntKeys.length; i++) {
        var acts, remaining, e, k;

        evnt = evntKeys[i];
        acts = this._events[evnt];

        if (!acts) continue;

        if (!action && !ctx) {
          delete this._events[evnt];
          continue;
        }

        remaining = [];
        for (k = 0; k < acts.length; k++) {
          e = acts[k];
          if (
            action && action !== e.action &&
            action !== e.action._action ||
            ctx && ctx !== e.ctx
          ) {
            remaining.push (e);
          }
        }

        if (remaining.length) {
          this._events[evnt] = remaining;
        } else {
          delete this._events[evnt];
        }
      }
      return this;
    }

  });

  var Listener = whale.Listener = Class.extend ({
    initialize: function () {
      this._listening = {};
    },
    listen: function (dispatcher, evnt, action, ctx) {
      ctx = ctx || this;
      var id = dispatcher._id;
      this._listening[id] = dispatcher;
      dispatcher.when (evnt, action, ctx);
      return this;
    },
    listenOnce: function (dispatcher, evnt, action, ctx) {
      ctx = ctx || this;
      var cb = function () {
        this.stopListening (dispatcher, evnt, cb);
        action.apply (this, arguments);
      }
      cb._action = action;
      return this.listen (dispatcher, evnt, cb, ctx);
    },
    stopListening: function (dispatcher, evnt, action, ctx) {
      var id, disp;

      id = dispatcher._id;
      ctx = ctx || this;

      for (var id in this._listening) {
        disp = this._listening[id];
        disp.stop (evnt, action, ctx);
      }

      if (!Object.keys (this._listening[id]).length) delete this._listening[id];
      return this;
    }
  });
}.call(this));