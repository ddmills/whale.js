var Bard = whale.Dispatcher.extend ({
  sing: function() {
    this.trigger('singing');
  }
});

var Traveller = whale.Listener.extend ({
  /* Traveller has a construcor which takes in a name and a Bard */
  construct: function (name, bard) {
    this.name = name;
    this.drinks = 0;
    /* listenOnce will only all the function to trigger one time
     * this line says: "call the function this.drink once the bard
     * triggers 'singing' event" */
    this.listenOnce (bard, 'singing', this.drink);
  },

  drink: function (bard) {
    this.drinks++;
    console.log (this.name + ' takes a drink as the bard starts to sing');
    /* listen tells this object to call 'this.hum' whenever bard triggers 'singing' */
    this.listen (bard, 'singing', this.hum);
  },


  hum: function (bard) {
    this.drinks++;
    console.log (this.name + ' hums along while the bard continues to sing');
    if (this.drinks > 4) {
      console.log (this.name + ' has had enough to drink and stops listening to the bard');
      /* stop listening to all events from the bard. note this method can be more
       * specific:
       *  this.stopListening(bard, 'singing') and:
       *  this.stopListening (bard, 'singing', this.hum)
       */
      this.stopListening (bard);
    }
  }
});

/* create new Bard object */
var bard = new Bard;

/* whenever the bard sings, print out some stuff.
 * note how this event is attached to the bard
 * (instead of the listening function,
 * like obj.listen()) */
bard.when('singing', function() {
  console.log ('the bard is singing...');
});

/* call the sing() method, which triggers the 'singing' event */
bard.sing();


/* Create an instance of traveller called Bob who listens to bard */
var bob = new Traveller ('Bob', bard);

/* let the bard sing */
bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();

/*
  OUTPUT

  "the bard is singing..."
  "Bob takes a drink as the bard starts to sing"
  "the bard is singing..."
  "Bob hums along while the bard continues to sing"
  "the bard is singing..."
  "Bob hums along while the bard continues to sing"
  "the bard is singing..."
  "Bob hums along while the bard continues to sing"
  "the bard is singing..."
  "Bob hums along while the bard continues to sing"
  "Bob has had enough to drink and stops listening to the bard"
  "the bard is singing..."
  "the bard is singing..."

*/