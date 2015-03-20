!(function () {
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

  var isFunction = whale.isFunction = function (obj) {
    return typeof obj === 'function';
  }

  // Class inheritance idea from John Resig http://ejohn.org/
  // modified to include initialize()
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
        isFunction (prop[name]) &&
        isFunction (_super[name]) &&
        isFunction (prop[name])
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
    if (isFunction (dep)) {
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

  // ## Factory
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

  // ## Service
  // Similiar to Factory, Service will make a new object based on proto
  // with the array of given dependencies. Service will create a single
  // instance of the new class and register that instance as given name
  var Service = whale.Service = function (name, deps, proto) {
    var obj = new (inject (deps, Class.extend (proto)));
    if (name != null) return register (name, obj);
    return obj;
  }

  // ## Dispatcher Class
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
      var evnts = this._events[name];
      if (!evnts) return this;
      for (var i = 0; i < evnts.length; i++) {
        var listener = evnts[i];
        // a listener callback can be a function, or a string
        // which represents a function name. Using this method, we can
        // invoke the function name string on the registered context
        if (isFunction (listener.action)) {
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
      for (var i = 0; i < arguments.length; i++) {
        this._dispatch (arguments[i]);
      }
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

  // ## Listener
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

      ctx = ctx || this;

      // if no arguments were provided, stop listening to everything
      if (!dispatcher && !evnt && !action) {
        for (var id in this._listening) {
          disp = this._listening[id];
          disp.stop (evnt, action, ctx);
          if (!Object.keys (this._listening[id]).length) delete this._listening[id];
        }
        return this;
      }

      // we need a valid Dispatcher from here on out
      // TODO: also allow dispatcher to be null, and remove all events with same name!
      if (! (dispatcher instanceof Dispatcher)) {
        throw 'First argument was not a valid Dispatcher object';
      }

      // we only want to stop listening to this specific dispatcher
      id = dispatcher._id;
      disp = this._listening[id];
      // Dispatcher.stop will sort out if evnt, action, or ctx are null
      disp.stop (evnt, action, ctx);
      if (!Object.keys (this._listening[id]).length) delete this._listening[id];
      return this;
    }
  });

  // ## Model
  // TODO
  var Model = whale.Model = Dispatcher.extend ({
  });

  // ## View
  // View is just a factory that extends Dispatcher
  // Views can only send out events, and not listen to anything. Note
  // that doesn't mean Views don't listen to DOM events, Views should listen
  // to DOM events, and pass those on to Controllers.
  var View = whale.View = function (name, deps, proto) {
    var obj = inject (deps, Dispatcher.extend (proto));
    if (name != null) return register (name, obj);
    return obj;
  }

  // ## Controller
  // Controller is just a factory that extends Listener
  // Controllers should be able to listen to events models and views
  // to wire them together
  var Controller = whale.Controller = function (name, deps, proto) {
    var obj = inject (deps, Listener.extend (proto));
    if (name != null) return register (name, obj);
    return obj;
  }

  // ## whale.promise
  // a small promise callback library with done, fail, always
  var promise = whale.promise = whale.register ('whale.promise', whale.Class.extend ({
    initialize: function () {
      this._response = null;
      this._onDone = [];
      this._onFail = [];
      this._onAlways = [];
      this.pending = true;
      this.fulfilled = false;
      this.rejected = false;
      this.settled = false;
    },

    construct: function(ctx) {
      this._ctx = ctx || this;
    },

    resolve: function () {
      if (this.pending) {
        this._response = arguments;
        this.fulfilled = true;
        this.settled = true;
        this.pending = false;
        for (var i = 0; i < this._onDone.length; i++) {
          this._onDone[i][0].apply (this._onDone[i][1], arguments);
        }
        for (var i = 0; i < this._onAlways.length; i++) {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(true);
          this._onAlways[i][0].apply (this._onAlways[i][1], args);
        }
      }
      return this;
    },

    reject: function () {
      if (this.pending) {
        this._response = arguments;
        this.rejected = true;
        this.settled = true;
        this.pending = false;
        for (var i = 0; i < this._onFail.length; i++) {
          this._onFail[i][0].apply (this._onFail[i][1], arguments);
        }
        for (var i = 0; i < this._onAlways.length; i++) {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(false);
          this._onAlways[i][0].apply (this._onAlways[i][1], args);
        }
      }
      return this;
    },

    done: function (cb, ctx) {
      var c = ctx || this._ctx;
      this._onDone.push ([cb, c]);
      if (this.fulfilled) cb.apply (c, this._response);
      return this;
    },

    fail: function (cb, ctx) {
      var c = ctx || this._ctx;
      this._onFail.push ([cb, c]);
      if (this.rejected) cb.apply (c, this._response);
      return this;
    },

    always: function (cb, ctx) {
      var c = ctx || this._ctx;
      this._onAlways.push ([cb, c]);
      if (this.settled) cb.apply (c, this.fulfilled, this._response);
      return this;
    }
  }));

  // ## whale.node
  // simple DOM selector/manipulator
  var node = whale.node = whale.register ('whale.node', whale.Class.extend ({
    splice: Array.prototype.splice,

    init: function () {
      this.length = 0;
    },

    construct: function (s) {
      if (s.constructor === Array) {
        this.elem = s;
      } else if (s && s.nodeType) {
        this.elem = [s];
      } else if (typeof s == 'string') {
        this.elem = [];
        var div = document.createElement ('div');
        div.innerHTML = s;
        for (var i = div.childNodes.length-1; i >= 0; i--) {
          this.elem[i] = div.childNodes[i];
        }
      }
    },

    on: function (e, cb, ctx) {
      var self = this;
      ctx = ctx || this;
      return this.each (function (n) {
        n.addEventListener (e, function() {
          cb.call (ctx, self);
        });
      });
    },

    off: function (e, cb) {
      return this.each (function (c) {
        c.removeEventListener (e, cb)
      });
    },

    remove: function () {
      return this.each (function (e) { e.parentNode.removeChild (e); });
    },

    addClass: function (c) {
      return this.each (function (e) { e.className += ' ' + c; });
    },

    each: function (cb) {
      for (var i = 0; i < this.elem.length; i++) {
        cb (this.elem[i]);
      }
      return this;
    },

    outer: function () {
      return this.elem[0].outerHTML;
    },

    html: function (snippet) {
      if (snippet || snippet === '') {
        if (snippet instanceof this.constructor) {
          return this.each (function(e) {
            e.innerHTML = '';
            snippet.each (function (e2) {
              e.appendChild (e2);
            });
          });
        }
        return this.each (function (e) {
          e.innerHTML = snippet;
        });
      }
      return this.elem[0].innerHTML;
    },

    append: function (snippet) {
      if (snippet instanceof this.constructor) {
        return this.each (function (e) {
          snippet.each (function (e2) {
            e.appendChild (e2);
          });
        });
      }
      return e.insertAdjacentHTML ('beforeend', snippet);
    },

    prepend: function (snippet) {
      if (snippet instanceof this.constructor) {
        return this.each (function (e) {
          snippet.each (function (e2) {
            e.insertBefore (e2, e.firstChild);
          });
        });
      }
      return e.insertAdjacentHTML ('afterbegin', snippet);
    },

    before: function (snippet) {
      if (snippet instanceof this.constructor) {
        return this.each (function (e) {
          snippet.each (function(e2) {
            // e.parentNode.insertBefore(e2, e.nextSibling);
            e.parentNode.insertBefore (e2, e);
          });
        });
      }
      return this.each (function (e) {
        e.insertAdjacentHTML ('beforebegin', snippet);
      });
    },

    after: function (snippet) {
      var self = this;
      if (snippet instanceof self.constructor) {
        return this.each (function (e) {
          snippet.each (function(e2) {
            e.parentNode.insertBefore (e2, e.nextSibling);
          });
        });
      }
      return this.each (function (e) {
        e.insertAdjacentHTML ('afterend', snippet);
      });
    },

    find: function (selector) {
      var res = [];
      this.each (function (e) {
        var q = e.querySelectorAll (selector);
        for (var i = q.length-1; i >= 0; i--) {
          res[i] = q[i];
        }
      });
      return new this.constructor (res);
    },

    val: function (data) {
      // TODO check type of node
      if (data) {
        this.each (function () {
          this.value = data;
        });
      } else {
        return this.elem[0].value;
      }
    }
  }));

  // ## whale.dom
  // base DOM object which can find and create new nodes
  var dom = whale.dom = whale.Service ('whale.dom', ['whale.node'], {
    _matches: {
      '#': 'getElementById',
      '.': 'getElementsByClassName',
      '@': 'getElementsByName',
      '=': 'getElementsByTagName'
    },

    construct: function (node) {
      this.node = node;
    },

    find: function (s, complex) {
      // FIXME make similar to whale.node.find
      complex = complex || /\s/.test (s);
      if (!complex && this._matches[s[0]]) return new this.node (document[this._matches[s[0]]] (s.slice (1)));
      return new this.node (document.querySelectorAll (s));
    }
  });

  // ## whale.ajax
  // A service for making AJAX calls, depends on whale.promise
  var ajax = whale.ajax = whale.Service ('whale.ajax', ['whale.promise'], {
    construct: function (Prom) {
      this.Prom = Prom;
      this.req = false;
    },

    _xhr: function() {
      return new XMLHttpRequest;
    },

    encode: function(data) {
      if (!data) return '';

      var encoded, append;

      encoded = [];

      append = function (k, v) {
        v = isFunction (v) ? v () : (v == null ? '' : v);
        encoded[encoded.length] = encodeURIComponent (k) + '=' + encodeURIComponent(v);
      }

      if (Array.isArray (data) || typeof data === 'object') {
        for (var k in data) {
          if (data.hasOwnProperty (k)) append (k, data[k]);
        }
      } else {
        append (data);
      }

      return encoded.join ('&').replace (/%20/g, '+');
    },

    // Send a request with a URL
    request: function (params) {
      var p, req, type, body, url;

      if (typeof params === 'string') {
        params = { url: params };
      }

      if (params.url) {
        url = params.url;
      } else {
        throw 'a url parameter must be specified';
      }

      type = (params.type || params.method || 'GET').toUpperCase ();
      body = this.encode (params.body || params.data || '');
      parse = params.parse || false;
      headers = params.headers || {};
      content = params.content || 'application/x-www-form-urlencoded; charset=UTF-8';

      p = new this.Prom;
      req = this._xhr();


      // TODO check timeout
      req.onreadystatechange = function () {
        if (req.readyState == 4) {
          var s = req.status;
          if (!s || (s < 200 || s >= 300) && s !== 304) {
            if (parse) {
              try {
                p.reject (JSON.parse (req.responseText), req);
              } catch (e) {
                p.reject ('Ajax request returned with error status: ' + req.status, req);
              }
            } else {
              p.reject (req.responseText, req);
            }
          } else {
            if (parse) {
              try {
                p.resolve (JSON.parse (req.responseText), req);
              } catch (e) {
                p.reject ('responseText is not valid JSON', req);
              }
            } else {
              p.resolve (req.responseText, req);
            }
          }
        }
      };

      if (req) {
          if (type == 'GET' && body) {
            url += '?' + body;
            body = null;
          }

          req.open (type, url);
          req.setRequestHeader ('X-Requested-With', 'XMLHttpRequest');

          if (type == 'POST') {
            req.setRequestHeader ('Content-Type', content);
            req.setRequestHeader ('Content-length', body.length);
            req.setRequestHeader ('Connection', 'close');
          }

          for (var h in headers) {
            if (headers.hasOwnProperty (h)) {
              req.setRequestHeader (h, headers[h]);
            }
          }

          req.send (body);
      } else {
        p.reject('window does not support ActiveXObject or XMLHttpRequest');
      }
      return p;
    },

    get: function (parameters) {
      return this.request (parameters);
    },

    post: function (parameters) {
      if (typeof parameters === 'string') {
        var url = parameters;
        parameters = { type: 'POST', url: url };
      } else {
        parameters.type = 'POST';
      }
      return this.request (parameters);
    },

    put: function (parameters) {
      if (typeof parameters === 'string') {
        var url = parameters;
        parameters = { type: 'PUT', url: url };
      } else {
        parameters.type = 'PUT';
      }
      return this.request (parameters);
    },

    delete: function (parameters) {
      if (typeof parameters === 'string') {
        var url = parameters;
        parameters = { type: 'DELETE', url: url };
      } else {
        parameters.type = 'DELETE';
      }
      return this.request (parameters);
    }

  });

}.call(this));