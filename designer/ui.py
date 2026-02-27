from . import utils

import bpy
from bpy.types import Panel
from rna_prop_ui import PropertyPanel

from . import props

class GameObjectPanel:
    bl_space_type = 'PROPERTIES'
    bl_region_type = 'WINDOW'
    bl_context = "object"

class OBJECT_PT_GameObjectPanel (GameObjectPanel, Panel):
    bl_idname = "OBJECT_PT_GameObjectPanel"
    bl_label = "gamejs"
    bl_context = "object"

    @classmethod
    def poll(cls, context):
        return (context.object)

    def draw(self, context):
        layout = self.layout
        
        layout.prop(context.object.gamejs, "ignore")
        layout.prop(context.object.gamejs, "is_character")
        layout.prop(context.object.gamejs, "primary_character")
        layout.prop(context.object.gamejs, "logic_tree")
        
        

reg = utils.Registrar([
    OBJECT_PT_GameObjectPanel
])
