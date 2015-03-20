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

### Service
Create a "Service" by using ```whale.Service```. A Service is an object that only has once instance, similar to a singleton. The first argument is the name of the service, this get registered with whale. The second argument is an array of dependencies, which is anything registered with whale. The third argument is the class declaration for the Harbor service.
```javascript
whale.Service ('Harbor', [], {
  boats: [],
  dock: function(boat) {
    this.boats.push(boat);
  }
});
```

### Factory
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


### Dispatcher
Create a Dispatcher by extending the Dispatcher class:
```javascript
var Bard = whale.Dispatcher.extend({
  sing: function() {
    this.trigger('singing'); // trigger is a method inherited from Dispatcher
  }
});
```

### Listener
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

