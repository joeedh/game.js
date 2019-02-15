#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "include/libplatform/libplatform.h"
#include "include/v8.h"
#include "angle_wrap.h"

#include "angle_gl.h"

#include <EGL/egl.h>
#include <EGL/eglext.h>

#include "OSWindow.h"

using namespace gamejs::angle;
using namespace gamejs;

static struct {
	Global<FunctionTemplate> WebGLBuffer;
	Global<FunctionTemplate> WebGLShader;
	Global<FunctionTemplate> WebGLProgram;
} webgl_types;

static void BaseCallback(const v8::FunctionCallbackInfo<v8::Value>& args) {
}

#define TYPE_ERROR(isolate, msg) \
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, msg)))
#define REFERENCE_ERROR(isolate, msg) \
		isolate->ThrowException(Exception::ReferenceError(String::NewFromUtf8(isolate, msg)))

static void BufferCallback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	if (!args.IsConstructCall()) {
		TYPE_ERROR(args.GetIsolate(), "Can only call with 'new'");
		return;
	}

	Local<Object> This = args.This();
	GLuint bufid = 0;

	glGenBuffers(1, &bufid);

	This->SetInternalField(0, Boolean::New(args.GetIsolate(), false));
	This->SetInternalField(1, Number::New(args.GetIsolate(), bufid));
}
static int GetObjectOfType(Isolate *isolate, Local<Object>& out, Local<FunctionTemplate> type, Local<Value> & value, char *typename1) {
	EscapableHandleScope scope(isolate);

	if (!(type->HasInstance(value))) {
		char errbuf[256];
		sprintf(errbuf, "Expected %s", typename1);

		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, errbuf)));
		return -1;
	}
	
	Local<Object> obj = Local<Object>::Cast(value);
	out = scope.Escape(obj);

	return 1;
}


static int GetWebGLObjectOfType(Isolate *isolate, Local<Object>& out, Local<FunctionTemplate> type, Local<Value> & value, char *typename1) {
	EscapableHandleScope scope(isolate);

	if (!(type->HasInstance(value))) {
		char errbuf[256];
		sprintf(errbuf, "Expected %s", typename1);

		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, errbuf)));
		return -1;
	}
	
	Local<Object> obj = Local<Object>::Cast(value);

	int invalidated = obj->GetInternalField(0)->Int32Value();
	if (invalidated) {
		char errbuf[256];

		sprintf(errbuf, "Passed %s is invalid", typename1);
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, errbuf)));

		return -1;
	}

	return obj->GetInternalField(1)->Int32Value();
}

static void BindBufferCallback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);

	if (args.Length() < 2) {
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected WebGLBuffer")));
		return;
	}
	
	int glid;

	if (args[1]->IsNull()) {
		glid = 0;
	} else {
		Local<FunctionTemplate> type = webgl_types.WebGLBuffer.Get(isolate);

		if (!(type->HasInstance(args[1]))) {
			isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected WebGLBuffer")));
			return;
		}
	
		Local<Object> id = Local<Object>::Cast(args[1]);

		int invalidated = id->GetInternalField(0)->Int32Value();
		glid = id->GetInternalField(1)->Int32Value(); 

		if (invalidated) {
			isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Passed WebGLBuffer is invalid")));
			return;
		}
	}

	glBindBuffer(args[0]->Int32Value(), glid);
	
	//	Local<External> wrap = Local<External>::Cast(self->GetInternalField(0));
}

static void ShaderCallback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	if (!args.IsConstructCall()) {
		TYPE_ERROR(args.GetIsolate(), "Can only call with 'new'");
		return;
	}

	if (args.Length() < 1) {
		TYPE_ERROR(args.GetIsolate(), "Expected one argument");
		return;
	}
	
	Local<Object> This = args.This();
	GLuint shaderid = 0;

	shaderid = glCreateShader(args[0]->Int32Value());

	This->SetInternalField(0, Boolean::New(args.GetIsolate(), false));
	This->SetInternalField(1, Number::New(args.GetIsolate(), shaderid));
}

