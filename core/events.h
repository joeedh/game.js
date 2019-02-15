#include "stdio.h"
#include "include/v8.h"

using namespace v8;

namespace gamejs {
namespace events {
	
void SetGlobalTemplates(Local<ObjectTemplate> &global, Isolate *isolate);
void SetGlobalObjects(Local<Object> &global, Isolate *isolate, Local<Context> context);
void FireEvent(Local<Object>& global, Isolate *isolate, std::string name, Local<Object> &event);

}
}
