import bpy
from . import utils

class ObjectSettings(bpy.types.PropertyGroup):
    ignore = bpy.props.BoolProperty()
    #my_float = bpy.props.FloatProperty()
    #my_string = bpy.props.StringProperty()


def register():
    bpy.utils.register_class(ObjectSettings)
    bpy.types.Object.gamejs = \
        bpy.props.PointerProperty(type=ObjectSettings)

def unregister():
    bpy.utils.unregister_class(ObjectSettings)

reg = utils.Registrar([
    utils.Registrar.custom(register, unregister)
])