static void ProgramCallback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	if (!args.IsConstructCall()) {
		TYPE_ERROR(args.GetIsolate(), "Can only call with 'new'");
		return;
	}

	Local<Object> This = args.This();
	GLuint programid = 0;

	programid = glCreateProgram();

	This->SetInternalField(0, Boolean::New(args.GetIsolate(), false));
	This->SetInternalField(1, Number::New(args.GetIsolate(), programid));
}

#define _WRAPF_1\
	Local<Value> arg1 = args[0];


#define _WRAPF_2\
	Local<Value> arg1 = args[0];\
	Local<Value> arg2 = args[1];


#define _WRAPF_3\
	Local<Value> arg1 = args[0];\
	Local<Value> arg2 = args[1];\
	Local<Value> arg3 = args[2];

#define _WRAPF_4\
	Local<Value> arg1 = args[0];\
	Local<Value> arg2 = args[1];\
	Local<Value> arg3 = args[2];\
	Local<Value> arg4 = args[3];

#define _ARG_0
#define _ARG_1 arg1->NumberValue()
#define _ARG_2 arg1->NumberValue(), arg2->NumberValue()
#define _ARG_3 arg1->NumberValue(), arg2->NumberValue(), arg3->NumberValue()
#define _ARG_4 arg1->NumberValue(), arg2->NumberValue(), arg3->NumberValue(), arg4->NumberValue()
#define _ARG_5 arg1->NumberValue(), arg2->NumberValue(), arg3->NumberValue(), arg4->NumberValue(), arg5->NumberValue()

#define V8_VALUE_CAST_float NumberValue
#define V8_VALUE_CAST_int Int32Value

#define V8_VALUE_CAST(x) V8_VALUE_CAST_##x

#define WRAP(name, glname, arglen)\
static void name##_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {\
	if (args.Length() < arglen) {\
		char errbuf[256];\
		sprintf(errbuf, "Expected %d arguments, got %d instead", (int)args.Length(), (int)arglen);\
		TYPE_ERROR(args.GetIsolate(), errbuf);\
	}\
	_WRAPF_##arglen\
	glname(_ARG_##arglen);\
}


//datalen is how big the array buffer should be, in bytes
static void *get_array_buffer(Isolate *isolate, Local<Value> val, int datalen) {
	HandleScope scope(isolate);
	ArrayBuffer *ret = NULL;

	if (val->IsArrayBuffer()) {
		ret = ArrayBuffer::Cast(*val);
	} else if (val->IsArrayBufferView()) {
		ArrayBufferView *view = ArrayBufferView::Cast(*val);

		if (view) {
			Local<ArrayBuffer> array = view->Buffer();

			ret = !array.IsEmpty() ? *array : NULL;
		}
	} else {
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Expected array buffer")));
		return NULL;
	}

	if (!ret || ret->ByteLength() != datalen) {
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Array buffer has wrong size")));
		return NULL;
	}

	return ret->GetContents().Data();
}

static void bindAttribLocation_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);

	if (args.Length() < 3) {
		TYPE_ERROR(isolate, "Expected 3 arguments");
		return;
	}

	Local<Object> program; 
	int glid = GetWebGLObjectOfType(isolate, program, webgl_types.WebGLProgram.Get(isolate), args[0], "WebGLProgram");
	if (glid < 0) {
		return; //error
	}
	
	int index = args[1]->Int32Value();
	Local<String> name = args[2]->ToString();

	const char *cname = name->GetExternalOneByteStringResource()->data();
	int namelen = name->GetExternalOneByteStringResource()->length();

	char buf[512];

	//chrome docs don't say if GetExternalOneByteStringResource.data is null-terminated or not
	namelen = namelen < 0 ? 0 : namelen;
	namelen = namelen > sizeof(buf)-1 ? sizeof(buf) - 1 : namelen;

	strncpy(buf, cname, sizeof(buf)-1);
	buf[namelen] = 0;

	glBindAttribLocation(glid, index, buf);
}

