import bpy, time, random
from . import utils
from math import *
from mathutils import *
import bmesh

eevee_closure_code = """
struct Closure {
	vec3 radiance;
	float opacity;
#  ifdef USE_SSS
	vec4 sss_data;
#    ifdef USE_SSS_ALBEDO
	vec3 sss_albedo;
#    endif
#  endif
	vec4 ssr_data;
	vec2 ssr_normal;
	int ssr_id;
};

/* This is hacking ssr_id to tag transparent bsdf */
#define TRANSPARENT_CLOSURE_FLAG -2
#define REFRACT_CLOSURE_FLAG -3
#define NO_SSR -999

#  ifdef USE_SSS
#    ifdef USE_SSS_ALBEDO
#define CLOSURE_DEFAULT Closure(vec3(0.0), 1.0, vec4(0.0), vec3(0.0), vec4(0.0), vec2(0.0), -1)
#    else
#define CLOSURE_DEFAULT Closure(vec3(0.0), 1.0, vec4(0.0), vec4(0.0), vec2(0.0), -1)
#    endif
#  else
#define CLOSURE_DEFAULT Closure(vec3(0.0), 1.0, vec4(0.0), vec2(0.0), -1)
#  endif

uniform int outputSsrId;

Closure cast_closure(vec4 color)
{
    Closure ret = CLOSURE_DEFAULT;
    
    ret.radiance = color.rgb;
    ret.opacity = color.a;
    
    return ret;
}

Closure closure_mix(Closure cl1, Closure cl2, float fac)
{
	Closure cl;

	if (cl1.ssr_id == TRANSPARENT_CLOSURE_FLAG) {
		cl1.ssr_normal = cl2.ssr_normal;
		cl1.ssr_data = cl2.ssr_data;
		cl1.ssr_id = cl2.ssr_id;
#  ifdef USE_SSS
		cl1.sss_data = cl2.sss_data;
#    ifdef USE_SSS_ALBEDO
		cl1.sss_albedo = cl2.sss_albedo;
#    endif
#  endif
	}
	if (cl2.ssr_id == TRANSPARENT_CLOSURE_FLAG) {
		cl2.ssr_normal = cl1.ssr_normal;
		cl2.ssr_data = cl1.ssr_data;
		cl2.ssr_id = cl1.ssr_id;
#  ifdef USE_SSS
		cl2.sss_data = cl1.sss_data;
#    ifdef USE_SSS_ALBEDO
		cl2.sss_albedo = cl1.sss_albedo;
#    endif
#  endif
	}
	if (cl1.ssr_id == outputSsrId) {
		cl.ssr_data = mix(cl1.ssr_data.xyzw, vec4(vec3(0.0), cl1.ssr_data.w), fac); /* do not blend roughness */
		cl.ssr_normal = cl1.ssr_normal;
		cl.ssr_id = cl1.ssr_id;
	}
	else {
		cl.ssr_data = mix(vec4(vec3(0.0), cl2.ssr_data.w), cl2.ssr_data.xyzw, fac); /* do not blend roughness */
		cl.ssr_normal = cl2.ssr_normal;
		cl.ssr_id = cl2.ssr_id;
	}
	cl.opacity = mix(cl1.opacity, cl2.opacity, fac);
	cl.radiance = mix(cl1.radiance * cl1.opacity, cl2.radiance * cl2.opacity, fac);
	cl.radiance /= max(1e-8, cl.opacity);

#  ifdef USE_SSS
	cl.sss_data.rgb = mix(cl1.sss_data.rgb, cl2.sss_data.rgb, fac);
	cl.sss_data.a = (cl1.sss_data.a > 0.0) ? cl1.sss_data.a : cl2.sss_data.a;
#    ifdef USE_SSS_ALBEDO
	/* TODO Find a solution to this. Dither? */
	cl.sss_albedo = (cl1.sss_data.a > 0.0) ? cl1.sss_albedo : cl2.sss_albedo;
#    endif
#  endif

	return cl;
}

Closure closure_add(Closure cl1, Closure cl2)
{
	Closure cl = (cl1.ssr_id == outputSsrId) ? cl1 : cl2;
#  ifdef USE_SSS
	cl.sss_data = (cl1.sss_data.a > 0.0) ? cl1.sss_data : cl2.sss_data;
#    ifdef USE_SSS_ALBEDO
	/* TODO Find a solution to this. Dither? */
	cl.sss_albedo = (cl1.sss_data.a > 0.0) ? cl1.sss_albedo : cl2.sss_albedo;
#    endif
#  endif
	cl.radiance = cl1.radiance + cl2.radiance;
	cl.opacity = saturate(cl1.opacity + cl2.opacity);
	return cl;
}

Closure closure_emission(vec3 rgb)
{
	Closure cl = CLOSURE_DEFAULT;
	cl.radiance = rgb;
	return cl;
}
"""

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
    