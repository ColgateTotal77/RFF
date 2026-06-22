# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# react-native-reanimated
-keep class com.swmansion.reanimated.** { *; }
-keep class com.facebook.react.turbomodule.** { *; }

# BookBridge: methods annotated @JavascriptInterface are called by name from the WebView JS side
-keep class com.reader.bookengine.BookBridge { *; }

# JNI: C functions are resolved by mangled class+method name at runtime, so these must not be renamed
-keepclasseswithmembers class com.reader.bookengine.BookEngineModule {
    native <methods>;
}
-keepclasseswithmembers class com.reader.bookengine.AnkiModule {
    native <methods>;
}

# SLF4J: the api jar references StaticLoggerBinder but the binding is not included (Ktor uses SLF4J internally)
-dontwarn org.slf4j.impl.StaticLoggerBinder
