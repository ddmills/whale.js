// There is only once instance of Harbor
// Harbor is a Service which other Classes can
// utilize
var Harbor = whale.Service ('Harbor', [], {
  construct: function () {
    this.boats = [];
  },

  dock: function (boat) {
    this.boats.push (boat);
    console.log ('A ' + boat.color + ' boat arrives the harbor');
  },

  look: function () {
    console.log ('The harbor has ' + this.boats.length + ' boats');
    for (var i = 0; i < this.boats.length; i++) {
      console.log ('* a ' + this.boats[i].color + ' boat');
    }
  }
});

// Boats require a Harbor
// This boat uses Harbor, which gets injected to the construct() function.
// Since Harbor is a Service, it will already be instantiated
var Boat = whale.Factory ('Boat', ['Harbor'], {
  // construct recieves Harbor, the color will be provided by user
  construct: function (harbor, color) {
    this.color = color;
    harbor.dock (this);
  },
});

new Boat ('green');
new Boat ('blue');
new Boat ('yellow');

// we can get the Harbor module on it's own
var harbor = whale.get ('Harbor');
harbor.look();

/*
  OUTPUT

  "A green boat arrives the harbor"
  "A blue boat arrives the harbor"
  "A yellow boat arrives the harbor"
  "The harbor has 3 boats"
  "* a green boat"
  "* a blue boat"
  "* a yellow boat"
*/