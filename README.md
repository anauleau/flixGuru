<body>
<h1>flixGURU</h1>
=========
<p>flixGURU is a d3 project that graphs the top 35 movies at the box office based on their aggregate critical score</p>
<ul>
<li>The project uses the Rotten Tomatoes API as its data source for the box office rankings, movie review data, movie poster images, and other movie related information</li>
<li>The d3 code is based on the <a href="https://github.com/ricardmo/vishna">Vishna project</a>. I adapted and refactored the code from this project to fit this application's needs.</li>
</ul>
<h3>API Call</h3>
<pre>http://api.rottentomatoes.com/api/public/v1.0/lists/movies/box_office.json?APIKEY&limit=36&callback=?"</pre>

<h3>Bubbles Size</h3>
d.score refers to the aggregate critical score of each movie. I begin the range at 30 so that low scoring movies are visible and cap it at 75 to manage the scale of the entire infographic.
<pre>r = d3.scale.linear()
    .domain([ d3.min(posts, function(d) { return d.score; }),
            d3.max(posts, function(d) { return d.score; }) ])
    .range([ 30, 75 ])
    .clamp(true);</pre>

<h3>Appending the rank to each bubble</h3>
<pre>d.text = svg.append("text")
            .attr("x", d.x + (.2 * d.r))
            .attr("y", d.y - (.2 * d.r))
            .text(d.rank)
            .attr("font-size", "34px")
            .attr("font-family", '"Amatic SC", cursive')
            .attr("text-align", "left")
});</pre>
</body>
