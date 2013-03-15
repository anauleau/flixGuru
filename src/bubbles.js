/**
 * Modified from https://github.com/ricardmo/vishna
 */

var bubbles = (function() {
  var urls = {      //API urls
      boxOfficeCritics: "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/box_office.json?apikey=kkd937tfu53qzuesmc68j99k&limit=36&callback=?"
  },
      w = $(window).width() * 0.85,  //width
      h = $(window).height() * 0.85, //height
      m = 20,                                         //margin
      center = {                                      //gravity center
          x : ( w - m ) / 2,
          y : ( h - m ) / 2
      },
      posts,                //content
      next,                 //next page
      o,                    //opacity scale
      r,                    //radius scale
      z,                    //color scale
      g,                    //gravity scale
      gravity  = -0.0,      //gravity constants
      damper   = 0.2,
      friction = 0.9,
      force = d3       //gravity engine
          .layout
          .force()
          .size([ w - m,
                  h - m ]),
      svg = d3         //container
          .select("body article")
          .append("svg")
          .attr("height", h + "px")
          .attr("width", w + "px"),
      circles,         //data representation
      tooltip = CustomTooltip( "posts_tooltip", 240 );

//initializes based on urls[category]
  function init( category ) {
      if ( urls[ category ] ) {
          load( urls[ category ], function() {
              // legendSize();
              legend();
              launch();
          });
      }
  }

  function load( url, callback ){
      $.getJSON(url, function( data ) {
        posts = data.movies;
        next = posts.pop();

        var rank = 0;
        posts.map( function(d) {
          var comments    = d.critics_consensus,
              score       = parseInt( d.ratings.critics_score ),
              time        = d.release_dates.theater.split(" ").toString(),
              format      = d3.time.format("%Y-%m-%d")
              scoreCritic = d.ratings.critics_score,
              mpaaRating  = d.mpaa_rating,
              scoreAud    = d.ratings.audience_score;
              rank ++;

          d.rank = rank;
          if (comments === undefined){
            d.comments = '<i>No critical consensus available.<i>';
          } else {
            d.comments = comments;
          }

          d.score   = score;
          d.time    = format.parse(time);
          d.url     = d.links.alternate;
          d.color = '#055959';

          d.timeDif = Date.parse(Date())- Date.parse(d.time);
          console.log(d.timeDif);

          //release date handler
          if(400000000 > d.timeDif ) d.time = .6;
          else if(d.timeDif < 1508187000) d.time = .4;
          else if(d.timeDif < 3322587000) d.time = .2;
          else d.time = .05;
          return d;
        });

        r = d3.scale.linear()
          .domain([ d3.min(posts, function(d) { return d.score; }),
                    d3.max(posts, function(d) { return d.score; }) ])
          .range([ 28, 75 ])
          .clamp(true);

        z = d3.scale.linear()
          .domain([ d3.min(posts, function(d) { return d.comments; }),
                    d3.max(posts, function(d) { return d.comments; }) ])
          .range([ '#ff7f0e', '#ff7f0e' ]);

        o = d3.scale.linear()
          .domain([ d3.min(posts, function(d) { return d.time; }),
                    d3.max(posts, function(d) { return d.time; }) ])
          .range([ 0.2, 1 ]);

        g = function(d) { return -r(d) * r(d) / 2.5; };

        callback();
      });
  }

var moveText = function(d){
    d.text && d.text.attr('x', d.x)
          .attr('y', d.y)
};

function launch() {
  force
    .nodes( posts );

  circles = svg
    .append("g")
    .attr("id", "circles")
    .selectAll("a")
    .data(force.nodes());

   // Init all circles at random places on the canvas
  force.nodes().forEach( function(d, i) {
    d.x = Math.random() * w;
    d.y = Math.random() * h;
  });

  var node = circles
    .enter()
    .append("a")
    .append("circle").call(force.drag)
    .attr('class', 'movies')
    .on('mousedown.foo', function(d){d.click = true;})
    .on('mouseup.foo', function(d){d.click = false;})
    .on('mousemove.foo', function(d){if(d.click)moveText(d);})
    .attr("r", 0)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("fill", function(d) { return z( d.comments ); })
    .attr("stroke", "#003C30")
    .attr("stroke-opacity", 0)
    .attr("stroke-width", 3)
    .attr("id", function(d) { return "post_#" + d.item_id; })
    .attr("title", function(d) { return d.title; })
    .attr("fill-opacity", function(d) { return o( d.time ); })
    .attr("fill", function(d){return d.color;})
    .on("mouseover", function(d, i) { highlight( d, i, this ); })
    .on("mouseout", function(d, i) { downlight( d, i, this ); });

  d3.selectAll(".movies")
    .transition()
    .ease('bounce')
    .delay(function(d, i) { return i * 50; })
    .duration( 1000 )
    .attr("r", function(d) { return d.r = r( d.score ); })
    .each('end', function(d, i){
    d.text = svg.append("text")
                .attr("x", d.x + (.2 * d.r))
                .attr("y", d.y - (.2 * d.r))
                .text(d.rank)
                .attr("font-size", "34px")
                .attr("font-family", '"Amatic SC", cursive')
                .attr("text-align", "left")
    });

  loadGravity( moveCenter );

    //Loads gravity
    function loadGravity( generator ) {
      force
        .gravity(gravity)
        .charge( function(d) { return g( d.score ); })
        .friction(friction)
        .on("tick", function(e) {
          generator(e.alpha);
          d = node

            .attr("cx", function(d) { return d.x + (.2 * d.r);})
            .attr("cy", function(d) { return d.y - (.2 * d.r); })
            .data()
            d.forEach(moveText);
        }).start();
    }

      // Generates a gravitational point in the middle
    function moveCenter( alpha ) {
      force.nodes().forEach(function(d) {
        d.x = d.x + (center.x - d.x) * (damper + 0.02) * alpha;
        d.y = d.y + (center.y - d.y) * (damper + 0.02) * alpha;
      });
    }
  }


//Legend code
function legendSize() {
  var circleRotten = svg.selectAll('.legend')
    .data([3,2,1.5])
    .enter()
    .append('circle');

    circleRotten
    .attr('class', 'legend')
    .attr('fill', '#055959')
    .attr('opacity', .8)
    .attr('r', function(data){ return data * 11;})
    .attr('cx', 40)
    .attr('cy', function(d, i){
      var previous = circleRotten.nth(i - 1);
      return previous ? previous.attr('r'): 0 + d * 11 + 350 + (i * 60);
    });

  var legendSize = svg.append("g")

  legendSize
    .append("text")
    .attr("x", 20)
    .attr("y", 300)
    .text("Higher Critical Score");

  legendSize
    .append("text")
    .attr("x", 20)
    .attr("y", 500)
    .text("Lower Critical Score");
}

function legend() {

  var linearGradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "legendGradient")
    .attr("x1", "0%")
    .attr("y1", "100%")
    .attr("x2", "0%")
    .attr("y2", "0%")
    .attr("spreadMethod", "pad");

  linearGradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#055959")
    .attr("stop-opacity", "0.1");

  linearGradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#055959")
    .attr("stop-opacity", "1");

  var legend = svg.append("g")
    .attr("id", "legend");

  legend
    .append("rect")
    .attr("x", "20")
    .attr("y", "60")
    .attr("width", "20")
    .attr("height", "200")
    .attr("style", "fill:url(#legendGradient);");

  legend
    .append("text")
    .attr("x", 45)
    .attr("y", 70)
    .text("Newest");

  legend
    .append("text")
    .attr("x", 45)
    .attr("y", 260)
    .text("Oldest");
}


//appends url for hover state
function highlight( data, i, element ) {
  d3.select( element )
    .attr('stroke-opacity', 1);
  // d3.select(".thumb").attr("src", data.posters.detailed);
  var description = data.comments,
      scoreAud    = data.ratings.audience_score,
      scoreCritic = data.ratings.critics_score,
      getTimesURL = 'http://www.rottentomatoes.com/m/' + data.id + '/movie_times/',
      content     = '<span class=\"title\"><a href=\"' + data.url + '\">' + data.title + '</a></span><br/>' +
               description + "<br/>" + '<span><b>Critical Score:</b> ' + scoreCritic + '</span>' +
               '<br><span><b>Audience Score:</b> ' + scoreAud + '</span><br/>' + '<span class=\"title\"><a href=\"' + getTimesURL + '\">GET SHOWTIMES</a></span><br/>' +
               '<a href="' + data.url + '"><img src="' + data.posters.detailed + '" alt="alt text" style="border:none;" /></a>';
  tooltip.showTooltip(content, d3.event);
}

function downlight( data, i, element ) {
  d3.select(element)
    .attr("stroke-opacity", 0);
}

return {
  categories : ["boxOfficeCritics"],
  init : init
};

})();

bubbles.init( window.location.href.split("#")[1] ? window.location.href.split("#")[1] : "boxOfficeCritics");
