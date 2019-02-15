#include "stdio.h"
#include "include/v8.h"

using namespace v8;

namespace gamejs {
namespace fileapi {
	
void SetGlobalTemplates(Local<ObjectTemplate> &global, Isolate *isolate);
void SetGlobalObjects(Local<Object> &global, Isolate *isolate, Local<Context> context);

class File {
public:
	File(char *path, char *mode);
	File(FILE *file);
	int WriteCString(char *buf);
private:
	char _path[256], _mode[8];
	FILE *_file;
};

}
}
