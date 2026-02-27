import {NodeSocketAbstract, Node, SocketFlags, NodeFlags} from './node.js';
import {Aspect, AspectClass} from '../util/typesystem.js';

import {Vector3, Matrix4, Vector4, Quat, Vector2} from '../util/vectormath.js';
import {ValueSocket, Vec3Socket, Mat4Socket} from './sockets.js';

let Identity = new Matrix4();

export class GameObject extends Node {
  constructor() {
    super();
  }
  
  on_tick() {
  }
}
