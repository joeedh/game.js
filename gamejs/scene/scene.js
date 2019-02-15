import {NodeSocketAbstract, Node, SocketFlags, NodeFlags, Graph} from '../graph/node.js';
import {Aspect, AspectClass} from '../util/typesystem.js';

import {Vector3, Matrix4, Vector4, Quat, Vector2} from '../util/vectormath.js';
import {ValueSocket, Vec3Socket, Mat4Socket} from '../graph/sockets.js';
import * as util from '../util/util.js';
import {time_ms} from '../util/util.js';
import {GameObject} from '../graph/gameobject.js'

import {GameEngineIF} from './engine.js';

class GameScene extends AspectClass {
  constructor(dt=1000.0/60.0, engine=undefined) { //time spent per frame
    super();
    
    this.dt = dt;
    this.objects = []; //flat list of all game object
    this.graph = new Graph();
    this.engine = engine === undefined ? new GameEngineIF() : engine; //stub if necassary
    
    this.eventhandlers = {};
  }
  
  toJSON() {
    return {
      object : this.objects,
      dt : this.dt,
      graph : this.graph
    };
  }
  
  addEventInput(type, handler) {
    if (this.eventhandlers[type] === undefined)
      this.eventhandlers[type] = [];
    
    this.eventhandlers[type].push(handler)
  }
  
  removeEventInput(type, handler) {
    this.eventhandlers[type].remove(handler);
  }
  
  frame() {
    let dt = this.dt;
    let engine = this.engine;
    
    let start = time_ms();
    let time = 0;
    
    engine.beginFrame(this);
    engine.render();
    
    let dt2 = time_ms() - start;
    
    if (dt2 >= dt) { //force one cycle of physics engine
      engine.doPhysics(undefined, true);
    } else {
      engine.doPhysics(dt-dt2);
    }
  }
}

export function load(path, name) {
  return new Promise((accept, reject) => {
    let spath = `${path}/${name}.json`;
    
    fetch(spath).then((res) => {
      res.json().then((data) => {
      
      let scene = new GameScene();
      //for ob in 
      
      accept(scene);
    })});
    
    console.log(spath)
  })
}





