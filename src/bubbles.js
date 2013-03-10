var bubbles = (function() {

//NEED TO EDIT --->>
  var urls = {      //API urls
      // news  : "http://hndroidapi.appspot.com/news/format/json/page/?appid=vishna&callback=?",
      news: "http://api.rottentomatoes.com/api/public/v1.0/lists/movies/box_office.json?apikey=kkd937tfu53qzuesmc68j99k&limit=30&callback=?"
  },
      thread = /^(item[?]id[=][0-9]+)/,               //regexp for HN thread posts
      w = $(window).width() * 0.85,  //width
      h = $(window).height() * 0.85, //height
      m = 20,                                         //margin
      center = {                                      //gravity center
          x : ( w - m ) / 2,
          y : ( h - m ) / 2
      },
      posts,        //content
      next,         //next page
      o,            //opacity scale
      r,            //radius scale
      z,            //color scale
      g,            //gravity scale
      t = {         //time factors
          minutes : 1,
          hour    : 60,
          hours   : 60,
          day     : 1440,
          days    : 1440
      },
      gravity  = -0.01,//gravity constants
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
              launch();
              legend();
          });
      }
  }
//<<----

//updates based on urls[category]
  function update( category ) {
    if ( urls[ category ] ) {
      load( urls[ category ], function() {
        circles
          .transition()
          .duration( 750 )
          .attr("r", function(d) { return r(d) + 100; })
          .delay( 250 )
          .style("opacity", function(d) { return 0; })
          .remove();

        launch();
        });
      }
  }
//d is equal to the object that is returned by the ajax request
//url is urls.news
//NEED TO EDIT --->>
  function load( url, callback ){
      $.getJSON(url, function( data ) {
        posts = data.movies;
        next = posts.pop();

        posts.map( function(d) {
          var comments = d.critics_consensus,
              score    = parseInt( d.ratings.critics_score ),
              time     = d.release_dates.theater.split(" ").toString(),
              rank     = 1;

              var format = d3.time.format("%Y-%m-%d");
          d.comments = comments;
          d.score = score;
          d.time = format.parse(time);
          d.url = d.links.alternate;
          return d;
        });

        // Defining the scales
        r = d3.scale.linear()
          .domain([ d3.min(posts, function(d) { return d.score; }),
                    d3.max(posts, function(d) { return d.score; }) ])
          .range([ 10, 100 ])
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
//<<-----


var moveText = function(d){
    d.text.attr('x', d.x)
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
    .on('mousedown.foo', function(d){d.click = true;})
    .on('mouseup.foo', function(d){d.click = false;})
    .on('mousemove.foo', function(d){if(d.click)moveText(d);})
    .attr("r", 0)
    .attr("cx", function(d) { return d.x; })
    .attr("cy", function(d) { return d.y; })
    .attr("fill", function(d) { return z( d.comments ); })
    .attr("stroke-width", 2)
    .attr("stroke", function(d) { return d3.rgb(z( d.comments )).darker(); })
    .attr("id", function(d) { return "post_#" + d.item_id; })
    .attr("title", function(d) { return d.title; })
    .style("opacity", function(d) { return o( d.time ); })
    .on("mouseover", function(d, i) { force.resume(); highlight( d, i, this ); })
    .on("mouseout", function(d, i) { downlight( d, i, this ); }).each(function(d, i){
    d.text = svg.append('text').attr('x', d.x)
                        .attr('y', d.y)
                        .text(d.title)
    });

  d3.selectAll("circle")
    .transition()
    .delay(function(d, i) { return i * 10; })
    .duration( 1000 )
    .attr("r", function(d) { return r( d.score ); });

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
            .attr("cx", function(d) { return d.x;})
            .attr("cy", function(d) { return d.y; })
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

function legend() {

  var linearGradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", "legendGradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

  linearGradient
    .append("stop")
    .attr("offset", "0%")
    .attr("stop-color", "#024C68")
    .attr("stop-opacity", "0.1");

  linearGradient
    .append("stop")
    .attr("offset", "100%")
    .attr("stop-color", "#024C68")
    .attr("stop-opacity", "1");

  var legend = svg.append("g")
    .attr("id", "legend");

  legend
    .append("rect")
    .attr("x", "20")
    .attr("y", "20")
    .attr("width", "20")
    .attr("height", "200")
    .attr("style", "fill:url(#legendGradient);");

  legend
    .append("text")
    .attr("x", 45)
    .attr("y", 30)
    .text("Oldest");

  legend
    .append("text")
    .attr("x", 45)
    .attr("y", 220)
    .text("Newest");

}


//appends url for hover state
function highlight( data, i, element ) {
  d3.select( element ).attr( "stroke", "black" );
  var description = data.critics_consensus,
    content = '<span class=\"title\"><a href=\"' + data.url + '\">' + data.title + '</a></span><br/>' +
               description + "<br/>" + '<a href="' + data.url + '"><img src="' + data.posters.detailed + '" alt="alt text" style="border:none;" /></a>';
               console.log(data.posters.detailed);



  tooltip.showTooltip(content, d3.event);
}

function downlight( data, i, element ) {
  d3.select(element).attr("stroke", function(d) { return d3.rgb( z( d.comments )).darker(); });
}

//Register category selectors
$("a.category").on("click", function(e) { update( $(this).attr("value") ); });

return {
  categories : ["news", "movies"],
  init : init,
  update : update
};

})();

bubbles.init( window.location.href.split("#")[1] ? window.location.href.split("#")[1] : "news");
