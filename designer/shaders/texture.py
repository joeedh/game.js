from .shader_base import *

shader = Shader(
    name="diffuse",
    inputs = {
        "texture" : Texture(),
        "filter" : Enum({
            "linear" : 0,
            "cubic" : 1,
            "smart" : 2,
            "none" : 3
        }),
        "position" : Vec3(flags=ShaderFlags.DEFAULT_TO_POSITION)
    },
    outputs = {
        "color" : Color(),
        "fac" : Float()
    },
    flag=ShaderFlags.LIGHTS|ShaderFlags.SHADOWS,
    fragment = """
        vec4 c = texture2d(texture, position.uv);
        
        fac = COLOR2FLOAT(c);
        color = c;
    """
)


