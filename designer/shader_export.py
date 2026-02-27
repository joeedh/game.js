import bpy, time, random
from . import utils
from math import *
from mathutils import *
import bmesh

from .shaders import shader_base, shader_base_utils
eevee_closure_code = shader_base_utils.eevee_closure_code

class SockTypes:
    COLOR4 = 0
    VEC3   = 1
    VALUE  = 2
    SHADER = 3

SockTypeNames = ["COLOR4", "VEC3", "VALUE", "SHADER"];
    
class Color4Cast:
    #make FROM shader
    def SHADER(name):
        return "vec4($1.radiance, $1.opacity)".replace("$1", name)
    def VALUE(name):
        return "vec4($1, $1, $1, 1.0)".replace("$1", name)
    def VEC3(name):
        return "vec4($1, 1.0)".replace("$1", name)
        
class Vec3Cast:
    def SHADER(name):
        return "vec4($1.radiance, $1.opacity)".replace("$1", name)
    def VALUE(name):
        return "vec3($1, $1, $1)".replace("$1", name)
    def COLOR4(name):
        return "$1.rgb".replace("$1", name)

class ValueCast:
    def SHADER(name):
        return "length($1.radiance)".replace("$1", name)
    def VEC3(name):
        return "length($1)".replace("$1", name)
    def COLOR4(name):
        return "length($1)".replace("$1", name)

class ShaderCast:
    def COLOR4(name):
        return "cast_closure($1)".replace("$1", name)
    def VEC3(name):
        return "cast_closure(vec4($1, 1.0))".replace("$1", name)
    def VALUE(name):
        return "cast_closure(vec4($1, $1, $1, 1.0))".replace("$1", name)

castmap = {
    SockTypes.COLOR4 : Color4Cast,
    SockTypes.VEC3   : Vec3Cast,
    SockTypes.VALUE  : ValueCast,
    SockTypes.SHADER : ShaderCast
}

class ShaderGraph:
    def __init__(self, mat):
        self.mat = mat
        self.graph = mat.node_tree
        self.sortlist = []
    
    def sort(self):
        self.sortlist = []
        sortlist = self.sortlist
        out = None
        
        visit = set()
        tag = set()
        tag2 = set()
        links = {}
        nlinks = {}
        
        def rec(n):
            if n in visit:
                return
                
            if n in tag2:
                print("cycle in shader graph!")
                return
                
            tag2.add(n)
            
            for sock in n.inputs:
                if sock not in links: continue
                for n2 in nlinks[sock]:
                    if n2 not in tag:
                        rec(n2)
                
            tag.add(n)
            visit.add(n)
            sortlist.append(n)
            
            tag2.remove(n)
        
        for l in self.graph.links:
            if l.from_socket not in links:
                links[l.from_socket] = []
                nlinks[l.from_socket] = []
            if l.to_socket not in links:
                links[l.to_socket] = []
                nlinks[l.to_socket] = []
                
            links[l.from_socket].append(l.to_socket)
            links[l.to_socket].append(l.from_socket)
            nlinks[l.from_socket].append(l.to_node)
            nlinks[l.to_socket].append(l.from_node)
            
        for n in self.graph.nodes:
            if n not in visit:
                rec(n)
            
            #always use first output found
            #print(type(n))
            if out is None and type(n) == bpy.types.ShaderNodeOutputMaterial:
                out = n
        
        self.links = links
        self.nlinks = nlinks
        self.out = out
    
    
    def cast(self, s1, t1, name1, s2, t2, name2):
        if t1 == t2:
            return name2;
        
        c = castmap[t1]
        tname = SockTypeNames[t2]
        if hasattr(c, tname):
            return getattr(castmap[t1], tname)(name2)
        else:
            print("Cast fail!", tname, c);
            
        return ""
        
    def typename(self, type):
        if type == SockTypes.COLOR4:
            return "vec4";
        elif type == SockTypes.VEC3:
            return "vec3";
        elif type == SockTypes.VALUE:
            return "float";
        elif type == SockTypes.SHADER:
            return "vec4";
        else:
            raise RuntimeError("unknown type " + str(type))
            
    def type2type(self, t):
        if type(t) == bpy.types.NodeSocketColor:
            return SockTypes.COLOR4
        elif type(t) == bpy.types.NodeSocketFloat:
            return SockTypes.VALUE
        elif type(t) == bpy.types.NodeSocketFloatFactor:
            return SockTypes.VALUE
        elif type(t) == bpy.types.NodeSocketVector:
            return SockTypes.VEC3
        elif type(t) == bpy.types.NodeSocketShader:
            return SockTypes.SHADER
        else:
            raise RuntimeError("unknown type " + str(type))
        
    def gencode(self):
        self.sort()
        sortlist = self.sortlist
        nlinks = self.nlinks
        links = self.links
        
        print(sortlist)
        
        buf = "";
        #buf += eevee_closure_code;
        
        for n in sortlist:
            for sock in n.outputs:
                if sock not in nlinks: continue
                
                t = self.type2type(sock)
                tn = self.typename(t);
                
                id = "_" + str(sortlist.index(n)) + "_out_";
                varname = id + sock.name;
                
                print(sock.name)
                buf += tn + " " + varname + ";\n"
                
            buf += "{\n";
            for sock in n.inputs:
                if sock in nlinks:
                    #for now, don't do multiple inputs
                    sock2 = links[sock][0]
                    
                    t = self.type2type(sock)
                    tn = self.typename(t);
                    
                    t2 = self.type2type(sock2)
                    tn2 = self.typename(t2)
                    
                    varname = sock.name;
                    
                    print(sock.name)
                    
                    name1 = sock.name
                    name2 = "_" + str(self.sortlist.index(sock2.node)) + "_out_" + sock2.name
                    
                    castcode = self.cast(sock, t, name1, sock2, t2, name2)
                    
                    buf += "  " + tn + " " + varname + "=" + castcode + ";\n"
                
            buf += "}\n"
            
        print(buf)        
        return buf
        
def exportShader(mat, name):
    r = {
        "type" : "Shader",
        "name" : name,
        "fragment" : "",
        "vertex" : "",
        "uniforms" : ""
    }
    
    if mat.node_tree is None:
        print("WARNING: mat had no node tree!")
        return r
    
    graph = ShaderGraph(mat)
    graph.gencode()
    
    return r
    