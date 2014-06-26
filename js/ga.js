//Set your GA Account
var gaAccount='##########';

//Do not edit 
function trackEvent(el){
	_gaq.push(['_trackEvent',el.getAttribute("ga-category"),el.getAttribute("ga-action"),el.getAttribute("ga-label")]);
	setTimeout('document.location = "' + el.href + '"', 800);
}

var _gaq = _gaq || [];
	_gaq.push(['_setAccount', gaAccount]);
	_gaq.push(['_trackPageview']);

(function() {
	   var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
	   ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
	   var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();