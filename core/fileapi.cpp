#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "include/libplatform/libplatform.h"
#include "include/v8.h"
#include "fileapi.h"

using namespace gamejs::fileapi;
using namespace gamejs;

int File::WriteCString(char *buf) {
	return fprintf(_file, "%s", buf);
}

File::File(char *path, char *mode) {
	strncpy(_path, path, sizeof(_path));
	strncpy(_mode, mode, sizeof(_mode));

	_path[sizeof(_path)-1] = 0;
	_mode[sizeof(_mode)-1] = 0;
}

File::File(FILE *file) : _file(file) {
}

//static Global<ObjectTemplate> file_template;
void Getter(Local<String> property,
                const PropertyCallbackInfo<Value>& info) {
    //info.GetReturnValue().Set(x);
}
void Setter(Local<String> property, Local<Value> value,
            const PropertyCallbackInfo<Value>& info) {
	//x = value->Int32Value();
}

static Local<FunctionTemplate> make_file_templ(Isolate *isolate);

Local<Object> file_new(Isolate *isolate, char *path, char *mode) {
	EscapableHandleScope handle_scope(isolate);

    Local<FunctionTemplate> templ = make_file_templ(isolate);
	Local<ObjectTemplate> objtempl = templ->InstanceTemplate();

	File *file = new File(path, mode);
	Local<Object> ret = objtempl->NewInstance();
	ret->SetInternalField(0, External::New(isolate, file));

	return handle_scope.Escape(ret);
}

Local<Object> create_stdout(Isolate *isolate) {
	EscapableHandleScope handle_scope(isolate);

    Local<FunctionTemplate> templ = make_file_templ(isolate);
	Local<ObjectTemplate> objtempl = templ->InstanceTemplate();

	File *file = new File(stdout);
	Local<Object> ret = objtempl->NewInstance();
	ret->SetInternalField(0, External::New(isolate, file));

	return handle_scope.Escape(ret);
}

static void WriteUtf8Callback(const v8::FunctionCallbackInfo<v8::Value>& args) {
	if (args.Length() < 1) return;

	HandleScope scope(args.GetIsolate());

	Local<Object> self = args.Holder();
	Local<External> wrap = Local<External>::Cast(self->GetInternalField(0));
	void* ptr = wrap->Value();
	File *file = static_cast<File*>(ptr);

	Local<Value> arg1 = args[0];
	String::Utf8Value data(arg1);
	
	file->WriteCString(*data);
}

static void FileCallback(const v8::FunctionCallbackInfo<v8::Value>& args) {
  if (args.Length() < 2) return;

  EscapableHandleScope scope(args.GetIsolate());

  Local<Value> arg1 = args[0];
  Local<Value> arg2 = args[1];
  String::Utf8Value path(arg1);
  String::Utf8Value mode(arg2);

  Local<Object> ret = file_new(args.GetIsolate(), *path, *mode);

  args.GetReturnValue().Set(scope.Escape(ret));
}

static Local<FunctionTemplate> make_file_templ(Isolate *isolate) {
	EscapableHandleScope handle_scope(isolate);
	Local<FunctionTemplate> ftempl = FunctionTemplate::New(isolate, FileCallback);

	Local<ObjectTemplate> fclass = ftempl->InstanceTemplate();
	fclass->SetInternalFieldCount(1);
	
	Local<ObjectTemplate> proto = ftempl->PrototypeTemplate();
	proto->Set(String::NewFromUtf8(isolate, "write_utf8"),  
		       FunctionTemplate::New(isolate, WriteUtf8Callback)->GetFunction());

	return handle_scope.Escape(ftempl);
}


void gamejs::fileapi::SetGlobalTemplates(Local<ObjectTemplate> &global, Isolate *isolate) {
	HandleScope handle_scope(isolate);

	// Local scope for temporary handles.
	Local<FunctionTemplate> ftempl = FunctionTemplate::New(isolate, FileCallback);
	Local<ObjectTemplate> fclass = ftempl->InstanceTemplate();
	fclass->SetInternalFieldCount(1);
	
	Local<ObjectTemplate> proto = ftempl->PrototypeTemplate();
	global->Set(String::NewFromUtf8(isolate, "_File"), ftempl);
}

void gamejs::fileapi::SetGlobalObjects(Local<Object> &global, Isolate *isolate, Local<Context> context) {
	HandleScope handle_scope(isolate);

	global->Set(String::NewFromUtf8(isolate, "_stdout"), create_stdout(isolate));
}
