import {NodeSocketAbstract, SocketFlags, NodeFlags} from './node.js';
import {Aspect, AspectClass} from '../util/typesystem.js';
import '../util/struct.js'

import {Vector3, Matrix4, Vector4, Quat, Vector2} from '../util/vectormath.js';

export class ValueSocket extends NodeSocketAbstract {
  define() {return {
    name : "Value",
    flag : 0
  }};
  
  constructor(name) {
    super(name, value, min, max, is_int);
    
    this.value = value;
    this._last_value = value;
    this.min = min;
    this.max = max;
    this.is_int = is_int;
  }
  
  storeLastValue() {
    this._last_value = this.value;
  }
  
  deltaLastValue() {
    return this.value - this._last_value;
  }
  
  static fromSTRUCT(reader) {
    let ret = new ValueSocket();
    reader(ret);
    return ret;
  }
}

ValueSocket.STRUCT = STRUCT.inherit(ValueSocket, NodeSocketAbstract) + `
  value : float;
}
`;

STRUCT.add_class(ValueSocket);

export class Vec3Socket extends NodeSocketAbstract {
  define (){return {
    name : "Vec3",
    flag : 0
  }}
  
  constructor(name, value, min, max, is_int) {
    super(name);
    
    this.min = new Vector3(min);
    this.max = new Vector3(max);
    
    this.value = new Vector3(value);
    this._last_value = new Vector3(this.value);
  }
  
  storeLastValue() {
    this._last_value.load(this.value);
  }
  
  deltaLastValue() {
    return this.value.vectorDistance(this._last_value);
  }
  static fromSTRUCT(reader) {
    let ret = new Vec3Socket();
    reader(ret);
    return ret;
  }
}

Vec3Socket.STRUCT = STRUCT.inherit(Vec3Socket, NodeSocketAbstract) + `
  value : vec3;
}
`
STRUCT.add_class(Vec3Socket);


export class Mat4Socket extends NodeSocketAbstract {
  define (){return {
    name : "Mat4",
    flag : 0
  }}
  
  constructor(name, value, is_int) {
    super(name);
    
    this.is_int = is_int;
    this.value = new Matrix4(value);
    this._last_value = new Matrix4(this.value);
    this._tmp = new Matrix4();
  }
  
  storeLastValue() {
    this._last_value.load(this.value);
  }
  
  deltaLastValue() {
    let m1 = this.value;
    let m2 = this._last_value;
    let t = this._tmp;
    
    t.load(m2).sub(m1);
    
    let vec = new Vector4();
    vec[0] = vec[1] = vec[2] = vec[3] = 1.0;
    
    vec.multVecMatrix(t);
    
    return vec.vectorLength();
  }
}



