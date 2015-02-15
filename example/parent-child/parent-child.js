//     whale.js Classical Inheritance Example
//     (c) 2015 Dalton Mills, www.ddmills.com

// Person Class
// ------------
// Person extends the default class by calling ```whale.Class.extend```
var Person = whale.Class.extend ({
  // the ```construct``` method acts as the constructor and will be called on object creation
  construct: function (name) {
    this.name = name;
  },

  // attach an additional prototype method to this class
  greet: function () {
    console.log ('hello my name is ' + this.name);
  }
});

// create an instance like normal, passing in a name to the constructor
var bob = new Person ('Bob');

bob.greet (); // => "hello my name is Bob"


// Pirate class
// -----------
// Pirate extends Person
var Pirate = Person.extend ({
  construct: function (name, weapon) {
    // Person's constructor can be called with ```_super ()```
    this._super (name);
    this.weapon = weapon;
  },

  // override the greet method on the parent class (Person)
  greet: function () {
    console.log ('Arrr matey, my name is ' + this.name + '. My weapon is a ' + this.weapon);
  }
});

var pegleg = new Pirate ('Pegleg', 'cannon');
pegleg.greet (); // => "Arrr matey, my name is Pegleg. My weapon is a cannon"

// Captain class
// -----------
// Captain extends Pirate which extends Person
var Captain = Pirate.extend ({
  construct: function (name) {
    // call the Pirate constructor
    this._super (name, 'Sword');
  },

  greet: function () {
    // note here that _super() calls the greet method defined on Pirate
    this._super ();
    console.log ('and I\'m the captain!');
  }
});

var cap = new Captain ('Gandalf');
cap.greet (); // => "Arrr matey, my name is Gandalf. My weapon is a Sword", "and I'm the captain!"

// Object Types
// -----------
// Classes maintain notion of type
console.log (bob instanceof Person);     // => true

console.log (pegleg instanceof Person);  // => true
console.log (pegleg instanceof Pirate);  // => true

console.log (cap instanceof Person);     // => true
console.log (cap instanceof Pirate);     // => true
console.log (cap instanceof Captain);    // => true