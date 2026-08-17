#include <emscripten/emscripten.h>
#include <emscripten/html5.h>
#include <emscripten/html5_webgl.h>

#include <projectM-4/audio.h>
#include <projectM-4/core.h>
#include <projectM-4/parameters.h>
#include <projectM-4/render_opengl.h>
#include <projectM-4/types.h>

extern "C" {

EMSCRIPTEN_KEEPALIVE
int webmilk_projectm_init_webgl_context(const char* canvasSelector, int width, int height)
{
    if (canvasSelector == nullptr)
    {
        return EMSCRIPTEN_RESULT_INVALID_PARAM;
    }

    EMSCRIPTEN_WEBGL_CONTEXT_HANDLE currentContext = emscripten_webgl_get_current_context();
    if (currentContext <= 0)
    {
        EmscriptenWebGLContextAttributes attributes;
        emscripten_webgl_init_context_attributes(&attributes);
        attributes.majorVersion = 2;
        attributes.minorVersion = 0;
        attributes.alpha = EM_TRUE;
        attributes.depth = EM_TRUE;
        attributes.stencil = EM_FALSE;
        attributes.antialias = EM_TRUE;
        attributes.preserveDrawingBuffer = EM_TRUE;
        attributes.enableExtensionsByDefault = EM_TRUE;

        currentContext = emscripten_webgl_create_context(canvasSelector, &attributes);
        if (currentContext <= 0)
        {
            return currentContext;
        }
    }

    const EMSCRIPTEN_RESULT makeCurrentResult = emscripten_webgl_make_context_current(currentContext);
    if (makeCurrentResult != EMSCRIPTEN_RESULT_SUCCESS)
    {
        return makeCurrentResult;
    }

    if (width > 0 && height > 0)
    {
        const EMSCRIPTEN_RESULT resizeResult = emscripten_set_canvas_element_size(canvasSelector, width, height);
        if (resizeResult != EMSCRIPTEN_RESULT_SUCCESS)
        {
            return resizeResult;
        }
    }

    return currentContext;
}

EMSCRIPTEN_KEEPALIVE
projectm_handle webmilk_projectm_create()
{
    return projectm_create();
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_destroy(projectm_handle instance)
{
    projectm_destroy(instance);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_load_preset_data(projectm_handle instance, const char* data, bool smoothTransition)
{
    projectm_load_preset_data(instance, data, smoothTransition);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_set_window_size(projectm_handle instance, size_t width, size_t height)
{
    projectm_set_window_size(instance, width, height);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_set_fps(projectm_handle instance, int32_t fps)
{
    projectm_set_fps(instance, fps);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_set_frame_time(projectm_handle instance, double secondsSinceFirstFrame)
{
    projectm_set_frame_time(instance, secondsSinceFirstFrame);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_set_preset_locked(projectm_handle instance, bool enabled)
{
    projectm_set_preset_locked(instance, enabled);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_set_preset_start_clean(projectm_handle instance, bool enabled)
{
    projectm_set_preset_start_clean(instance, enabled);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_pcm_add_float(projectm_handle instance, const float* samples, unsigned int count, projectm_channels channels)
{
    projectm_pcm_add_float(instance, samples, count, channels);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_opengl_render_frame(projectm_handle instance)
{
    projectm_opengl_render_frame(instance);
}

EMSCRIPTEN_KEEPALIVE
void webmilk_projectm_opengl_render_frame_fbo(projectm_handle instance, uint32_t framebufferObjectId)
{
    projectm_opengl_render_frame_fbo(instance, framebufferObjectId);
}

}

int main()
{
    return 0;
}
