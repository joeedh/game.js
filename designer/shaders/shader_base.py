class Slot:
    def __init__(self, name=None, default=None, flags=0):
        self.name = name
        self.default = default
        self.flags = flags

class ShaderFlags:
    LIGHTS  = 1
    SHADOWS = 2
    AO      = 4
    SSS     = 8
    TEXTURE = 16
    DEFAULT_TO_NORMAL = 32
    DEFAULT_TO_POSITION = 64
    
class Enum (Slot):
    def __init__(self, enum_dict, default=None, flags=0, name=None):
        Slot.__init__(self, name)
        self.enum = enum_dict
        self.default = default
        
class Bool(Slot):
    pass
class Surface(Slot):
    pass
class Texture (Slot):
    pass
class Float(Slot):
    pass
class Vec3(Slot):
    pass
class Vec4(Slot):
    pass
class Color(Vec4):
    pass
class Mat4(Slot):
    pass
class Mat3(Slot):
    pass
    
class Shader:
    def __init__(self, name="", inputs={}, outputs={}, settings={}, flag=0, fragment=""):
        self.inputs = inputs
        self.outputs = outputs
        self.settings = settings
    
    def customGen(self, node, graph):
        return None
        
        