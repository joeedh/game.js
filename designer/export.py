import bpy, json, time, random, os, sys, os.path
from math import *
from mathutils import *
from . import utils
from . import shader_export

#"""
class PatchContext(list):
    def __init__(self):
        self.append([[], {}])
    
    def push(self):
        self.append([self[-1][0][:], dict(self[-1][1])])
    
    def setKey(self, key, val):
        self[-1][0].append([key, val])
        self[-1][1][key] = val
        
    def get(self, key):
        lst, map = self[-1]
        
        if key in map:
            return map[key]
        return key
#"""

def handleShader(mat, name, pctx, shaders):
    if name not in shaders:
        shaders[name] = shader_export.exportShader(mat, name)
        
    
def convertObject(ob, pctx, shaders):
    r = {
        "type" : "GameObject",
        "loc" : list(ob.location),
        "quat" : list(ob.rotation_euler.to_quaternion()),
        "scale" : list(ob.scale),
        "name" : pctx.get("OB"+ob.name),
        "parent" : pctx.get("OB"+ob.parent.name) if ob.parent else None,
    }
    
    for mat in ob.material_slots:
        if mat.material is None: continue
        
        name = pctx.get("MA"+mat.material.name) 
        handleShader(mat.material, name, pctx, shaders)
        
    if ob.type == "EMPTY":
        r["subtype"] = "empty"
    elif ob.type == "LIGHT":
        r["subtype"] = "light"
        r["data"] = ob.data.name
    elif ob.type == "MESH":
        r["subtype"] = "MESH"
        r["data"] = ob.data.name
    
    return r
    
def makeEmpty(name):
    return {
        "loc" : list(Vector()),
        "quat" : list(Quaternion()),
        "scale" : list(Vector()),
        "name" : name,
        "parent" : None,
        "type" : "GameObject"
    }

def convertObjects(objects, pctx, shaders):
    ret = []
    
    for ob in objects:
        if ob.gamejs.ignore: continue
        if ob.type == "EMPTY" and ob.instance_collection:
            col = ob.instance_collection
            
            key = "_CL" + ob.name + "_"
            pctx.push();
            for ob2 in col.objects:
                pctx.setKey("OB"+ob2.name, key + ob2.name)
            
            
            ob3 = convertObject(ob, pctx, shaders)
            ret.append(ob3)
            
            for ob2 in convertObjects(col.objects, pctx, shaders):
                if ob2["parent"] is None:
                    ob2["parent"] = ob3
                    
                ret.append(ob2)
                
            pctx.pop()
            
            print("instance!")
            print(ob.instance_collection)
            #instance!
        else:
            ret.append(convertObject(ob, pctx, shaders))
    
    return ret
        
def exportScene(basepath, scene):
    pctx = PatchContext()
    obs = []
    
    spath = basepath + "/Scenes/" + scene.name
    mpath = spath + "/Models"
    tpath = spath + "/Textures"
    
    print(basepath, spath, mpath)
    
    os.makedirs(spath, exist_ok=True)
    os.makedirs(mpath, exist_ok=True)
    os.makedirs(tpath, exist_ok=True)
    
    for ob in scene.objects:
        if not ob.gamejs.ignore:
            obs.append(ob)
    
    shaders = {}
    
    ret = convertObjects(obs, pctx, shaders)
    jscene = {
        "objects" : ret,
        "shaders" : shaders,
        "name" : scene.name
    }
    
    buf = json.dumps(jscene, indent=2)
    
    file = open(spath + "/" + scene.name + ".json", "w")
    file.write(buf)
    file.close()
    
        
reg = utils.Registrar([
])
