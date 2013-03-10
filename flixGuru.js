Results = new Meteor.Collection('results');

if (Meteor.isClient) {
  //Vishna code here
}


if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
