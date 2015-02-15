whale.View ('buttonView', [], {
  template: '<button type="button"> click me </button>',

  construct: function (selector) {
    this.clicks = 0; // typically you don't want to save data in your view
    this.container = $ (selector);
    this.element = $ (this.template);
    this.element.click (this.triggerClick.bind (this));
    this.container.append (this.element);
  },

  triggerClick: function () {
    this.clicks++;
    this.trigger ('click');
  },

});


whale.Controller ('buttonController', ['buttonView'], {

  construct: function (buttonView) {
    this.views = [];

    /* create five views */
    for (var i = 0; i < 5; i++) {
      var view = new buttonView ('#container');
      this.listen (view, 'click', this.log);
      this.views.push (view);
    }
  },

  log: function (e) {
    console.log ('button ' + e._id + ' has been clicked ' + e.clicks + ' times');
  },
});


whale.make ('buttonController');