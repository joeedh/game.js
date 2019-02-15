export let PhysicsCommands = {
  FORCE_IMPULSE : 0, //
  SET_COLLISION : 1
};

export class GameEngineIF {
  beginFrame(scene) {
  }
  
  sendPhysicsCommand(gameobject, command, args) {
  }
  
  doPhysics(time_budget, one_cycle=false) {
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
