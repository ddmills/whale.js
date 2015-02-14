

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
