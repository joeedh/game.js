import bpy
from bpy.types import NodeTree, Node, NodeSocket, NodeCustomGroup, NodeGroup, NodeGroupInput
from bpy.types import NodeGroupOutput

from . import utils
from . import config as cf
from .config import *
from . import globals

# Derived from the NodeTree base type, similar to Menu, Operator, Panel, etc.
class NoodleTree(NodeTree):
    # Optional identifier string. If not explicitly defined, the python class name is used.
    bl_idname = NODETREE_TYPE
    # Label for nice name display
    bl_label = NODETREE_EDITOR_NAME
    
    # Icon identifier
    bl_icon = 'NODETREE'
  
    @classmethod
    def poll(cls, ntree):
      return True

# Description string
NoodleTree.__doc__ = cf.NODETREE_EDITOR_NAME + " Editor"

# Mix-in class for all custom nodes in this tree type.
# Defines a poll function to enable instantiation.
class NoodleTreeNode:
    tag : bpy.props.IntProperty(default=0) #used during sorting
    
    @classmethod
    def poll(cls, ntree):
        return ntree.bl_idname == NODETREE_TYPE

class NoodleCustomGroup (NodeCustomGroup):
  bl_idname = PRE+"NodeGroup"
  bl_label = "Group"
  bl_icon = 'SOUND'
  bl_width_min = 250
  
  def init(self, context):
    pass
    
  def copy(self, b):
    pass
    
  def poll_instance(self, tree):
    return ntree.bl_idname == NODETREE_TYPE
    
  @classmethod
  def poll(cls, ntree):
    return ntree.bl_idname == NODETREE_TYPE
    
  # Additional buttons displayed on the node.
  def draw_buttons(self, context, layout):
    if self.node_tree == None:
      return
      
    layout.label(text=self.node_tree.name)
    
    layout.prop(self.node_tree, "name")
    
    prop = layout.operator("node."+APIPRE+"_edit_group", text="Edit Group")
    print("PATH", context.space_data.path[-1].node_tree)
    node_tree = context.space_data.path[-1].node_tree
    prop["node_path"] = utils.gen_node_path(self, node_tree) #context.space_data.path[-1]) #node_tree)
    
  def draw_buttons_ext(self, context, layout):
    pass

  
globals.module_registrar.add(utils.Registrar([
  #NoodleTree is registered in node_tree.py
  NoodleCustomGroup
]));
