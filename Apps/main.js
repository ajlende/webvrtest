// put your key for Bing Map here, see: https://www.bingmapsportal.com/
//   Cesium.BingMapsApi.defaultKey = 'xxxxxxxxxxxx'

// create a Cesium Entity with a MIL-2525 symbol at the given location
function milEntityAt(lng, lat, alt) {
  // create a MIL-2525 symbol
  // var sym = new ms.Symbol("sfgpewrh--mt", {
  //     size:35,
  // quantity: 20,
  // staffComments: "staff",
  // additionalInformation: "info",
  // direction: (750*360/6400),
  // type: "machine gun".toUpperCase(),
  // dtg: "time",
  // location: "location"
  // });
  // return an Entity with the mil2525 symbol
  return new Cesium.Entity({
    position: Cesium.Cartesian3.fromDegrees(lng, lat, alt),
    point: {
      color: Cesium.Color.RED,
    }
  })
  // billboard: new Cesium.BillboardGraphics({
  //     image: sym.getMarker().asCanvas(),
  //     show: true,
  //     scale: 1.2,
  //     width: 240.0,
  //     height: 80.0 })
  // })
}

// start the Cesium viewer
function startup(Cesium) {
  'use strict';

  // assume we have a valid VR display
  var vrDisplay = window;
  navigator.getVRDisplays().then(function(displays) {
    if (displays.length > 0) {
      vrDisplay = displays[0];
    }
  });

  // create the Cesium viewer
  var viewer = new Cesium.Viewer('cesiumContainer', { vrButton : true });

  // Click the VR button in the bottom right of the screen to switch to VR mode.
  viewer.scene.globe.enableLighting = true;
  viewer.terrainProvider = new Cesium.CesiumTerrainProvider({
    url : '//assets.agi.com/stk-terrain/world',
    requestVertexNormals : true
  });

  viewer.scene.globe.depthTestAgainstTerrain = true;

  // initial location Sydney
  var longitude = 151.2093;
  var latitude = -33.8688;
  var altitude = 200.0;

  var entity = viewer.entities.add(milEntityAt(longitude, latitude, altitude));
  viewer.flyTo(entity);

  // Set initial camera position and orientation to be in the model's reference frame.
  var camera = viewer.camera;
  camera.position = new Cesium.Cartesian3(0.25, 0.0, 0.0);
  camera.direction = new Cesium.Cartesian3(1.0, 0.0, 0.0);
  camera.up = new Cesium.Cartesian3(0.0, 0.0, 1.0);
  camera.right = new Cesium.Cartesian3(0.0, -1.0, 0.0);

  var frameData = new VRFrameData();

  viewer.scene.preRender.addEventListener(function(scene, time) {
    var position = entity.position.getValue(time);

    vrDisplay.getFrameData(frameData);

    var pose = frameData.pose;
    var ori = curFramePose.orientation;

    if (!Cesium.defined(position)) {
      return;
    }

    // the tricky bit
    var transform;
    var q;
    if (Cesium.defined(ori)) {
      if (ori[0] == 0 && ori[1] == 0 && ori[2] == 0 && ori[3] == 0) {
        q = Cesium.Quaternion.IDENTITY;
      }
      else {
        q = new Cesium.Quaternion(ori[0], ori[1], ori[2], ori[3]);
      }
      transform = Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromQuaternion(q), position);
    } else {
      transform = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    }

    // Save the camera state
    var offset = Cesium.Cartesian3.clone(camera.position);
    var direction = Cesium.Cartesian3.clone(camera.direction);
    var up = Cesium.Cartesian3.clone(camera.up);

    // Set camera to be in model's reference frame.
    camera.lookAtTransform(transform);

    // Reset the camera state to the saved state so it appears fixed in the model's frame.
    Cesium.Cartesian3.clone(offset, camera.position);
    Cesium.Cartesian3.clone(direction, camera.direction);
    Cesium.Cartesian3.clone(up, camera.up);
    Cesium.Cartesian3.cross(direction, up, camera.right);
  });

  // create a few other symbols nearby to look at
  Cesium.Math.setRandomNumberSeed(3);
  for (var i = 0; i < 10; ++i) {
    var lng = longitude + Cesium.Math.nextRandomNumber()/100.0;
    var lat = latitude + Cesium.Math.nextRandomNumber()/100.0;
    viewer.entities.add(milEntityAt(lng, lat, altitude));
  }

  Sandcastle.finishedLoading();
} // end start Cesium

// launch Cesium if available
if (typeof Cesium !== "undefined") {
  startup(Cesium);
} else if (typeof require === "function") {
  require(["Cesium"], startup);
}
