$(document).ready(function(){
 
 var json = JSON.parse($('div#map_holder').attr('data'));
 
 
 initMap = function() {
  var myLatLng = {lat: json.lat, lng: json.lng};

  // Create a map object and specify the DOM element for display.
  var map = new google.maps.Map(document.getElementById('map_holder'), {
    center: myLatLng,
    scrollwheel: false,
    zoom: 17
  });

  // Create a marker and set its position.
  var marker = new google.maps.Marker({
    map: map,
    position: myLatLng,
    title: 'Company'
  });
 }
 

})