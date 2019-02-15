@Echo off

set LIBDIR=%CD%\..

:: create build directory
mkdir build
cd build

cmake -G "NMake Makefiles" ..\zlib-1.2.8 ^
 -DCMAKE_INSTALL_PREFIX=%LIBDIR%\zlib\install ^
 -DCMAKE_C_FLAGS_RELEASE="/MT /O2 /Ob2 /D NDEBUG" ^
 -DCMAKE_BUILD_TYPE=Release

nmake
nmake install

cd ..

copy install\lib\zlib.lib lib\zlib.lib
copy install\lib\zlib.lib lib\libz.lib
copy install\lib\zlibstatic.lib lib\libz_st.lib
copy install\bin\zlib.dll lib\zlib.dll
copy install\include\*.h include\

