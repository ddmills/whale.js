/* A base Person Class */
var Person = whale.Class.extend ({
  /* construct acts as the constructor */
  construct: function (name) {
    this.name = name;
  },

  greet: function () {
    console.log ('hello my name is ' + this.name);
  }
});

/* A pirate class that extends Person */
var Pirate = Person.extend ({
  construct: function (name, weapon) {
    /* call the super constructor with _super () */
    this._super (name);
    this.weapon = weapon;
  },

  /* override the person greet method */
  greet: function () {
    console.log ('Arrr matey, my name is ' + this.name);
  }
});

/* Captain extends Pirate which extends Person */
var Captain = Pirate.extend ({
  construct: function (name) {
    this._super (name, 'Sword');
  },
  greet: function () {
    this._super();
    console.log ('and I\'m the captain!');
  }
});

var bob = new Person ('Bob');
var pegleg = new Pirate ('Pegleg', 'cannon');
var cap = new Captain ('Gandalf');

bob.greet ();
pegleg.greet ();
cap.greet ();