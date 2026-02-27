import bpy, imp

__all__ = [
    "node", "runtime", "props", "ops", "export",
    "shader_export"
]

from . import node, runtime, ops, props, utils, export, shader_export, ui
from .shaders import shader_base, diffuse, shader_base_utils
from .shaders import mixrgb, texture, shader_map

from . import logic

logic.unregister()
imp.reload(logic)
logic.register()

imp.reload(utils)
imp.reload(props)
imp.reload(node)

imp.reload(shader_base)
imp.reload(shader_base_utils)
imp.reload(diffuse)
imp.reload(mixrgb)
imp.reload(texture)
imp.reload(shader_map)

imp.reload(shader_export)
imp.reload(export)
imp.reload(ops)
imp.reload(runtime)
imp.reload(ui)

reg = utils.Registrar([
    props.reg,
    node.reg,
    export.reg,
    ops.reg,
    runtime.reg,
    ui.reg
])

def register():  
    reg.register()

def unregister():
    reg.unregister()