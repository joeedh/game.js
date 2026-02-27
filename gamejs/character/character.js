import {NodeSocketAbstract, Node, SocketFlags, NodeFlags} from '../graph/node.js';
import {Aspect, AspectClass} from '../util/typesystem.js';

import {Vector3, Matrix4, Vector4, Quat, Vector2} from '../util/vectormath.js';
import {ValueSocket, Vec3Socket, FlagsSocket, EnumSocket, 
        Mat4Socket, FlowSocket} from '../graph/sockets.js';

import {GameObject} from '../graph/gameobject.js'
import {SceneObject} from '../scene/sceneobject.js'

export let CharState = {
  IDLE    : 0, 
  MOVING  : 1, 
  JUMPING : 2, 
  FLYING  : 3
};
export let CharFlags = {
  SELECT   : 1, //editor flag
  DISABLED : 2,
  DEAD     : 4
};

export class Character extends SceneObject {
  static define() {return Node.inherit({
    name : "Character",
    inputs : {
      jump : new FlowSocket(),
      move : new FlowSocket(),
      move_dir : new Vec4Socket()
    },
    
    outputs : {
      state : new EnumSocket(CharState, 0),
      flag  : new FlagsSocket(CharFlags, 0),
      jump_done : new FlowSocket(), //jump animation done trigger
      
      anim_done : new FlowSocket() //generic animation done trigger,
    }
  })};
  
  constructor() {
    super();
    
    this.idle_animation = "idle";
    this.idle_animation_frame = 0;
    this.anim_state = 1;
  }
  
  execute(ctx) {
    if (this.inmap.jump.triggered) {
      this.anim_state = "jump";
      this.anim_frame = 0;
    }
    
    if (this.inmap.move.triggered) {
      
    }
  }
  
  on_tick_anim(ctx) {
    let count = ctx.engine.countAnimationFrames(this, this.anim_state);
    
    if (this.anim_frame >= count) {
      if (this.anim_state == "jump") {
        this.outmap.jump_done.trigger();
      } else {
        this.outmap.anim_done.trigger();
      }
      
      this.anim_state = this.idle_animation;
      this.anim_frame = this.idle_animation_frame;
      ctx.engine.loadAnimationFrame(this, this.anim_state, this.anim_frame);
    } else {
      ctx.engine.loadAnimationFrame(this, this.anim_state, this.anim_frame);
    }
    
    this.anim_frame++;
  }
  
  on_tick(ctx) {
    if (this.anim_state !== undefined) {
      this.on_tick_anim(ctx);
    }
  }
}

