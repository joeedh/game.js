import * as STRUCT from '../util/struct.js';
import {NodeSocketAbstract, Node, SocketFlags, NodeFlags, Graph} from '../graph/node.js';
import {Aspect, AspectClass} from '../util/typesystem.js';

import {Vector3, Matrix4, Vector4, Quat, Vector2} from '../util/vectormath.js';
import {ValueSocket, Vec3Socket, Mat4Socket} from '../graph/sockets.js';
import * as util from '../util/util.js';
import {time_ms} from '../util/util.js';

class GameState extends Node {
  static define(name) {return {
    name : "GameState",
    inputs : {},
    outputs : {}
  }}
  
  constructor() {
    super();
  }
  
  static fromSTRUCT(reader) {
    let gs = new GameState();
    reader(gs);
    return gs;
  }
}

GameState.STRUCT = STRUCT.inherit(GameState, Node) + `
}
`;

STRUCT.add_class(GameState);

