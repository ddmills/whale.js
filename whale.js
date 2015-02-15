(function () {
  // establish root object (typically window)
  var root = this;

  // save previous value of root.whale
  var previousWhale = root.whale;

  // safe reference to whale
  var whale = function (obj) {
    if (obj instanceof whale) return whale;
    if (! (this instanceof whale)) return new whale (obj);
    this._Wrapped = obj;
  };

  // should probably do checking for node and require
  root.whale = whale;

  // current version of whale
  whale.VERSION = '0.0.1';

  // offer a no conflict option to remove from root
  whale.noConflict = function () {
    root.whale = previousWhale;
    return this;
  }

  // Class inheritance idea from John Resig http://ejohn.org/
  // modified to include initialize()
  var fnTest = /xyz/.test (function(){xyz;}) ? /\b_super\b/ : /.*/;
  var INITIALIZING;
  var Class = whale.Class = function () {};
  Class.prototype.initialize = function () {
    // all objects should have a unique id
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

  var make = whale.make = function (key) {
    var args, dep, tmp, inst;

    // extract the named dependency
    dep = get(key);

    // get rest of the arguments
    args = Array.prototype.slice.call (arguments, 1);

    // check if target is callable
    if (typeof dep === 'function') {
      // temporary constructor
      tmp = function () {};

      // give tmp constructor the same prototype as the target
      tmp.prototype = dep.prototype;

      // create an instance of tmp to get prototype
      inst = new tmp;

      // call target constructor from context of inst and send arguments
      ret = dep.apply (inst, args);

      // return if dep constructor returned object, else return inst
      return Object (ret) === ret ? ret : inst;
    } else {
      // just return the dep instance since it's not callable
      return dep;
    }
  }

  // Register an object with whale
  var register = whale.register = function (key, value) {
    registered[key] = value;
    return registered[key];
  }

  // Inject array of dependencies into object
  var inject = whale.inject = function (deps, obj) {
    var args, i;

    args = [];

    // retrieve all dependencies
    for (i = 0; i < deps.length; i++) {
      args.push (whale.get (deps[i]));
    }

    // return a wrapper to the object with dependencies injected
    return obj.extend ({
      construct: function () {
        // call super constructor if it exists
        if (this._super)
          this._super.apply (this, args.concat (Array.prototype.slice.call (arguments, 0)));
      }
    });
  }

  // Factory creates a new class based on proto.
  // It will build the class and insert the array of dependencies
  // into the constructor.
  // Factory will also register the resulting object as "name" if given.
  // Leave name null if you don't want the object to be registered.
  var Factory = whale.Factory = function (name, deps, proto) {
    var obj = inject (deps, Class.extend (proto));
    if (name != null) return register (name, obj);
    return obj;
  }

  // Similiar to Factory, Service will make a new object based on proto
  // with the array of given dependencies. Service will create a single
  // instance of the new class and register that instance as given name
  var Service = whale.Service = function (name, deps, proto) {
    var obj = new (inject (deps, Class.extend (proto)));
    if (name != null) return register (name, obj);
    return obj;
  }
  // ### Dispatcher Class
  // The Dispatcher class can trigger events
  var Dispatcher = whale.Dispatcher = Class.extend ({
    // initialize is similiar to the construct method, exept it doesn't
    // need to be called with _super(). It will always run before the
    // construct method. Using initialize will gaurantee that the class
    // will always have certain fresh properties. In this case, anything
    // that extends whale.Dispatcher will have a variable called _events.
    initialize: function () {
      // events holds a list of listeners grouped by event
      this._events = [];
    },

    // dispatch will retrieve and send out callbacks for the given event
    _dispatch: function (name) {
      if (!this._events[name]) return this;
      for (var i = 0; i < this._events[name].length; i++) {
        var listener = this._events[name][i];
        // a listener callback can be a function, or a string
        // which represents a function name. Using this method, we can
        // invoke the function name string on the registered context
        if (typeof listener.action === 'function') {
          listener.action.call (listener.ctx, this);
        } else {
          var fn = listener.ctx[listener.action];
          fn.call (listener.ctx, this);
        }
      }
      return this;
    },

    // trigger can be called on a list of events to dispatch
    // note that events are just strings
    trigger: function () {
      for (var i = 0; i < arguments.length; i++)
        this._dispatch (arguments[i]);
      return this;
    },

    // register a callback (action) for given event (evnt)
    // and use given context (ctx)
    when: function (evnt, action, ctx) {
      var events = this._events[evnt] || (this._events[evnt] = []);
      ctx = ctx || this; // default context is the current object
      events.push ({ action: action, ctx: ctx });
      return this;
    },

    // Stop listening to an event
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

  // ### Listener
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

  // ### View
  var View = whale.View = function (name, deps, proto) {
    var obj = inject (deps, Dispatcher.extend (proto));
    if (name != null) return register (name, obj);
    return obj;
  }

  // ### Controller
  var Controller = whale.Controller = function (name, deps, proto) {
    var obj = inject (deps, Listener.extend (proto));
    if (name != null) return register (name, obj);
    return obj;
  }

}.call(this));