static void attachShader_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void compileShader_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void deleteProgram_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void deleteShader_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void detachShader_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void getAttachedShaders_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void getProgramParameter_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void isShader_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void isProgram_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void linkProgram_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void shaderSource_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void useProgram_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void validateProgram_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
	
static void getShaderSource_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void getShaderInfoLog_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void getShaderPrecisionFormat_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void getShaderParameter_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}
static void getProgramInfoLog_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	Isolate *isolate = args.GetIsolate();
	HandleScope scope(isolate);
}

//arglen should be 1 minus total number of args; e.g. gluniform3fv(loc, ptr) would have arglen of 1
#define WRAPV(name, glname, arglen, datatype, datalen)\
static void name##_callback(const v8::FunctionCallbackInfo<v8::Value>& args) {\
	if (args.Length() < arglen+1) {\
		return;\
	}\
	_WRAPF_##arglen\
	datatype *ptr = (datatype *) get_array_buffer(args.GetIsolate(), args[arglen], datalen*sizeof(datatype));\
	if (ptr == NULL) return;\
	\
	glname(_ARG_##arglen, ptr);\
}

WRAP(clearDepth, glClearDepthf, 1)
WRAP(clearStencil, glClearStencil, 1)
WRAP(clearColor, glClearColor, 4)
WRAP(clear, glClear, 1)

WRAPV(uniformMatrix4fv, glUniformMatrix4fv, 3, float, 16);

WRAP(uniform1f, glUniform1f, 2)
WRAP(uniform2f, glUniform2f, 3)
WRAP(uniform3f, glUniform3f, 4)
WRAP(bindTexture, glBindTexture, 2)
WRAP(viewport, glViewport, 4)

