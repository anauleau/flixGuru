Results = new Meteor.Collection('results');

//code used to query the RT API
var query;
var rt = {
  apiKey: "kkd937tfu53qzuesmc68j99k",
  baseURL: "http://api.rottentomatoes.com/api/public/v1.0",
};

var moviesSearchUrl = rt.baseURL + '/movies.json?apikey=' + rt.apiKey;

function searchCallback(data) {
  var movies = data.movies;
    $.each(movies, function(index, movie) {
      console.log(movie);
    });
}

if (Meteor.isClient) {
  Template.hello.greeting = function () {
    return "Welcome to flixGuru.";
  };

  Template.hello.events({
    'click input' : function () {
      // template data, if any, is available in 'this'
      if (typeof console !== 'undefined')
        console.log("You pressed the button");
    }
  });

  Template.searchForm.events({
    'click #search': function() {
      $(document).ready(function() {
        $.ajax({
          url: "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/box_office.json?apikey=kkd937tfu53qzuesmc68j99k&limit=30",
          dataType: "jsonp",
          success: searchCallback
        });
      });
    }
  });
}


if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
