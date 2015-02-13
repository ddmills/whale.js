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

  /* list of registered dependencies */
  var dependencies = {};


  var get = whale.get = function (key) {
    return dependencies[key];
  }

  var make = whale.make = function (key) {
    var args, dep, tmp, inst;

    /* extract the named dependency */
    dep = get(key);

    /* get rest of the arguments */
    args = Array.prototype.slice.call (arguments, 1);

    /* check if target is callable */
    if (typeof dep === 'function') {
      /* temporary constructor */
      tmp = function () {};

      /* give tmp constructor the same prototype as the target */
      tmp.prototype = dep.prototype;

      /* create an instance of tmp to get prototype */
      inst = new tmp;

      /* call target constructor from context of inst and send arguments */
      ret = dep.apply (inst, args);

      /* return if dep constructor returned object, else return inst */
      return Object (ret) === ret ? ret : inst;
    } else {
      /* just return the dep instance since it's not callable */
      return dep;
    }
  }

  /* register a dependency */
  var register = whale.register = function (key, value) {
    dependencies[key] = value;
    return dependencies[key];
  }

  /* inject dependencies into a function */
  var inject = whale.inject = function (deps, func, ctx) {
    var args = [];
    ctx = ctx || {};

    /* make sure function was provided for second value */
    if (typeof func !== 'function') {
      throw 'whale inject was not provided with a function to inject to... ' +
            'found "' + (typeof func) + '" instead';
    }

    /* loop through all given dependencies */
    _.each (deps, function (d) {
      /* make sure dependency is registered */
      if (!dependencies[d]) {
        throw 'whale inject cannot resolve given dependency "' + d + '"... ' +
              'could not find it in list registered dependencies';
      }

      /* push dependency value to argument list */
      args.push (dependencies[d]);
    }, this);

    /* return a wrapper to the function with dependencies injected */
    return function () {
      return func.apply (ctx, args.concat (Array.prototype.slice.call (arguments, 0)));
    }
  };

  /* register a Service (initialized on creation with "new") */
  var Service = whale.Service = function (name, deps, func, ctx) {
    return register (name, (new (inject (deps, func, ctx))));
  }

  /* register a Factory (use to create your own instances with new) */
  var Factory = whale.Factory = function (name, deps, func, ctx) {
    var factory = inject (deps, func, ctx)();
    if (name) return register (name, factory);
    return factory;
  }

  var Dispatcher = whale.Dispatcher = Factory (null, [], function () {
    var events, dispatch, id;

    events = [];

    dispatch = function (name, args) {
      if (!events[name]) return this;
      _.each (events[name], function (listener) {
        if (typeof listener.action === 'function') {
          listener.action.call (listener.ctx);
        } else {
          var fn = listener.ctx[listener.action];
          fn.call (listener.ctx);
        }
      }, this);
      return this;
    }

    Dispatcher = function () {
      id = _.uniqueId ('dispatcher-');
    };

    Dispatcher.prototype = {
      trigger: function () {
        _.each (arguments, dispatch, this);
        return this;
      },

      when: function (subject, action, ctx) {
        var evnts = events[subject] || (events[subject] = []);
        ctx = ctx || this;
        evnts.push ({ action: action, ctx: ctx });
        return this;
      },

      id: function() {
        return id;
      },

      stop: function (subject, action, ctx) {
        var subjects, i;

        if (!subject && !action && !ctx) {
          events = [];
          return this;
        }

        subjects = subject ? [subject] : _.keys (events);
        for (i = 0; i < subjects.length; i++) {
          var acts, remaining, e, k;

          subject = subjects[i];

          acts = events[subject];

          if (!acts) continue;

          if (!action && !ctx) {
            delete events[subject];
            continue;
          }

          remaining = [];

          /* find remaining events and keep them */
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
            events[subject] = remaining;
          } else {
            delete events[subject];
          }
        }

        return this;
      }
    }

    return Dispatcher;
  });

  /* A listener can listen to dispatched events, but it can also unsubscribe itself */
  var Listener = whale.Listener = Factory (null, [], function () {
    var listening, id;

    listening = {};

    Listener = function () {
      id = _.uniqueId ('listener-');
    };

    Listener.prototype = {
      listen: function (dispatcher, subject, action, ctx) {
        ctx = ctx || this;
        var id = dispatcher.id ();
        listening[id] = dispatcher;
        dispatcher.when (subject, action, ctx);
        return this;
      },

      listenOnce: function (dispatcher, subject, action, ctx) {
        ctx = ctx || this;
        var cb = _.once (function () {
          this.stopListening (dispatcher, subject, cb);
          action.apply (this, arguments);
        });
        /* save action so we can remove this later if necessary */
        cb._action = action;
        return this.listen (dispatcher, subject, cb, ctx);
      },

      stopListening: function (dispatcher, subject, action, ctx) {
        var id, ctx;

        id = dispatcher.id ();
        ctx = ctx || this;

        for (var id in listening) {
          disp = listening[id];
          disp.stop (subject, action, ctx);
        }

        if (_.isEmpty(listening[id])) delete listening[id];
        return this;
      }
    }

    return Listener;
  });

  /* register a View (a Factory ) */
  var View = whale.View = function (name, deps, func, ctx) {

  }
}.call (this));