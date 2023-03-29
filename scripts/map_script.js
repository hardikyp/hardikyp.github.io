function initMap() {
    new google.maps.Map(document.getElementById("map"), {
      mapId: "2e1ff3edfa7ae7fb",
      center: { lat: 42.29336742303774, lng: -83.71556321232052 },
      zoom: 17
    });

    new google.maps.Marker({
      position:{ lat: 42.29336742303774, lng: -83.71556321232052 },
      map,
      animation: google.maps.Animation.DROP
    });
  }  