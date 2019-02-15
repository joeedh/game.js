"use strict"

import * as scene from '../scene/scene.js'
import * as engine from '../scene/engine.js'

class BJSState {
  constructor() {
    this.loadScene("Test");
  }
  
  loadScene(name) {
    scene.load(`game/Scenes/${name}`, name).then((scene) => {
      console.log("Got logic scene!", scene);
      
      this.scene = scene;
      this.start2();
    });
  }
  
  start(name="Test") {
    this.loadScene(name)
  }
  
  start2() {
        var canvas = this.canvas = document.getElementById("renderCanvas"); // Get the canvas element 
        var engine = this.engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

        /******* Add the create scene function ******/
        var createScene = function () {

            // Create the scene space
            var scene = new BABYLON.Scene(engine);

            // Add a camera to the scene and attach it to the canvas
            var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, new BABYLON.Vector3(0,0,5), scene);
            camera.attachControl(canvas, true);

            // Add lights to the scene
            var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);
            var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, 1, -1), scene);

            // Add and manipulate meshes in the scene
            var sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter:2}, scene);

            return scene;
        };
        /******* End of the create scene function ******/    

        var scene = this.bscene= createScene(); //Call the createScene function

        // Register a render loop to repeatedly render the scene
        engine.runRenderLoop(function () { 
                scene.render();
        });

        // Watch for browser/canvas resize events
        window.addEventListener("resize", function () { 
                engine.resize();
        });
  }
}

window.state = new BJSState();
state.start();