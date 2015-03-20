# whale.js
Whale is a tiny library which provides strong MVC tools and components.

* Classical inheritance
* Dependency injection
* Factory and Service patterns (built off dependency injection)
* Events (dispatchers and listeners)
* Model, View, Controller classes
* DOM manipulation and query
* AJAX functions
* Promises

## Classical Inheritance
Create a class by extending the base whale.Class:
```javascript
var Person = whale.Class.extend ({
  construct: function(name) {
    this.name = name;
  },
  ...
});
```

### Extending Classes
Extend your own classes:
```javascript
var Pirate = Person.extend ({
  construct: function(name, weapon) {
    this._super(name);
    ...
  },
  ...
});
```

Create instance of a class:
```javascript
var pegleg = new Pirate('Pegleg', 'Sword');
console.log(pegleg instanceof Person); // true
console.log(pegleg instanceof Pirate); // true
```

## Dependency Injection

### whale.Service
Create a "Service" by using ```whale.Service```. A Service is an object that only has once instance, similar to a singleton. The first argument is the name of the service, this get registered with whale. The second argument is an array of dependencies, which is anything registered with whale. The third argument is the class declaration for the Harbor service.
```javascript
whale.Service ('Harbor', [], {
  boats: [],
  dock: function(boat) {
    this.boats.push(boat);
  }
});
```

### whale.Factory
We can create a Factory, or a Boat class which relies on the Harbor service. Factory is exactly the same as Service except it doesn't get instantiated. Notice that "var Boat =" is optional, because the Boat class gets registered with whale.
```javascript
var Boat = whale.Factory('Boat', ['Harbor'], {
  // the harbor object will be automatically provided to the constructor
  // when the object is made because it is specified as a dependency in 
  // the brackets: ['Harbor'] above.
  construct: function(harbor, color) {
    this.color = color;
    harbor.dock(this);
  }
});
```

#### Initializing Objects
There are a several ways to instantiate the boat class. Note that methods 2 and 3 are the preferred ways to create instances.
```javascript
// 1. since the class is assigned a variable: "var Boat = "
var greenBoat = new Boat('green');

// 2. Since the class is registered:
var blueBoat = whale.make('Boat', 'blue');

// 3. Also since the class is registered:
var Boat = whale.get('Boat');
var yellowBoat = new Boat('yellow);

// We can also get the Harbor instance:
var harbor = whale.get('Harbor');
console.log (harbor.boats); // logs array of Boats [greenBoat, blueBoat, yellowBoat]
```


## Events
In whale, events are handled by the built in whale.Dispatcher and whale.Listener Classes. A whale.Dispatcher can trigger events, and a Listener can listen to events.


### whale.Dispatcher
Create a Dispatcher by extending the Dispatcher class:
```javascript
var Bard = whale.Dispatcher.extend({
  sing: function() {
    this.trigger('singing'); // trigger is a method inherited from Dispatcher
  }
});
```

### whale.Listener
And create a Listener by extending the Listener class:
```javascript
var Knight = whale.Listener.extend({
  construct: function(name, bard) {
    this.name = name;
    this.listenOnce(bard, 'singing', this.orderDrink); // stop listening after one call
    this.listen(bard, 'singing', this.drink); // keep listening until stopListening() is called
  },
  orderDrink: function() {
    ...
  },
  drink: function() {
    ...
  }
});
```

And when they both work together:
```javascript
var jim = new Bard;
var tom = new Knight('Tom', jim);

jim.sing(); // Tom's "orderDrink" and then "drink" methods are called
jim.sing(); // Tom's "drink" method is called again
```

## Model View Controller classes

### whale.Model
todo

### whale.View
todo

### whale.Controller
todo

## whale.Dom, whale.Node - DOM manipulation
whale.Dom is a built in whale Service which gives access to the DOM.
whale.Node is a built in whale Class that wraps the results of a query (a list of DOM nodes).

### whale.Dom
whale.Dom gives you access to the document and to whale.Node. Query selectors work like css selectors.

Get nodes by calling whale.Dom.find:
```javascript
var someElement = whale.Dom.find('#some-element-with-id');
var someOther = whale.Dom.find('.some-element-with-class');
var multipleElements = whale.Dom.find('ul li');
```

Create a new element several ways with whale.Node:
```javascript
var html = '<p>Hello <strong>World</strong></p>';
var stuff = new whale.Node(html);
var stuff = new whale.Dom.Node(html);
var stuff = whale.make('whale.Node', html);

// replace the HTML of an element with id "some-container":
whale.Dom.find('#some-container').html(stuff);
```

### whale.Node methods
```javascript
var n = whale.Dom.find('#some-element');
n.outer(); // get the all of the HTML of this node
n.html(); // get the inner HTML of the node
n.html('hello'); // replace the inner HTML of the node(s)
n.html(otherNode); // replace the inner HTML of the node(s) with otherNode
n.append('some stuff'); // append some HTML to the node(s)
n.append(otherNode); // append otherNode (an instance of whale.Node)
n.prepend(...); // prepend another Node(s) or some raw html
n.before(...); // insert before the Node(s)
n.after(...); // insert after the Node(s)
n.each(callback); // loop through each DOM element selected by this Node
n.remove(); // remove this element
n.addClass(); // add a CSS class to this object
n.on(evnt, callback, context); // listen to a DOM event from this element(s)
n.off(event, callback); // stop listening to a DOM event from this element(s)
```

## whale.Promise 
Basic promise with resolve(), reject(), done(), fail(), always().

A function that returns a promise:
```javascript
var doAsyncStuff = function() {
  var p = new whale.Promise();
  
  // some asynchronos task is called
  setTimeout(function() {
    if (something) {
      // if the task succeeded, the promise is resolved
      p.resolve('something succeeded', 'some other arg');
    } else {
      // if the task failed, the promise is rejected
      p.reject('something failed', 'here is other stuff', 123, 'more args');
    }
  }, 5000);
  
  return p;
}
```

How to use the promise
```javascript
var p = doAsyncStuff();

p.done(function(data) {
  console.log('the promise was resolved');
});

p.fail(function(data) {
  console.log('the promise was rejected');
});

p.always(function(resolved, data) {
  console.log('this method is always called when the promise is fulfilled');
});

// done, fail, always can also be chained and have multiple calls
doAsyncStuff().done(...).fail(...).done(..).always(...);
```



