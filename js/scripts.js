var placeResults = [];
var xmlHolder;
var userLat;
var userLng;

var img_srcs = [
    'images/header.png',
    'images/footer.png'
];

var imgs_to_load = img_srcs.length

window.onload = function(){
    function itemLoaded(e) {
        imgs_to_load--;
        if(imgs_to_load == 0) {
            /* When all the images have finished,
             continue displaying the ad. */
            window.setTimeout(start,1000);
        }
    }

    for(var i = 0; i < img_srcs.length; i++) {
        var img = document.createElement('img');
        img.src = img_srcs[i];
        img.style.display = 'none';
        img.addEventListener('load',itemLoaded,false);
        document.body.appendChild(img);
    }
}

$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "xml/locations.xml",
        dataType: "xml",
        success: function(data){
            storeData(data);
        }
    });
});

function storeData(xml) {
    xmlHolder = $(xml).find('result');
}

function rad(x) {return x*Math.PI/180;}

function distHaversine(lat1, lng1, lat2, lng2) {
    var R = 3963.1676; // earth's mean radius in miles
    var dLat  = rad(lat2 - lat1);
    var dLong = rad(lng2 - lng1);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLong/2) * Math.sin(dLong/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;

    return d.toFixed(3);
}

function sort_numerically(locationsarray){
    locationsarray.sort(function(a, b){
        return (a['distance'] - b['distance']);
    });
}

function processData() {
    var i=0;
    xmlHolder.each(function(){
        var singlePlace = {
            'name': $(this).find('name').text(),
            'address': $(this).find('address').text(),
            'lat': $(this).find('lat').text(),
            'lng': $(this).find('lng').text(),
            'phone': $(this).find('phone').text()
        };
        singlePlace['distance'] = distHaversine($(this).find('lat').text(), $(this).find('lng').text(), userLat, userLng);
        console.log("userLat = " + userLat + " | userLng = " + userLng + " | distance = " + singlePlace['distance']);
        placeResults[i] = singlePlace;
        i++;
    });
    sort_numerically(placeResults);
    for(var j=0; j< placeResults.length; j++){
        console.log(placeResults[j].distance);
    }
}



var service;

