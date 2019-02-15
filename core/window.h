#ifndef _WINDOW_H
#define _WINDOW_H

#include <EGL/egl.h>
#include <EGL/eglext.h>

#include "OSWindow.h"
#include "Timer.h"

#include <string>
#include <list>
#include <cstdint>
#include <memory>

class EGLWindow;

class AppWindow
{
  public:
    AppWindow(const std::string& name, size_t width, size_t height,
                      EGLint glesMajorVersion = 2, EGLint requestedRenderer = EGL_PLATFORM_ANGLE_TYPE_DEFAULT_ANGLE);
    virtual ~AppWindow();

    virtual bool initialize();
    virtual void destroy();

    virtual void step(float dt, double totalTime);
    virtual void draw();

    virtual void swap();

    OSWindow *getWindow() const;
    EGLConfig getConfig() const;
    EGLDisplay getDisplay() const;
    EGLSurface getSurface() const;
    EGLContext getContext() const;

    bool popEvent(Event *event);
	void messageLoop() {
		mOSWindow->messageLoop();
	}

    int start();
    void exit();

	size_t size[2];
  private:
    std::string mName;
    bool mRunning;

    std::unique_ptr<Timer> mTimer;
    std::unique_ptr<EGLWindow> mEGLWindow;
    std::unique_ptr<OSWindow> mOSWindow;
};

#endif //_WINDOW_H
