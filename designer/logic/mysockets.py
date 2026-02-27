import bpy
from bpy.types import NodeTree, Node, NodeSocket, NodeCustomGroup, NodeGroup, NodeGroupInput
from bpy.types import NodeGroupOutput

from . import utils
from . import config as cf
from .config import *
from . import globals

# Custom socket type
class FloatSocket(NodeSocket):
    # Description string
    '''Vector Socket'''
    # Optional identifier string. If not explicitly defined, the python class name is used.
    bl_idname = PRE+'FloatSocket'
    # Label for nice name display
    bl_label = 'Value'

    value : bpy.props.FloatProperty(default=0.0)
    
    # Optional function for drawing the socket input vector
    def draw(self, context, layout, node, text):
        if self.is_output or self.is_linked:
            layout.label(text=text)
        else:
            layout.prop(self, "value", text=self.name)

    # Socket color
    def draw_color(self, context, node):
        return (0.4, 0.8, 1.0, 1.0)



# Custom socket type
class VectorSocket(NodeSocket):
    # Description string
    '''Vector Socket'''
    # Optional identifier string. If not explicitly defined, the python class name is used.
    bl_idname = PRE+'VectorSocket'
    # Label for nice name display
    bl_label = 'Vector'

    value : bpy.props.FloatVectorProperty(default=[0.0, 0.0, 0.0], size=3)
    
    # Optional function for drawing the socket input vector
    def draw(self, context, layout, node, text):
        if self.is_output or self.is_linked:
            layout.label(text=text)
        else:
            layout.prop(self, "value", text=self.name)

    # Socket color
    def draw_color(self, context, node):
        return (0.4, 0.8, 1.0, 1.0)



# Custom socket type
class FlowSocket(NodeSocket):
    # Description string
    '''Value Socket'''
    # Optional identifier string. If not explicitly defined, the python class name is used.
    bl_idname = PRE+'FlowSocket'
    # Label for nice name display
    bl_label = 'Flow'

    value : bpy.props.FloatProperty(default=0.0)
    
    # Optional function for drawing the socket input value
    def draw(self, context, layout, node, text):
        if self.is_output or self.is_linked:
            layout.label(text=text)
        else:
            layout.prop(self, "value", text=self.name)

    # Socket color
    def draw_color(self, context, node):
        return (1.0, 0.4, 0.216, 1.0)

globals.module_registrar.add(utils.Registrar([
  FlowSocket,
  VectorSocket,
  FloatSocket
]));
