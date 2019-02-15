#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "include/libplatform/libplatform.h"
#include "include/v8.h"

#include "fileapi.h"
#include "angle_wrap.h"
#include "utils.h"
#include "window.h"
#include "events.h"

#include "Windows.h"

using namespace v8;
using namespace gamejs;

class ArrayBufferAllocator : public v8::ArrayBuffer::Allocator {
 public:
  virtual void* Allocate(size_t length) {
    void* data = AllocateUninitialized(length);
    return data == NULL ? data : memset(data, 0, length);
  }
  virtual void* AllocateUninitialized(size_t length) { return malloc(length); }
  virtual void Free(void* data, size_t) { free(data); }
};

AppWindow *main_window=NULL;

Global<Context> g_context;

void init_window() {
	main_window = new AppWindow("Game", 800, 600, 3, EGL_PLATFORM_ANGLE_TYPE_DEFAULT_ANGLE);
	main_window->start();
}

char *get_event_name(Event::EventType type) {
	switch(type) {
		case Event::EventType::EVENT_CLOSED:
			return "closed";
		case Event::EventType::EVENT_MOVED:
			return "winmoved";
		case Event::EventType::EVENT_RESIZED:
			return "resize";
		case Event::EventType::EVENT_LOST_FOCUS:
			return "blur";
		case Event::EventType::EVENT_GAINED_FOCUS:
			return "focus";
		case Event::EventType::EVENT_TEXT_ENTERED:
			return "input";
		case Event::EventType::EVENT_KEY_PRESSED:
			return "keydown";
		case Event::EventType::EVENT_KEY_RELEASED:
			return "keyup";
		case Event::EventType::EVENT_MOUSE_WHEEL_MOVED:
			return "mousewheel";
		case Event::EventType::EVENT_MOUSE_BUTTON_PRESSED:
			return "mousedown";
		case Event::EventType::EVENT_MOUSE_BUTTON_RELEASED:
			return "mouseup";
		case Event::EventType::EVENT_MOUSE_MOVED:
			return "mousemove";
		case Event::EventType::EVENT_MOUSE_ENTERED:
			return "entermouse";
		case Event::EventType::EVENT_MOUSE_LEFT:
			return "exitmouse";
		case Event::EventType::EVENT_TEST:
			return "test";
		default:
			return "bad_event";
	}
}

//local flags for caching modifier state
enum {
	ALT_FLAG     = 1,
    CTRL_FLAG    = 2,
	SHIFT_FLAG   = 4,
	SYSTEM_FLAG = 8
};

Local<Object> event_to_js(Isolate *isolate, Event& event) {
	EscapableHandleScope scope(isolate);
	Local<ObjectTemplate> templ = ObjectTemplate::New();
	Local<Object> ret;
	char *name = get_event_name(event.Type);
	static int modifiers = 0;

	ret = templ->NewInstance();

	ret->Set(String::NewFromUtf8(isolate, "type"), String::NewFromUtf8(isolate, name));
	
	int height = main_window->getWindow()->getHeight();

	switch (event.Type) {
	case Event::EventType::EVENT_MOUSE_BUTTON_PRESSED:
	case Event::EventType::EVENT_MOUSE_BUTTON_RELEASED:
		int button;

		//convert to DOM button enumeration
		switch (event.MouseButton.Button) {
			case MOUSEBUTTON_LEFT:
				button = 0;
				break;
			case MOUSEBUTTON_MIDDLE:
				button = 1;
				break;
			case MOUSEBUTTON_RIGHT:
				button = 2;
				break;
			case  MOUSEBUTTON_BUTTON4: //need to look up right DOM code for this
				button = 3;
				break;
			case MOUSEBUTTON_BUTTON5:
				button = 4;
				break;
			default:
				button = -1; //bad code
				break;
		}

		ret->Set(String::NewFromUtf8(isolate, "button"), Number::New(isolate, (double)button));
		ret->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, event.MouseButton.X));
		ret->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, height - event.MouseButton.Y));
		break;
	case Event::EventType::EVENT_MOUSE_MOVED:
		ret->Set(String::NewFromUtf8(isolate, "x"), Number::New(isolate, event.Move.X));
		ret->Set(String::NewFromUtf8(isolate, "y"), Number::New(isolate, height - event.Move.Y));
		break;
	case Event::EventType::EVENT_KEY_PRESSED:
	case Event::EventType::EVENT_KEY_RELEASED:
		ret->Set(String::NewFromUtf8(isolate, "keyCode"), Number::New(isolate, event.Key.Code));
		modifiers = (ALT_FLAG*event.Key.Alt) | (CTRL_FLAG*event.Key.Control) | (SHIFT_FLAG*event.Key.Shift) | (SYSTEM_FLAG*event.Key.System);
		break;
	}

	ret->Set(String::NewFromUtf8(isolate, "altKey"), Boolean::New(isolate, !!(modifiers & ALT_FLAG)));
	ret->Set(String::NewFromUtf8(isolate, "ctrlKey"), Boolean::New(isolate, !!(modifiers & CTRL_FLAG)));
	ret->Set(String::NewFromUtf8(isolate, "shiftKey"), Boolean::New(isolate, !!(modifiers & SHIFT_FLAG)));
	ret->Set(String::NewFromUtf8(isolate, "systemKey"), Boolean::New(isolate, !!(modifiers & SYSTEM_FLAG)));

	return scope.Escape(ret);
}

