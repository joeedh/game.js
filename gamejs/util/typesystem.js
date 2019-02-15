"use strict";

console.log(window.global)
window.global = window

if (Symbol.aspect === undefined) {
  Symbol.aspect = Symbol("aspect");
  Symbol.pre = Symbol("pre");
  Symbol.post = Symbol("post");
  Symbol.aspects = Symbol("aspect");
}

class Method {
  //mode can be one of Symbol.pre or Symbol.post
  constructor(name, mode, symbol) {
    this.name = name;
    this.mode = mode;
    this.symbol = symbol;
    this.method = undefined;
    this.next = undefined;
    this.prev = undefined;
  }
  
  copy() {
    let c = new Method(this.name, this.mode, this.symbol);
    c.method = this.method;
    return c;
  }
}

let map = {};
let _aspect_idgen = 0;

class AspectRef {
  //mode can be Symbol.pre or Symbol.post
  constructor(data, mode) {
    this.mode = mode;
    this.aspect = data;
  }
}

//used by method chaining
let aspect_next = undefined;
let aspect_next_this = undefined;
let aspect_next_called = undefined;
let aspect_next_state = undefined;

//note that this Aspect class is put into the global 
//namespace
export class Aspect {
  static next() {
    aspect_next_called = true;
    return aspect_next.apply(aspect_next_this, arguments);
  }
  
  //mode can be one of Symbol.pre or Symbol.post
  static method(name, mode=Symbol.pre) {
    //ok, symbols should be unique every time you instantiate them,
    //even if the name is the same.
    
    let sym = Symbol(name);
    let m = new Method(name, mode, sym);
    
    map[sym] = m;
    return sym;
  }
  
  static pre(cls) {
    return new AspectRef(cls, Symbol.pre);
  }
  
  static post(cls) {
    return new AspectRef(cls, Symbol.post);
  }
  
  static checkCycles(cls) {
    if (cls._cycle_test)
      throw new Error(cls.name + ": circular reference between aspect classes");

    cls._cycle_test = 1;
    for (let a of cls._aspects) {
      Aspect.checkCycles(a.aspect);
    }
    
    delete cls._cycle_test;
  }
  
  static init(cls) {
    if (cls._init) {
      console.warn("Aspect.init was called twice!");
      return;
    }
    console.log("uninitialized constructor!", cls.name);
    
    if (cls._cycle_test) {
      throw new Error(cls.name + ": circular reference between aspect classes");
    }
    
    cls._init = true;
    cls._cycle_test = 1;
    cls._aspect_id = _aspect_idgen++;
    cls._aspects = [];
    
    let aspects = cls[Symbol.aspects]();
    
    for (let a of aspects) {
      let cls2 = a;
      
      if (!(a instanceof AspectRef)) {
        a = new AspectRef(a, undefined);
      } else {
        cls2 = a.aspect;
      }
      
      if (!cls2._init) {
        Aspect.init(cls2);
      }
      
      cls._aspects.push(a);
    }
    
    //ensure entire inheritance chain is initialized
    let cls2 = cls;
    while (cls2) {
      if (cls2 === AspectClass) {
        break;
      }
      
      if (!cls2._init) {
        Aspect.init(cls2);
      }
      
      cls2 = cls2.__proto__;
    }
    
    //clean up cycle ref test stuff
    delete cls._cycle_test;
    
    cls._amethods = {};
    
    //make methods from aspect definitions
    for (let k of Object.getOwnPropertySymbols(cls.prototype)) {
      if (!(k in map)) continue;
      
      let m = map[k];
      m.method = cls.prototype[k];
      
      cls.prototype[k]._aspectdef = m;
      cls.prototype[m.name] = cls.prototype[k];
      cls._amethods[m.name] = m;
    }
    
    //now, do patching
    let methods = {};
    
    console.log("patching", cls.name);
    
    aspects = cls._aspects
    for (let k of list(Object.getOwnPropertyNames(cls.prototype))) {
      let m = cls.prototype[k];
      if (k == "constructor") continue;
      if (!(m instanceof Function)) continue;
      
      for (let a of aspects) {
        let mode = a.mode;
        a = a.aspect;
        
        if (k in a._amethods) {
          if (!(k in methods)) {
            methods[k] = {
              pre : [],
              post : []
            }
          }
          
          let m = a._amethods[k];
          let mode2 = mode === undefined ? m.mode : mode;
          mode2 = mode2 === undefined ? Symbol.pre : mode2;
          
          if (mode2 === Symbol.pre)
            methods[k].pre.push(m.copy());
          else
            methods[k].post.push(m.copy());
        }
      }
    }
    
    function make_method(name, mdef, func) {
      //build method chain
      
      let lastm = undefined;
      for (let m of mdef.pre) {
        if (lastm !== undefined) {
          lastm.next = m;
          m.prev = lastm;
        }
        
        lastm = m;
      }
      
      let fm = new Method(name, undefined, undefined);
      fm.method = func;
      fm.mprev = lastm;
      
      if (lastm !== undefined) {
        lastm.next = fm;
        fm.prev = lastm;
      }
      
      lastm = fm;
      
      for (let m of mdef.post) {
        lastm.next = m;
        m.prev = lastm;
        
        lastm = m;
      }
      
      function make_newfunc(m) {
        return function() {
          let old1 = aspect_next_this;
          let old2 = aspect_next_called;
          let old3 = aspect_next;
          
          aspect_next_this = this;
          aspect_next_called = false;
          aspect_next = m.next !== undefined ? m.next.method : () => {};
          
          let ret = m._method.apply(this, arguments);
          
          let called = aspect_next_called;
          
          aspect_next_this = old1;
          aspect_next_called = old2;
          aspect_next = old3;
          
          if (!called && m.next !== undefined) {
            return m.next.method();
          }
          
          return ret;
        };
      }
            
      let m = fm;
      while (m.prev !== undefined) {
        m = m.prev;
      }

      let first = m;
      
      while (m !== undefined) {
        m._method = m.method;
        m.method = make_newfunc(m);
        m = m.next;
      }
      
      return first.method;
    }
    
    for (let k in methods) {
      let m = methods[k];
      
      cls.prototype[k] = make_method(k, m, cls.prototype[k]);
    }
    //console.log(cls.name);
    
    
    
    //do final check for cycles
    Aspect.checkCycles(cls);
  }
}
global.Aspect = Aspect

/*
usage:

class MyAspect extends AspectClass {
  [Aspect.method("on_tick")] {
  }
}

let pre = Aspect.pre, post = Aspect.post;
class Class extends 3 {
  [Symbol.aspects] { return
    pre(MyAspect),
  ]}
  
  on_tick() {
  }
}
*/
export class AspectClass extends Array {
  constructor() {
    super();
    
    if (!this.constructor._init) {
      Aspect.init(this.constructor);
    }
  }
  
  static [Symbol.aspects]() {
    return [];
  }
}

export function test() {
  class Test extends AspectClass {
    constructor() {
      super()
    }
    [Aspect.method("on_tick")]() {
      console.log("yay1");
    }
  }
  
  class Test2 extends AspectClass {
    constructor() {
      super();
    }
    
    static [Symbol.aspects]() { return [
      Test, Test, Aspect.post(Test)
    ]}
    
    on_tick() {
      console.log("yay2");
    }
  }
  
  //let t1 = new Test();
  //let t2 = new Test();
  //let t3 = new Test2();
  let t4 = new Test2();
  
  console.log("Testing");
  t4.on_tick();
}

//test();
