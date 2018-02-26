var app = angular.module("footNote", []);
const rndNum = Math.floor(1000 + Math.random() * 9000);
app.controller('myCtrl', function($scope, $http) {
  $scope.respMessages = [];
  $scope.usrMessages = [];
  $scope.user;
  $scope.coords = window.polyPoints;


  $scope.$watch(function() {
    return window.polyPoints;
  }, function() {
    $scope.coords = window.polyPoints;
  });

  $scope.updUsrLoc = function(loc) {
    var payload = {
      "userID": loc.userID,
      "coords": loc.coords
    }
    //console.log("update location payload :  ", payload.coords);
    $http.post('https://ec2-13-59-133-80.us-east-2.compute.amazonaws.com:3000/api/addLoc', payload).then(function(response) {

      $scope.user.location = response.data.location;
      $scope.user.threshold = response.data.threshold;
      console.log("location in UI : ", $scope.user.location);

    });

  };
  $scope.verify2 = function() {
    console.log('verf :', $scope.user.verf);
    console.log('verf2 :', document.getElementById('verNumbr').value);

    if (document.getElementById('verNumbr').value == $scope.user.verf) {
      //console.log('verf :',$scope.user.verf);

      //  $scope.getMyMessages($scope.user.id)
      var payload = {
        "userID": $scope.user.id,
        "verf": $scope.user.verf
      }

      //  console.log(' $scope.user.id', payload.userID);
      $http.post('https://ec2-13-59-133-80.us-east-2.compute.amazonaws.com:3000/api/logEntry', payload).then(function(response) {
        console.log("logEntry");
        $scope.user.rating = response.data.rating;
        console.log("rating in UI : ", response.data);

      });
      loginJS();

    }
  };

  $scope.verify = function() {
    // var rndNum =
    $scope.user.verf = rndNum;
    console.log('verf (1):', $scope.user.verf);
    var string = $scope.user.id;
    var substring = "ac.uk";
    //check valid Email
    if (string == "footnotead1@gmail.com") {

      var payload = {
        "userID": $scope.user.id,
        "verf": $scope.user.verf
      }
      //  console.log(' $scope.user.id', payload.userID);
      $http.post('https://ec2-13-59-133-80.us-east-2.compute.amazonaws.com:3000/api/mail', payload).then(function(response) {
        console.log("mail sent");
      });
      window.alert("verification sent");

    } else if (string.indexOf(substring) == -1 || string == null) {
      window.alert("Invalid Email");
    } else {

      //send off email request
      var payload = {
        "userID": $scope.user.id,
        "verf": $scope.user.verf
      }

      //  console.log(' $scope.user.id', payload.userID);
      $http.post('https://ec2-13-59-133-80.us-east-2.compute.amazonaws.com:3000/api/mail', payload).then(function(response) {
        console.log("mail sent");
      });
      window.alert("verification sent");

    }

    document.getElementById('loginBut').disabled = false;
    document.getElementById('verify').disabled = true;
  };

  $scope.clearSelection = function() {
    window.polyPoints = [];
    $scope.coords = [];
    console.log('polyPoints', window.polyPoints);
  }

  $scope.getMessage = function() {

    //console.log('polyPoints', window.polyPoints);
    $scope.coords = window.polyPoints;
    //console.log('$scope.coords', $scope.coords);
    // polyPoints = window.polyPoints;
    $http.post('https://ec2-13-59-133-80.us-east-2.compute.amazonaws.com:3000/api/retrieve', [$scope.coords]).then(function(response) {
      //  $scope.respMessages.push(response.data[0].messageContent);
      //console.log('resp', response)
      $scope.respMessages = [];

      //  console.log('message', response.data);
      for (var i = 0; i < response.data.length; i++) {
        // /  console.log(response.data[i].messageContent);
        $scope.respMessages.push({
          "alias": response.data[i].alias,
          "message": response.data[i].messageContent
        });
      }

    });
  }

  $scope.getInitialMessage = function(coords) {
    //console.log('getInitialMessage coords:', coords);
    // polyPoints = window.polyPoints;
    $http.post('https://ec2-13-59-133-80.us-east-2.compute.amazonaws.com:3000/api/retrieve', [coords]).then(function(response) {
      //  $scope.respMessages.push(response.data[0].messageContent);

      $scope.respMessages = [];

      for (var i = 0; i < response.data.length; i++) {
        console.log(response.data[i].messageContent);
        $scope.respMessages.push({
          "alias": response.data[i].alias,
          "message": response.data[i].messageContent,
          "coords": response.data[i].location.coordinates,
          "index": i
        });
      }

    });
  }

  $scope.getMyMessages = function(user, path) {

    console.log('getMyMessages', user);
    // polyPoints = window.polyPoints;
    $http.post('https://ec2-13-59-133-80.us-east-2.compute.amazonaws.com:3000/api/retrieveMe', [hash(user),path]).then(function(response) {
      //  $scope.respMessages.push(response.data[0].messageContent);
      console.log('getMyMessages : response', response.data.myMessages);
      console.log('getMyMessages : response : rate', response.data.toRate);
      $scope.usrMessages = [];
      $scope.rteMessages = [];
      $scope.user.numberOfPosts = response.data.myMessages.length;
      for (var i = 0; i < response.data.myMessages.length; i++) {

        $scope.usrMessages.push({
          "alias": response.data.myMessages[i].alias,
          "message": response.data.myMessages[i].messageContent,
          "coords": response.data.myMessages[i].location.coordinates
        });
      }

      for( var j = 0; j< response.data.toRate.length;j++){
        $scope.rteMessages.push({
          "alias": response.data.toRate[j].alias,
          "message": response.data.toRate[j].messageContent,
          "coords": response.data.toRate[j].location.coordinates,
          "UR": response.data.toRate[j].verfUsr,
          "MR": response.data.toRate[j].verfMsg
        });

      }

    });
  }

  $scope.send = function() {

    var expIn = document.getElementById('expiry').value;
    console.log("to expire in: ", expIn);
    var date = new Date();
    console.log(" dat rn : ", date);
    var defaultExpiry = date.setHours(date.getHours() + parseInt(expIn));
    console.log(" new date : ", defaultExpiry);

    var lastPost = new Date();
    var currentTime = new Date();
    //var postThreshold = currentTime.setMinutes(currentTime.setMinutes() - 1);

    var payload = {
      "messageContent": $scope.user.message,
      "verfUsr": $scope.user.rating,
      "alias": $scope.user.alias,
      "messageDupNumber": "1",
      "userID": hash($scope.user.id),
      "expiry": defaultExpiry,
      "location": {
        "type": "Polygon",
        "coordinates": [$scope.coords]
      }


    }
    console.log(payload);
    console.log("number of posts : ", $scope.user.numberOfPosts, " threshold : ", $scope.user.threshold);
    if ($scope.user.numberOfPosts > $scope.user.threshold) {
      window.alert("you have exceeded the number of posts per day please try tomorrow")
    } else if ($scope.user.lastpost == null || currentTime.getMinutes() > lastPost.getMinutes() + 1) {

      $http.post('https://ec2-13-59-133-80.us-east-2.compute.amazonaws.com:3000/api/add', payload).then(function(response) {
        console.log('response', response);
        $scope.user.lastpost = lastPost;
        //$scope.user.posts = response.data[0].count;
      }).then(function() {
        $scope.getMyMessages($scope.user.id, "A");
      });

    } else {
      console.log( "currentTime : ", currentTime , " last post : ", lastPost);
      window.alert("please wait at least 1 minute between posts")
    }

  }

});
