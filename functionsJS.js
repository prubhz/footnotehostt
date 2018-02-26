var map,
  drawing = false,
  mousedown,
  move;


var dataPoints = [];
var polyArray = [];
var polyPoints = [];
var poly;
var usrLocationObj = {};
var recUsrCoords = false;

function clearDraw() {
  if (poly) {
    poly.setMap(null);
  }
  dataPoints = [];

  // initMap(function(inMap){
  //   console.log("redraw map");
  // });
  mapRedraw();
}

//http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function hash(value) {
  var hash = 0;
  if (value.length == 0) return hash;
  for (i = 0; i < value.length; i++) {
    char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function refreshLocalFeed(map) {
  var bounds = map.getBounds();
  var newArea = [];
  var NECorner = bounds.getNorthEast();
  var SWCorner = bounds.getSouthWest();

  var NWCorner = new google.maps.LatLng(NECorner.lat(), SWCorner.lng());
  var SECorner = new google.maps.LatLng(SWCorner.lat(), NECorner.lng());

  newArea.push([NWCorner.lng(), NWCorner.lat()]);
  newArea.push([NECorner.lng(), NECorner.lat()]);
  newArea.push([SECorner.lng(), SECorner.lat()]);
  newArea.push([SWCorner.lng(), SWCorner.lat()]);
  newArea.push(newArea[0]);

  var scope = angular.element(document.getElementById('body')).scope();
  console.log('windo moved');
  scope.getInitialMessage(newArea);

}

// ​function showError(error) {
//     switch(error.code) {
//         case error.PERMISSION_DENIED:
//              window.alert("User denied the request for Geolocation.");
//             break;
//         case error.POSITION_UNAVAILABLE:
//             window.alert("Location information is unavailable.");
//             break;
//         case error.TIMEOUT:
//             window.alert( "The request to get user location timed out.");
//             break;
//         case error.UNKNOWN_ERROR:
//             window.alert("An unknown error occurred.");
//             break;
//     }
// }


function getLocation(callback) {
  console.log("getLocation called")
  if (navigator.geolocation) {
    // navigator.geolocation.getCurrentPosition(getPosition);//, showError);
    console.log("navigator.geolocation")
    //
    // navigator.geolocation.getCurrentPosition(function(data){
    //   console.log('success geodata', data);
    // }, function(error){
    //   console.log('error geo data', error);
    //
    //   navigator.permissions.query({name: 'geolocation'}).then(function(result){
    //     console.log('permissions result', result);
    //     if(result.state == "prompt"){
    //       getLocation();
    //     }
    //   });
    // });

    navigator.geolocation.getCurrentPosition(function(position) {
      usrLocationObj = {
        "lng": position.coords.longitude,
        "lat": position.coords.latitude
      }
        console.log("usrLocationObj")
      callback(usrLocationObj);
    },function error(msg){

                alert('Please enable your GPS position future.');

      },
      {maximumAge:600000, timeout:5000, enableHighAccuracy: true});
  } else {
    window.alert("Geolocation is not supported by this browser.");
  }
}

function mapRedraw() {
  var mapOptions = {
    zoom: 16,
    center: new google.maps.LatLng(usrLocationObj.lat, usrLocationObj.lng),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map'), mapOptions);
  map.addListener('dragend', function() {
    refreshLocalFeed(map);
  });
}

function initMap() {
  console.log("init map called")
//  var ipdata = null;
  //$.getJSON('http://ipinfo.io', function(data){
    // console.log("data ", data.loc);
    // //ipdata = data;
    // var loclng = data.loc.split(',');
    // console.log("data 0 ", parseFloat(loclng[0]));
    // var lat = parseFloat(loclng[0]);
    //
    // console.log("data 1 ", parseFloat(loclng[1]));
    // var lng = parseFloat(loclng[1]);
    //
    // usrLocationObj = {
    //   "lng": lng,
    //   "lat": lat
    // }
    var mapOptions;
    getLocation(function(cb) {
//getLocation();
      if (recUsrCoords == false) {
      console.log("populating user loc : ", cb.lat," : ",cb.lng);
      console.log("populating user loc : ",usrLocationObj.lat," : ",usrLocationObj.lng);
        mapOptions = {
          zoom: 16,
          center: new google.maps.LatLng(usrLocationObj.lat, usrLocationObj.lng),
          //center: new google.maps.LatLng(lat, lng),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        recUsrCoords = true;
      }

      console.log("init map");

      map = new google.maps.Map(document.getElementById('map'), mapOptions);
      var scope = angular.element(document.getElementById('body')).scope();

      console.log("initial local feed and call method to set usr loc in db");

      google.maps.event.addListenerOnce(map, 'idle', function() {
        refreshLocalFeed(map);
        var payload = {
          "userID": hash(scope.user.id),
          // "coords": [cb.lng,cb.lat]
          "coords": [usrLocationObj.lng,usrLocationObj.lat]
        }
        console.log("updUsrLoc payload : ", payload);
        scope.updUsrLoc(payload);

      });

      map.addListener('dragend', function() {
        refreshLocalFeed(map);
      });


//});

  });
}

function removePoly() {
  for (i in polyArray) {
    polyArray[i].setMap(null);
  }
}

function drawCondition() {
  if (!drawing) {
    disable()
    draw();
  }
  //once drawing is finished clear the listener
  google.maps.event.clearListeners(map.getDiv(), 'mousedown');
}

//length between points
function lineLen(a, b) {
  return Math.pow((a[0] - b[0]), 2) + Math.pow((a[1] - b[1]), 2);
}

//function to find shortest distance from point to line
function perpDistance(point, lineStart, lineEnd) {
  var resultSqr;
  //length of line
  var lineLength = lineLen(lineStart, lineEnd);

  if (lineLength == 0) {
    return lineLen(point, lineStart);
  }

  //point[0] = x axis and point[1] = y axis
  var t = ((point[0] - lineStart[0]) * (lineEnd[0] - lineStart[0]) +
    (point[1] - lineStart[1]) * (lineEnd[1] - lineStart[1])) / lineLength;

  if (t < 0) {
    return lineLen(point, lineStart);
  }
  if (t > 1) {
    return lineLen(point, lineEnd);
  }

  var pointB = [lineStart[0] + t * (lineEnd[0] - lineStart[0]), lineStart[1] + t * (lineEnd[1] - lineStart[1])];

  resultSqr = lineLen(point, pointB);

  //square root and return
  // console.log('perp len: ', resultSqr);
  return Math.sqrt(resultSqr);

}

//smooth edges using Ramer–Douglas–Peucker algorithm
function smoothEdges(points, epsilon) {

  //find point with maximum distance to line
  var pointsArray = points; //get first polygon
  var resultSet = [],
    sectionA = [],
    sectionB = [];
  var maxDist = 0,
    dist, index,
    end = points.length - 1;

  var i;
  for (i = 1; i < end - 1; i++) {
    dist = perpDistance(pointsArray[i], pointsArray[0], pointsArray[end]);

    if (dist > maxDist) {
      //select that point
      index = i;
      //update new maxDist
      maxDist = dist;
    }
  }

  //check against epsilon (dist threshold)
  if (maxDist > epsilon) {
    //recursively simplify new lines from index
    //console.log('sectionA :', sectionA);
    sectionA = smoothEdges(pointsArray.slice(0, index), epsilon);

    sectionB = smoothEdges(pointsArray.slice(index, end), epsilon);

    //build up result set
    //add in points from set a
    for (point in sectionA) {
      resultSet.push(sectionA[point]);
    }
    //add in points from set b
    for (point in sectionB) {
      resultSet.push(sectionB[point]);
    }
  } else {
    resultSet.push(pointsArray[0]);
    resultSet.push(pointsArray[end]);
  }

  return resultSet;
}


function smoothv3(points) {
  var len = points.length;
  var newPoints = [];
  var index = 0;
  for (i = 1; i < len - 1; i++) {
    if ((i % 1.25) != 0) {
      newPoints.push([points[i][0], points[i][1]]);
    }

  }
  return newPoints;
}

function removeDuplicates(arr) {
  let unique_array = []
  for (let i = 0; i < arr.length; i++) {
    if (unique_array.indexOf(arr[i]) == -1) {
      unique_array.push(arr[i])
    }
  }
  return unique_array
}

function reverseLatLng(input) {
  //form new points in format for new polygon object
  console.log("input : ", input);
  var revPoints = [];
  for (var i = 0; i < input.length; i++) {
    revPoints.push({
      lat: input[i][1],
      lng: input[i][0]
    });
  }

  return revPoints;
}

function setId(feed) {
  //console.log("setID");
  if (feed == "user") {

    $(".elemMe").each(function(index) {
      $(this).attr("id", this.id + index);
    });
    console.log("setID: user : feed :", feed);
  }

  if (feed == "local") {
    $(".elem").each(function(index) {
      $(this).attr("id", this.id + index);
    });

    console.log("setID: local : feed :", feed);
  }

  if (feed == "rate") {
    $(".elemRate").each(function(index) {
      $(this).attr("id", this.id + index);
    });

    console.log("setID: rate : feed :", feed);
  }

}

function removeId(feed) {
  if (feed == "local") {
    $(".elem").each(function(index) {
      $(this).removeAttr('id');
    });

  }
  if (feed == "user") {
    $(".elemMe").each(function(index) {
      $(this).removeAttr('id');
    });

  }

  if (feed == "rate") {
    $(".elemRate").each(function(index) {
      $(this).removeAttr('id');
    });

  }


}

function showPolyRate(item) {
  setId("rate");
  removePoly();
  var scope = angular.element(document.getElementById('body')).scope();
  var coords = scope.rteMessages[item.id].coords[0];
  var coordsRev = reverseLatLng(coords);
  var bound = new google.maps.LatLngBounds();

  var tempPoly = new google.maps.Polygon({
    map: map,
    path: coordsRev
  });

  for (i = 0; i < coords.length; i++) {
    //temp.push([points[i][0], points[i][1]]);

    bound.extend(new google.maps.LatLng(coords[i][0], coords[i][1]));

  }
  map.setCenter(new google.maps.LatLng(coords[Math.floor(coords.length / 2)][1], coords[Math.floor(coords.length / 2)][0]));
  polyArray.push(tempPoly);
  removeId("rate");
}
function showPoly(item) {
  setId("local");
  removePoly();
  var scope = angular.element(document.getElementById('body')).scope();
  var coords = scope.respMessages[item.id].coords[0];
  var coordsRev = reverseLatLng(coords);
  var bound = new google.maps.LatLngBounds();

  var tempPoly = new google.maps.Polygon({
    map: map,
    path: coordsRev
  });

  for (i = 0; i < coords.length; i++) {
    //temp.push([points[i][0], points[i][1]]);

    bound.extend(new google.maps.LatLng(coords[i][0], coords[i][1]));

  }
  map.setCenter(new google.maps.LatLng(coords[Math.floor(coords.length / 2)][1], coords[Math.floor(coords.length / 2)][0]));
  polyArray.push(tempPoly);
  removeId("local");
}

function showPolyMe(item) {
  setId("user");
  removePoly();
  var scope = angular.element(document.getElementById('body')).scope();
  var coords = scope.usrMessages[item.id].coords[0];
  var coordsRev = reverseLatLng(coords);
  var bound = new google.maps.LatLngBounds();

  var tempPoly = new google.maps.Polygon({
    map: map,
    path: coordsRev
  });

  for (i = 0; i < coords.length; i++) {
    //temp.push([points[i][0], points[i][1]]);

    bound.extend(new google.maps.LatLng(coords[i][0], coords[i][1]));

  }
  map.setCenter(new google.maps.LatLng(coords[Math.floor(coords.length / 2)][1], coords[Math.floor(coords.length / 2)][0]));
  polyArray.push(tempPoly);
  removeId("user");
}

function draw() {
  //mouseup-listener
  google.maps.event.addListenerOnce(map, 'mouseup', function(e) {
    console.log("mouseup");
    //remove old listeners
    google.maps.event.removeListener(move);
    google.maps.event.removeListener(mousedown);
    //  removePoly(poly);
    //get path of drawn object


    //loop and add points in this path to array to be sent to data layer
    var bounds = new google.maps.LatLngBounds();

    var smoothedPoints = [];
    var smoothedPointsRev = [];
    for (var i = 0; i < poly.getPath().getLength(); i++) {
      bounds.extend(poly.getPath().getAt(i));
      polyPoints.push([poly.getPath().getAt(i).lng(), poly.getPath().getAt(i).lat()]);
    }

    //ensure last point ends at original point
    polyPoints.push(polyPoints[0]);

    //apply smoothing
    smoothedPoints = smoothv3(polyPoints);
    //smoothedPoints = smoothv2(polyPoints);
    //  smoothedPoints = smoothEdges(polyPoints, 0.00001);
    // console.log('with Dup : ', smoothedPoints.length);
    // smoothedPoints = removeDuplicates(smoothedPoints);
    // console.log('without Dup : ', smoothedPoints.length);
    smoothedPoints.push(smoothedPoints[0]);

    var revPoints = [];
    for (var i = 0; i < smoothedPoints.length; i++) {
      revPoints.push({
        lat: smoothedPoints[i][1],
        lng: smoothedPoints[i][0]
      });
    }

    smoothedPointsRev = revPoints;


    // console.log("orginal draw : ", smoothedPoints);
    // console.log("orginal draw rev : ", reverseLatLng(smoothedPoints));
    //set polygon path and map to be drawn on

    poly2 = new google.maps.Polygon({
      map: map,
      path: smoothedPointsRev
    });
    //remove old polygon
    removePoly();
    polyArray.push(poly2);
    //store array in browser so angular function can pick it up and send points to server
    window.polyPoints = smoothedPoints;
    //enable map functions
    enable()
  });

  //mousedown event, once user begins to drawn
  //capture mouse movement and draw new poly
  mousedown = google.maps.event.addListener(map, 'mousedown', function() {
    //  console.log("mouse down");
    move = google.maps.event.addListener(map, 'mousemove', function(e) {
      dataPoints.push(e.latLng);

      poly = new google.maps.Polyline({
        path: dataPoints,
        map: map,
        clickable: false
      });

      polyArray.push(poly); //add to array of polys to be cleared up later
    });
  });
}


function disable() {
  map.setOptions({
    draggable: false,
    zoomControl: false,
    scrollwheel: false,
    disableDoubleClickZoom: false
  });

}

function enable() {
  map.setOptions({
    draggable: true,
    zoomControl: true,
    scrollwheel: true,
    disableDoubleClickZoom: true
  });
}

function loginJS() {
  $('#loginModal').modal('hide');
  document.getElementById('verNumbr').value = "";
}

//try find centre of three and make that the new point
function smoothv2(points) {

  var len = points.length;
  var reducedLen = Math.floor(len * 0.6);
  var int = len / reducedLen
  var interval = 3; //int.toFixed(2);// 1.5;//Math.ceil((reducedLen / len)*10);
  var temp = [];
  var newPoints = [];
  var bound = new google.maps.LatLngBounds();
  var index = 0;
  console.log('old length :', len);
  console.log('point index 0:', (points[1]));
  // while (index < len) {
  //   for (i = 0; i < interval; i++) {
  //     //temp.push([points[i][0], points[i][1]]);
  //     if (index > len - 1) {
  //       break;
  //     }
  //     bound.extend(new google.maps.LatLng(points[index][0], points[index][1]));
  //
  //     index++;
  //
  //   }


  //console.log('temp points: lng ', temp[0][0], 'lat : ', temp[0][1]);
  //console.log('new points: lng ', bound.getCenter().lng(), 'lat : ', bound.getCenter().lat());
  // newPoints.push([bound.getCenter().lat(), bound.getCenter().lng()]);
  //newPoints.push([points[i][0], points[i][1]]);
  //index = index +interval;
  //}

  // for(var i = 0; i < newPoints.length; i++){
  //   for(var j = 0; i < newPoints.length; j++){
  //     if(i != j){
  //       intersects(newPoints[i][0],newPoints[i][1],newPoints[i+1][0],newPoints[i+1][1],p,q,r,s)
  //     }
  //   }
  // }
  console.log('index : ', index);
  console.log('reducedLen : ', reducedLen);
  console.log('interval : ', interval);
  console.log('old length :', len);
  console.log('new length :', newPoints.length);
  newPoints.push(newPoints[0]);
  return newPoints;
}
