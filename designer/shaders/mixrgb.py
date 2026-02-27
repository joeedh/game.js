from .shader_base import *

shader = Shader(
    name="mixrgb",
    settings={
        "mode" : Enum({
            "mix", "add", "subtract",
            "multiply", "divide", "screen",
            "overlay", "hue", "color",
            "value", "saturation", "burn",
            "lighten", "darken", "linear light",
            "soft light", "screen",
            "dodge", "difference"
        }, default="mix"),
        "bounds_min" : Vec4(default=[0,0,0,0]),
        "bounds_max" : Vec4(default=[1,1,1,1]),
        "use_bounds" : Bool()
    },
    inputs = {
        "fac" : Float(default=0.5),
        "color1" : Color(),
        "color2" : Color(),
        
    },
    outputs = {
        "color" : Surface()
    },
)

codetable = {
    "mix" : """ color = (color1 + (color2 - color1)) * fac;""",
    "multiply" : """
        vec4 tmp = color1 * color2;
        color = color1 + (tmp - color1) * fac;
        """
}

def customGen(self, node, graph):
    global codetable
    return codetable[self.settings["mode"]]

shader.customGen = customGen



