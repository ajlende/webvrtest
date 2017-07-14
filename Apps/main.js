// start the Cesium viewer
function startup(Cesium) {
  'use strict';

  // create the Cesium viewer
  var viewer = new Cesium.Viewer('cesiumContainer', { vrButton: true, useDefaultRenderLoop: false });
  var webglCanvas = viewer.canvas;

  var vrButton = viewer.vrButton;
  var cesiumVR = window.cesiumVR = vrButton.viewModel;
  console.log('Cesium VR Enabled: ' + cesiumVR.isVREnabled);
  vrButton.container.addEventListener('click', onVRRequestPresent);

  var vrDisplay = window;
  if (navigator.getVRDisplays) {
    frameData = new VRFrameData();
    navigator.getVRDisplays().then(function (displays) {
      if (displays.length > 0) {
        vrDisplay = displays[displays.length - 1];
        window.vrDisplay = vrDisplay;

        // It's highly reccommended that you set the near and far planes to
        // something appropriate for your scene so the projection matricies
        // WebVR produces have a well scaled depth buffer.
        vrDisplay.depthNear = 0.1;
        vrDisplay.depthFar = 1024.0;

        // Generally, you want to wait until VR support is confirmed and
        // you know the user has a VRDisplay capable of presenting connected
        // before adding UI that advertises VR features.
        // if (vrDisplay.capabilities.canPresent) {
        //   vrPresentButton = VRSamplesUtil.addButton("Enter VR", "E", "media/icons/cardboard64.png", onVRRequestPresent);
        // }

        // For the benefit of automated testing.  Safe to ignore.
        // if (vrDisplay.capabilities.canPresent && WGLUUrl.getBool('canvasClickPresents', false)) {
        //   webglCanvas.addEventListener("click", onVRRequestPresent, false);
        // }

        // The UA may kick us out of VR present mode for any reason, so to
        // ensure we always know when we begin/end presenting we need to
        // listen for vrdisplaypresentchange events.
        window.addEventListener('vrdisplaypresentchange', onVRPresentChange, false);

        // These events fire when the user agent has had some indication that
        // it would be appropariate to enter or exit VR presentation mode, such
        // as the user putting on a headset and triggering a proximity sensor.
        // You can inspect the `reason` property of the event to learn why the
        // event was fired, but in this case we're going to always trust the
        // event and enter or exit VR presentation mode when asked.
        window.addEventListener('vrdisplayactivate', onVRRequestPresent, false);
        window.addEventListener('vrdisplaydeactivate', onVRExitPresent, false);
      } else {
        // VRSamplesUtil.addInfo("WebVR supported, but no VRDisplays found.", 3000);
        console.warn("WebVR supported, but no VRDisplays found.");
      }
    });
  } else if (navigator.getVRDevices) {
    // VRSamplesUtil.addError("Your browser supports WebVR but not the latest version.  See <a href='http://webvr.info'>webvr.info</a> for more info.");
    console.error("Your browser supports WebVR but not the latest version. See http://webvr.info for more info.");
  } else {
    // VRSamplesUtil.addError("Your browser does not support WebVR.  See <a href='http://webvr.info'>webvr.info</a> for assistance.");
    console.error("Your browser does not support WebVR. See http://webvr.info for assistance.");
  }


  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // Begin WebVR Test Code ///////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////

  function onVRRequestPresent() {
    // This can only be called in response to a user gesture.
    return vrDisplay.requestPresent([{ source: webglCanvas }])
      .catch(function (err) {
        var errMsg = "requestPresent failed.";
        // if (err && err.message) {
        //   errMsg += "<br/>" + err.message
        // }
        // VRSamplesUtil.addError(errMsg, 2000);
        console.error(errMsg, err);
      });
  }

  function onVRExitPresent() {
    // No sense in exiting presentation if we're not actually presenting.
    // (This may happen if we get an event like vrdisplaydeactivate when
    // we weren't presenting.)
    if (!vrDisplay.isPresenting) return Promise.resolve('Not presenting');

    return vrDisplay.exitPresent()
      .catch(function (err) {
        var errMsg = "exitPresent failed.";
        // if (err && err.message) {
        //   errMsg += "<br/>" + err.message
        // }
        // VRSamplesUtil.addError(errMsg, 2000);
        console.error(errMsg, err);
      });
  }

  function onVRPresentChange() {
    // When we begin or end presenting, the canvas should be resized to the
    // recommended dimensions for the display.
    onResize();
    if (vrDisplay.isPresenting) {
      console.log('VR is presenting!');
      if (vrDisplay.capabilities.hasExternalDisplay) {
        console.log("VR has external display.");
        // Because we're not mirroring any images on an external screen will
        // freeze while presenting.  It's better to replace it with a message
        // indicating that content is being shown on the VRDisplay.
        // presentingMessage.style.display = "block";

        // On devices with an external display the UA may not provide a way
        // to exit VR presentation mode, so we should provide one ourselves.
        // VRSamplesUtil.removeButton(vrPresentButton);
        // vrPresentButton = VRSamplesUtil.addButton("Exit VR", "E", "media/icons/cardboard64.png", onVRExitPresent);
      }
    } else {
      // If we have an external display take down the presenting message and
      // change the button back to "Enter VR".
      if (vrDisplay.capabilities.hasExternalDisplay) {
        console.log("VR has external display.");
        // presentingMessage.style.display = "";
        // VRSamplesUtil.removeButton(vrPresentButton);
        // vrPresentButton = VRSamplesUtil.addButton("Enter VR", "E", "media/icons/cardboard64.png", onVRRequestPresent);
      }
    }
  }

  function onResize() {
    if (vrDisplay && vrDisplay.isPresenting) {
      // If we're presenting we want to use the drawing buffer size
      // recommended by the VRDevice, since that will ensure the best
      // results post-distortion.
      var leftEye = vrDisplay.getEyeParameters("left");
      var rightEye = vrDisplay.getEyeParameters("right");
      // For simplicity we're going to render both eyes at the same size,
      // even if one eye needs less resolution.  You can render each eye at
      // the exact size it needs, but you'll need to adjust the viewports to
      // account for that.
      webglCanvas.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
      webglCanvas.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);
    } else {
      // We only want to change the size of the canvas drawing buffer to
      // match the window dimensions when we're not presenting.
      webglCanvas.width = webglCanvas.offsetWidth * window.devicePixelRatio;
      webglCanvas.height = webglCanvas.offsetHeight * window.devicePixelRatio;
    }
  }
  window.addEventListener("resize", onResize, false);
  onResize();

  // Listen for click events on the canvas, which may come from something
  // like a Cardboard viewer or other VR controller, and make a small change
  // to the scene in response (so that we know it's working.) This basic
  // interaction mode is the baseline for all WebVR compatible devices, and
  // should ideally always be minimally supported.
  // function onClick () {
  //   // Reset the background color to a random value
  //   gl.clearColor( Math.random() * 0.5, Math.random() * 0.5, Math.random() * 0.5, 1.0);
  // }
  // webglCanvas.addEventListener("click", onClick, false);

  function onAnimationFrame(t) {
    if (vrDisplay) {
      vrDisplay.requestAnimationFrame(onAnimationFrame);
      viewer.render();
    }
  }
  vrDisplay.requestAnimationFrame(onAnimationFrame);

  // function onAnimationFrame (t) {
  //   stats.begin();
  //   gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  //   if (vrDisplay) {
  //     // When presenting content to the VRDisplay we want to update at its
  //     // refresh rate if it differs from the refresh rate of the main
  //     // display.  Calling VRDisplay.requestAnimationFrame ensures we render
  //     // at the right speed for VR.
  //     vrDisplay.requestAnimationFrame(onAnimationFrame);
  //     // As a general rule you want to get the pose as late as possible
  //     // and call VRDisplay.submitFrame as early as possible after
  //     // retrieving the pose.  Do any work for the frame that doesn't need
  //     // to know the pose earlier to ensure the lowest latency possible.
  //     //var pose = vrDisplay.getPose();
  //     vrDisplay.getFrameData(frameData);
  //     if (vrDisplay.isPresenting) {
  //       // When presenting render a stereo view.
  //       gl.viewport(0, 0, webglCanvas.width * 0.5, webglCanvas.height);
  //       cubeSea.render(frameData.leftProjectionMatrix, frameData.leftViewMatrix, stats, t);
  //       gl.viewport(webglCanvas.width * 0.5, 0, webglCanvas.width * 0.5, webglCanvas.height);
  //       cubeSea.render(frameData.rightProjectionMatrix, frameData.rightViewMatrix, stats, t);
  //       // If we're currently presenting to the VRDisplay we need to
  //       // explicitly indicate we're done rendering.
  //       vrDisplay.submitFrame();
  //     } else {
  //       // When not presenting render a mono view that still takes pose into
  //       // account.
  //       gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
  //       // It's best to use our own projection matrix in this case, but we can use the left eye's view matrix
  //       mat4.perspective(projectionMat, Math.PI*0.4, webglCanvas.width / webglCanvas.height, 0.1, 1024.0);
  //       cubeSea.render(projectionMat, frameData.leftViewMatrix, stats, t);
  //       stats.renderOrtho();
  //     }
  //   } else {
  //     window.requestAnimationFrame(onAnimationFrame);
  //     // No VRDisplay found.
  //     gl.viewport(0, 0, webglCanvas.width, webglCanvas.height);
  //     mat4.perspective(projectionMat, Math.PI*0.4, webglCanvas.width / webglCanvas.height, 0.1, 1024.0);
  //     mat4.identity(viewMat);
  //     cubeSea.render(projectionMat, viewMat, stats, t);
  //     stats.renderOrtho();
  //   }
  //   stats.end();
  // }

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // End WebVR Test Code /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////////////////////////

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

    // return new Cesium.Entity({
    //   position: Cesium.Cartesian3.fromDegrees(lng, lat, alt),
    // billboard: new Cesium.BillboardGraphics({
    //     image: sym.getMarker().asCanvas(),
    //     show: true,
    //     scale: 1.2,
    //     width: 240.0,
    //     height: 80.0 })
    // });

    return new Cesium.Entity({
      position: Cesium.Cartesian3.fromDegrees(lng, lat, alt),
      point: {
        color: Cesium.Color.RED,
        pixelSize: 10,
      }
    });
  }

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

  function preRenderForVR(scene, time) {
    if (!vrDisplay || !vrDisplay.getFrameData) return;

    var position = entity.position.getValue(time);

    vrDisplay.getFrameData(frameData);

    var pose = frameData.pose;
    var ori = pose.orientation;

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
  }

  viewer.scene.preRender.addEventListener(preRenderForVR);

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