void mainloop(Isolate *isolate, Local<Script> script, Local<Context> context, Platform *platform) {
	double t = gamejs::utils::time_ms(), lastt=t;

	while (1) {
		{
			HandleScope scope(isolate);

			while (v8::platform::PumpMessageLoop(platform, isolate)) {
			}
			
			Event event;
			while (main_window->popEvent(&event)) {
				char *name = get_event_name(event.Type);
				Local<Object> e = event_to_js(isolate, event);

				gamejs::events::FireEvent(context->Global(), isolate, name, e);
			}
						
			t = gamejs::utils::time_ms();

			if (t-lastt < 16.66) {
				continue;
			}

	        //Event event;
			//main_window->popEvent(event);

			main_window->messageLoop();

			main_window->step((float)(t-lastt), t);
			main_window->draw();
			main_window->swap();

			//void gamejs::events::FireEvent(Isolate *isolate, std::string name, Local<Object> &event) {
			Local<String> str = String::NewFromUtf8(isolate, "event");
			Local<Object> obj = Local<Object>::Cast(str);

			gamejs::events::FireEvent(context->Global(), isolate, "draw", obj);

			lastt = t;
			Sleep(3);
		}
	}
}

int main(int argc, char* argv[]) {
  // Initialize V8.
  V8::InitializeICU();
  V8::InitializeExternalStartupData(argv[0]);
  Platform* platform = platform::CreateDefaultPlatform();
  V8::InitializePlatform(platform);
  V8::Initialize();
  FILE *file;
  size_t fsize, read;
  char *buf, *path;

  if (argc < 2) {
	  fprintf(stderr, "Error: no input file\n");
	  return -1;
  }

  path = argv[1];
  fopen_s(&file, path, "r");

  if (!file) {
	  fprintf(stderr, "Error: could not open file: %s\n", path);
	  return -1;
  }

  fseek(file, 0, SEEK_END);
  fsize = ftell(file);
  fseek(file, 0, SEEK_SET);

  buf = (char*) malloc(fsize + 1);
  read = fread_s(buf, fsize + 1, 1, fsize, file);
  buf[read < fsize ? read : fsize] = 0; //paranoia safety check
  fclose(file);

  char flags[] = "--harmony-modules";
  V8::SetFlagsFromString(flags, sizeof(flags));

  // Create a new Isolate and make it the current one.
  ArrayBufferAllocator allocator;
  Isolate::CreateParams create_params;
  create_params.array_buffer_allocator = &allocator;
  Isolate* isolate = Isolate::New(create_params);
  {
    Isolate::Scope isolate_scope(isolate);

    // Create a stack-allocated handle scope.
    HandleScope handle_scope(isolate);

	// Create a template for the global object and set the
	// built-in global functions.
	Local<ObjectTemplate> global = ObjectTemplate::New(isolate);

	gamejs::utils::SetGlobalTemplates(global, isolate);
	gamejs::events::SetGlobalTemplates(global, isolate);
	gamejs::fileapi::SetGlobalTemplates(global, isolate);
	gamejs::angle::SetGlobalTemplates(global, isolate);
	
    // Create a new context.
    Local<Context> context = Context::New(isolate, NULL, global);
	g_context.Reset(isolate, context);

    // Enter the context for compiling and running the hello world script.
    Context::Scope context_scope(context);
	//Global

	gamejs::utils::SetGlobalObjects(context->Global(), isolate, context);
	gamejs::events::SetGlobalObjects(context->Global(), isolate, context);
	gamejs::fileapi::SetGlobalObjects(context->Global(), isolate, context);
	gamejs::angle::SetGlobalObjects(context->Global(), isolate, context);
	
	//create window
	init_window();

	//create self reference, for getting global object in JS code
	context->Global()->Set(String::NewFromUtf8(isolate, "self"), context->Global());
	
    // Create a string containing the JavaScript source code.
    Local<String> source =
        String::NewFromUtf8(isolate, buf,
                            NewStringType::kNormal).ToLocalChecked();

	ScriptCompiler::Source sourcejs(source);

    // Compile the source code.
	//Local<ScriptCompiler> compiler = 
    Local<Script> script = ScriptCompiler::Compile(context, &sourcejs).ToLocalChecked();

    // Run the script to get the result.
    script->Run(context);

	mainloop(isolate, script, context, platform);
  }

  // Dispose the isolate and tear down V8.
  isolate->Dispose();
  V8::Dispose();
  V8::ShutdownPlatform();
  delete platform;

  return 0;
}