function start() {
    AdController();
}
// Root method that sets up the ad interaction
function AdController() {
    var me = null;
    var custom = false;
    var kansas = new google.maps.LatLng(39.2322526,-98.3356471);

    var myMap = new google.maps.Map(document.getElementById("map"),{
        center: kansas,
        zoom: 4
    });

    service = new google.maps.places.PlacesService(myMap);

    var myloc = new google.maps.Marker({
        clickable: false,
        icon: new google.maps.MarkerImage('http://maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
            new google.maps.Size(22,22),
            new google.maps.Point(0,18),
            new google.maps.Point(11,11)),
        shadow: null,
        zIndex: 999,
        map: myMap// your google.maps.Map object
    });

    var locateLink = document.getElementById("LocateMe");
    var customLink = document.getElementById("CustomLink");
    var overlay = document.getElementById("MapOverlay");
    var spinner = overlay.getElementsByClassName("loading-spinner")[0];
    var searchForm = document.getElementById("MapSearch");
    var customLocationFields = document.getElementById("CustomLocation");
    var customLocation = document.getElementById("CustomLocationString");
    var infoBox = document.getElementById("MapInfo");
    var callButton = document.getElementById("CallButton");
    var dirButton = document.getElementById("DirButton");
    var loaderSpin = document.getElementById("loading");
    var activeInfoWindow;
    var activeMarkers;
    var searching = false;
    var venueObject;
    var targetLoc;
    var myCurrentLoc;
    var googleMapBaseUrl = 'http://maps.google.com/maps?'

    function getCurrentLocation() {
        loaderSpin.style.display = "block";
        console.log("checking....");
        if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function(pos) {
            me = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
            userLat = pos.coords.latitude;
            userLng = pos.coords.longitude;
            console.log("these " + userLat + ", " + userLng);
            myloc.setPosition(me);
        });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(getCurrentLocationSuccess, getCurrentLocationError);
        } else {
            geoLocateError({"code":-1});
        }
    }

    function getCurrentLocationSuccess(position) {
        loaderSpin.style.display = "none";
        var coords = position.coords || position.coordinate || position;
        userLat = coords.latitude;
        userLng = coords.longitude;
        var newCenter = new google.maps.LatLng(coords.latitude, coords.longitude);
        myMap.setZoom(13);
        myMap.setCenter(newCenter);
        myCurrentLoc = position;
        findResults();
    }

    function getCurrentLocationError(err) {
        var msg;
        switch(err.code) {
            case err.UNKNOWN_ERROR:
                msg = "Unable to find your location";
                break;
            case err.PERMISSION_DENINED:
                msg = "Permissioned denied in finding your location";
                break;
            case err.POSITION_UNAVAILABLE:
                msg = "Your location is currently unknown";
                break;
            case err.BREAK:
                msg = "Attempt to find location took too long";
                break;
            default:
                msg = "Location detection not supported";
        }
        alert(msg);
        locateLink.className = locateLink.className.replace(" clicked");
    }

    function getEmptyResult(err){}


    function findResults() {
        if(!userLat){
            setTimeout(processData(),4000);
        } else {
            processData();
        }
        searchComplete();
    }

    function searchComplete() {
        var results = placeResults;

        overlay.style.opacity = "0";
        setTimeout(function() { overlay.style.display = "none"; },400);

        // clear existing markers
        if(activeInfoWindow) activeInfoWindow.close();
        if(typeof activeMarkers == "object") {
            for(var i=0; i<activeMarkers.length; i++) {
                activeMarkers[i].setMap(null);
            }
        }

        if(results.length) {
            var bounds = new google.maps.LatLngBounds();
            activeMarkers = new Array();
            // add new markers

            var targetList;
            if(results.length <= 3) {
                targetList = results;
            } else {
                targetList = results.slice(0,5);
            }
            for(var i=0;i<targetList.length;i++) {
                var latitude = results[i].lat;
                var longitude = results[i].lng;
                console.log(latitude + ", " + longitude + " — " + results[i].distance);
                if(results[i].distance < 50 || i === 0){
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(latitude,longitude),
                        map: myMap,
                        icon: 'images/pin.png'
                    });
                    bounds.extend(marker.getPosition());
                    google.maps.event.addListener(marker, "click", markerClick);
                    activeMarkers[i] = marker;
                }
            }
            // move map
            myMap.fitBounds(bounds);
            // adjust zoom to a reasonable level
            if(myMap.getZoom() > 16) myMap.setZoom(16);
        }
    }

    function markerClick(e) {
        var index = activeMarkers.indexOf(this);
        myMap.panTo(this.position);
        console.log(placeResults[index].name);
        getVenueDetail(placeResults[index]);
    }

    function showResult(result) {
        myMap.panBy(0,6);
        var retailPosition = new google.maps.LatLng(result.lat,result.lng);
        infoBox.getElementsByClassName("title")[0].innerHTML = result.name;
        console.log(result.distance);

        if(result.phone != null) {
            callButton.href = "tel://" + result.phone.match(/\d/g).join("");
            callButton.style.display = "inline-block";
        } else {
            callButton.style.display = "none";
        }

        if(typeof(targetLoc) == 'undefined'){
            dirButton.href =  googleMapBaseUrl + 'saddr=(' + myCurrentLoc.coords.latitude + ',' + myCurrentLoc.coords.longitude + ')&daddr=' + result.address;
        }else{
            dirButton.href =  googleMapBaseUrl + 'saddr=' + targetLoc.formatted_address + '&daddr=' + result.address;
        }

        // Display Distance to Location
        // if(custom == false){
        //     infoBox.getElementsByClassName("distance")[0].innerHTML = distHaversine(new google.maps.LatLng(myCurrentLoc.coords.latitude, myCurrentLoc.coords.longitude),retailPosition) + " miles away";
        // }

        infoBox.getElementsByClassName("address")[0].innerHTML = result.address;
        infoBox.style.display = "block";
    }

    function getVenueDetail(result){
        // var request = {
        //     reference: result.reference
        // };

        // service.getDetails(request, function(place, status){
        //     if (status == google.maps.places.PlacesServiceStatus.OK) {
        //         venueObject = place;
        //         showResult(result);
        //     }
        // });
        showResult(result);
    }

    function toggleCustomLocation() {
        custom = true;
        if(customLocationFields.style.display == "none") {
            customLink.className += " clicked";
            customLocationFields.style.display = "block";
            searchForm.style.height = (searchForm.clientHeight + 19).toString() + "px";
        } else {
            customLink.className = customLink.className.replace(/ clicked/g,"");
            customLocationFields.style.display = "none";
            searchForm.style.height = (searchForm.clientHeight - 59).toString() + "px";
        }
    }

    function handleGeocoderResponse(results, status) {
        if(status == "OK") {
            myMap.fitBounds(results[0].geometry.viewport);
            userLat = results[0].geometry.location.k;
            userLng = results[0].geometry.location.A;
            targetLoc = results[0];
            findResults();
        } else {
            alert("Could not find location: "+status);
        }
    }

    function customLocateSubmit(e) {
        e.preventDefault();
        if(customLocation.value.length < 1) {
            customLocation.blur();
        } else if(!searching) {
            (new google.maps.Geocoder()).geocode({
                "address":customLocation.value
            },handleGeocoderResponse);
        }
    }

    function activeStyle(e) {
        this.className += " clicked";
    }

    function inactiveStyle(e) {
        this.className = this.className.replace(" clicked","");
    }

    searchForm.addEventListener("submit",customLocateSubmit,false);

    locateLink.addEventListener("click",function(e) {
        console.log("button click");
        e.preventDefault();
        getCurrentLocation();
    },false);

    customLink.addEventListener("click",function(e) {
        toggleCustomLocation();
    });
    customLink.removeEventListener("touchcancel",inactiveStyle,false);
    customLink.removeEventListener("touchend",inactiveStyle,false);

    customLocationFields.style.display = "none";
}
