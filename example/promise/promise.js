whale.Factory ('Promiser', ['whale.promise'], {
  construct: function(whalePromise) {
    this.whalePromise = whalePromise;
  },
  asyncCall: function () {
    var p = new this.whalePromise;
    setTimeout (function () {
      p.reject ('no response from server');
    }, 10000);
    return p;
  }
});

var promiser = whale.make('Promiser');

var doAsyncCall = promiser.asyncCall()
  .done(function(data) {
    console.log(data);
  })
  .always(function(success, data) {
    console.log('all done');
    if (success) {
      console.log ('the promise succeeded with data: ' + data);
    } else {
      console.log ('the promise failed with reason: ' + data);
    }

  })
  .fail(function(reason) {
    console.log('failed because ' + reason);
  });