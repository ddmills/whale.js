

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
    this.bard = bard;
    this.listenOnce (this.bard, 'singing', this.drink);
  },

  drink: function (a) {
    console.log (a);
    console.log (this.name + ' takes a drink as the bard starts to sing');
    this.listen (this.bard, 'singing', this.hum);
  },

  hum: function () {
    console.log (this.name + ' hums along while the bard continues to sing');
  }

});

var b = new Bard;
var a = new Traveller ('Jim', b);

b.when('singing', function() {
  console.log ('that bard is singing again...');
});

b.sing();
b.sing();
b.sing();
b.sing();