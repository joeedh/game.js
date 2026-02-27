from .shader_base import *

shader = Shader(
    name="diffuse",
    inputs = {
        "color" : Color()
    },
    outputs = {
        "surface" : Surface()
    },
    flag=ShaderFlags.LIGHTS|ShaderFlags.SHADOWS,
    fragment = """
        vec4 diff = DO_LIGHTS(color);
        
        surface.radiance = diff.rgb;
        surface.opacity = diff.a;
    """
)


