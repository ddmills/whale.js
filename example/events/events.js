var Bard = whale.Dispatcher.extend ({
  sing: function() {
    this.trigger('singing');
  }
});

var Traveller = whale.Listener.extend ({
  initialize: function() {
    this.blood = 20;
  },

  construct: function (name, bard) {
    this.name = name;
    this.drinks = 0;
    this.listenOnce (bard, 'singing', this.drink);
  },

  drink: function (bard) {
    this.drinks++;
    console.log (this.name + ' takes a drink as the bard starts to sing');
    this.listen (bard, 'singing', this.hum);
  },

  hum: function (bard) {
    this.drinks++;
    console.log (this.name + ' hums along while the bard continues to sing');
    if (this.drinks > 4) {
      console.log (this.name + ' has had enough to drink and stops listening to the bard');
      this.stopListening(bard);
    }
  }
});

var bard = new Bard;
bard.when('singing', function() {
  console.log ('the bard is singing...');
});
bard.sing();


var bob = new Traveller ('Bob', bard);

bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();