package com.mob2is

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = AppConfigModule.NAME)
class AppConfigModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  override fun getConstants(): MutableMap<String, Any> =
      mutableMapOf(
          "mapTilerApiKey" to BuildConfig.MAPTILER_API_KEY
      )

  @ReactMethod
  fun noop() {
    // Required so the module can be kept lightweight while exposing constants.
  }

  companion object {
    const val NAME = "AppConfig"
  }
}
