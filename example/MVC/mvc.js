// ## View
// make a new View called "alertView" which depends
// on "whale.dom" - a built in Service for manipulating HTML elements
whale.View ('alertView', ['whale.dom'], {
  template: '<div class="alert"><span class="close">x</span><h4></h4><span class="message"></span></div>',

  // construct method gets called on object creation
  // it will get passed the "whale.dom" object automatically
  construct: function (dom, data) {
    this.dom = dom;
    this.data = data;

    // create a new DOM element
    this.element = new this.dom.node (this.template);

    // manipulate the DOM based on the data
    // in this case we're setting some text and adding a class
    this.element.find ('.message').html (data.message);
    this.element.find ('h4').html (data.title);
    this.element.addClass (data.type);

    // now we are binding a DOM 'click' event to trigger the 'close' event
    // the last argument "this" is the context of the callback method
    this.element.find ('.close').on ('click', this.triggerClose, this);
  },

  // render this view into a given selector
  render: function (selector) {
    this.container = this.dom.find (selector);
    this.container.append (this.element);
  },

  close: function () {
    // delete the element from the DOM
    this.element.remove();
  },

  triggerClose: function () {
    this.trigger ('close');
  },

});

// ## Controller
whale.Controller ('alertController', ['alertView'], {
  construct: function (alertView, data) {
    // this controller has multiple views
    this.views = {};

    // create some views based on the data
    for (var i = 0; i < data.length; i++) {
      var view = new alertView (data[i]);
      view.render ('#container');

      // listen to the 'close' event once (the views can only be closed once)
      this.listenOnce (view, 'close', this.closeView);
      this.views[view._id] = view;
    }
  },

  // close the view and delete it
  closeView: function (e) {
    e.close();
    delete this.views[e._id];
  },
});

// ## Model
// TODO use whale.Model
var data = [{
  title   : 'Warning!',
  message : 'Don\'t drink the koolaid man. It\'s poisoned.',
  type    : 'warning'
}, {
  title   : 'Good Job!',
  message : 'You didn\'t drink the koolaid dude nice.',
  type    : 'success'
}, {
  title   : 'Congratulations',
  message : 'You are the 100000000th visitor!',
  type    : 'success'
}, {
  title   : 'Hello World',
  message : 'poaisdufoasidjflkasjdf lasdjflasjdf :D',
  type    : 'warning'
}, {
  title   : 'Whale whale whale',
  message : 'WHALE WHALE WHALE',
  type    : 'success'
}];

// ## Start
// call whale.make to call on a dependency, pass in data variable to constructor
whale.make ('alertController', data);