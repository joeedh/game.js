#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "include/libplatform/libplatform.h"
#include "include/v8.h"
#include "utils.h"

#include "windows.h"

using namespace gamejs::utils;
using namespace gamejs;

/*
static void IdCallback(const v8::FunctionCallbackInfo<v8::Value>& args) {
  if (args.Length() < 1) return;

  EscapableHandleScope scope(args.GetIsolate());

  Local<Value> arg1 = args[0];
  char str[256];

  sprintf(str, "%p", *arg1);
  str[255] = 0; //paranoia check

  //Local<StringObject> objstr = StringObject::New(String::NewFromUtf8(args.GetIsolate(), str));

  //String::Utf8Value uret(objstr);
  //Local<Value> ret = static_cast<Local<Value>>(uret);

  //Local<Number> ret = Number::New(args.GetIsolate(), 0.00);

  args.GetReturnValue().Set(StringObject::New(String::NewFromUtf8(args.GetIsolate(), str)));
}
*/

void gamejs::utils::SetGlobalTemplates(Local<ObjectTemplate> &global, Isolate *isolate) {
	//global->Set(String::NewFromUtf8(isolate, "_object_id"), FunctionTemplate::New(isolate, IdCallback));
}

void gamejs::utils::SetGlobalObjects(Local<Object> &global, Isolate *isolate, Local<Context> context) {

}

double gamejs::utils::time_ms() {
	LARGE_INTEGER time;
	static LARGE_INTEGER freq;
	static int do_init = 1;

	if (do_init) {
		QueryPerformanceFrequency(&freq);
		do_init = 0;
	}

	QueryPerformanceCounter(&time);
	return ((double)time.QuadPart / (double)freq.QuadPart)*1000.0;
}
