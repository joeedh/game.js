"use strict";

gl.createProgram = function createProgram() {
  return new WebGLProgram();
}

gl.createShader = function createShader(type) {
  return new WebGLShader(type);
}

class Console {
  constructor(file) {
    this.file = file;
  }
  
  _format(obj) {
    if (obj === undefined || obj === null)
      return ""+obj;
    if (typeof obj != "object")
      return ""+obj;
    
    var tag = Symbol('console_format_tag');
    var objs = [];
    var vset = {};
    var nl_tag_idgen = 0;
    
    function tab(n) {
      var s = "";
      for (var i=0; i<n; i++) {
        s += "  ";
      }
      
      return s;
    }
    
    function recurse(obj, depth, tablevel) {
      if (typeof obj != "object") {
        return ""+obj;
      }
      
      if (tag in obj) {
        return "[Circular Ref]"
      }
      
      var t = tab(tablevel);
      
      obj[tag] = 1;
      objs.push(obj);
      
      if (obj instanceof Array) {
        //use one line per array element only as needed
        
        var nl_tag = "NL_ARRAY_"+(nl_tag_idgen++)+"__";
        var nt_tag = "NT_ARRAY_"+(nl_tag_idgen++)+"__";
        
        var s = "["+nl_tag;
        for (var i=0; i<obj.length; i++) {
          if (i > 0) s += ", "+nl_tag;
          
          let s2 = recurse(obj[i], depth+1, tablevel+1);
          if (s2[0] == "\n")
            s2 = s2.slice(1, s2.length);
          if (s2.endsWith("\n"))
            s2 = s2.slice(0, s2.length-1);
          
          
          s += nt_tag + s2;
          
          if (i == obj.length-1) {
            s += nl_tag;
          }
        }
        
        if (s.search("\n") >= 0) {
          s = s.replace(new RegExp(nl_tag, 'g'), "\n")
          s = s.replace(new RegExp(nt_tag, 'g'), t + "  ")
          s += t + "]\n"
        } else {
          s = s.replace(new RegExp(nl_tag, 'g'), "")
          s = s.replace(new RegExp(nt_tag, 'g'), "")
          s += "]"
        }
        
        return s;
      }
      
      var name = "constructor" in obj.__proto__ ? obj.__proto__.constructor.name : "";
      if (obj["prototype"] != undefined && obj["prototype"]["constructor"] != undefined) {
        name = obj.constructor.name;
      }
      
      var s = "\n" + name + " {\n";
      var keys = Object.keys(obj);
      for (let k of keys) {
        let s2;
        let val = obj[k];
        
        if (typeof val == "function" && depth > 0) {
          s2 = " function " + (val.name != undefined ? val.name : "")
        } else {
          s2 = recurse(val, depth+1, tablevel+1);
        }
        
        if (s2[0] == "\n") {
          s2 = s2.slice(1, s2.length);
        }
        
        if (!s2.endsWith("\n")) {
          s2 += "\n";
        }
        
        s += t + "  " + k + " : " + s2
      }
      
      s += t + "}\n";
      
      return s;
    }
    
    let ret = recurse(obj, 0, 0);
    
    for (let i=0; i<objs.length; i++) {
      delete objs[i][tag];
    }
    
    return ret;
  }
  
  log() {
    var buf = ""
    for (var i=0; i<arguments.length; i++) {
      if (i > 0) {
        buf += " ";
      }
      
      buf += this._format(arguments[i]);
    }
    
    buf += "\n";
    
    this.file.write_utf8(buf);
  }
}

self.define_module = function(name, imports, func) {
  console.log("define module");
}

self.import_module = function(name) {
  console.log("import called for", name);
}

self.Console = Console;
self.console = new Console(_stdout);

console.log("yay!", Int32Array, Object.keys(self), self.Math);

var on_draw = function on_draw() {
  //var buf = new WebGLBuffer();
  //console.log("draw!");
  gl.clearColor(0.5, 0.7, 1.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

console.log("COLOR_BUFFER_BIT", gl.COLOR_BUFFER_BIT);

var on_tick = function on_tick() {
}

var on_mousemove = function on_mousemove(e) {
  console.log("mousemove!", e);
}

var on_mousedown = function on_mousedown(e) {
  console.log("mousedown!", e);
}

var on_mouseup = function on_mouseup(e) {
  console.log("mouseup!", e);
}

var on_keydown = function on_keydown(e) {
  console.log("key down!", e);
}

var on_keyup = function on_keyup(e) {
  console.log("keyup!", e);
}

var on_close = function on_close(e) {
  console.log("on close!", e);
}

addEventListener("draw", on_draw);
addEventListener("tick", on_tick);

addEventListener("mousemove", on_mousemove);
addEventListener("mousedown", on_mousedown);
addEventListener("mouseup", on_mouseup);
addEventListener("keydown", on_keydown);
addEventListener("keyup", on_keyup);

console.log("added event listener!");
console.log(gl);