static Local<ObjectTemplate> gen_gl_template(Isolate *isolate) {
	EscapableHandleScope scope(isolate);
	Local<ObjectTemplate> gl_templ = ObjectTemplate::New();

#define ADD_API(name) gl_templ->Set(String::NewFromUtf8(isolate, #name), FunctionTemplate::New(isolate, name##_callback))
#define ADD_CONST(name) gl_templ->Set(String::NewFromUtf8(isolate, #name), Number::New(isolate, GL_##name))

	//gl_templ->Set(String::NewFromUtf8(isolate, "clear"), FunctionTemplate::New(isolate, clear_callback));
	//gl_templ->Set(String::NewFromUtf8(isolate, "clearColor"), FunctionTemplate::New(isolate, clearColor_callback));
	
	//shader/program api
	gl_templ->Set(String::NewFromUtf8(isolate, "bindAttribLocation"), FunctionTemplate::New(isolate, bindAttribLocation_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "attachShader"), FunctionTemplate::New(isolate, attachShader_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "compileShader"), FunctionTemplate::New(isolate, compileShader_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "deleteProgram"), FunctionTemplate::New(isolate, deleteProgram_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "deleteShader"), FunctionTemplate::New(isolate, deleteShader_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "detachShader"), FunctionTemplate::New(isolate, detachShader_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "getAttachedShaders"), FunctionTemplate::New(isolate, getAttachedShaders_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "getProgramParameter"), FunctionTemplate::New(isolate, getProgramParameter_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "getProgramInfoLog"), FunctionTemplate::New(isolate, getProgramInfoLog_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "getShaderParameter"), FunctionTemplate::New(isolate, getShaderParameter_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "getShaderPrecisionFormat"), FunctionTemplate::New(isolate, getShaderPrecisionFormat_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "getShaderInfoLog"), FunctionTemplate::New(isolate, getShaderInfoLog_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "getShaderSource"), FunctionTemplate::New(isolate, getShaderSource_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "isProgram"), FunctionTemplate::New(isolate, isProgram_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "isShader"), FunctionTemplate::New(isolate, isShader_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "linkProgram"), FunctionTemplate::New(isolate, linkProgram_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "shaderSource"), FunctionTemplate::New(isolate, shaderSource_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "useProgram"), FunctionTemplate::New(isolate, useProgram_callback));
	gl_templ->Set(String::NewFromUtf8(isolate, "validateProgram"), FunctionTemplate::New(isolate, validateProgram_callback));
	
	ADD_CONST(COLOR_BUFFER_BIT);
	ADD_CONST(DEPTH_BUFFER_BIT);
	ADD_CONST(STENCIL_BUFFER_BIT);

	ADD_CONST(TRIANGLES);
	ADD_CONST(LINES);
	ADD_CONST(POINTS);
	ADD_CONST(LINE_LOOP);
	ADD_CONST(LINE_STRIP);
	ADD_CONST(TRIANGLE_STRIP);
	ADD_CONST(TRIANGLE_FAN);
	
	ADD_CONST(NEVER);
	ADD_CONST(LESS);
	ADD_CONST(EQUAL);
	ADD_CONST(LEQUAL);
	ADD_CONST(NOTEQUAL);
	ADD_CONST(GEQUAL);
	ADD_CONST(ALWAYS);
	ADD_CONST(ZERO);
	ADD_CONST(ONE);
	ADD_CONST(SRC_COLOR);
	ADD_CONST(ONE_MINUS_SRC_COLOR);
	ADD_CONST(SRC_ALPHA);
	ADD_CONST(DST_ALPHA);
	ADD_CONST(ONE_MINUS_DST_ALPHA);
	ADD_CONST(DST_COLOR);
	ADD_CONST(ONE_MINUS_DST_COLOR);
	ADD_CONST(SRC_ALPHA_SATURATE);
	ADD_CONST(FUNC_ADD);
	ADD_CONST(BLEND_EQUATION);
	ADD_CONST(BLEND_EQUATION_RGB);
	ADD_CONST(BLEND_EQUATION_ALPHA);
	ADD_CONST(FUNC_SUBTRACT);
	ADD_CONST(FUNC_REVERSE_SUBTRACT);
	ADD_CONST(BLEND_DST_RGB);
	ADD_CONST(BLEND_SRC_RGB);
	ADD_CONST(BLEND_DST_ALPHA);
	ADD_CONST(BLEND_SRC_ALPHA);
	ADD_CONST(CONSTANT_COLOR);
	ADD_CONST(ONE_MINUS_CONSTANT_COLOR);
	ADD_CONST(CONSTANT_ALPHA);
	ADD_CONST(ONE_MINUS_CONSTANT_ALPHA);
	ADD_CONST(BLEND_COLOR);
	ADD_CONST(ARRAY_BUFFER);
	ADD_CONST(ELEMENT_ARRAY_BUFFER);
	ADD_CONST(ARRAY_BUFFER_BINDING);
	ADD_CONST(ELEMENT_ARRAY_BUFFER_BINDING);
	ADD_CONST(STREAM_DRAW);
	ADD_CONST(STATIC_DRAW);
	ADD_CONST(DYNAMIC_DRAW);
	ADD_CONST(BUFFER_SIZE);
	ADD_CONST(BUFFER_USAGE);
	ADD_CONST(CURRENT_VERTEX_ATTRIB);
	ADD_CONST(FRONT);
	ADD_CONST(BACK);
	ADD_CONST(FRONT_AND_BACK);
	ADD_CONST(CULL_FACE);
	ADD_CONST(BLEND);
	ADD_CONST(DITHER);
	ADD_CONST(STENCIL_TEST);
	ADD_CONST(DEPTH_TEST);
	ADD_CONST(SCISSOR_TEST);
	ADD_CONST(POLYGON_OFFSET_FILL);
	ADD_CONST(SAMPLE_ALPHA_TO_COVERAGE);
	ADD_CONST(SAMPLE_COVERAGE);
	ADD_CONST(NO_ERROR);
	ADD_CONST(INVALID_ENUM);
	ADD_CONST(INVALID_VALUE);
	ADD_CONST(INVALID_OPERATION);
	ADD_CONST(OUT_OF_MEMORY);
	ADD_CONST(CW);
	ADD_CONST(CCW);
	ADD_CONST(LINE_WIDTH);
	ADD_CONST(ALIASED_POINT_SIZE_RANGE);
	ADD_CONST(ALIASED_LINE_WIDTH_RANGE);
	ADD_CONST(CULL_FACE_MODE);
	ADD_CONST(FRONT_FACE);
	ADD_CONST(DEPTH_RANGE);
	ADD_CONST(DEPTH_WRITEMASK);
	ADD_CONST(DEPTH_CLEAR_VALUE);
	ADD_CONST(DEPTH_FUNC);
	ADD_CONST(STENCIL_CLEAR_VALUE);
	ADD_CONST(STENCIL_FUNC);
	ADD_CONST(STENCIL_FAIL);
	ADD_CONST(STENCIL_PASS_DEPTH_FAIL);
	ADD_CONST(STENCIL_PASS_DEPTH_PASS);
	ADD_CONST(STENCIL_REF);
	ADD_CONST(STENCIL_VALUE_MASK);
	ADD_CONST(STENCIL_WRITEMASK);
	ADD_CONST(STENCIL_BACK_FUNC);
	ADD_CONST(STENCIL_BACK_FAIL);
	ADD_CONST(STENCIL_BACK_PASS_DEPTH_FAIL);

	ADD_CONST(FLOAT);

	ADD_API(clear);
	ADD_API(clearColor);
	ADD_API(uniform1f);
	ADD_API(uniform2f);
	ADD_API(uniform3f);
	ADD_API(viewport);

	return scope.Escape(gl_templ);
}

