import {NodeSocketAbstract, Node, SocketFlags, NodeFlags} from './node.js';
import {Aspect, AspectClass} from '../util/typesystem.js';

import {Vector3, Matrix4, Vector4, Quat, Vector2} from '../util/vectormath.js';
import {ValueSocket, Vec3Socket, Mat4Socket} from './sockets.js';

let Identity = new Matrix4();

export class GameObject extends Node {
  static define() {return {
    name : "GameObject",
    inputs : {
      matrix : new Mat4Socket("matrix", Identity),
//      loc : new Vector3(),
//      quat : new Vector3(),
//      size : new Vector3(),
      parentinv : new Mat4Socket("matrix", Identity)
    },
    
    outputs : {
      matrix : new Mat4Socket("matrix", Identity)
    }
  }}
  
  constructor() {
    super();
    
    this.matrix = new Matrix4();
    
    this.loc = new Vector3();
    this.quat = new Quat();
    this.size = new Vector3();
  }
  
  on_tick() {
  }
}


