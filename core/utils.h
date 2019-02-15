#include "stdio.h"
#include "include/v8.h"

using namespace v8;

namespace gamejs {
namespace utils {
	
void SetGlobalTemplates(Local<ObjectTemplate> &global, Isolate *isolate);
void SetGlobalObjects(Local<Object> &global, Isolate *isolate, Local<Context> context);
double time_ms();

}
}