void gamejs::angle::SetGlobalTemplates(Local<ObjectTemplate> &global, Isolate *isolate) {
	HandleScope handle_scope(isolate);

	// Local scope for temporary handles.
	Local<FunctionTemplate> webgl_base = FunctionTemplate::New(isolate, BaseCallback);
	Local<ObjectTemplate> fclass = webgl_base->InstanceTemplate();
	fclass->SetInternalFieldCount(1); //the internal field is just the 'invalidated' flag, [webgl 5.3]
	
	global->Set(String::NewFromUtf8(isolate, "WebGLObject"), webgl_base);

    Local<FunctionTemplate> webgl_buffer = FunctionTemplate::New(isolate, BufferCallback);
	webgl_buffer->Inherit(webgl_base);
	webgl_buffer->InstanceTemplate()->SetInternalFieldCount(2); //invalidated + buffer id

	Local<FunctionTemplate> webgl_shader = FunctionTemplate::New(isolate, ShaderCallback);
	webgl_shader->Inherit(webgl_base);
	webgl_shader->InstanceTemplate()->SetInternalFieldCount(2); //invalidated + buffer id

	Local<FunctionTemplate> webgl_program = FunctionTemplate::New(isolate, ProgramCallback);
	webgl_program->Inherit(webgl_base);
	webgl_program->InstanceTemplate()->SetInternalFieldCount(2); //invalidated + buffer id
	
	webgl_types.WebGLBuffer.Reset(isolate, webgl_buffer);
	webgl_types.WebGLShader.Reset(isolate, webgl_shader);
	webgl_types.WebGLProgram.Reset(isolate, webgl_program);

	global->Set(String::NewFromUtf8(isolate, "WebGLBuffer"), webgl_buffer);
	global->Set(String::NewFromUtf8(isolate, "WebGLShader"), webgl_shader);
	global->Set(String::NewFromUtf8(isolate, "WebGLProgram"), webgl_program);
}

void gamejs::angle::SetGlobalObjects(Local<Object> &global, Isolate *isolate, Local<Context> context) {
	HandleScope handle_scope(isolate);

	Local<ObjectTemplate> gl_templ = gen_gl_template(isolate);
	Local<Object> gl = gl_templ->NewInstance();

	global->Set(String::NewFromUtf8(isolate, "gl"), gl);
}
