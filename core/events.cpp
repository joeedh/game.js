#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <map>
#include <string>
#include <vector>

#include "include/libplatform/libplatform.h"
#include "include/v8.h"
#include "events.h"

using namespace gamejs::events;
using namespace gamejs;

std::map<std::string, std::vector<Global<Function>> *> event_stacks;
extern Global<Context> g_context;
 
static void addEventListenerCallback(const v8::FunctionCallbackInfo<v8::Value>& args) {
  std::vector<Global<Function>> *stack;

  if (args.Length() < 2 || !args[1]->IsFunction()) return;
  
  EscapableHandleScope scope(args.GetIsolate());

  Local<Value> arg1 = args[0];
  Local<Value> arg2 = args[1];

  String::Utf8Value event(arg1);
  Local<Function>   func;
  func = func.Cast(arg2);

  std::string key = *event;

  if (!event_stacks.count(key)) {
	  stack = new std::vector<Global<Function>>();

	  event_stacks[key] = stack;
  } else {
	  stack = event_stacks[key];
  }

  stack->emplace_back();
  (*stack)[stack->size()-1].Reset(args.GetIsolate(), func);
}

void gamejs::events::FireEvent(Local<Object>& global, Isolate *isolate, std::string name, Local<Object>& event) {
	HandleScope handle_scope(isolate);

	if (event_stacks.count(name) == 0) 
		return;

	std::vector<Global<Function>> *stack = event_stacks[name];

	int size = stack->size();
	Local<Value> retval;
	Local<Value> args[1] = {event};
	Local<Context> context = Local<Context>::New(isolate, g_context);

	for (int i=0; i<size; i++) {
		HandleScope handle_scope_2(isolate);
		Local<Function> func = (*stack)[i].Get(isolate);

		func->Call(context, global, 1, args);
	}
}

void gamejs::events::SetGlobalTemplates(Local<ObjectTemplate> &global, Isolate *isolate) {
	HandleScope handle_scope(isolate);

	// Local scope for temporary handles.
	Local<FunctionTemplate> ftempl = FunctionTemplate::New(isolate, addEventListenerCallback);
	global->Set(String::NewFromUtf8(isolate, "addEventListener"), ftempl);
}

void gamejs::events::SetGlobalObjects(Local<Object> &global, Isolate *isolate, Local<Context> context) {
	HandleScope handle_scope(isolate);
}
