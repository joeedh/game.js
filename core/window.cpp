//
// Copyright (c) 2013 The ANGLE Project Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
//

#include "window.h"
#include "EGLWindow.h"

AppWindow::AppWindow(const std::string& name, size_t width, size_t height,
                    EGLint glesMajorVersion, EGLint requestedRenderer)
    : mName(name),
      mRunning(false)
{
    mEGLWindow.reset(new EGLWindow(glesMajorVersion, EGLPlatformParameters(requestedRenderer)));
    mTimer.reset(CreateTimer());
    mOSWindow.reset(CreateOSWindow());

	size[0] = width;
	size[1] = height;

    mEGLWindow->setConfigRedBits(8);
    mEGLWindow->setConfigGreenBits(8);
    mEGLWindow->setConfigBlueBits(8);
    mEGLWindow->setConfigAlphaBits(8);
    mEGLWindow->setConfigDepthBits(24);
    mEGLWindow->setConfigStencilBits(8);

    // Disable vsync
    mEGLWindow->setSwapInterval(0);
}

AppWindow::~AppWindow()
{
}

bool AppWindow::initialize()
{
    return true;
}

void AppWindow::destroy()
{
}

void AppWindow::step(float dt, double totalTime)
{
}

void AppWindow::draw()
{
}

void AppWindow::swap()
{
    mEGLWindow->swap();
}

OSWindow *AppWindow::getWindow() const
{
    return mOSWindow.get();
}

EGLConfig AppWindow::getConfig() const
{
    return mEGLWindow->getConfig();
}

EGLDisplay AppWindow::getDisplay() const
{
    return mEGLWindow->getDisplay();
}

EGLSurface AppWindow::getSurface() const
{
    return mEGLWindow->getSurface();
}

EGLContext AppWindow::getContext() const
{
    return mEGLWindow->getContext();
}

int AppWindow::start()
{
    if (!mOSWindow->initialize(mName, size[0], size[1]))
    {
        return -1;
    }

    mOSWindow->setVisible(true);

    if (!mEGLWindow->initializeGL(mOSWindow.get()))
    {
        return -1;
    }

    mRunning = true;
    int result = 0;

    if (!initialize())
    {
        mRunning = false;
        result = -1;
    }

    mTimer->start();
#if 0
    double prevTime = 0.0;

        double elapsedTime = mTimer->getElapsedTime();
        double deltaTime = elapsedTime - prevTime;

        step(static_cast<float>(deltaTime), elapsedTime);

        // Clear events that the application did not process from this frame
        Event event;
        while (popEvent(&event))
        {
            // If the application did not catch a close event, close now
            if (event.Type == Event::EVENT_CLOSED)
            {
                exit();
            }
        }

        if (!mRunning)
        {
            break;
        }

        draw();
        swap();

        mOSWindow->messageLoop();

        prevTime = elapsedTime;
    }

    //destroy();
    //mEGLWindow->destroyGL();
    //mOSWindow->destroy();
#endif
    return 0;
}

void AppWindow::exit()
{
    mRunning = false;
}

bool AppWindow::popEvent(Event *event)
{
    return mOSWindow->popEvent(event);
}
