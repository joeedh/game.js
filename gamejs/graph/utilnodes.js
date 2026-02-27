import {NodeSocketAbstract, Node, SocketFlags, NodeFlags} from '../graph/node.js';
import {Aspect, AspectClass} from '../util/typesystem.js';

import {Vector3, Matrix4, Vector4, Quat, Vector2} from '../util/vectormath.js';
import {ValueSocket, Vec3Socket, Mat4Socket, FlowSocket} from '../graph/sockets.js';

import {GameObject} from '../graph/gameobject.js'
import {SceneObject} from '../scene/sceneobject.js'

export class TestInt extends SceneObject {
  static define() {return Node.inherit({
    name : "TestInt",
    inputs : {
      //Cypress's PSoC creator's UI can do things like refine
      //types of sockets from parent nodes, make sure to do that 
      //to (in the blender UI py code)
      value   : new ValueSocket(),
      compare : new ValueSocket()
    },
    
    outputs : {
      trigger : new FlowSocket()
    }
  })};
  
  execute() {
    if (this.inputs[0].value == this.inputs[1].value) {
      this.outputs[0].trigger();
    }
  }
}
