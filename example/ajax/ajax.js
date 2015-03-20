// Some of the DOM elements
var button = whale.dom.find ('#search');
var input = whale.dom.find ('#username');
var resp = whale.dom.find ('#result');

// Do stuff when the button is clicked
button.on ('click', function (e) {

  resp.html ('loading...');

  // get the username that was entered
  var val = input.val ();

  // do a GET request (returns a promise)
  whale.ajax.get ({
    url: 'https://api.github.com/users/' + val,
    parse: true // Parse the response to JSON
  })
  .always (function (success, response) {
    resp.html (JSON.stringify (response, null, 2));
  });

});