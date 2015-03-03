(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

ga('create', '###########', 'placeiq.com');
ga('send', 'pageview');

ga('send', 'event', 'In-Page Events', 'Page Events', 'Page Visit');

var firstinteraction = 0;

var trackOutboundLink = function(url) {
   ga('send', 'event', 'Exit Links', 'Click', url, {'hitCallback':
     function () {
     	if(firstinteraction === 0){
     		firstinteraction = 1;
     		ga('send', 'event', 'In-Page Events', 'Page Events', 'First Interaction', {'hitCallback':
				function(){document.location = url}
     		});
            console.log("First Interaction");
     	} else {
     		document.location = url;
     	}
     }
   });
}

function trackEvent(el){
	if(firstinteraction === 0){
     	firstinteraction = 1;
     	ga('send', 'event', 'In-Page Events', 'Page Events', 'First Interaction');
        console.log("First Interaction");
    }
	ga('send', 'event', el.getAttribute("ga-category"), el.getAttribute("ga-action"), el.getAttribute("ga-label"));
}