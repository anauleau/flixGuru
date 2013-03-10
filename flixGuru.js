Results = new Meteor.Collection('results');

if (Meteor.isClient) {
}


if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}