import {Aspect, AspectClass} from '../util/typesystem.js';
import '../util/struct.js'

export var SocketFlags = {
  SELECT : 1,
  INPUT  : 2,
  OUTPUT : 4,
  TAG    : 8
};

export var NodeFlags = {
  SELECT : 1,
  UPDATE : 2,
  RESORT : 4,
  TEMP   : 8,
  TEMP2  : 16
};

export class NodeSocketAbstract extends AspectClass {
  static define() {return {
    name : "human-readable (but still unique) name",
    flag : 0 //default flags, see SocketFlags
  }};
  
  constructor(name) {
    this.name = name;
    this.node = undefined; //owning node
    this.links = [];
    this.id = -1;
    this.flag = this.constructor.define().flag;
  }
  
  toJSON() {
    let links = [];
    for (let l of this.links) {
      links.push(l.id);
    }
    
    return {
      name : this.name,
      type : this.constructor.define().name,
      node : this.node.id,
      links : links,
      id : this.id,
      flag : this.flag
    }
  }
  
  loadJSON(obj) {
    this.name = obj.name;
    this.node = obj.node;
    this.links = obj.links;
    this.id = obj.id;
    this.flag = obj.flag;
    
    return this;
  }
  
  storeLastValue() {
  }
  
  //returns how much socket differs from stored last value.
  //this is used to detect when to stop solver when solving
  //for cycles
  deltaLastValue() {
  }
  
  connect(dst) {
    dst.links.push(this);
    this.links.push(dst);
  }
  
  copyFrom(obj) {
    obj.name = this.name;
    obj.node = this.node;
    obj.flag = this.flag;
  }
  
  copy() {
    throw new Error("implement me!");
  }
  
  static fromSTRUCT(reader) {
    let ret = new NodeSocketAbstract();
    reader(ret);
    return ret;
  }
}

NodeSocketAbstract.STRUCT = `
NodeSocketAbstract {
  type  : string | obj.constructor.define().name;
  node  : int | obj.node.id;
  flag  : int;
  id    : int;
  name  : string;
  links : array(e, int) | e.id;
}
`;

STRUCT.add_class(NodeSocketAbstract);

export class Node extends AspectClass {
  static define() {return {
    name : "Node",
    inputs : {},
    outputs : {}
  }};
  
  constructor() {
    super();
    
    this.inputs = [];
    this.outputs = [];
    
    this.inmap = {};
    this.outmap = {};
    
    this.id = -1;
    this.flag = 0;
    this.graph = undefined;
  }
  
  toJSON() {
    return {
      id : this.id,
      flag : this.flag,
      graph : this.graph !== undefined ? this.graph.id : -1,
      type : this.constructor.define().name,
      inputs : this.inputs,
      outputs : this.outputs
    }
  }
  
  loadJSON(obj) {
    obj.id = this.id;
    obj.flag = this.flag;
    obj.graph = this.graph;
    obj.inputs = this.inputs;
    obj.outputs = this.outputs;
    
    return this;
  }
  
  update() {
    this.flag |= NodeFlags.UPDATE;
  }
  
  //note that nodes are responsible for calling .update()
  //on their child nodes
  execute() {
  }
  
  static fromSTRUCT(reader) {
    let ret = new Node();
    reader(ret);
    return ret;
  }
}

Node.STRUCT = `
Node {
  type    : string | obj.constructor.define().name;
  flag    : int;
  id      : int | obj.id;
  graph   : int | obj.graph !== undefined ? obj.graph.id : -1;
  inputs  : array(abstract(NodeSocketAbstract));
  outputs : array(abstract(NodeSocketAbstract));  
}
`;
STRUCT.add_class(Node);

let graph_idgen = 0;

export class Graph extends Node {
  constructor() {
    super();
    
    //stuff for (experimental) cycle solver
    this.allowCycles = false;
    this.cycleEndThreshold = 0.1; //stop when value of all sockets differ from previous run by this amount
    
    this._gid = graph_idgen++;
    //try and prevent collision between nodes from graphs and any embedded subgraphs
    this.idgen = this._gid*1024*1024; 
    
    this.idmap = {};
    this.nodes = [];
    this.sortlist = [];
  }
  
  connect(n1, s1, n2, s2) {
    n2.outmap[s2].connect(n1.inmap[s1]);
  }
  
  toJSON() {
    let ret = super.toJSON();
    
    ret.nodes = this.nodes;
    ret.idgen = this.idgen;
    ret._gid = this._gid;
    
    return ret;
  }
  
  loadJSON(obj) {
    super.loadJSON(obj);
    
    this.nodes = obj.nodes;
    this._gid = obj._gid;
    this.idgen = obj.idgen;
    
    return this;
  }
  
  add(node) {
    if (node.id != -1) {
      throw new Error("tried to add node twice");
    }
    
    node.id = this.idgen++;
    
    this.idmap[node.id] = node;
    this.nodes.push(node);
    
    this.flag |= NodeFlags.RESORT;
  }
  
  sort() {
    let list = this.sortlist;
    list.length = 0;
    
    for (let n of this.nodes) {
      n.flag |= NodeFlags.TEMP;
      n.flag &= ~NodeFlags.TEMP2;
    }
    
    let dosort = (n) => {
      if (!(n.flag & NodeFlags.TEMP)) {
        return;
      }
      
      if (n.flag & NodeFlags.TEMP2) {
        console.log("Cycle detected in graph; ignoring. . .");
        return;
      }
      
      n.flag |= NodeFlags.TEMP2;
      
      for (let sock of n.inputs) {
        for (let sock2 of sock.links) {
          let n2 = sock2.node;
          
          if (n2.flag & NodeFlags.TEMP) {
            dosort(n2);
          }
        }
      }
      
      n.flag &= ~NodeFlags.TEMP2;
      list.push(n);
    }
    
    for (let n of this.nodes) {
      dosort(n);
    }
    
    this.flag &= ~NodeFlags.RESORT;
  }
  
  executeCycles() {
    for (let i=0; i<100; i++) {
      let changed = 0;
      let delta = 0;
      
      for (let n2 of this.sortlist) {
        if (n2.flag & NodeFlags.UPDATE) {
          changed = 1;
          
          for (let sock of n2.inputs) {
            delta += Math.abs(sock.deltaLastValue());
            sock.storeLastValue();
          }
          
          for (let sock of n2.outputs) {
            delta += Math.abs(sock.deltaLastValue());
            sock.storeLastValue();
          }
          
          n2.execute();
          n2.flag &= ~NodeFlags.UPDATE; 
        }
      }
      
      if (changed && delta < this.cycleEndThreshold) {
        return;
      }
    }
    
    console.warn("Graph failed to converge");
  }
  execute() {
    if (this.allowCycles) {
      return this.executeCycles();
    }
    
    for (let n of this.sortlist) {
      if (n.flag & NodeFlags.UPDATE) {
        n.execute();
      }
    }
  }
  
  static fromSTRUCT(reader) {
    let ret = new Graph();
    reader(ret);
    return ret;
  }
}

Graph.STRUCT = STRUCT.inherit(Graph, Node) + `
  nodes : array(abstract(Node));
  idgen : int;
  _gid : int;
}`

STRUCT.add_class(Graph);
