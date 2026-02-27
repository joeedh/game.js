import bpy
from bpy.types import NodeTree, Node, NodeSocket, NodeCustomGroup, NodeGroup, NodeGroupInput
from bpy.types import NodeGroupOutput

from . import utils
from . import config as cf
from .config import *
from . import globals

from . import symbol
sym = symbol.sym

from .mysockets import *
from .node import NoodleTree, NoodleTreeNode

# Derived from the Node base type.
class KeyInputNode(Node, NoodleTree):
    # === Basics ===
    # Description string
    '''Key Input Node'''
    bl_idname = PRE+'KeyInputNode'

    # Label for nice name display
    bl_label = 'Keyboard Input'

    # Icon identifier
    bl_icon = 'SOUND'
    bl_width_min = 200
    
    keyString : bpy.props.StringProperty()

    def init(self, context):
        self.outputs.new(PRE+'FlowSocket', "trigger")
    
    # Copy function to initialize a copied node from an existing one.
    def copy(self, node):
        self.keyString = node.keyString
        print("Copying from node ", node)

    # Free function to clean up on removal.
    def free(self):
        print("Removing node ", self, ", Goodbye!")

    # Additional buttons displayed on the node.
    def draw_buttons(self, context, layout):
        layout.label(text="Key:")
        layout.prop(self, "keyString")

    # Detail buttons in the sidebar.
    # If this function is not defined, the draw_buttons function is used instead
    def draw_buttons_ext(self, context, layout):
        pass
        #layout.prop(self, "myFloatProperty")
        # myStringProperty button will only be visible in the sidebar
        #layout.prop(self, "myStringProperty")

    # Optional: custom label
    # Explicit user label overrides this, but here we can define a label dynamically
    def draw_label(self):
        return "Keyboard Node"

class MoveCharacterNode(Node, NoodleTree):
    # === Basics ===
    # Description string
    '''Move Character Node'''
    bl_idname = PRE+'MoveCharacterNode'

    # Label for nice name display
    bl_label = 'Move Character'

    # Icon identifier
    bl_icon = 'SOUND'
    bl_width_min = 200

    def init(self, context):
        self.inputs.new(PRE+'FlowSocket', "trigger")
        self.inputs.new(PRE+'VectorSocket', "move")
        self.inputs.new(PRE+'VectorSocket', "rotate")
        self.inputs.new(PRE+"FloatSocket", "distance")
        
        self.outputs.new(PRE+'FlowSocket', "next")
    
    # Copy function to initialize a copied node from an existing one.
    def copy(self, node):        
        pass
        
    # Free function to clean up on removal.
    def free(self):
        print("Removing node ", self, ", Goodbye!")

    # Additional buttons displayed on the node.
    def draw_buttons(self, context, layout):
        pass
        
    # Detail buttons in the sidebar.
    # If this function is not defined, the draw_buttons function is used instead
    def draw_buttons_ext(self, context, layout):
        pass
        #layout.prop(self, "myFloatProperty")
        # myStringProperty button will only be visible in the sidebar
        #layout.prop(self, "myStringProperty")

    # Optional: custom label
    # Explicit user label overrides this, but here we can define a label dynamically
    def draw_label(self):
        return "Move Character"

class FlowOrNode(Node, NoodleTree):
    # === Basics ===
    # Description string
    '''Move Character Node'''
    bl_idname = PRE+'FlowOrNode'

    # Label for nice name display
    bl_label = 'Flow Or'

    # Icon identifier
    bl_icon = 'SOUND'
    bl_width_min = 200

    def init(self, context):
        self.inputs.new(PRE+'FlowSocket', "0")
        self.inputs.new(PRE+'FlowSocket', "1")
        self.inputs.new(PRE+'FlowSocket', "2")
        self.inputs.new(PRE+'FlowSocket', "3")
        self.inputs.new(PRE+'FlowSocket', "4")
        self.inputs.new(PRE+'FlowSocket', "5")
        
        self.outputs.new(PRE+'FlowSocket', "flow")
    
    # Copy function to initialize a copied node from an existing one.
    def copy(self, node):        
        pass
        
    # Free function to clean up on removal.
    def free(self):
        print("Removing node ", self, ", Goodbye!")

    # Additional buttons displayed on the node.
    def draw_buttons(self, context, layout):
        pass
        
    # Detail buttons in the sidebar.
    # If this function is not defined, the draw_buttons function is used instead
    def draw_buttons_ext(self, context, layout):
        pass
        #layout.prop(self, "myFloatProperty")
        # myStringProperty button will only be visible in the sidebar
        #layout.prop(self, "myStringProperty")

    # Optional: custom label
    # Explicit user label overrides this, but here we can define a label dynamically
    def draw_label(self):
        return "Flow \"Or\""
        
globals.module_registrar.add(utils.Registrar([
  KeyInputNode,
  MoveCharacterNode,
  FlowOrNode
]));
