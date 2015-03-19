whale.Factory ('github', ['whale.ajax'], {
  construct: function(ajax, name) {
    this.ajax = ajax;
  },
  fetchUser: function (user) {
    return this.ajax.request({
      url: 'https://api.github.com/users/',
      type: 'get',
      body: user
    });
  }
});

var github = whale.make ('github', 'hello');

github.fetchUser('ddmills')
  .done (function (data) {
    console.log (data);
  })
  .always (function (err, data) {
    console.log (data);
  });
