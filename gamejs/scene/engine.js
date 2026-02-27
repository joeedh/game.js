export let PhysicsCommands = {
  FORCE_IMPULSE : 0, //
  SET_COLLISION : 1
};

export let UpdateFlags = {
  MESH         : 1<<0,
  PHYSICS      : 1<<1,
  ANIMATION    : 1<<2,
  LOGIC_STATE  : 1<<3,
  VISIBILITY   : 1<<4,
  
}

export class GameEngineIF {
  beginFrame(scene) {
  }
  
  sendPhysicsCommand(gameobject, command, args) {
  }
  
  /*
    updateobject is function with prototype:
    updateObject(sceneobject);
  */
  doPhysics(time_budget, updateObject, one_cycle=false) {
  }
  
  applyForceImpulse(sceneobject, vec, time) {
    
  }
  
  countAnimationFrames(sceneobject, action_name) {
  }
  
  //hrm, I wonder if I should have *this* method handle animation
  //transitions. of course, that could make it stateful and I was
  //going to make it stateless, but could be worth it. . .hrm. . .
  loadAnimationFrame(sceneobject, action_name, frame) {
  }
  
  updateObject(sceneobject, updateflags) {
    
  }
  
  render() {
  }
  
  endFrame() {
  }
  
  registerEvents() {
  }
  
  unregisterEvents() {
  }
}
