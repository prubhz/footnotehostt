var button = $('#loginClose');

$(window).on('load', function() {
  document.getElementById('loginBut').disabled = true;
  $('#loginModal').modal('show');
});

$("#loginModal").on("hidden.bs.modal", function() {

  var bounds;
  var initialArea = [];
  var NECorner;
  var SWCorner;
  var NWCorner;
  var SECorner;

  var scope = angular.element(document.getElementById('body')).scope();

  var uID = scope.user.id;
  console.log('user messages : ', uID);
  scope.getMyMessages(uID.toString(),"I");

//  $(document).ready(function(){
    initMap();
  //});
  // refreshLocalFeed(map);




});
