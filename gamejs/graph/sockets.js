
import {NodeSocketAbstract, SocketFlags, NodeFlags} from './node.js';
import {Aspect, AspectClass} from '../util/typesystem.js';
import '../util/struct.js'

import {Vector3, Matrix4, Vector4, Quat, Vector2} from '../util/vectormath.js';


//this could get tricky, the cycle solver (as envisioned now)
//works by detecting convergence, which is what the storeLastValue
//and deltaLastValue methods are for.
//
//technically speaking, FlowSocket doesn't need to store a value
//at all, but then the solver's cycle breaker might get confused.
//so, FlowSocket does have a value, which should mirror the current state
//of this.flag & SocketFlags.UPDATE

export class FlowSocket extends NodeSocketAbstract {
  define() {return {
    name : "Flow",
    flag : 0
  }};
  
  constructor(default_value=false, name="untitled") {
    super(name);
    
    this.value = default_value;
    this._last_value = default_value;
  }
  
  storeLastValue() {
    this._last_value = this.value;
  }
  
  deltaLastValue() {
    return this.value - this._last_value;
  }
  
  static fromSTRUCT(reader) {
    let ret = new FlowSocket();
    reader(ret);
    return ret;
  }
}

FlowSocket.STRUCT = STRUCT.inherit(FlowSocket, NodeSocketAbstract) + `
  value : int;
}
`;

STRUCT.add_class(FlowSocket);

export class ValueSocket extends NodeSocketAbstract {
  define() {return {
    name : "Value",
    flag : 0
  }};
  
  constructor(default_value=0, min=-1e17, max=1e17, name="untitled", is_int=false) {
    super(name);
    
    this.value = default_value;
    this._last_value = default_value;
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


export class EnumSocket extends ValueSocket {
  /*
  enum is like so:
  
  some_object = {
    ITEM1 : 0,
    ITEM2 : 1,
  }
  
  uinames is like of human-readible names, if not defiend will be auto-generated
  */
  
  constructor(enumdef, default_value=0, name="untitled", uinames=undefined) {
    super(default_value)
    
    this.is_int = true;
    
    this.revenum = {}
    for (let k in enumdef) {
      this.revenum[enumdef[k]] = k;
    }
    
    this.enum = enumdef;
    if (uinames === undefined) {
      uinames = {};
      
      for (let k in enumdef) {
        let k2 = k.replace(/[ \t\n\r_$]/g, " ").replace(/  /g, " ").split(" ");
        let k3 = "", first = true;
        
        for (let word of k2) {
          k3 += word[0].toUpperCase() + word.slice(1, word.length).toLowerCase() + " "
        }
        
        uinames[k] = k3.trim();
      }
    }
    
    this.uinames = uinames;
  }
}


EnumSocket.STRUCT = STRUCT.inherit(EnumSocket, NodeSocketAbstract) + `
  value : int;
}
`;

export class FlagsSocket extends ValueSocket {
  /*
  enum is like so:
  
  some_object = {
    ITEM1 : 1,
    ITEM2 : 2,
  }
  
  uinames is like of human-readible names, if not defiend will be auto-generated
  */
  
  constructor(flagsdef, default_value=0, name="untitled", uinames=undefined) {
    super(default_value)
    
    this.is_int = true;
    
    this.revflags = {}
    for (let k in flagsdef) {
      this.revflags[flagsdef[k]] = k;
    }
    
    this.enum = flagsdef;
    if (uinames === undefined) {
      uinames = {};
      
      for (let k in flagsdef) {
        let k2 = k.replace(/[ \t\n\r_$]/g, " ").replace(/  /g, " ").split(" ");
        let k3 = "", first = true;
        
        for (let word of k2) {
          k3 += word[0].toUpperCase() + word.slice(1, word.length).toLowerCase() + " "
        }
        
        uinames[k] = k3.trim();
      }
    }
    
    this.uinames = uinames;
  }
}

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



