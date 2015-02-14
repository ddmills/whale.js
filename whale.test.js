

var Dock = whale.Service ('Dock', [], {
  init: function () {
    console.log ('im a dock...');
  },

  moor: function(boat) {
    console.log ('ur boat is ' + boat.getColor() + ' ...');
  }

});

var Boat = whale.Factory ('Boat', ['Dock'], {
  init: function (dock, color) {
    this.color = color;
    dock.moor (this);
  },
  getColor: function () {
    return this.color;
  },
});

var Pirate = whale.Factory ('Pirate', ['Boat'], {

  init: function (boat, name) {
    console.log ('yo i\'m a pirate');
    console.log ('my name is ' + name);
    this.drink();
    this.myBoat = new boat ('blue');
    console.log ('im on a ' + this.myBoat.getColor () + ' boat');
  },

  drink: function () {
    console.log ('im drankin');
  }
});

var Ninja = Pirate.extend ({
  init: function (beltColor) {
    this._super ('steve');
    console.log ('i\'m a ninja with a ' + beltColor + ' belt!');
  }
});

var n = new Ninja ('black');

var Bard = whale.Dispatcher.extend ({
  init: function () {
    this._super ();
    console.log ('hi im a bard yo');
  },

  sing: function() {
    this.trigger('singing');
  }
});

var Traveller = whale.Listener.extend ({
  init: function (name, bard) {
    this._super ();
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
var a = new Traveller ('Jim', bard);

bard.when('singing', function() {
  console.log ('the bard is singing...');
});

bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();
bard.sing();