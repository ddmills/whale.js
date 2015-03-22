var data = [{
  id      : 0,
  title   : 'Warning!',
  message : 'Don\'t drink the koolaid man. It\'s poisoned.',
  type    : 'warning'
}, {
  id      : 1,
  title   : 'Good Job!',
  message : 'You didn\'t drink the koolaid dude nice.',
  type    : 'success'
}, {
  id      : 2,
  title   : 'Congratulations',
  message : 'You are the 100000000th visitor!',
  type    : 'success'
}, {
  id      : 3,
  title   : 'Hello World',
  message : 'poaisdufoasidjflkasjdf lasdjflasjdf :D',
  type    : 'warning'
}, {
  id      : 4,
  title   : 'Whale whale whale',
  message : 'WHALE WHALE WHALE',
  type    : 'success'
}];

whale.Model ('github', [], {
  urlRoot: 'https://api.github.com/users',
  idAttribute: 'login'
});


var dm = whale.make ('github', {'login' : 'ddmills'});
dm.fetch ();

whale.Model ('alert', [], {

});

whale.Collection ('alerts', ['alert']);

var alerts = whale.make ('alerts', data);

console.log (alerts);