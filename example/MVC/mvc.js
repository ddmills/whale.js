whale.View ('alertView', [], {
  template: '<div class="alert"><span class="close">x</span><h4></h4><span class="message"></span></div>',

  construct: function (data) {
    this.data = data;
    this.element = $ (this.template);
    this.element.find ('.message').html (data.message);
    this.element.find ('h4').html (data.title);
    this.element.addClass (data.type);
    this.element.find ('.close').click (this.triggerClose.bind (this));
  },

  render: function (selector) {
    this.container = $ (selector);
    this.container.append (this.element);
  },

  close: function () {
    this.element.slideUp(this.element.remove.bind(this));
  },

  triggerClose: function () {
    this.trigger ('close');
  },

});


whale.Controller ('alertController', ['alertView'], {

  construct: function (alertView) {
    this.views = {};

    var warningData = {
      title: 'Warning!',
      message: 'Don\'t drink the koolaid man. It\'s poisoned.',
      type: 'warning'
    }

    var successData = {
      title: 'Good Job!',
      message: 'You didn\'t drink the koolaid dude nice.',
      type: 'success'
    }

    // create five views
    for (var i = 0; i < 5; i++) {
      var data = i < 2 ? warningData : successData;
      var view = new alertView (data);
      view.render ('#container');
      this.listenOnce (view, 'close', this.closeView);
      this.views[view._id] = view;
    }
  },

  closeView: function (e) {
    e.close();
    delete this.views[e._id];
  },
});


whale.make ('alertController');