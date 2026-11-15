"""Create a static Inter instance and optionally install/register brand fonts on macOS."""
from pathlib import Path
import sys,ctypes,shutil
ROOT=Path(__file__).resolve().parent.parent
try:
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
except ImportError:
    sys.path.insert(0,'/private/tmp/ucl-ppt-font-tools')
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
dest=ROOT/'backups/fonts';dest.mkdir(parents=True,exist_ok=True)
font=TTFont(ROOT/'assets/fonts/inter.ttf')
instance=instantiateVariableFont(font,{'wght':400,'opsz':32},inplace=False)
for nid,value in [(1,'Inter UCL'),(2,'Regular'),(4,'Inter UCL Regular'),(6,'InterUCL-Regular'),(16,'Inter UCL'),(17,'Regular')]:
    for platform,encoding,language in [(3,1,0x409),(1,0,0)]:instance['name'].setName(value,nid,platform,encoding,language)
instance.save(dest/'inter-ucl-regular.ttf')
if '--install' in sys.argv:
    if sys.platform!='darwin':raise SystemExit('On Windows, install the fonts from backups/fonts with the font installer.')
    cf=ctypes.CDLL('/System/Library/Frameworks/CoreFoundation.framework/CoreFoundation')
    ct=ctypes.CDLL('/System/Library/Frameworks/CoreText.framework/CoreText')
    cf.CFURLCreateFromFileSystemRepresentation.argtypes=[ctypes.c_void_p,ctypes.c_char_p,ctypes.c_long,ctypes.c_bool];cf.CFURLCreateFromFileSystemRepresentation.restype=ctypes.c_void_p
    ct.CTFontManagerRegisterFontsForURL.argtypes=[ctypes.c_void_p,ctypes.c_uint32,ctypes.POINTER(ctypes.c_void_p)];ct.CTFontManagerRegisterFontsForURL.restype=ctypes.c_bool
    cf.CFErrorCopyDescription.argtypes=[ctypes.c_void_p];cf.CFErrorCopyDescription.restype=ctypes.c_void_p
    cf.CFStringGetCString.argtypes=[ctypes.c_void_p,ctypes.c_char_p,ctypes.c_long,ctypes.c_uint];cf.CFStringGetCString.restype=ctypes.c_bool
    def string(ptr):
        buf=ctypes.create_string_buffer(2048);cf.CFStringGetCString(ptr,buf,2048,0x08000100);return buf.value.decode()
    home=Path.home()/'Library/Fonts';home.mkdir(parents=True,exist_ok=True)
    for filename in ['season-regular.otf','season-italic.otf','inter-ucl-regular.ttf']:
        source=dest/filename
        if not source.exists():shutil.copy2(ROOT/'assets/fonts'/filename,source)
        target=home/('ucl-'+filename);shutil.copy2(source,target)
        raw=str(target).encode();url=cf.CFURLCreateFromFileSystemRepresentation(None,raw,len(raw),False);err=ctypes.c_void_p()
        ok=ct.CTFontManagerRegisterFontsForURL(url,2,ctypes.byref(err))
        print(filename,'registered' if ok else string(cf.CFErrorCopyDescription(err)))
    ct.CTFontManagerCopyAvailablePostScriptNames.restype=ctypes.c_void_p;cf.CFArrayGetCount.argtypes=[ctypes.c_void_p];cf.CFArrayGetCount.restype=ctypes.c_long;cf.CFArrayGetValueAtIndex.argtypes=[ctypes.c_void_p,ctypes.c_long];cf.CFArrayGetValueAtIndex.restype=ctypes.c_void_p
    names=ct.CTFontManagerCopyAvailablePostScriptNames()
    for i in range(cf.CFArrayGetCount(names)):
        name=string(cf.CFArrayGetValueAtIndex(names,i))
        if 'SeasonMix' in name or 'InterUCL' in name:print('Available:',name)
