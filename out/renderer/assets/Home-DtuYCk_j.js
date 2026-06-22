import { c as commonjsGlobal, r as reactExports, a as axiosInstance, I as IP, j as jsxRuntimeExports, e, u as useSelector, U as URL$2, s as socketAppManager, b as axios, d as useNavigate, f as useDispatch, g as socket, h as setUser, i as desconnectIo, p as pushNotifications, k as deleteNotifications, l as setLocals, m as setEstablishment, n as establishment, o as createIo } from "./index-_cwg1DLC.js";
var lib = {};
var uaParser_min = { exports: {} };
(function(module, exports) {
  (function(window2, undefined$1) {
    var LIBVERSION = "1.0.35", EMPTY = "", UNKNOWN = "?", FUNC_TYPE = "function", UNDEF_TYPE = "undefined", OBJ_TYPE = "object", STR_TYPE = "string", MAJOR = "major", MODEL = "model", NAME = "name", TYPE = "type", VENDOR = "vendor", VERSION = "version", ARCHITECTURE = "architecture", CONSOLE = "console", MOBILE = "mobile", TABLET = "tablet", SMARTTV = "smarttv", WEARABLE = "wearable", EMBEDDED = "embedded", UA_MAX_LENGTH = 350;
    var AMAZON = "Amazon", APPLE = "Apple", ASUS = "ASUS", BLACKBERRY = "BlackBerry", BROWSER = "Browser", CHROME = "Chrome", EDGE = "Edge", FIREFOX = "Firefox", GOOGLE = "Google", HUAWEI = "Huawei", LG = "LG", MICROSOFT = "Microsoft", MOTOROLA = "Motorola", OPERA = "Opera", SAMSUNG = "Samsung", SHARP = "Sharp", SONY = "Sony", XIAOMI = "Xiaomi", ZEBRA = "Zebra", FACEBOOK = "Facebook", CHROMIUM_OS = "Chromium OS", MAC_OS = "Mac OS";
    var extend2 = function(regexes2, extensions) {
      var mergedRegexes = {};
      for (var i2 in regexes2) {
        if (extensions[i2] && extensions[i2].length % 2 === 0) {
          mergedRegexes[i2] = extensions[i2].concat(regexes2[i2]);
        } else {
          mergedRegexes[i2] = regexes2[i2];
        }
      }
      return mergedRegexes;
    }, enumerize = function(arr) {
      var enums = {};
      for (var i2 = 0; i2 < arr.length; i2++) {
        enums[arr[i2].toUpperCase()] = arr[i2];
      }
      return enums;
    }, has = function(str1, str2) {
      return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
    }, lowerize = function(str) {
      return str.toLowerCase();
    }, majorize = function(version) {
      return typeof version === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split(".")[0] : undefined$1;
    }, trim = function(str, len) {
      if (typeof str === STR_TYPE) {
        str = str.replace(/^\s\s*/, EMPTY);
        return typeof len === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
      }
    };
    var rgxMapper = function(ua2, arrays) {
      var i2 = 0, j, k, p, q, matches, match;
      while (i2 < arrays.length && !matches) {
        var regex = arrays[i2], props = arrays[i2 + 1];
        j = k = 0;
        while (j < regex.length && !matches) {
          if (!regex[j]) {
            break;
          }
          matches = regex[j++].exec(ua2);
          if (!!matches) {
            for (p = 0; p < props.length; p++) {
              match = matches[++k];
              q = props[p];
              if (typeof q === OBJ_TYPE && q.length > 0) {
                if (q.length === 2) {
                  if (typeof q[1] == FUNC_TYPE) {
                    this[q[0]] = q[1].call(this, match);
                  } else {
                    this[q[0]] = q[1];
                  }
                } else if (q.length === 3) {
                  if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                    this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined$1;
                  } else {
                    this[q[0]] = match ? match.replace(q[1], q[2]) : undefined$1;
                  }
                } else if (q.length === 4) {
                  this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined$1;
                }
              } else {
                this[q] = match ? match : undefined$1;
              }
            }
          }
        }
        i2 += 2;
      }
    }, strMapper = function(str, map) {
      for (var i2 in map) {
        if (typeof map[i2] === OBJ_TYPE && map[i2].length > 0) {
          for (var j = 0; j < map[i2].length; j++) {
            if (has(map[i2][j], str)) {
              return i2 === UNKNOWN ? undefined$1 : i2;
            }
          }
        } else if (has(map[i2], str)) {
          return i2 === UNKNOWN ? undefined$1 : i2;
        }
      }
      return str;
    };
    var oldSafariMap = { "1.0": "/8", 1.2: "/1", 1.3: "/3", "2.0": "/412", "2.0.2": "/416", "2.0.3": "/417", "2.0.4": "/419", "?": "/" }, windowsVersionMap = { ME: "4.90", "NT 3.11": "NT3.51", "NT 4.0": "NT4.0", 2e3: "NT 5.0", XP: ["NT 5.1", "NT 5.2"], Vista: "NT 6.0", 7: "NT 6.1", 8: "NT 6.2", 8.1: "NT 6.3", 10: ["NT 6.4", "NT 10.0"], RT: "ARM" };
    var regexes = { browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i], [VERSION, [NAME, "Chrome"]], [/edg(?:e|ios|a)?\/([\w\.]+)/i], [VERSION, [NAME, "Edge"]], [/(opera mini)\/([-\w\.]+)/i, /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i], [NAME, VERSION], [/opios[\/ ]+([\w\.]+)/i], [VERSION, [NAME, OPERA + " Mini"]], [/\bopr\/([\w\.]+)/i], [VERSION, [NAME, OPERA]], [/(kindle)\/([\w\.]+)/i, /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, /(ba?idubrowser)[\/ ]?([\w\.]+)/i, /(?:ms|\()(ie) ([\w\.]+)/i, /(flock|rockmelt|midori|epiphany|silk|skyfire|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale(?!.+naver)|qqbrowserlite|qq|duckduckgo)\/([-\w\.]+)/i, /(heytap|ovi)browser\/([\d\.]+)/i, /(weibo)__([\d\.]+)/i], [NAME, VERSION], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i], [VERSION, [NAME, "UC" + BROWSER]], [/microm.+\bqbcore\/([\w\.]+)/i, /\bqbcore\/([\w\.]+).+microm/i], [VERSION, [NAME, "WeChat(Win) Desktop"]], [/micromessenger\/([\w\.]+)/i], [VERSION, [NAME, "WeChat"]], [/konqueror\/([\w\.]+)/i], [VERSION, [NAME, "Konqueror"]], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i], [VERSION, [NAME, "IE"]], [/ya(?:search)?browser\/([\w\.]+)/i], [VERSION, [NAME, "Yandex"]], [/(avast|avg)\/([\w\.]+)/i], [[NAME, /(.+)/, "$1 Secure " + BROWSER], VERSION], [/\bfocus\/([\w\.]+)/i], [VERSION, [NAME, FIREFOX + " Focus"]], [/\bopt\/([\w\.]+)/i], [VERSION, [NAME, OPERA + " Touch"]], [/coc_coc\w+\/([\w\.]+)/i], [VERSION, [NAME, "Coc Coc"]], [/dolfin\/([\w\.]+)/i], [VERSION, [NAME, "Dolphin"]], [/coast\/([\w\.]+)/i], [VERSION, [NAME, OPERA + " Coast"]], [/miuibrowser\/([\w\.]+)/i], [VERSION, [NAME, "MIUI " + BROWSER]], [/fxios\/([-\w\.]+)/i], [VERSION, [NAME, FIREFOX]], [/\bqihu|(qi?ho?o?|360)browser/i], [[NAME, "360 " + BROWSER]], [/(oculus|samsung|sailfish|huawei)browser\/([\w\.]+)/i], [[NAME, /(.+)/, "$1 " + BROWSER], VERSION], [/(comodo_dragon)\/([\w\.]+)/i], [[NAME, /_/g, " "], VERSION], [/(electron)\/([\w\.]+) safari/i, /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i], [NAME, VERSION], [/(metasr)[\/ ]?([\w\.]+)/i, /(lbbrowser)/i, /\[(linkedin)app\]/i], [NAME], [/((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i], [[NAME, FACEBOOK], VERSION], [/(kakao(?:talk|story))[\/ ]([\w\.]+)/i, /(naver)\(.*?(\d+\.[\w\.]+).*\)/i, /safari (line)\/([\w\.]+)/i, /\b(line)\/([\w\.]+)\/iab/i, /(chromium|instagram)[\/ ]([-\w\.]+)/i], [NAME, VERSION], [/\bgsa\/([\w\.]+) .*safari\//i], [VERSION, [NAME, "GSA"]], [/musical_ly(?:.+app_?version\/|_)([\w\.]+)/i], [VERSION, [NAME, "TikTok"]], [/headlesschrome(?:\/([\w\.]+)| )/i], [VERSION, [NAME, CHROME + " Headless"]], [/ wv\).+(chrome)\/([\w\.]+)/i], [[NAME, CHROME + " WebView"], VERSION], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i], [VERSION, [NAME, "Android " + BROWSER]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i], [NAME, VERSION], [/version\/([\w\.\,]+) .*mobile\/\w+ (safari)/i], [VERSION, [NAME, "Mobile Safari"]], [/version\/([\w(\.|\,)]+) .*(mobile ?safari|safari)/i], [VERSION, NAME], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i], [NAME, [VERSION, strMapper, oldSafariMap]], [/(webkit|khtml)\/([\w\.]+)/i], [NAME, VERSION], [/(navigator|netscape\d?)\/([-\w\.]+)/i], [[NAME, "Netscape"], VERSION], [/mobile vr; rv:([\w\.]+)\).+firefox/i], [VERSION, [NAME, FIREFOX + " Reality"]], [/ekiohf.+(flow)\/([\w\.]+)/i, /(swiftfox)/i, /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, /(firefox)\/([\w\.]+)/i, /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, /(links) \(([\w\.]+)/i, /panasonic;(viera)/i], [NAME, VERSION], [/(cobalt)\/([\w\.]+)/i], [NAME, [VERSION, /master.|lts./, ""]]], cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i], [[ARCHITECTURE, "amd64"]], [/(ia32(?=;))/i], [[ARCHITECTURE, lowerize]], [/((?:i[346]|x)86)[;\)]/i], [[ARCHITECTURE, "ia32"]], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i], [[ARCHITECTURE, "arm64"]], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i], [[ARCHITECTURE, "armhf"]], [/windows (ce|mobile); ppc;/i], [[ARCHITECTURE, "arm"]], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i], [[ARCHITECTURE, /ower/, EMPTY, lowerize]], [/(sun4\w)[;\)]/i], [[ARCHITECTURE, "sparc"]], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i], [[ARCHITECTURE, lowerize]]], device: [[/\b(sch-i[89]0\d|shw-m380s|sm-[ptx]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]], [/\b((?:s[cgp]h|gt|sm)-\w+|sc[g-]?[\d]+a?|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]], [/(?:\/|\()(ip(?:hone|od)[\w, ]*)(?:\/|;)/i], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [/\((ipad);[-\w\),; ]+apple/i, /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [/(macintosh);/i], [MODEL, [VENDOR, APPLE]], [/\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [MODEL, [VENDOR, SHARP], [TYPE, MOBILE]], [/\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}e?-[atu]?[ln][\dx][012359c][adn]?)\b(?!.+d\/s)/i], [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]], [/\b(poco[\w ]+)(?: bui|\))/i, /\b; (\w+) build\/hm\1/i, /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max|cc)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i], [[MODEL, /_/g, " "], [VENDOR, XIAOMI], [TYPE, MOBILE]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i], [[MODEL, /_/g, " "], [VENDOR, XIAOMI], [TYPE, TABLET]], [/; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007|a101op)\b/i], [MODEL, [VENDOR, "OPPO"], [TYPE, MOBILE]], [/vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [MODEL, [VENDOR, "Vivo"], [TYPE, MOBILE]], [/\b(rmx[12]\d{3})(?: bui|;|\))/i], [MODEL, [VENDOR, "Realme"], [TYPE, MOBILE]], [/\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]], [/((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [MODEL, [VENDOR, LG], [TYPE, TABLET]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [MODEL, [VENDOR, LG], [TYPE, MOBILE]], [/(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [MODEL, [VENDOR, "Lenovo"], [TYPE, TABLET]], [/(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[MODEL, /_/g, " "], [VENDOR, "Nokia"], [TYPE, MOBILE]], [/(pixel c)\b/i], [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i], [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]], [/droid.+ (a?\d[0-2]{2}so|[c-g]\d{4}|so[-gl]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [MODEL, [VENDOR, SONY], [TYPE, MOBILE]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[MODEL, "Xperia Tablet"], [VENDOR, SONY], [TYPE, TABLET]], [/ (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [MODEL, [VENDOR, "OnePlus"], [TYPE, MOBILE]], [/(alexa)webm/i, /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i, /(kf[a-z]+)( bui|\)).+silk\//i], [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i], [[MODEL, /(.+)/g, "Fire Phone $1"], [VENDOR, AMAZON], [TYPE, MOBILE]], [/(playbook);[-\w\),; ]+(rim)/i], [MODEL, VENDOR, [TYPE, TABLET]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i], [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]], [/(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [MODEL, [VENDOR, ASUS], [TYPE, TABLET]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]], [/(nexus 9)/i], [MODEL, [VENDOR, "HTC"], [TYPE, TABLET]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic(?!(?:;|\.))|sony(?!-bra))[-_ ]?([-\w]*)/i], [VENDOR, [MODEL, /_/g, " "], [TYPE, MOBILE]], [/droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [MODEL, [VENDOR, "Acer"], [TYPE, TABLET]], [/droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [MODEL, [VENDOR, "Meizu"], [TYPE, MOBILE]], [/(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, /(hp) ([\w ]+\w)/i, /(asus)-?(\w+)/i, /(microsoft); (lumia[\w ]+)/i, /(lenovo)[-_ ]?([-\w]+)/i, /(jolla)/i, /(oppo) ?([\w ]+) bui/i], [VENDOR, MODEL, [TYPE, MOBILE]], [/(kobo)\s(ereader|touch)/i, /(archos) (gamepad2?)/i, /(hp).+(touchpad(?!.+tablet)|tablet)/i, /(kindle)\/([\w\.]+)/i, /(nook)[\w ]+build\/(\w+)/i, /(dell) (strea[kpr\d ]*[\dko])/i, /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, /(trinity)[- ]*(t\d{3}) bui/i, /(gigaset)[- ]+(q\w{1,9}) bui/i, /(vodafone) ([\w ]+)(?:\)| bui)/i], [VENDOR, MODEL, [TYPE, TABLET]], [/(surface duo)/i], [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i], [MODEL, [VENDOR, "Fairphone"], [TYPE, MOBILE]], [/(u304aa)/i], [MODEL, [VENDOR, "AT&T"], [TYPE, MOBILE]], [/\bsie-(\w*)/i], [MODEL, [VENDOR, "Siemens"], [TYPE, MOBILE]], [/\b(rct\w+) b/i], [MODEL, [VENDOR, "RCA"], [TYPE, TABLET]], [/\b(venue[\d ]{2,7}) b/i], [MODEL, [VENDOR, "Dell"], [TYPE, TABLET]], [/\b(q(?:mv|ta)\w+) b/i], [MODEL, [VENDOR, "Verizon"], [TYPE, TABLET]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i], [MODEL, [VENDOR, "Barnes & Noble"], [TYPE, TABLET]], [/\b(tm\d{3}\w+) b/i], [MODEL, [VENDOR, "NuVision"], [TYPE, TABLET]], [/\b(k88) b/i], [MODEL, [VENDOR, "ZTE"], [TYPE, TABLET]], [/\b(nx\d{3}j) b/i], [MODEL, [VENDOR, "ZTE"], [TYPE, MOBILE]], [/\b(gen\d{3}) b.+49h/i], [MODEL, [VENDOR, "Swiss"], [TYPE, MOBILE]], [/\b(zur\d{3}) b/i], [MODEL, [VENDOR, "Swiss"], [TYPE, TABLET]], [/\b((zeki)?tb.*\b) b/i], [MODEL, [VENDOR, "Zeki"], [TYPE, TABLET]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i], [[VENDOR, "Dragon Touch"], MODEL, [TYPE, TABLET]], [/\b(ns-?\w{0,9}) b/i], [MODEL, [VENDOR, "Insignia"], [TYPE, TABLET]], [/\b((nxa|next)-?\w{0,9}) b/i], [MODEL, [VENDOR, "NextBook"], [TYPE, TABLET]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i], [[VENDOR, "Voice"], MODEL, [TYPE, MOBILE]], [/\b(lvtel\-)?(v1[12]) b/i], [[VENDOR, "LvTel"], MODEL, [TYPE, MOBILE]], [/\b(ph-1) /i], [MODEL, [VENDOR, "Essential"], [TYPE, MOBILE]], [/\b(v(100md|700na|7011|917g).*\b) b/i], [MODEL, [VENDOR, "Envizen"], [TYPE, TABLET]], [/\b(trio[-\w\. ]+) b/i], [MODEL, [VENDOR, "MachSpeed"], [TYPE, TABLET]], [/\btu_(1491) b/i], [MODEL, [VENDOR, "Rotor"], [TYPE, TABLET]], [/(shield[\w ]+) b/i], [MODEL, [VENDOR, "Nvidia"], [TYPE, TABLET]], [/(sprint) (\w+)/i], [VENDOR, MODEL, [TYPE, MOBILE]], [/(kin\.[onetw]{3})/i], [[MODEL, /\./g, " "], [VENDOR, MICROSOFT], [TYPE, MOBILE]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]], [/smart-tv.+(samsung)/i], [VENDOR, [TYPE, SMARTTV]], [/hbbtv.+maple;(\d+)/i], [[MODEL, /^/, "SmartTV"], [VENDOR, SAMSUNG], [TYPE, SMARTTV]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i], [[VENDOR, LG], [TYPE, SMARTTV]], [/(apple) ?tv/i], [VENDOR, [MODEL, APPLE + " TV"], [TYPE, SMARTTV]], [/crkey/i], [[MODEL, CHROME + "cast"], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [/droid.+aft(\w)( bui|\))/i], [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]], [/\(dtv[\);].+(aquos)/i, /(aquos-tv[\w ]+)\)/i], [MODEL, [VENDOR, SHARP], [TYPE, SMARTTV]], [/(bravia[\w ]+)( bui|\))/i], [MODEL, [VENDOR, SONY], [TYPE, SMARTTV]], [/(mitv-\w{5}) bui/i], [MODEL, [VENDOR, XIAOMI], [TYPE, SMARTTV]], [/Hbbtv.*(technisat) (.*);/i], [VENDOR, MODEL, [TYPE, SMARTTV]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, /hbbtv\/\d+\.\d+\.\d+ +\([\w\+ ]*; *([\w\d][^;]*);([^;]*)/i], [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i], [[TYPE, SMARTTV]], [/(ouya)/i, /(nintendo) ([wids3utch]+)/i], [VENDOR, MODEL, [TYPE, CONSOLE]], [/droid.+; (shield) bui/i], [MODEL, [VENDOR, "Nvidia"], [TYPE, CONSOLE]], [/(playstation [345portablevi]+)/i], [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i], [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]], [/((pebble))app/i], [VENDOR, MODEL, [TYPE, WEARABLE]], [/(watch)(?: ?os[,\/]|\d,\d\/)[\d\.]+/i], [MODEL, [VENDOR, APPLE], [TYPE, WEARABLE]], [/droid.+; (glass) \d/i], [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]], [/droid.+; (wt63?0{2,3})\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]], [/(quest( 2| pro)?)/i], [MODEL, [VENDOR, FACEBOOK], [TYPE, WEARABLE]], [/(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i], [VENDOR, [TYPE, EMBEDDED]], [/(aeobc)\b/i], [MODEL, [VENDOR, AMAZON], [TYPE, EMBEDDED]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i], [MODEL, [TYPE, MOBILE]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i], [MODEL, [TYPE, TABLET]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i], [[TYPE, TABLET]], [/(phone|mobile(?:[;\/]| [ \w\/\.]*safari)|pda(?=.+windows ce))/i], [[TYPE, MOBILE]], [/(android[-\w\. ]{0,9});.+buil/i], [MODEL, [VENDOR, "Generic"]]], engine: [[/windows.+ edge\/([\w\.]+)/i], [VERSION, [NAME, EDGE + "HTML"]], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i], [VERSION, [NAME, "Blink"]], [/(presto)\/([\w\.]+)/i, /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, /ekioh(flow)\/([\w\.]+)/i, /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, /(icab)[\/ ]([23]\.[\d\.]+)/i, /\b(libweb)/i], [NAME, VERSION], [/rv\:([\w\.]{1,9})\b.+(gecko)/i], [VERSION, NAME]], os: [[/microsoft (windows) (vista|xp)/i], [NAME, VERSION], [/(windows) nt 6\.2; (arm)/i, /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [NAME, [VERSION, strMapper, windowsVersionMap]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[NAME, "Windows"], [VERSION, strMapper, windowsVersionMap]], [/ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, /ios;fbsv\/([\d\.]+)/i, /cfnetwork\/.+darwin/i], [[VERSION, /_/g, "."], [NAME, "iOS"]], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i], [[NAME, MAC_OS], [VERSION, /_/g, "."]], [/droid ([\w\.]+)\b.+(android[- ]x86|harmonyos)/i], [VERSION, NAME], [/(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, /(tizen|kaios)[\/ ]([\w\.]+)/i, /\((series40);/i], [NAME, VERSION], [/\(bb(10);/i], [VERSION, [NAME, BLACKBERRY]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i], [VERSION, [NAME, "Symbian"]], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i], [VERSION, [NAME, FIREFOX + " OS"]], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i], [VERSION, [NAME, "webOS"]], [/watch(?: ?os[,\/]|\d,\d\/)([\d\.]+)/i], [VERSION, [NAME, "watchOS"]], [/crkey\/([\d\.]+)/i], [VERSION, [NAME, CHROME + "cast"]], [/(cros) [\w]+(?:\)| ([\w\.]+)\b)/i], [[NAME, CHROMIUM_OS], VERSION], [/panasonic;(viera)/i, /(netrange)mmh/i, /(nettv)\/(\d+\.[\w\.]+)/i, /(nintendo|playstation) ([wids345portablevuch]+)/i, /(xbox); +xbox ([^\);]+)/i, /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, /(mint)[\/\(\) ]?(\w*)/i, /(mageia|vectorlinux)[; ]/i, /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, /(hurd|linux) ?([\w\.]*)/i, /(gnu) ?([\w\.]*)/i, /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, /(haiku) (\w+)/i], [NAME, VERSION], [/(sunos) ?([\w\.\d]*)/i], [[NAME, "Solaris"], VERSION], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux|serenityos)/i, /(unix) ?([\w\.]*)/i], [NAME, VERSION]] };
    var UAParser2 = function(ua2, extensions) {
      if (typeof ua2 === OBJ_TYPE) {
        extensions = ua2;
        ua2 = undefined$1;
      }
      if (!(this instanceof UAParser2)) {
        return new UAParser2(ua2, extensions).getResult();
      }
      var _navigator = typeof window2 !== UNDEF_TYPE && window2.navigator ? window2.navigator : undefined$1;
      var _ua = ua2 || (_navigator && _navigator.userAgent ? _navigator.userAgent : EMPTY);
      var _uach = _navigator && _navigator.userAgentData ? _navigator.userAgentData : undefined$1;
      var _rgxmap = extensions ? extend2(regexes, extensions) : regexes;
      var _isSelfNav = _navigator && _navigator.userAgent == _ua;
      this.getBrowser = function() {
        var _browser = {};
        _browser[NAME] = undefined$1;
        _browser[VERSION] = undefined$1;
        rgxMapper.call(_browser, _ua, _rgxmap.browser);
        _browser[MAJOR] = majorize(_browser[VERSION]);
        if (_isSelfNav && _navigator && _navigator.brave && typeof _navigator.brave.isBrave == FUNC_TYPE) {
          _browser[NAME] = "Brave";
        }
        return _browser;
      };
      this.getCPU = function() {
        var _cpu = {};
        _cpu[ARCHITECTURE] = undefined$1;
        rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
        return _cpu;
      };
      this.getDevice = function() {
        var _device = {};
        _device[VENDOR] = undefined$1;
        _device[MODEL] = undefined$1;
        _device[TYPE] = undefined$1;
        rgxMapper.call(_device, _ua, _rgxmap.device);
        if (_isSelfNav && !_device[TYPE] && _uach && _uach.mobile) {
          _device[TYPE] = MOBILE;
        }
        if (_isSelfNav && _device[MODEL] == "Macintosh" && _navigator && typeof _navigator.standalone !== UNDEF_TYPE && _navigator.maxTouchPoints && _navigator.maxTouchPoints > 2) {
          _device[MODEL] = "iPad";
          _device[TYPE] = TABLET;
        }
        return _device;
      };
      this.getEngine = function() {
        var _engine = {};
        _engine[NAME] = undefined$1;
        _engine[VERSION] = undefined$1;
        rgxMapper.call(_engine, _ua, _rgxmap.engine);
        return _engine;
      };
      this.getOS = function() {
        var _os = {};
        _os[NAME] = undefined$1;
        _os[VERSION] = undefined$1;
        rgxMapper.call(_os, _ua, _rgxmap.os);
        if (_isSelfNav && !_os[NAME] && _uach && _uach.platform != "Unknown") {
          _os[NAME] = _uach.platform.replace(/chrome os/i, CHROMIUM_OS).replace(/macos/i, MAC_OS);
        }
        return _os;
      };
      this.getResult = function() {
        return { ua: this.getUA(), browser: this.getBrowser(), engine: this.getEngine(), os: this.getOS(), device: this.getDevice(), cpu: this.getCPU() };
      };
      this.getUA = function() {
        return _ua;
      };
      this.setUA = function(ua3) {
        _ua = typeof ua3 === STR_TYPE && ua3.length > UA_MAX_LENGTH ? trim(ua3, UA_MAX_LENGTH) : ua3;
        return this;
      };
      this.setUA(_ua);
      return this;
    };
    UAParser2.VERSION = LIBVERSION;
    UAParser2.BROWSER = enumerize([NAME, VERSION, MAJOR]);
    UAParser2.CPU = enumerize([ARCHITECTURE]);
    UAParser2.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
    UAParser2.ENGINE = UAParser2.OS = enumerize([NAME, VERSION]);
    {
      if (module.exports) {
        exports = module.exports = UAParser2;
      }
      exports.UAParser = UAParser2;
    }
    var $ = typeof window2 !== UNDEF_TYPE && (window2.jQuery || window2.Zepto);
    if ($ && !$.ua) {
      var parser = new UAParser2();
      $.ua = parser.getResult();
      $.ua.get = function() {
        return parser.getUA();
      };
      $.ua.set = function(ua2) {
        parser.setUA(ua2);
        var result = parser.getResult();
        for (var prop in result) {
          $.ua[prop] = result[prop];
        }
      };
    }
  })(typeof window === "object" ? window : commonjsGlobal);
})(uaParser_min, uaParser_min.exports);
var uaParser_minExports = uaParser_min.exports;
Object.defineProperty(lib, "__esModule", { value: true });
function _interopDefault$1(ex) {
  return ex && typeof ex === "object" && "default" in ex ? ex["default"] : ex;
}
var React = reactExports;
var React__default = _interopDefault$1(React);
var UAParser = uaParser_minExports;
var ClientUAInstance = new UAParser();
var browser = ClientUAInstance.getBrowser();
var cpu = ClientUAInstance.getCPU();
var device = ClientUAInstance.getDevice();
var engine = ClientUAInstance.getEngine();
var os = ClientUAInstance.getOS();
var ua = ClientUAInstance.getUA();
var setUa = function setUa2(userAgentString) {
  return ClientUAInstance.setUA(userAgentString);
};
var parseUserAgent = function parseUserAgent2(userAgent) {
  if (!userAgent) {
    console.error("No userAgent string was provided");
    return;
  }
  var UserAgentInstance = new UAParser(userAgent);
  return {
    UA: UserAgentInstance,
    browser: UserAgentInstance.getBrowser(),
    cpu: UserAgentInstance.getCPU(),
    device: UserAgentInstance.getDevice(),
    engine: UserAgentInstance.getEngine(),
    os: UserAgentInstance.getOS(),
    ua: UserAgentInstance.getUA(),
    setUserAgent: function setUserAgent3(userAgentString) {
      return UserAgentInstance.setUA(userAgentString);
    }
  };
};
var UAHelper = /* @__PURE__ */ Object.freeze({
  ClientUAInstance,
  browser,
  cpu,
  device,
  engine,
  os,
  ua,
  setUa,
  parseUserAgent
});
function ownKeys$2(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) {
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2$2(target) {
  for (var i2 = 1; i2 < arguments.length; i2++) {
    var source = arguments[i2] != null ? arguments[i2] : {};
    if (i2 % 2) {
      ownKeys$2(Object(source), true).forEach(function(key) {
        _defineProperty$2(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys$2(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function _typeof$1(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof$1 = function(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof$1 = function(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof$1(obj);
}
function _classCallCheck$2(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties$2(target, props) {
  for (var i2 = 0; i2 < props.length; i2++) {
    var descriptor = props[i2];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass$2(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties$2(Constructor.prototype, protoProps);
  return Constructor;
}
function _defineProperty$2(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _extends$1() {
  _extends$1 = Object.assign || function(target) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var source = arguments[i2];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends$1.apply(this, arguments);
}
function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}
function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf2(o2) {
    return o2.__proto__ || Object.getPrototypeOf(o2);
  };
  return _getPrototypeOf(o);
}
function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf2(o2, p2) {
    o2.__proto__ = p2;
    return o2;
  };
  return _setPrototypeOf(o, p);
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  var sourceKeys = Object.keys(source);
  var key, i2;
  for (i2 = 0; i2 < sourceKeys.length; i2++) {
    key = sourceKeys[i2];
    if (excluded.indexOf(key) >= 0) continue;
    target[key] = source[key];
  }
  return target;
}
function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i2;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i2 = 0; i2 < sourceSymbolKeys.length; i2++) {
      key = sourceSymbolKeys[i2];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}
function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError("Derived constructors may only return object or undefined");
  }
  return _assertThisInitialized(self);
}
function _slicedToArray(arr, i2) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i2) || _unsupportedIterableToArray$1(arr, i2) || _nonIterableRest();
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
function _iterableToArrayLimit(arr, i2) {
  var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i2 && _arr.length === i2) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}
function _unsupportedIterableToArray$1(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray$1(o, minLen);
  var n2 = Object.prototype.toString.call(o).slice(8, -1);
  if (n2 === "Object" && o.constructor) n2 = o.constructor.name;
  if (n2 === "Map" || n2 === "Set") return Array.from(o);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return _arrayLikeToArray$1(o, minLen);
}
function _arrayLikeToArray$1(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i2 = 0, arr2 = new Array(len); i2 < len; i2++) arr2[i2] = arr[i2];
  return arr2;
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
var DeviceTypes = {
  Mobile: "mobile",
  Tablet: "tablet",
  SmartTv: "smarttv",
  Console: "console",
  Wearable: "wearable",
  Embedded: "embedded",
  Browser: void 0
};
var BrowserTypes = {
  Chrome: "Chrome",
  Firefox: "Firefox",
  Opera: "Opera",
  Yandex: "Yandex",
  Safari: "Safari",
  InternetExplorer: "Internet Explorer",
  Edge: "Edge",
  Chromium: "Chromium",
  Ie: "IE",
  MobileSafari: "Mobile Safari",
  EdgeChromium: "Edge Chromium",
  MIUI: "MIUI Browser",
  SamsungBrowser: "Samsung Browser"
};
var OsTypes = {
  IOS: "iOS",
  Android: "Android",
  WindowsPhone: "Windows Phone",
  Windows: "Windows",
  MAC_OS: "Mac OS"
};
var InitialDeviceTypes = {
  isMobile: false,
  isTablet: false,
  isBrowser: false,
  isSmartTV: false,
  isConsole: false,
  isWearable: false
};
var checkDeviceType = function checkDeviceType2(type) {
  switch (type) {
    case DeviceTypes.Mobile:
      return {
        isMobile: true
      };
    case DeviceTypes.Tablet:
      return {
        isTablet: true
      };
    case DeviceTypes.SmartTv:
      return {
        isSmartTV: true
      };
    case DeviceTypes.Console:
      return {
        isConsole: true
      };
    case DeviceTypes.Wearable:
      return {
        isWearable: true
      };
    case DeviceTypes.Browser:
      return {
        isBrowser: true
      };
    case DeviceTypes.Embedded:
      return {
        isEmbedded: true
      };
    default:
      return InitialDeviceTypes;
  }
};
var setUserAgent = function setUserAgent2(userAgent) {
  return setUa(userAgent);
};
var setDefaults = function setDefaults2(p) {
  var d = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "none";
  return p ? p : d;
};
var getNavigatorInstance = function getNavigatorInstance2() {
  if (typeof window !== "undefined") {
    if (window.navigator || navigator) {
      return window.navigator || navigator;
    }
  }
  return false;
};
var isIOS13Check = function isIOS13Check2(type) {
  var nav = getNavigatorInstance();
  return nav && nav.platform && (nav.platform.indexOf(type) !== -1 || nav.platform === "MacIntel" && nav.maxTouchPoints > 1 && !window.MSStream);
};
var browserPayload = function browserPayload2(isBrowser2, browser2, engine2, os2, ua2) {
  return {
    isBrowser: isBrowser2,
    browserMajorVersion: setDefaults(browser2.major),
    browserFullVersion: setDefaults(browser2.version),
    browserName: setDefaults(browser2.name),
    engineName: setDefaults(engine2.name),
    engineVersion: setDefaults(engine2.version),
    osName: setDefaults(os2.name),
    osVersion: setDefaults(os2.version),
    userAgent: setDefaults(ua2)
  };
};
var mobilePayload = function mobilePayload2(type, device2, os2, ua2) {
  return _objectSpread2$2({}, type, {
    vendor: setDefaults(device2.vendor),
    model: setDefaults(device2.model),
    os: setDefaults(os2.name),
    osVersion: setDefaults(os2.version),
    ua: setDefaults(ua2)
  });
};
var smartTvPayload = function smartTvPayload2(isSmartTV2, engine2, os2, ua2) {
  return {
    isSmartTV: isSmartTV2,
    engineName: setDefaults(engine2.name),
    engineVersion: setDefaults(engine2.version),
    osName: setDefaults(os2.name),
    osVersion: setDefaults(os2.version),
    userAgent: setDefaults(ua2)
  };
};
var consolePayload = function consolePayload2(isConsole2, engine2, os2, ua2) {
  return {
    isConsole: isConsole2,
    engineName: setDefaults(engine2.name),
    engineVersion: setDefaults(engine2.version),
    osName: setDefaults(os2.name),
    osVersion: setDefaults(os2.version),
    userAgent: setDefaults(ua2)
  };
};
var wearablePayload = function wearablePayload2(isWearable2, engine2, os2, ua2) {
  return {
    isWearable: isWearable2,
    engineName: setDefaults(engine2.name),
    engineVersion: setDefaults(engine2.version),
    osName: setDefaults(os2.name),
    osVersion: setDefaults(os2.version),
    userAgent: setDefaults(ua2)
  };
};
var embeddedPayload = function embeddedPayload2(isEmbedded2, device2, engine2, os2, ua2) {
  return {
    isEmbedded: isEmbedded2,
    vendor: setDefaults(device2.vendor),
    model: setDefaults(device2.model),
    engineName: setDefaults(engine2.name),
    engineVersion: setDefaults(engine2.version),
    osName: setDefaults(os2.name),
    osVersion: setDefaults(os2.version),
    userAgent: setDefaults(ua2)
  };
};
function deviceDetect(userAgent) {
  var _ref = userAgent ? parseUserAgent(userAgent) : UAHelper, device2 = _ref.device, browser2 = _ref.browser, engine2 = _ref.engine, os2 = _ref.os, ua2 = _ref.ua;
  var type = checkDeviceType(device2.type);
  var isBrowser2 = type.isBrowser, isMobile2 = type.isMobile, isTablet2 = type.isTablet, isSmartTV2 = type.isSmartTV, isConsole2 = type.isConsole, isWearable2 = type.isWearable, isEmbedded2 = type.isEmbedded;
  if (isBrowser2) {
    return browserPayload(isBrowser2, browser2, engine2, os2, ua2);
  }
  if (isSmartTV2) {
    return smartTvPayload(isSmartTV2, engine2, os2, ua2);
  }
  if (isConsole2) {
    return consolePayload(isConsole2, engine2, os2, ua2);
  }
  if (isMobile2) {
    return mobilePayload(type, device2, os2, ua2);
  }
  if (isTablet2) {
    return mobilePayload(type, device2, os2, ua2);
  }
  if (isWearable2) {
    return wearablePayload(isWearable2, engine2, os2, ua2);
  }
  if (isEmbedded2) {
    return embeddedPayload(isEmbedded2, device2, engine2, os2, ua2);
  }
}
var isMobileType = function isMobileType2(_ref) {
  var type = _ref.type;
  return type === DeviceTypes.Mobile;
};
var isTabletType = function isTabletType2(_ref2) {
  var type = _ref2.type;
  return type === DeviceTypes.Tablet;
};
var isMobileAndTabletType = function isMobileAndTabletType2(_ref3) {
  var type = _ref3.type;
  return type === DeviceTypes.Mobile || type === DeviceTypes.Tablet;
};
var isSmartTVType = function isSmartTVType2(_ref4) {
  var type = _ref4.type;
  return type === DeviceTypes.SmartTv;
};
var isBrowserType = function isBrowserType2(_ref5) {
  var type = _ref5.type;
  return type === DeviceTypes.Browser;
};
var isWearableType = function isWearableType2(_ref6) {
  var type = _ref6.type;
  return type === DeviceTypes.Wearable;
};
var isConsoleType = function isConsoleType2(_ref7) {
  var type = _ref7.type;
  return type === DeviceTypes.Console;
};
var isEmbeddedType = function isEmbeddedType2(_ref8) {
  var type = _ref8.type;
  return type === DeviceTypes.Embedded;
};
var getMobileVendor = function getMobileVendor2(_ref9) {
  var vendor = _ref9.vendor;
  return setDefaults(vendor);
};
var getMobileModel = function getMobileModel2(_ref10) {
  var model = _ref10.model;
  return setDefaults(model);
};
var getDeviceType = function getDeviceType2(_ref11) {
  var type = _ref11.type;
  return setDefaults(type, "browser");
};
var isAndroidType = function isAndroidType2(_ref12) {
  var name = _ref12.name;
  return name === OsTypes.Android;
};
var isWindowsType = function isWindowsType2(_ref13) {
  var name = _ref13.name;
  return name === OsTypes.Windows;
};
var isMacOsType = function isMacOsType2(_ref14) {
  var name = _ref14.name;
  return name === OsTypes.MAC_OS;
};
var isWinPhoneType = function isWinPhoneType2(_ref15) {
  var name = _ref15.name;
  return name === OsTypes.WindowsPhone;
};
var isIOSType = function isIOSType2(_ref16) {
  var name = _ref16.name;
  return name === OsTypes.IOS;
};
var getOsVersion = function getOsVersion2(_ref17) {
  var version = _ref17.version;
  return setDefaults(version);
};
var getOsName = function getOsName2(_ref18) {
  var name = _ref18.name;
  return setDefaults(name);
};
var isChromeType = function isChromeType2(_ref19) {
  var name = _ref19.name;
  return name === BrowserTypes.Chrome;
};
var isFirefoxType = function isFirefoxType2(_ref20) {
  var name = _ref20.name;
  return name === BrowserTypes.Firefox;
};
var isChromiumType = function isChromiumType2(_ref21) {
  var name = _ref21.name;
  return name === BrowserTypes.Chromium;
};
var isEdgeType = function isEdgeType2(_ref22) {
  var name = _ref22.name;
  return name === BrowserTypes.Edge;
};
var isYandexType = function isYandexType2(_ref23) {
  var name = _ref23.name;
  return name === BrowserTypes.Yandex;
};
var isSafariType = function isSafariType2(_ref24) {
  var name = _ref24.name;
  return name === BrowserTypes.Safari || name === BrowserTypes.MobileSafari;
};
var isMobileSafariType = function isMobileSafariType2(_ref25) {
  var name = _ref25.name;
  return name === BrowserTypes.MobileSafari;
};
var isOperaType = function isOperaType2(_ref26) {
  var name = _ref26.name;
  return name === BrowserTypes.Opera;
};
var isIEType = function isIEType2(_ref27) {
  var name = _ref27.name;
  return name === BrowserTypes.InternetExplorer || name === BrowserTypes.Ie;
};
var isMIUIType = function isMIUIType2(_ref28) {
  var name = _ref28.name;
  return name === BrowserTypes.MIUI;
};
var isSamsungBrowserType = function isSamsungBrowserType2(_ref29) {
  var name = _ref29.name;
  return name === BrowserTypes.SamsungBrowser;
};
var getBrowserFullVersion = function getBrowserFullVersion2(_ref30) {
  var version = _ref30.version;
  return setDefaults(version);
};
var getBrowserVersion = function getBrowserVersion2(_ref31) {
  var major = _ref31.major;
  return setDefaults(major);
};
var getBrowserName = function getBrowserName2(_ref32) {
  var name = _ref32.name;
  return setDefaults(name);
};
var getEngineName = function getEngineName2(_ref33) {
  var name = _ref33.name;
  return setDefaults(name);
};
var getEngineVersion = function getEngineVersion2(_ref34) {
  var version = _ref34.version;
  return setDefaults(version);
};
var isElectronType = function isElectronType2() {
  var nav = getNavigatorInstance();
  var ua2 = nav && nav.userAgent && nav.userAgent.toLowerCase();
  return typeof ua2 === "string" ? /electron/.test(ua2) : false;
};
var isEdgeChromiumType = function isEdgeChromiumType2(ua2) {
  return typeof ua2 === "string" && ua2.indexOf("Edg/") !== -1;
};
var getIOS13 = function getIOS132() {
  var nav = getNavigatorInstance();
  return nav && (/iPad|iPhone|iPod/.test(nav.platform) || nav.platform === "MacIntel" && nav.maxTouchPoints > 1) && !window.MSStream;
};
var getIPad13 = function getIPad132() {
  return isIOS13Check("iPad");
};
var getIphone13 = function getIphone132() {
  return isIOS13Check("iPhone");
};
var getIPod13 = function getIPod132() {
  return isIOS13Check("iPod");
};
var getUseragent = function getUseragent2(userAg) {
  return setDefaults(userAg);
};
function buildSelectorsObject(options) {
  var _ref = options ? options : UAHelper, device2 = _ref.device, browser2 = _ref.browser, os2 = _ref.os, engine2 = _ref.engine, ua2 = _ref.ua;
  return {
    isSmartTV: isSmartTVType(device2),
    isConsole: isConsoleType(device2),
    isWearable: isWearableType(device2),
    isEmbedded: isEmbeddedType(device2),
    isMobileSafari: isMobileSafariType(browser2) || getIPad13(),
    isChromium: isChromiumType(browser2),
    isMobile: isMobileAndTabletType(device2) || getIPad13(),
    isMobileOnly: isMobileType(device2),
    isTablet: isTabletType(device2) || getIPad13(),
    isBrowser: isBrowserType(device2),
    isDesktop: isBrowserType(device2),
    isAndroid: isAndroidType(os2),
    isWinPhone: isWinPhoneType(os2),
    isIOS: isIOSType(os2) || getIPad13(),
    isChrome: isChromeType(browser2),
    isFirefox: isFirefoxType(browser2),
    isSafari: isSafariType(browser2),
    isOpera: isOperaType(browser2),
    isIE: isIEType(browser2),
    osVersion: getOsVersion(os2),
    osName: getOsName(os2),
    fullBrowserVersion: getBrowserFullVersion(browser2),
    browserVersion: getBrowserVersion(browser2),
    browserName: getBrowserName(browser2),
    mobileVendor: getMobileVendor(device2),
    mobileModel: getMobileModel(device2),
    engineName: getEngineName(engine2),
    engineVersion: getEngineVersion(engine2),
    getUA: getUseragent(ua2),
    isEdge: isEdgeType(browser2) || isEdgeChromiumType(ua2),
    isYandex: isYandexType(browser2),
    deviceType: getDeviceType(device2),
    isIOS13: getIOS13(),
    isIPad13: getIPad13(),
    isIPhone13: getIphone13(),
    isIPod13: getIPod13(),
    isElectron: isElectronType(),
    isEdgeChromium: isEdgeChromiumType(ua2),
    isLegacyEdge: isEdgeType(browser2) && !isEdgeChromiumType(ua2),
    isWindows: isWindowsType(os2),
    isMacOs: isMacOsType(os2),
    isMIUI: isMIUIType(browser2),
    isSamsungBrowser: isSamsungBrowserType(browser2)
  };
}
var isSmartTV = isSmartTVType(device);
var isConsole = isConsoleType(device);
var isWearable = isWearableType(device);
var isEmbedded = isEmbeddedType(device);
var isMobileSafari = isMobileSafariType(browser) || getIPad13();
var isChromium = isChromiumType(browser);
var isMobile = isMobileAndTabletType(device) || getIPad13();
var isMobileOnly = isMobileType(device);
var isTablet = isTabletType(device) || getIPad13();
var isBrowser = isBrowserType(device);
var isDesktop = isBrowserType(device);
var isAndroid = isAndroidType(os);
var isWinPhone = isWinPhoneType(os);
var isIOS = isIOSType(os) || getIPad13();
var isChrome = isChromeType(browser);
var isFirefox = isFirefoxType(browser);
var isSafari = isSafariType(browser);
var isOpera = isOperaType(browser);
var isIE = isIEType(browser);
var osVersion = getOsVersion(os);
var osName = getOsName(os);
var fullBrowserVersion = getBrowserFullVersion(browser);
var browserVersion = getBrowserVersion(browser);
var browserName = getBrowserName(browser);
var mobileVendor = getMobileVendor(device);
var mobileModel = getMobileModel(device);
var engineName = getEngineName(engine);
var engineVersion = getEngineVersion(engine);
var getUA = getUseragent(ua);
var isEdge = isEdgeType(browser) || isEdgeChromiumType(ua);
var isYandex = isYandexType(browser);
var deviceType = getDeviceType(device);
var isIOS13 = getIOS13();
var isIPad13 = getIPad13();
var isIPhone13 = getIphone13();
var isIPod13 = getIPod13();
var isElectron = isElectronType();
var isEdgeChromium = isEdgeChromiumType(ua);
var isLegacyEdge = isEdgeType(browser) && !isEdgeChromiumType(ua);
var isWindows = isWindowsType(os);
var isMacOs = isMacOsType(os);
var isMIUI = isMIUIType(browser);
var isSamsungBrowser = isSamsungBrowserType(browser);
var getSelectorsByUserAgent = function getSelectorsByUserAgent2(userAgent) {
  if (!userAgent || typeof userAgent !== "string") {
    console.error("No valid user agent string was provided");
    return;
  }
  var _UAHelper$parseUserAg = parseUserAgent(userAgent), device2 = _UAHelper$parseUserAg.device, browser2 = _UAHelper$parseUserAg.browser, os2 = _UAHelper$parseUserAg.os, engine2 = _UAHelper$parseUserAg.engine, ua2 = _UAHelper$parseUserAg.ua;
  return buildSelectorsObject({
    device: device2,
    browser: browser2,
    os: os2,
    engine: engine2,
    ua: ua2
  });
};
var AndroidView = function AndroidView2(_ref) {
  var renderWithFragment = _ref.renderWithFragment, children = _ref.children, props = _objectWithoutProperties(_ref, ["renderWithFragment", "children"]);
  return isAndroid ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var BrowserView = function BrowserView2(_ref2) {
  var renderWithFragment = _ref2.renderWithFragment, children = _ref2.children, props = _objectWithoutProperties(_ref2, ["renderWithFragment", "children"]);
  return isBrowser ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var IEView = function IEView2(_ref3) {
  var renderWithFragment = _ref3.renderWithFragment, children = _ref3.children, props = _objectWithoutProperties(_ref3, ["renderWithFragment", "children"]);
  return isIE ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var IOSView = function IOSView2(_ref4) {
  var renderWithFragment = _ref4.renderWithFragment, children = _ref4.children, props = _objectWithoutProperties(_ref4, ["renderWithFragment", "children"]);
  return isIOS ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var MobileView = function MobileView2(_ref5) {
  var renderWithFragment = _ref5.renderWithFragment, children = _ref5.children, props = _objectWithoutProperties(_ref5, ["renderWithFragment", "children"]);
  return isMobile ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var TabletView = function TabletView2(_ref6) {
  var renderWithFragment = _ref6.renderWithFragment, children = _ref6.children, props = _objectWithoutProperties(_ref6, ["renderWithFragment", "children"]);
  return isTablet ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var WinPhoneView = function WinPhoneView2(_ref7) {
  var renderWithFragment = _ref7.renderWithFragment, children = _ref7.children, props = _objectWithoutProperties(_ref7, ["renderWithFragment", "children"]);
  return isWinPhone ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var MobileOnlyView = function MobileOnlyView2(_ref8) {
  var renderWithFragment = _ref8.renderWithFragment, children = _ref8.children;
  _ref8.viewClassName;
  _ref8.style;
  var props = _objectWithoutProperties(_ref8, ["renderWithFragment", "children", "viewClassName", "style"]);
  return isMobileOnly ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var SmartTVView = function SmartTVView2(_ref9) {
  var renderWithFragment = _ref9.renderWithFragment, children = _ref9.children, props = _objectWithoutProperties(_ref9, ["renderWithFragment", "children"]);
  return isSmartTV ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var ConsoleView = function ConsoleView2(_ref10) {
  var renderWithFragment = _ref10.renderWithFragment, children = _ref10.children, props = _objectWithoutProperties(_ref10, ["renderWithFragment", "children"]);
  return isConsole ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var WearableView = function WearableView2(_ref11) {
  var renderWithFragment = _ref11.renderWithFragment, children = _ref11.children, props = _objectWithoutProperties(_ref11, ["renderWithFragment", "children"]);
  return isWearable ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
var CustomView = function CustomView2(_ref12) {
  var renderWithFragment = _ref12.renderWithFragment, children = _ref12.children;
  _ref12.viewClassName;
  _ref12.style;
  var condition = _ref12.condition, props = _objectWithoutProperties(_ref12, ["renderWithFragment", "children", "viewClassName", "style", "condition"]);
  return condition ? renderWithFragment ? React__default.createElement(React.Fragment, null, children) : React__default.createElement("div", props, children) : null;
};
function withOrientationChange(WrappedComponent) {
  return /* @__PURE__ */ function(_React$Component) {
    _inherits(_class, _React$Component);
    function _class(props) {
      var _this;
      _classCallCheck$2(this, _class);
      _this = _possibleConstructorReturn(this, _getPrototypeOf(_class).call(this, props));
      _this.isEventListenerAdded = false;
      _this.handleOrientationChange = _this.handleOrientationChange.bind(_assertThisInitialized(_this));
      _this.onOrientationChange = _this.onOrientationChange.bind(_assertThisInitialized(_this));
      _this.onPageLoad = _this.onPageLoad.bind(_assertThisInitialized(_this));
      _this.state = {
        isLandscape: false,
        isPortrait: false
      };
      return _this;
    }
    _createClass$2(_class, [{
      key: "handleOrientationChange",
      value: function handleOrientationChange() {
        if (!this.isEventListenerAdded) {
          this.isEventListenerAdded = true;
        }
        var orientation = window.innerWidth > window.innerHeight ? 90 : 0;
        this.setState({
          isPortrait: orientation === 0,
          isLandscape: orientation === 90
        });
      }
    }, {
      key: "onOrientationChange",
      value: function onOrientationChange() {
        this.handleOrientationChange();
      }
    }, {
      key: "onPageLoad",
      value: function onPageLoad() {
        this.handleOrientationChange();
      }
    }, {
      key: "componentDidMount",
      value: function componentDidMount() {
        if ((typeof window === "undefined" ? "undefined" : _typeof$1(window)) !== void 0 && isMobile) {
          if (!this.isEventListenerAdded) {
            this.handleOrientationChange();
            window.addEventListener("load", this.onPageLoad, false);
          } else {
            window.removeEventListener("load", this.onPageLoad, false);
          }
          window.addEventListener("resize", this.onOrientationChange, false);
        }
      }
    }, {
      key: "componentWillUnmount",
      value: function componentWillUnmount() {
        window.removeEventListener("resize", this.onOrientationChange, false);
      }
    }, {
      key: "render",
      value: function render3() {
        return React__default.createElement(WrappedComponent, _extends$1({}, this.props, {
          isLandscape: this.state.isLandscape,
          isPortrait: this.state.isPortrait
        }));
      }
    }]);
    return _class;
  }(React__default.Component);
}
function useMobileOrientation() {
  var _useState = React.useState(function() {
    var orientation = window.innerWidth > window.innerHeight ? 90 : 0;
    return {
      isPortrait: orientation === 0,
      isLandscape: orientation === 90,
      orientation: orientation === 0 ? "portrait" : "landscape"
    };
  }), _useState2 = _slicedToArray(_useState, 2), state = _useState2[0], setState = _useState2[1];
  var handleOrientationChange = React.useCallback(function() {
    var orientation = window.innerWidth > window.innerHeight ? 90 : 0;
    var next = {
      isPortrait: orientation === 0,
      isLandscape: orientation === 90,
      orientation: orientation === 0 ? "portrait" : "landscape"
    };
    state.orientation !== next.orientation && setState(next);
  }, [state.orientation]);
  React.useEffect(function() {
    if ((typeof window === "undefined" ? "undefined" : _typeof$1(window)) !== void 0 && isMobile) {
      handleOrientationChange();
      window.addEventListener("load", handleOrientationChange, false);
      window.addEventListener("resize", handleOrientationChange, false);
    }
    return function() {
      window.removeEventListener("resize", handleOrientationChange, false);
      window.removeEventListener("load", handleOrientationChange, false);
    };
  }, [handleOrientationChange]);
  return state;
}
function useDeviceData(userAgent) {
  var hookUserAgent = userAgent ? userAgent : window.navigator.userAgent;
  return parseUserAgent(hookUserAgent);
}
function useDeviceSelectors(userAgent) {
  var hookUserAgent = userAgent ? userAgent : window.navigator.userAgent;
  var deviceData = useDeviceData(hookUserAgent);
  var selectors = buildSelectorsObject(deviceData);
  return [selectors, deviceData];
}
lib.AndroidView = AndroidView;
lib.BrowserTypes = BrowserTypes;
lib.BrowserView = BrowserView;
lib.ConsoleView = ConsoleView;
lib.CustomView = CustomView;
lib.IEView = IEView;
lib.IOSView = IOSView;
lib.MobileOnlyView = MobileOnlyView;
lib.MobileView = MobileView;
lib.OsTypes = OsTypes;
lib.SmartTVView = SmartTVView;
lib.TabletView = TabletView;
lib.WearableView = WearableView;
lib.WinPhoneView = WinPhoneView;
lib.browserName = browserName;
lib.browserVersion = browserVersion;
lib.deviceDetect = deviceDetect;
lib.deviceType = deviceType;
lib.engineName = engineName;
lib.engineVersion = engineVersion;
lib.fullBrowserVersion = fullBrowserVersion;
lib.getSelectorsByUserAgent = getSelectorsByUserAgent;
lib.getUA = getUA;
lib.isAndroid = isAndroid;
lib.isBrowser = isBrowser;
lib.isChrome = isChrome;
lib.isChromium = isChromium;
lib.isConsole = isConsole;
var isDesktop_1 = lib.isDesktop = isDesktop;
lib.isEdge = isEdge;
lib.isEdgeChromium = isEdgeChromium;
lib.isElectron = isElectron;
lib.isEmbedded = isEmbedded;
lib.isFirefox = isFirefox;
lib.isIE = isIE;
lib.isIOS = isIOS;
lib.isIOS13 = isIOS13;
lib.isIPad13 = isIPad13;
lib.isIPhone13 = isIPhone13;
lib.isIPod13 = isIPod13;
lib.isLegacyEdge = isLegacyEdge;
lib.isMIUI = isMIUI;
lib.isMacOs = isMacOs;
var isMobile_1 = lib.isMobile = isMobile;
lib.isMobileOnly = isMobileOnly;
lib.isMobileSafari = isMobileSafari;
lib.isOpera = isOpera;
lib.isSafari = isSafari;
lib.isSamsungBrowser = isSamsungBrowser;
lib.isSmartTV = isSmartTV;
var isTablet_1 = lib.isTablet = isTablet;
lib.isWearable = isWearable;
lib.isWinPhone = isWinPhone;
lib.isWindows = isWindows;
lib.isYandex = isYandex;
lib.mobileModel = mobileModel;
lib.mobileVendor = mobileVendor;
lib.osName = osName;
lib.osVersion = osVersion;
lib.parseUserAgent = parseUserAgent;
lib.setUserAgent = setUserAgent;
lib.useDeviceData = useDeviceData;
lib.useDeviceSelectors = useDeviceSelectors;
lib.useMobileOrientation = useMobileOrientation;
lib.withOrientationChange = withOrientationChange;
function useSaveNoveltie() {
  const save2 = (noveltieTitle, userData) => {
    const nameUser = userData.userName;
    if (localStorage.getItem("my-noveltie") === null) {
      const myNoveltie = [];
      myNoveltie.push({ name: nameUser, titleNoveltie: noveltieTitle });
      localStorage.setItem("my-noveltie", JSON.stringify(myNoveltie));
    } else {
      const myNoveltie = JSON.parse(localStorage.getItem("my-noveltie"));
      myNoveltie.push({ name: nameUser, titleNoveltie: noveltieTitle });
      localStorage.setItem("my-noveltie", JSON.stringify(myNoveltie));
    }
  };
  const getList = () => {
    if (localStorage.getItem("my-noveltie") === null) {
      const myNoveltie = [];
      localStorage.setItem("my-noveltie", JSON.stringify(myNoveltie));
      return myNoveltie;
    }
    return JSON.parse(localStorage.getItem("my-noveltie"));
  };
  const deleteListNoveltie = () => {
    localStorage.removeItem("my-noveltie");
  };
  return {
    save: save2,
    getList,
    deleteListNoveltie
  };
}
function useDataUser(user, local, storangeUser, storangeLocal) {
  const userData = {};
  const localData = {};
  let LANG = null;
  userData.userName = `${user.name} ${user.surName}`;
  userData.userId = user._id;
  localData.name = local.name;
  localData.franchise = local.franchise;
  localData.localId = local._id;
  LANG = local.lang;
  return { userData, localData, LANG };
}
/*!
 * Compressor.js v1.1.1
 * https://fengyuanchen.github.io/compressorjs
 *
 * Copyright 2018-present Chen Fengyuan
 * Released under the MIT license
 *
 * Date: 2021-10-05T02:32:40.212Z
 */
function ownKeys$1(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) {
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }
    keys.push.apply(keys, symbols);
  }
  return keys;
}
function _objectSpread2$1(target) {
  for (var i2 = 1; i2 < arguments.length; i2++) {
    var source = arguments[i2] != null ? arguments[i2] : {};
    if (i2 % 2) {
      ownKeys$1(Object(source), true).forEach(function(key) {
        _defineProperty$1(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys$1(Object(source)).forEach(function(key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}
function _classCallCheck$1(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties$1(target, props) {
  for (var i2 = 0; i2 < props.length; i2++) {
    var descriptor = props[i2];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass$1(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties$1(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties$1(Constructor, staticProps);
  return Constructor;
}
function _defineProperty$1(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _extends() {
  _extends = Object.assign || function(target) {
    for (var i2 = 1; i2 < arguments.length; i2++) {
      var source = arguments[i2];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
var canvasToBlob$1 = { exports: {} };
(function(module) {
  if (typeof window === "undefined") {
    return;
  }
  (function(window2) {
    var CanvasPrototype = window2.HTMLCanvasElement && window2.HTMLCanvasElement.prototype;
    var hasBlobConstructor = window2.Blob && function() {
      try {
        return Boolean(new Blob());
      } catch (e2) {
        return false;
      }
    }();
    var hasArrayBufferViewSupport = hasBlobConstructor && window2.Uint8Array && function() {
      try {
        return new Blob([new Uint8Array(100)]).size === 100;
      } catch (e2) {
        return false;
      }
    }();
    var BlobBuilder = window2.BlobBuilder || window2.WebKitBlobBuilder || window2.MozBlobBuilder || window2.MSBlobBuilder;
    var dataURIPattern = /^data:((.*?)(;charset=.*?)?)(;base64)?,/;
    var dataURLtoBlob = (hasBlobConstructor || BlobBuilder) && window2.atob && window2.ArrayBuffer && window2.Uint8Array && function(dataURI) {
      var matches, mediaType, isBase64, dataString, byteString, arrayBuffer, intArray, i2, bb;
      matches = dataURI.match(dataURIPattern);
      if (!matches) {
        throw new Error("invalid data URI");
      }
      mediaType = matches[2] ? matches[1] : "text/plain" + (matches[3] || ";charset=US-ASCII");
      isBase64 = !!matches[4];
      dataString = dataURI.slice(matches[0].length);
      if (isBase64) {
        byteString = atob(dataString);
      } else {
        byteString = decodeURIComponent(dataString);
      }
      arrayBuffer = new ArrayBuffer(byteString.length);
      intArray = new Uint8Array(arrayBuffer);
      for (i2 = 0; i2 < byteString.length; i2 += 1) {
        intArray[i2] = byteString.charCodeAt(i2);
      }
      if (hasBlobConstructor) {
        return new Blob([hasArrayBufferViewSupport ? intArray : arrayBuffer], {
          type: mediaType
        });
      }
      bb = new BlobBuilder();
      bb.append(arrayBuffer);
      return bb.getBlob(mediaType);
    };
    if (window2.HTMLCanvasElement && !CanvasPrototype.toBlob) {
      if (CanvasPrototype.mozGetAsFile) {
        CanvasPrototype.toBlob = function(callback, type, quality) {
          var self = this;
          setTimeout(function() {
            if (quality && CanvasPrototype.toDataURL && dataURLtoBlob) {
              callback(dataURLtoBlob(self.toDataURL(type, quality)));
            } else {
              callback(self.mozGetAsFile("blob", type));
            }
          });
        };
      } else if (CanvasPrototype.toDataURL && dataURLtoBlob) {
        if (CanvasPrototype.msToBlob) {
          CanvasPrototype.toBlob = function(callback, type, quality) {
            var self = this;
            setTimeout(function() {
              if ((type && type !== "image/png" || quality) && CanvasPrototype.toDataURL && dataURLtoBlob) {
                callback(dataURLtoBlob(self.toDataURL(type, quality)));
              } else {
                callback(self.msToBlob(type));
              }
            });
          };
        } else {
          CanvasPrototype.toBlob = function(callback, type, quality) {
            var self = this;
            setTimeout(function() {
              callback(dataURLtoBlob(self.toDataURL(type, quality)));
            });
          };
        }
      }
    }
    if (module.exports) {
      module.exports = dataURLtoBlob;
    } else {
      window2.dataURLtoBlob = dataURLtoBlob;
    }
  })(window);
})(canvasToBlob$1);
var toBlob$1 = canvasToBlob$1.exports;
var isBlob = function isBlob2(value) {
  if (typeof Blob === "undefined") {
    return false;
  }
  return value instanceof Blob || Object.prototype.toString.call(value) === "[object Blob]";
};
var DEFAULTS$1 = {
  /**
   * Indicates if output the original image instead of the compressed one
   * when the size of the compressed image is greater than the original one's
   * @type {boolean}
   */
  strict: true,
  /**
   * Indicates if read the image's Exif Orientation information,
   * and then rotate or flip the image automatically.
   * @type {boolean}
   */
  checkOrientation: true,
  /**
   * The max width of the output image.
   * @type {number}
   */
  maxWidth: Infinity,
  /**
   * The max height of the output image.
   * @type {number}
   */
  maxHeight: Infinity,
  /**
   * The min width of the output image.
   * @type {number}
   */
  minWidth: 0,
  /**
   * The min height of the output image.
   * @type {number}
   */
  minHeight: 0,
  /**
   * The width of the output image.
   * If not specified, the natural width of the source image will be used.
   * @type {number}
   */
  width: void 0,
  /**
   * The height of the output image.
   * If not specified, the natural height of the source image will be used.
   * @type {number}
   */
  height: void 0,
  /**
   * Sets how the size of the image should be resized to the container
   * specified by the `width` and `height` options.
   * @type {string}
   */
  resize: "none",
  /**
   * The quality of the output image.
   * It must be a number between `0` and `1`,
   * and only available for `image/jpeg` and `image/webp` images.
   * Check out {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob canvas.toBlob}.
   * @type {number}
   */
  quality: 0.8,
  /**
   * The mime type of the output image.
   * By default, the original mime type of the source image file will be used.
   * @type {string}
   */
  mimeType: "auto",
  /**
   * Files whose file type is included in this list,
   * and whose file size exceeds the `convertSize` value will be converted to JPEGs.
   * @type {string｜Array}
   */
  convertTypes: ["image/png"],
  /**
   * PNG files over this size (5 MB by default) will be converted to JPEGs.
   * To disable this, just set the value to `Infinity`.
   * @type {number}
   */
  convertSize: 5e6,
  /**
   * The hook function to execute before draw the image into the canvas for compression.
   * @type {Function}
   * @param {CanvasRenderingContext2D} context - The 2d rendering context of the canvas.
   * @param {HTMLCanvasElement} canvas - The canvas for compression.
   * @example
   * function (context, canvas) {
   *   context.fillStyle = '#fff';
   * }
   */
  beforeDraw: null,
  /**
   * The hook function to execute after drew the image into the canvas for compression.
   * @type {Function}
   * @param {CanvasRenderingContext2D} context - The 2d rendering context of the canvas.
   * @param {HTMLCanvasElement} canvas - The canvas for compression.
   * @example
   * function (context, canvas) {
   *   context.filter = 'grayscale(100%)';
   * }
   */
  drew: null,
  /**
   * The hook function to execute when success to compress the image.
   * @type {Function}
   * @param {File} file - The compressed image File object.
   * @example
   * function (file) {
   *   console.log(file);
   * }
   */
  success: null,
  /**
   * The hook function to execute when fail to compress the image.
   * @type {Function}
   * @param {Error} err - An Error object.
   * @example
   * function (err) {
   *   console.log(err.message);
   * }
   */
  error: null
};
var IS_BROWSER$1 = typeof window !== "undefined" && typeof window.document !== "undefined";
var WINDOW$1 = IS_BROWSER$1 ? window : {};
var isPositiveNumber$1 = function isPositiveNumber(value) {
  return value > 0 && value < Infinity;
};
var slice$1 = Array.prototype.slice;
function toArray$2(value) {
  return Array.from ? Array.from(value) : slice$1.call(value);
}
var REGEXP_IMAGE_TYPE = /^image\/.+$/;
function isImageType(value) {
  return REGEXP_IMAGE_TYPE.test(value);
}
function imageTypeToExtension(value) {
  var extension = isImageType(value) ? value.substr(6) : "";
  if (extension === "jpeg") {
    extension = "jpg";
  }
  return ".".concat(extension);
}
var fromCharCode$1 = String.fromCharCode;
function getStringFromCharCode$1(dataView, start, length) {
  var str = "";
  var i2;
  length += start;
  for (i2 = start; i2 < length; i2 += 1) {
    str += fromCharCode$1(dataView.getUint8(i2));
  }
  return str;
}
var btoa$1 = WINDOW$1.btoa;
function arrayBufferToDataURL$1(arrayBuffer, mimeType) {
  var chunks = [];
  var chunkSize = 8192;
  var uint8 = new Uint8Array(arrayBuffer);
  while (uint8.length > 0) {
    chunks.push(fromCharCode$1.apply(null, toArray$2(uint8.subarray(0, chunkSize))));
    uint8 = uint8.subarray(chunkSize);
  }
  return "data:".concat(mimeType, ";base64,").concat(btoa$1(chunks.join("")));
}
function resetAndGetOrientation$1(arrayBuffer) {
  var dataView = new DataView(arrayBuffer);
  var orientation;
  try {
    var littleEndian;
    var app1Start;
    var ifdStart;
    if (dataView.getUint8(0) === 255 && dataView.getUint8(1) === 216) {
      var length = dataView.byteLength;
      var offset = 2;
      while (offset + 1 < length) {
        if (dataView.getUint8(offset) === 255 && dataView.getUint8(offset + 1) === 225) {
          app1Start = offset;
          break;
        }
        offset += 1;
      }
    }
    if (app1Start) {
      var exifIDCode = app1Start + 4;
      var tiffOffset = app1Start + 10;
      if (getStringFromCharCode$1(dataView, exifIDCode, 4) === "Exif") {
        var endianness = dataView.getUint16(tiffOffset);
        littleEndian = endianness === 18761;
        if (littleEndian || endianness === 19789) {
          if (dataView.getUint16(tiffOffset + 2, littleEndian) === 42) {
            var firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
            if (firstIFDOffset >= 8) {
              ifdStart = tiffOffset + firstIFDOffset;
            }
          }
        }
      }
    }
    if (ifdStart) {
      var _length = dataView.getUint16(ifdStart, littleEndian);
      var _offset;
      var i2;
      for (i2 = 0; i2 < _length; i2 += 1) {
        _offset = ifdStart + i2 * 12 + 2;
        if (dataView.getUint16(_offset, littleEndian) === 274) {
          _offset += 8;
          orientation = dataView.getUint16(_offset, littleEndian);
          dataView.setUint16(_offset, 1, littleEndian);
          break;
        }
      }
    }
  } catch (e2) {
    orientation = 1;
  }
  return orientation;
}
function parseOrientation$1(orientation) {
  var rotate2 = 0;
  var scaleX2 = 1;
  var scaleY2 = 1;
  switch (orientation) {
    case 2:
      scaleX2 = -1;
      break;
    case 3:
      rotate2 = -180;
      break;
    case 4:
      scaleY2 = -1;
      break;
    case 5:
      rotate2 = 90;
      scaleY2 = -1;
      break;
    case 6:
      rotate2 = 90;
      break;
    case 7:
      rotate2 = 90;
      scaleX2 = -1;
      break;
    case 8:
      rotate2 = -90;
      break;
  }
  return {
    rotate: rotate2,
    scaleX: scaleX2,
    scaleY: scaleY2
  };
}
var REGEXP_DECIMALS$1 = /\.\d*(?:0|9){12}\d*$/;
function normalizeDecimalNumber$1(value) {
  var times = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1e11;
  return REGEXP_DECIMALS$1.test(value) ? Math.round(value * times) / times : value;
}
function getAdjustedSizes$1(_ref) {
  var aspectRatio = _ref.aspectRatio, height = _ref.height, width = _ref.width;
  var type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "none";
  var isValidWidth = isPositiveNumber$1(width);
  var isValidHeight = isPositiveNumber$1(height);
  if (isValidWidth && isValidHeight) {
    var adjustedWidth = height * aspectRatio;
    if ((type === "contain" || type === "none") && adjustedWidth > width || type === "cover" && adjustedWidth < width) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }
  } else if (isValidWidth) {
    height = width / aspectRatio;
  } else if (isValidHeight) {
    width = height * aspectRatio;
  }
  return {
    width,
    height
  };
}
var ArrayBuffer$1 = WINDOW$1.ArrayBuffer, FileReader$1 = WINDOW$1.FileReader;
var URL$1 = WINDOW$1.URL || WINDOW$1.webkitURL;
var REGEXP_EXTENSION = /\.\w+$/;
var AnotherCompressor = WINDOW$1.Compressor;
var Compressor = /* @__PURE__ */ function() {
  function Compressor2(file, options) {
    _classCallCheck$1(this, Compressor2);
    this.file = file;
    this.image = new Image();
    this.options = _objectSpread2$1(_objectSpread2$1({}, DEFAULTS$1), options);
    this.aborted = false;
    this.result = null;
    this.init();
  }
  _createClass$1(Compressor2, [{
    key: "init",
    value: function init() {
      var _this = this;
      var file = this.file, options = this.options;
      if (!isBlob(file)) {
        this.fail(new Error("The first argument must be a File or Blob object."));
        return;
      }
      var mimeType = file.type;
      if (!isImageType(mimeType)) {
        this.fail(new Error("The first argument must be an image File or Blob object."));
        return;
      }
      if (!URL$1 || !FileReader$1) {
        this.fail(new Error("The current browser does not support image compression."));
        return;
      }
      if (!ArrayBuffer$1) {
        options.checkOrientation = false;
      }
      if (URL$1 && !options.checkOrientation) {
        this.load({
          url: URL$1.createObjectURL(file)
        });
      } else {
        var reader = new FileReader$1();
        var checkOrientation = options.checkOrientation && mimeType === "image/jpeg";
        this.reader = reader;
        reader.onload = function(_ref) {
          var target = _ref.target;
          var result = target.result;
          var data = {};
          if (checkOrientation) {
            var orientation = resetAndGetOrientation$1(result);
            if (orientation > 1 || !URL$1) {
              data.url = arrayBufferToDataURL$1(result, mimeType);
              if (orientation > 1) {
                _extends(data, parseOrientation$1(orientation));
              }
            } else {
              data.url = URL$1.createObjectURL(file);
            }
          } else {
            data.url = result;
          }
          _this.load(data);
        };
        reader.onabort = function() {
          _this.fail(new Error("Aborted to read the image with FileReader."));
        };
        reader.onerror = function() {
          _this.fail(new Error("Failed to read the image with FileReader."));
        };
        reader.onloadend = function() {
          _this.reader = null;
        };
        if (checkOrientation) {
          reader.readAsArrayBuffer(file);
        } else {
          reader.readAsDataURL(file);
        }
      }
    }
  }, {
    key: "load",
    value: function load(data) {
      var _this2 = this;
      var file = this.file, image = this.image;
      image.onload = function() {
        _this2.draw(_objectSpread2$1(_objectSpread2$1({}, data), {}, {
          naturalWidth: image.naturalWidth,
          naturalHeight: image.naturalHeight
        }));
      };
      image.onabort = function() {
        _this2.fail(new Error("Aborted to load the image."));
      };
      image.onerror = function() {
        _this2.fail(new Error("Failed to load the image."));
      };
      if (WINDOW$1.navigator && /(?:iPad|iPhone|iPod).*?AppleWebKit/i.test(WINDOW$1.navigator.userAgent)) {
        image.crossOrigin = "anonymous";
      }
      image.alt = file.name;
      image.src = data.url;
    }
  }, {
    key: "draw",
    value: function draw(_ref2) {
      var _this3 = this;
      var naturalWidth = _ref2.naturalWidth, naturalHeight = _ref2.naturalHeight, _ref2$rotate = _ref2.rotate, rotate2 = _ref2$rotate === void 0 ? 0 : _ref2$rotate, _ref2$scaleX = _ref2.scaleX, scaleX2 = _ref2$scaleX === void 0 ? 1 : _ref2$scaleX, _ref2$scaleY = _ref2.scaleY, scaleY2 = _ref2$scaleY === void 0 ? 1 : _ref2$scaleY;
      var file = this.file, image = this.image, options = this.options;
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var is90DegreesRotated = Math.abs(rotate2) % 180 === 90;
      var resizable = (options.resize === "contain" || options.resize === "cover") && isPositiveNumber$1(options.width) && isPositiveNumber$1(options.height);
      var maxWidth = Math.max(options.maxWidth, 0) || Infinity;
      var maxHeight = Math.max(options.maxHeight, 0) || Infinity;
      var minWidth = Math.max(options.minWidth, 0) || 0;
      var minHeight = Math.max(options.minHeight, 0) || 0;
      var aspectRatio = naturalWidth / naturalHeight;
      var width = options.width, height = options.height;
      if (is90DegreesRotated) {
        var _ref3 = [maxHeight, maxWidth];
        maxWidth = _ref3[0];
        maxHeight = _ref3[1];
        var _ref4 = [minHeight, minWidth];
        minWidth = _ref4[0];
        minHeight = _ref4[1];
        var _ref5 = [height, width];
        width = _ref5[0];
        height = _ref5[1];
      }
      if (resizable) {
        aspectRatio = width / height;
      }
      var _getAdjustedSizes = getAdjustedSizes$1({
        aspectRatio,
        width: maxWidth,
        height: maxHeight
      }, "contain");
      maxWidth = _getAdjustedSizes.width;
      maxHeight = _getAdjustedSizes.height;
      var _getAdjustedSizes2 = getAdjustedSizes$1({
        aspectRatio,
        width: minWidth,
        height: minHeight
      }, "cover");
      minWidth = _getAdjustedSizes2.width;
      minHeight = _getAdjustedSizes2.height;
      if (resizable) {
        var _getAdjustedSizes3 = getAdjustedSizes$1({
          aspectRatio,
          width,
          height
        }, options.resize);
        width = _getAdjustedSizes3.width;
        height = _getAdjustedSizes3.height;
      } else {
        var _getAdjustedSizes4 = getAdjustedSizes$1({
          aspectRatio,
          width,
          height
        });
        var _getAdjustedSizes4$wi = _getAdjustedSizes4.width;
        width = _getAdjustedSizes4$wi === void 0 ? naturalWidth : _getAdjustedSizes4$wi;
        var _getAdjustedSizes4$he = _getAdjustedSizes4.height;
        height = _getAdjustedSizes4$he === void 0 ? naturalHeight : _getAdjustedSizes4$he;
      }
      width = Math.floor(normalizeDecimalNumber$1(Math.min(Math.max(width, minWidth), maxWidth)));
      height = Math.floor(normalizeDecimalNumber$1(Math.min(Math.max(height, minHeight), maxHeight)));
      var destX = -width / 2;
      var destY = -height / 2;
      var destWidth = width;
      var destHeight = height;
      var params = [];
      if (resizable) {
        var srcX = 0;
        var srcY = 0;
        var srcWidth = naturalWidth;
        var srcHeight = naturalHeight;
        var _getAdjustedSizes5 = getAdjustedSizes$1({
          aspectRatio,
          width: naturalWidth,
          height: naturalHeight
        }, {
          contain: "cover",
          cover: "contain"
        }[options.resize]);
        srcWidth = _getAdjustedSizes5.width;
        srcHeight = _getAdjustedSizes5.height;
        srcX = (naturalWidth - srcWidth) / 2;
        srcY = (naturalHeight - srcHeight) / 2;
        params.push(srcX, srcY, srcWidth, srcHeight);
      }
      params.push(destX, destY, destWidth, destHeight);
      if (is90DegreesRotated) {
        var _ref6 = [height, width];
        width = _ref6[0];
        height = _ref6[1];
      }
      canvas.width = width;
      canvas.height = height;
      if (!isImageType(options.mimeType)) {
        options.mimeType = file.type;
      }
      var fillStyle = "transparent";
      if (file.size > options.convertSize && options.convertTypes.indexOf(options.mimeType) >= 0) {
        options.mimeType = "image/jpeg";
      }
      if (options.mimeType === "image/jpeg") {
        fillStyle = "#fff";
      }
      context.fillStyle = fillStyle;
      context.fillRect(0, 0, width, height);
      if (options.beforeDraw) {
        options.beforeDraw.call(this, context, canvas);
      }
      if (this.aborted) {
        return;
      }
      context.save();
      context.translate(width / 2, height / 2);
      context.rotate(rotate2 * Math.PI / 180);
      context.scale(scaleX2, scaleY2);
      context.drawImage.apply(context, [image].concat(params));
      context.restore();
      if (options.drew) {
        options.drew.call(this, context, canvas);
      }
      if (this.aborted) {
        return;
      }
      var done = function done2(result) {
        if (!_this3.aborted) {
          _this3.done({
            naturalWidth,
            naturalHeight,
            result
          });
        }
      };
      if (canvas.toBlob) {
        canvas.toBlob(done, options.mimeType, options.quality);
      } else {
        done(toBlob$1(canvas.toDataURL(options.mimeType, options.quality)));
      }
    }
  }, {
    key: "done",
    value: function done(_ref7) {
      var naturalWidth = _ref7.naturalWidth, naturalHeight = _ref7.naturalHeight, result = _ref7.result;
      var file = this.file, image = this.image, options = this.options;
      if (URL$1 && !options.checkOrientation) {
        URL$1.revokeObjectURL(image.src);
      }
      if (result) {
        if (options.strict && result.size > file.size && options.mimeType === file.type && !(options.width > naturalWidth || options.height > naturalHeight || options.minWidth > naturalWidth || options.minHeight > naturalHeight || options.maxWidth < naturalWidth || options.maxHeight < naturalHeight)) {
          result = file;
        } else {
          var date = /* @__PURE__ */ new Date();
          result.lastModified = date.getTime();
          result.lastModifiedDate = date;
          result.name = file.name;
          if (result.name && result.type !== file.type) {
            result.name = result.name.replace(REGEXP_EXTENSION, imageTypeToExtension(result.type));
          }
        }
      } else {
        result = file;
      }
      this.result = result;
      if (options.success) {
        options.success.call(this, result);
      }
    }
  }, {
    key: "fail",
    value: function fail(err) {
      var options = this.options;
      if (options.error) {
        options.error.call(this, err);
      } else {
        throw err;
      }
    }
  }, {
    key: "abort",
    value: function abort() {
      if (!this.aborted) {
        this.aborted = true;
        if (this.reader) {
          this.reader.abort();
        } else if (!this.image.complete) {
          this.image.onload = null;
          this.image.onabort();
        } else {
          this.fail(new Error("The compression process has been aborted."));
        }
      }
    }
    /**
     * Get the no conflict compressor class.
     * @returns {Compressor} The compressor class.
     */
  }], [{
    key: "noConflict",
    value: function noConflict() {
      window.Compressor = AnotherCompressor;
      return Compressor2;
    }
    /**
     * Change the default options.
     * @param {Object} options - The new default options.
     */
  }, {
    key: "setDefaults",
    value: function setDefaults3(options) {
      _extends(DEFAULTS$1, options);
    }
  }]);
  return Compressor2;
}();
const srcDefault = "" + new URL("drop-DcQ9u27D.png", import.meta.url).href;
const camera = "" + new URL("camera-A20mLyzL.png", import.meta.url).href;
const sendFile = (file) => {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("img", file);
    axiosInstance.post(`${IP}/multimedia`, formData).then((response) => resolve(response)).catch((error) => reject(error));
  });
};
function useAdapterResize({ breackWidth }) {
  const initZoom = typeof window !== "undefined" ? window.innerWidth < breackWidth && window.innerWidth > 720 ? window.innerWidth / breackWidth - 0.1 : 1 : 1;
  const htmlAdapterRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (typeof window !== "undefined") {
      const handleResize = () => {
        const newWidth = window.innerWidth;
        if (htmlAdapterRef.current) {
          if (newWidth < breackWidth && window.innerWidth > 720 && htmlAdapterRef.current) {
            htmlAdapterRef.current.style.zoom = (newWidth / breackWidth - 0.1).toString();
          } else if (window.innerWidth < 720) {
            htmlAdapterRef.current.style.zoom = (newWidth / breackWidth + 0.2).toString();
          } else if (htmlAdapterRef.current) {
            htmlAdapterRef.current.style.zoom = String(initZoom);
          }
        }
      };
      if (htmlAdapterRef.current) htmlAdapterRef.current.style.zoom = initZoom.toString();
      window.addEventListener("resize", handleResize);
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, [breackWidth]);
  return { htmlAdapterRef };
}
function resolveUrl(url, baseUrl) {
  if (url.match(/^[a-z]+:\/\//i)) {
    return url;
  }
  if (url.match(/^\/\//)) {
    return window.location.protocol + url;
  }
  if (url.match(/^[a-z]+:/i)) {
    return url;
  }
  const doc = document.implementation.createHTMLDocument();
  const base = doc.createElement("base");
  const a2 = doc.createElement("a");
  doc.head.appendChild(base);
  doc.body.appendChild(a2);
  if (baseUrl) {
    base.href = baseUrl;
  }
  a2.href = url;
  return a2.href;
}
const uuid = /* @__PURE__ */ (() => {
  let counter = 0;
  const random = () => (
    // eslint-disable-next-line no-bitwise
    `0000${(Math.random() * 36 ** 4 << 0).toString(36)}`.slice(-4)
  );
  return () => {
    counter += 1;
    return `u${random()}${counter}`;
  };
})();
function toArray$1(arrayLike) {
  const arr = [];
  for (let i2 = 0, l2 = arrayLike.length; i2 < l2; i2++) {
    arr.push(arrayLike[i2]);
  }
  return arr;
}
function px(node, styleProperty) {
  const win = node.ownerDocument.defaultView || window;
  const val = win.getComputedStyle(node).getPropertyValue(styleProperty);
  return val ? parseFloat(val.replace("px", "")) : 0;
}
function getNodeWidth(node) {
  const leftBorder = px(node, "border-left-width");
  const rightBorder = px(node, "border-right-width");
  return node.clientWidth + leftBorder + rightBorder;
}
function getNodeHeight(node) {
  const topBorder = px(node, "border-top-width");
  const bottomBorder = px(node, "border-bottom-width");
  return node.clientHeight + topBorder + bottomBorder;
}
function getImageSize(targetNode, options = {}) {
  const width = options.width || getNodeWidth(targetNode);
  const height = options.height || getNodeHeight(targetNode);
  return { width, height };
}
function getPixelRatio() {
  let ratio;
  let FINAL_PROCESS;
  try {
    FINAL_PROCESS = process;
  } catch (e2) {
  }
  const val = FINAL_PROCESS && FINAL_PROCESS.env ? FINAL_PROCESS.env.devicePixelRatio : null;
  if (val) {
    ratio = parseInt(val, 10);
    if (Number.isNaN(ratio)) {
      ratio = 1;
    }
  }
  return ratio || window.devicePixelRatio || 1;
}
const canvasDimensionLimit = 16384;
function checkCanvasDimensions(canvas) {
  if (canvas.width > canvasDimensionLimit || canvas.height > canvasDimensionLimit) {
    if (canvas.width > canvasDimensionLimit && canvas.height > canvasDimensionLimit) {
      if (canvas.width > canvas.height) {
        canvas.height *= canvasDimensionLimit / canvas.width;
        canvas.width = canvasDimensionLimit;
      } else {
        canvas.width *= canvasDimensionLimit / canvas.height;
        canvas.height = canvasDimensionLimit;
      }
    } else if (canvas.width > canvasDimensionLimit) {
      canvas.height *= canvasDimensionLimit / canvas.width;
      canvas.width = canvasDimensionLimit;
    } else {
      canvas.width *= canvasDimensionLimit / canvas.height;
      canvas.height = canvasDimensionLimit;
    }
  }
}
function canvasToBlob(canvas, options = {}) {
  if (canvas.toBlob) {
    return new Promise((resolve) => {
      canvas.toBlob(resolve, options.type ? options.type : "image/png", options.quality ? options.quality : 1);
    });
  }
  return new Promise((resolve) => {
    const binaryString = window.atob(canvas.toDataURL(options.type ? options.type : void 0, options.quality ? options.quality : void 0).split(",")[1]);
    const len = binaryString.length;
    const binaryArray = new Uint8Array(len);
    for (let i2 = 0; i2 < len; i2 += 1) {
      binaryArray[i2] = binaryString.charCodeAt(i2);
    }
    resolve(new Blob([binaryArray], {
      type: options.type ? options.type : "image/png"
    }));
  });
}
function createImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decode = () => resolve(img);
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = url;
  });
}
async function svgToDataURL(svg) {
  return Promise.resolve().then(() => new XMLSerializer().serializeToString(svg)).then(encodeURIComponent).then((html) => `data:image/svg+xml;charset=utf-8,${html}`);
}
async function nodeToDataURL(node, width, height) {
  const xmlns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(xmlns, "svg");
  const foreignObject = document.createElementNS(xmlns, "foreignObject");
  svg.setAttribute("width", `${width}`);
  svg.setAttribute("height", `${height}`);
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  foreignObject.setAttribute("width", "100%");
  foreignObject.setAttribute("height", "100%");
  foreignObject.setAttribute("x", "0");
  foreignObject.setAttribute("y", "0");
  foreignObject.setAttribute("externalResourcesRequired", "true");
  svg.appendChild(foreignObject);
  foreignObject.appendChild(node);
  return svgToDataURL(svg);
}
const isInstanceOfElement = (node, instance) => {
  if (node instanceof instance)
    return true;
  const nodePrototype = Object.getPrototypeOf(node);
  if (nodePrototype === null)
    return false;
  return nodePrototype.constructor.name === instance.name || isInstanceOfElement(nodePrototype, instance);
};
function formatCSSText(style) {
  const content = style.getPropertyValue("content");
  return `${style.cssText} content: '${content.replace(/'|"/g, "")}';`;
}
function formatCSSProperties(style) {
  return toArray$1(style).map((name) => {
    const value = style.getPropertyValue(name);
    const priority = style.getPropertyPriority(name);
    return `${name}: ${value}${priority ? " !important" : ""};`;
  }).join(" ");
}
function getPseudoElementStyle(className, pseudo, style) {
  const selector = `.${className}:${pseudo}`;
  const cssText = style.cssText ? formatCSSText(style) : formatCSSProperties(style);
  return document.createTextNode(`${selector}{${cssText}}`);
}
function clonePseudoElement(nativeNode, clonedNode, pseudo) {
  const style = window.getComputedStyle(nativeNode, pseudo);
  const content = style.getPropertyValue("content");
  if (content === "" || content === "none") {
    return;
  }
  const className = uuid();
  try {
    clonedNode.className = `${clonedNode.className} ${className}`;
  } catch (err) {
    return;
  }
  const styleElement = document.createElement("style");
  styleElement.appendChild(getPseudoElementStyle(className, pseudo, style));
  clonedNode.appendChild(styleElement);
}
function clonePseudoElements(nativeNode, clonedNode) {
  clonePseudoElement(nativeNode, clonedNode, ":before");
  clonePseudoElement(nativeNode, clonedNode, ":after");
}
const WOFF = "application/font-woff";
const JPEG = "image/jpeg";
const mimes = {
  woff: WOFF,
  woff2: WOFF,
  ttf: "application/font-truetype",
  eot: "application/vnd.ms-fontobject",
  png: "image/png",
  jpg: JPEG,
  jpeg: JPEG,
  gif: "image/gif",
  tiff: "image/tiff",
  svg: "image/svg+xml",
  webp: "image/webp"
};
function getExtension(url) {
  const match = /\.([^./]*?)$/g.exec(url);
  return match ? match[1] : "";
}
function getMimeType(url) {
  const extension = getExtension(url).toLowerCase();
  return mimes[extension] || "";
}
function getContentFromDataUrl(dataURL) {
  return dataURL.split(/,/)[1];
}
function isDataUrl(url) {
  return url.search(/^(data:)/) !== -1;
}
function makeDataUrl(content, mimeType) {
  return `data:${mimeType};base64,${content}`;
}
async function fetchAsDataURL(url, init, process2) {
  const res = await fetch(url, init);
  if (res.status === 404) {
    throw new Error(`Resource "${res.url}" not found`);
  }
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onloadend = () => {
      try {
        resolve(process2({ res, result: reader.result }));
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsDataURL(blob);
  });
}
const cache = {};
function getCacheKey(url, contentType, includeQueryParams) {
  let key = url.replace(/\?.*/, "");
  if (includeQueryParams) {
    key = url;
  }
  if (/ttf|otf|eot|woff2?/i.test(key)) {
    key = key.replace(/.*\//, "");
  }
  return contentType ? `[${contentType}]${key}` : key;
}
async function resourceToDataURL(resourceUrl, contentType, options) {
  const cacheKey = getCacheKey(resourceUrl, contentType, options.includeQueryParams);
  if (cache[cacheKey] != null) {
    return cache[cacheKey];
  }
  if (options.cacheBust) {
    resourceUrl += (/\?/.test(resourceUrl) ? "&" : "?") + (/* @__PURE__ */ new Date()).getTime();
  }
  let dataURL;
  try {
    const content = await fetchAsDataURL(resourceUrl, options.fetchRequestInit, ({ res, result }) => {
      if (!contentType) {
        contentType = res.headers.get("Content-Type") || "";
      }
      return getContentFromDataUrl(result);
    });
    dataURL = makeDataUrl(content, contentType);
  } catch (error) {
    dataURL = options.imagePlaceholder || "";
    let msg = `Failed to fetch resource: ${resourceUrl}`;
    if (error) {
      msg = typeof error === "string" ? error : error.message;
    }
    if (msg) {
      console.warn(msg);
    }
  }
  cache[cacheKey] = dataURL;
  return dataURL;
}
async function cloneCanvasElement(canvas) {
  const dataURL = canvas.toDataURL();
  if (dataURL === "data:,") {
    return canvas.cloneNode(false);
  }
  return createImage(dataURL);
}
async function cloneVideoElement(video, options) {
  if (video.currentSrc) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    ctx === null || ctx === void 0 ? void 0 : ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataURL2 = canvas.toDataURL();
    return createImage(dataURL2);
  }
  const poster = video.poster;
  const contentType = getMimeType(poster);
  const dataURL = await resourceToDataURL(poster, contentType, options);
  return createImage(dataURL);
}
async function cloneIFrameElement(iframe) {
  var _a;
  try {
    if ((_a = iframe === null || iframe === void 0 ? void 0 : iframe.contentDocument) === null || _a === void 0 ? void 0 : _a.body) {
      return await cloneNode(iframe.contentDocument.body, {}, true);
    }
  } catch (_b) {
  }
  return iframe.cloneNode(false);
}
async function cloneSingleNode(node, options) {
  if (isInstanceOfElement(node, HTMLCanvasElement)) {
    return cloneCanvasElement(node);
  }
  if (isInstanceOfElement(node, HTMLVideoElement)) {
    return cloneVideoElement(node, options);
  }
  if (isInstanceOfElement(node, HTMLIFrameElement)) {
    return cloneIFrameElement(node);
  }
  return node.cloneNode(false);
}
const isSlotElement = (node) => node.tagName != null && node.tagName.toUpperCase() === "SLOT";
async function cloneChildren(nativeNode, clonedNode, options) {
  var _a, _b;
  let children = [];
  if (isSlotElement(nativeNode) && nativeNode.assignedNodes) {
    children = toArray$1(nativeNode.assignedNodes());
  } else if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && ((_a = nativeNode.contentDocument) === null || _a === void 0 ? void 0 : _a.body)) {
    children = toArray$1(nativeNode.contentDocument.body.childNodes);
  } else {
    children = toArray$1(((_b = nativeNode.shadowRoot) !== null && _b !== void 0 ? _b : nativeNode).childNodes);
  }
  if (children.length === 0 || isInstanceOfElement(nativeNode, HTMLVideoElement)) {
    return clonedNode;
  }
  await children.reduce((deferred, child) => deferred.then(() => cloneNode(child, options)).then((clonedChild) => {
    if (clonedChild) {
      clonedNode.appendChild(clonedChild);
    }
  }), Promise.resolve());
  return clonedNode;
}
function cloneCSSStyle(nativeNode, clonedNode) {
  const targetStyle = clonedNode.style;
  if (!targetStyle) {
    return;
  }
  const sourceStyle = window.getComputedStyle(nativeNode);
  if (sourceStyle.cssText) {
    targetStyle.cssText = sourceStyle.cssText;
    targetStyle.transformOrigin = sourceStyle.transformOrigin;
  } else {
    toArray$1(sourceStyle).forEach((name) => {
      let value = sourceStyle.getPropertyValue(name);
      if (name === "font-size" && value.endsWith("px")) {
        const reducedFont = Math.floor(parseFloat(value.substring(0, value.length - 2))) - 0.1;
        value = `${reducedFont}px`;
      }
      if (isInstanceOfElement(nativeNode, HTMLIFrameElement) && name === "display" && value === "inline") {
        value = "block";
      }
      if (name === "d" && clonedNode.getAttribute("d")) {
        value = `path(${clonedNode.getAttribute("d")})`;
      }
      targetStyle.setProperty(name, value, sourceStyle.getPropertyPriority(name));
    });
  }
}
function cloneInputValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLTextAreaElement)) {
    clonedNode.innerHTML = nativeNode.value;
  }
  if (isInstanceOfElement(nativeNode, HTMLInputElement)) {
    clonedNode.setAttribute("value", nativeNode.value);
  }
}
function cloneSelectValue(nativeNode, clonedNode) {
  if (isInstanceOfElement(nativeNode, HTMLSelectElement)) {
    const clonedSelect = clonedNode;
    const selectedOption = Array.from(clonedSelect.children).find((child) => nativeNode.value === child.getAttribute("value"));
    if (selectedOption) {
      selectedOption.setAttribute("selected", "");
    }
  }
}
function decorate(nativeNode, clonedNode) {
  if (isInstanceOfElement(clonedNode, Element)) {
    cloneCSSStyle(nativeNode, clonedNode);
    clonePseudoElements(nativeNode, clonedNode);
    cloneInputValue(nativeNode, clonedNode);
    cloneSelectValue(nativeNode, clonedNode);
  }
  return clonedNode;
}
async function ensureSVGSymbols(clone, options) {
  const uses = clone.querySelectorAll ? clone.querySelectorAll("use") : [];
  if (uses.length === 0) {
    return clone;
  }
  const processedDefs = {};
  for (let i2 = 0; i2 < uses.length; i2++) {
    const use = uses[i2];
    const id = use.getAttribute("xlink:href");
    if (id) {
      const exist = clone.querySelector(id);
      const definition = document.querySelector(id);
      if (!exist && definition && !processedDefs[id]) {
        processedDefs[id] = await cloneNode(definition, options, true);
      }
    }
  }
  const nodes = Object.values(processedDefs);
  if (nodes.length) {
    const ns = "http://www.w3.org/1999/xhtml";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("xmlns", ns);
    svg.style.position = "absolute";
    svg.style.width = "0";
    svg.style.height = "0";
    svg.style.overflow = "hidden";
    svg.style.display = "none";
    const defs = document.createElementNS(ns, "defs");
    svg.appendChild(defs);
    for (let i2 = 0; i2 < nodes.length; i2++) {
      defs.appendChild(nodes[i2]);
    }
    clone.appendChild(svg);
  }
  return clone;
}
async function cloneNode(node, options, isRoot) {
  if (!isRoot && options.filter && !options.filter(node)) {
    return null;
  }
  return Promise.resolve(node).then((clonedNode) => cloneSingleNode(clonedNode, options)).then((clonedNode) => cloneChildren(node, clonedNode, options)).then((clonedNode) => decorate(node, clonedNode)).then((clonedNode) => ensureSVGSymbols(clonedNode, options));
}
const URL_REGEX = /url\((['"]?)([^'"]+?)\1\)/g;
const URL_WITH_FORMAT_REGEX = /url\([^)]+\)\s*format\((["']?)([^"']+)\1\)/g;
const FONT_SRC_REGEX = /src:\s*(?:url\([^)]+\)\s*format\([^)]+\)[,;]\s*)+/g;
function toRegex(url) {
  const escaped = url.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  return new RegExp(`(url\\(['"]?)(${escaped})(['"]?\\))`, "g");
}
function parseURLs(cssText) {
  const urls = [];
  cssText.replace(URL_REGEX, (raw, quotation, url) => {
    urls.push(url);
    return raw;
  });
  return urls.filter((url) => !isDataUrl(url));
}
async function embed(cssText, resourceURL, baseURL, options, getContentFromUrl) {
  try {
    const resolvedURL = baseURL ? resolveUrl(resourceURL, baseURL) : resourceURL;
    const contentType = getMimeType(resourceURL);
    let dataURL;
    if (getContentFromUrl) ;
    else {
      dataURL = await resourceToDataURL(resolvedURL, contentType, options);
    }
    return cssText.replace(toRegex(resourceURL), `$1${dataURL}$3`);
  } catch (error) {
  }
  return cssText;
}
function filterPreferredFontFormat(str, { preferredFontFormat }) {
  return !preferredFontFormat ? str : str.replace(FONT_SRC_REGEX, (match) => {
    while (true) {
      const [src, , format] = URL_WITH_FORMAT_REGEX.exec(match) || [];
      if (!format) {
        return "";
      }
      if (format === preferredFontFormat) {
        return `src: ${src};`;
      }
    }
  });
}
function shouldEmbed(url) {
  return url.search(URL_REGEX) !== -1;
}
async function embedResources(cssText, baseUrl, options) {
  if (!shouldEmbed(cssText)) {
    return cssText;
  }
  const filteredCSSText = filterPreferredFontFormat(cssText, options);
  const urls = parseURLs(filteredCSSText);
  return urls.reduce((deferred, url) => deferred.then((css) => embed(css, url, baseUrl, options)), Promise.resolve(filteredCSSText));
}
async function embedProp(propName, node, options) {
  var _a;
  const propValue = (_a = node.style) === null || _a === void 0 ? void 0 : _a.getPropertyValue(propName);
  if (propValue) {
    const cssString = await embedResources(propValue, null, options);
    node.style.setProperty(propName, cssString, node.style.getPropertyPriority(propName));
    return true;
  }
  return false;
}
async function embedBackground(clonedNode, options) {
  if (!await embedProp("background", clonedNode, options)) {
    await embedProp("background-image", clonedNode, options);
  }
  if (!await embedProp("mask", clonedNode, options)) {
    await embedProp("mask-image", clonedNode, options);
  }
}
async function embedImageNode(clonedNode, options) {
  const isImageElement = isInstanceOfElement(clonedNode, HTMLImageElement);
  if (!(isImageElement && !isDataUrl(clonedNode.src)) && !(isInstanceOfElement(clonedNode, SVGImageElement) && !isDataUrl(clonedNode.href.baseVal))) {
    return;
  }
  const url = isImageElement ? clonedNode.src : clonedNode.href.baseVal;
  const dataURL = await resourceToDataURL(url, getMimeType(url), options);
  await new Promise((resolve, reject) => {
    clonedNode.onload = resolve;
    clonedNode.onerror = reject;
    const image = clonedNode;
    if (image.decode) {
      image.decode = resolve;
    }
    if (image.loading === "lazy") {
      image.loading = "eager";
    }
    if (isImageElement) {
      clonedNode.srcset = "";
      clonedNode.src = dataURL;
    } else {
      clonedNode.href.baseVal = dataURL;
    }
  });
}
async function embedChildren(clonedNode, options) {
  const children = toArray$1(clonedNode.childNodes);
  const deferreds = children.map((child) => embedImages(child, options));
  await Promise.all(deferreds).then(() => clonedNode);
}
async function embedImages(clonedNode, options) {
  if (isInstanceOfElement(clonedNode, Element)) {
    await embedBackground(clonedNode, options);
    await embedImageNode(clonedNode, options);
    await embedChildren(clonedNode, options);
  }
}
function applyStyle(node, options) {
  const { style } = node;
  if (options.backgroundColor) {
    style.backgroundColor = options.backgroundColor;
  }
  if (options.width) {
    style.width = `${options.width}px`;
  }
  if (options.height) {
    style.height = `${options.height}px`;
  }
  const manual = options.style;
  if (manual != null) {
    Object.keys(manual).forEach((key) => {
      style[key] = manual[key];
    });
  }
  return node;
}
const cssFetchCache = {};
async function fetchCSS(url) {
  let cache2 = cssFetchCache[url];
  if (cache2 != null) {
    return cache2;
  }
  const res = await fetch(url);
  const cssText = await res.text();
  cache2 = { url, cssText };
  cssFetchCache[url] = cache2;
  return cache2;
}
async function embedFonts(data, options) {
  let cssText = data.cssText;
  const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
  const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
  const loadFonts = fontLocs.map(async (loc) => {
    let url = loc.replace(regexUrl, "$1");
    if (!url.startsWith("https://")) {
      url = new URL(url, data.url).href;
    }
    return fetchAsDataURL(url, options.fetchRequestInit, ({ result }) => {
      cssText = cssText.replace(loc, `url(${result})`);
      return [loc, result];
    });
  });
  return Promise.all(loadFonts).then(() => cssText);
}
function parseCSS(source) {
  if (source == null) {
    return [];
  }
  const result = [];
  const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
  let cssText = source.replace(commentsRegex, "");
  const keyframesRegex = new RegExp("((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})", "gi");
  while (true) {
    const matches = keyframesRegex.exec(cssText);
    if (matches === null) {
      break;
    }
    result.push(matches[0]);
  }
  cssText = cssText.replace(keyframesRegex, "");
  const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
  const combinedCSSRegex = "((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})";
  const unifiedRegex = new RegExp(combinedCSSRegex, "gi");
  while (true) {
    let matches = importRegex.exec(cssText);
    if (matches === null) {
      matches = unifiedRegex.exec(cssText);
      if (matches === null) {
        break;
      } else {
        importRegex.lastIndex = unifiedRegex.lastIndex;
      }
    } else {
      unifiedRegex.lastIndex = importRegex.lastIndex;
    }
    result.push(matches[0]);
  }
  return result;
}
async function getCSSRules(styleSheets, options) {
  const ret = [];
  const deferreds = [];
  styleSheets.forEach((sheet) => {
    if ("cssRules" in sheet) {
      try {
        toArray$1(sheet.cssRules || []).forEach((item, index) => {
          if (item.type === CSSRule.IMPORT_RULE) {
            let importIndex = index + 1;
            const url = item.href;
            const deferred = fetchCSS(url).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
              try {
                sheet.insertRule(rule, rule.startsWith("@import") ? importIndex += 1 : sheet.cssRules.length);
              } catch (error) {
                console.error("Error inserting rule from remote css", {
                  rule,
                  error
                });
              }
            })).catch((e2) => {
              console.error("Error loading remote css", e2.toString());
            });
            deferreds.push(deferred);
          }
        });
      } catch (e2) {
        const inline = styleSheets.find((a2) => a2.href == null) || document.styleSheets[0];
        if (sheet.href != null) {
          deferreds.push(fetchCSS(sheet.href).then((metadata) => embedFonts(metadata, options)).then((cssText) => parseCSS(cssText).forEach((rule) => {
            inline.insertRule(rule, sheet.cssRules.length);
          })).catch((err) => {
            console.error("Error loading remote stylesheet", err);
          }));
        }
        console.error("Error inlining remote css file", e2);
      }
    }
  });
  return Promise.all(deferreds).then(() => {
    styleSheets.forEach((sheet) => {
      if ("cssRules" in sheet) {
        try {
          toArray$1(sheet.cssRules || []).forEach((item) => {
            ret.push(item);
          });
        } catch (e2) {
          console.error(`Error while reading CSS rules from ${sheet.href}`, e2);
        }
      }
    });
    return ret;
  });
}
function getWebFontRules(cssRules) {
  return cssRules.filter((rule) => rule.type === CSSRule.FONT_FACE_RULE).filter((rule) => shouldEmbed(rule.style.getPropertyValue("src")));
}
async function parseWebFontRules(node, options) {
  if (node.ownerDocument == null) {
    throw new Error("Provided element is not within a Document");
  }
  const styleSheets = toArray$1(node.ownerDocument.styleSheets);
  const cssRules = await getCSSRules(styleSheets, options);
  return getWebFontRules(cssRules);
}
async function getWebFontCSS(node, options) {
  const rules = await parseWebFontRules(node, options);
  const cssTexts = await Promise.all(rules.map((rule) => {
    const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
    return embedResources(rule.cssText, baseUrl, options);
  }));
  return cssTexts.join("\n");
}
async function embedWebFonts(clonedNode, options) {
  const cssText = options.fontEmbedCSS != null ? options.fontEmbedCSS : options.skipFonts ? null : await getWebFontCSS(clonedNode, options);
  if (cssText) {
    const styleNode = document.createElement("style");
    const sytleContent = document.createTextNode(cssText);
    styleNode.appendChild(sytleContent);
    if (clonedNode.firstChild) {
      clonedNode.insertBefore(styleNode, clonedNode.firstChild);
    } else {
      clonedNode.appendChild(styleNode);
    }
  }
}
async function toSvg(node, options = {}) {
  const { width, height } = getImageSize(node, options);
  const clonedNode = await cloneNode(node, options, true);
  await embedWebFonts(clonedNode, options);
  await embedImages(clonedNode, options);
  applyStyle(clonedNode, options);
  const datauri = await nodeToDataURL(clonedNode, width, height);
  return datauri;
}
async function toCanvas(node, options = {}) {
  const { width, height } = getImageSize(node, options);
  const svg = await toSvg(node, options);
  const img = await createImage(svg);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const ratio = options.pixelRatio || getPixelRatio();
  const canvasWidth = options.canvasWidth || width;
  const canvasHeight = options.canvasHeight || height;
  canvas.width = canvasWidth * ratio;
  canvas.height = canvasHeight * ratio;
  if (!options.skipAutoScale) {
    checkCanvasDimensions(canvas);
  }
  canvas.style.width = `${canvasWidth}`;
  canvas.style.height = `${canvasHeight}`;
  if (options.backgroundColor) {
    context.fillStyle = options.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}
async function toPng(node, options = {}) {
  const canvas = await toCanvas(node, options);
  return canvas.toDataURL();
}
async function toBlob(node, options = {}) {
  const canvas = await toCanvas(node, options);
  const blob = await canvasToBlob(canvas);
  return blob;
}
function useImgAlternative(elementHtml, callback, download = true, imageCounting = 4) {
  return new Promise((resolve, reject) => {
    const originalElement = elementHtml;
    originalElement.style.zoom = "normal";
    originalElement.classList.remove("gridx4");
    const replicElement = originalElement.querySelector("#forImg-canvas02");
    if (replicElement) replicElement.remove();
    const htmlForImg = originalElement.cloneNode(true);
    htmlForImg.id = "forImg-canvas02";
    originalElement.appendChild(htmlForImg);
    htmlForImg.classList.add("box-imgComponenContent-alternative");
    Array.from(htmlForImg.children).forEach((element, index, arr) => {
      element.style.maxHeight = "unset";
      element.style.display = "none";
      const labelEl = element.querySelector(".dropzone__label") || element.querySelector(".box-text");
      const imgEl = element.querySelector(".dropzone__img") || element.querySelector(".box-img");
      const deleteEl = element.querySelector(".dropzone__action-btn--delete") || element.querySelector(".box-deleteimg");
      const areaEl = element.querySelector(".dropzone__area") || element.querySelector(".box-imgContain");
      if (labelEl) labelEl.classList.add("text-alternative");
      if (imgEl) imgEl.classList.add("box-img-alternative");
      if (deleteEl) deleteEl.style.display = "none";
      const altEl = element.querySelector(".text-alternative");
      if (altEl) {
        altEl.style.display = "flex";
        altEl.style.height = "30px";
      }
      if (areaEl) {
        areaEl.style.width = "100%";
        areaEl.style.height = "100%";
      }
      element.style.height = "300px";
      element.style.width = "550px";
      if (imageCounting === 1) {
        if (index === 0) element.style.display = "block";
        if (labelEl) labelEl.style.display = "none";
      } else if (imageCounting === 2) {
        if (index === 0 || index === arr.length - 1) element.style.display = "block";
      } else if (imageCounting === 4) {
        element.style.display = "block";
      }
    });
    toBlob(htmlForImg).then((dataUrl) => {
      resolve(dataUrl);
    }).catch((err) => {
      reject(err);
    }).finally(() => {
      htmlForImg.remove();
      originalElement.classList.add("gridx4");
    });
  });
}
function FieldInput({
  type = "text",
  label,
  value,
  onChange,
  required = false,
  placeholder = "",
  options = [],
  trueLabel = "Sí",
  falseLabel = "No",
  name,
  ...inputProps
}) {
  const body = renderByType({
    type,
    value,
    onChange,
    required,
    placeholder,
    options,
    trueLabel,
    falseLabel,
    name,
    inputProps
  });
  if (type === "checkbox") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fi-wrap", children: [
      label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "fi-label", children: label }),
      body
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "fi-wrap", children: [
    label && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "fi-label", children: label }),
    body
  ] });
}
function renderByType(p) {
  switch (p.type) {
    case "hour":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(HourField, { ...p });
    case "number":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(NumberField, { ...p });
    case "checkbox":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxField, { ...p });
    case "radio":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(RadioField, { ...p });
    case "select":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { ...p });
    case "textarea":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(TextAreaField, { ...p });
    case "text":
    default:
      return /* @__PURE__ */ jsxRuntimeExports.jsx(TextField, { ...p });
  }
}
function TextField({ value, onChange, required, placeholder, name, inputProps }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      type: "text",
      className: "fi-input",
      name,
      value: value ?? "",
      required,
      placeholder,
      onChange: (e2) => onChange(e2.target.value),
      ...inputProps
    }
  );
}
function NumberField({ value, onChange, required, placeholder, name, inputProps }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      type: "text",
      inputMode: "numeric",
      className: "fi-input",
      name,
      value: value ?? "",
      required,
      placeholder,
      onChange: (e2) => {
        const raw = e2.target.value;
        if (raw === "" || /^-?\d*\.?\d*$/.test(raw)) {
          onChange(raw === "" ? "" : Number(raw));
        }
      },
      ...inputProps
    }
  );
}
function TextAreaField({ value, onChange, required, placeholder, name, inputProps }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "textarea",
    {
      className: "fi-textarea",
      name,
      value: value ?? "",
      required,
      placeholder,
      spellCheck: "true",
      onChange: (e2) => onChange(e2.target.value),
      ...inputProps
    }
  );
}
function SelectField({ value, onChange, required, options, placeholder, name, inputProps }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "select",
    {
      className: "fi-select",
      name,
      value: value ?? "",
      required,
      onChange: (e2) => onChange(e2.target.value),
      ...inputProps,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: placeholder || "Selecciona…" }),
        options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.text }, opt.value))
      ]
    }
  );
}
function CheckboxField({ value, onChange, trueLabel, falseLabel, name }) {
  const checked = Boolean(value);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "fi-toggle", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "checkbox",
        className: "fi-toggle__input",
        name,
        checked,
        onChange: (e2) => onChange(e2.target.checked)
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "fi-toggle__switch" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "fi-toggle__text", children: checked ? trueLabel : falseLabel })
  ] });
}
function RadioField({ value, onChange, options, name }) {
  const groupName = name || `fi-radio-${Math.random().toString(36).slice(2, 8)}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fi-radio-group", children: options.map((opt) => {
    const selected = String(value) === String(opt.value);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `fi-radio${selected ? " fi-radio--on" : ""}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          type: "radio",
          className: "fi-radio__input",
          name: groupName,
          value: opt.value,
          checked: selected,
          onChange: () => onChange(opt.value)
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "fi-radio__dot" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "fi-radio__text", children: opt.text })
    ] }, opt.value);
  }) });
}
function HourField({ value, onChange, required, name }) {
  const refs = [reactExports.useRef(null), reactExports.useRef(null), reactExports.useRef(null)];
  const [touched, setTouched] = reactExports.useState(false);
  const max = [23, 59, 59];
  const parse = (v) => {
    const [h = "00", m = "00", s = "00"] = (v || "00:00:00").split(":");
    return [h.slice(0, 2), m.slice(0, 2), s.slice(0, 2)];
  };
  const segRef = reactExports.useRef(parse(value));
  const fresh = reactExports.useRef([true, true, true]);
  const external = parse(value).join(":");
  if (external !== segRef.current.join(":") && document.activeElement !== refs[0].current && document.activeElement !== refs[1].current && document.activeElement !== refs[2].current) {
    segRef.current = parse(value);
  }
  const segments = segRef.current;
  const commit = () => onChange(segRef.current.join(":"));
  const focusSeg = (i2) => {
    refs[i2].current?.focus();
    refs[i2].current?.select();
    fresh.current[i2] = true;
  };
  const handleKeyDown = (i2, e2) => {
    if (/^\d$/.test(e2.key)) {
      e2.preventDefault();
      if (!touched) setTouched(true);
      const current = segRef.current[i2];
      let seg = fresh.current[i2] ? e2.key : (current + e2.key).slice(-2);
      if (Number(seg) > max[i2]) seg = e2.key;
      segRef.current[i2] = seg;
      fresh.current[i2] = false;
      commit();
      if (seg.length === 2 && i2 < 2) focusSeg(i2 + 1);
      return;
    }
    if (e2.key === "Backspace") {
      e2.preventDefault();
      if (segRef.current[i2].length > 0 && !fresh.current[i2]) {
        segRef.current[i2] = segRef.current[i2].slice(0, -1);
        commit();
      } else if (i2 > 0) {
        focusSeg(i2 - 1);
      }
      fresh.current[i2] = false;
      return;
    }
    if ((e2.key === ":" || e2.key === " ") && i2 < 2) {
      e2.preventDefault();
      focusSeg(i2 + 1);
      return;
    }
    if (e2.key === "ArrowRight" && i2 < 2) {
      e2.preventDefault();
      focusSeg(i2 + 1);
      return;
    }
    if (e2.key === "ArrowLeft" && i2 > 0) {
      e2.preventDefault();
      focusSeg(i2 - 1);
      return;
    }
  };
  const handlePaste = (i2, e2) => {
    e2.preventDefault();
    const digits = (e2.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    if (!touched) setTouched(true);
    const padded = digits.padEnd(6, "0");
    segRef.current = [padded.slice(0, 2), padded.slice(2, 4), padded.slice(4, 6)].map((p, idx) => Number(p) > max[idx] ? "00" : p);
    fresh.current = [false, false, false];
    commit();
  };
  const handleBlur = (i2) => {
    segRef.current[i2] = (segRef.current[i2] || "0").padStart(2, "0");
    fresh.current[i2] = true;
    commit();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fi-hour", style: { position: "relative" }, "data-name": name, children: [
    required && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "text",
        name,
        value: touched ? value || "00:00:00" : "",
        required: true,
        tabIndex: -1,
        "aria-hidden": "true",
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          padding: 0,
          margin: 0,
          border: 0,
          opacity: 0,
          pointerEvents: "none",
          overflow: "hidden"
        },
        onChange: () => {
        }
      }
    ),
    segments.map((seg, i2) => /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "fi-hour__seg", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: refs[i2],
          type: "text",
          inputMode: "numeric",
          maxLength: 2,
          placeholder: "00",
          className: "fi-hour__input",
          value: seg,
          readOnly: true,
          onKeyDown: (e2) => handleKeyDown(i2, e2),
          onPaste: (e2) => handlePaste(i2, e2),
          onFocus: (e2) => {
            e2.target.select();
            fresh.current[i2] = true;
          },
          onBlur: () => handleBlur(i2),
          onChange: () => {
          }
        }
      ),
      i2 < 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "fi-hour__colon", children: ":" })
    ] }, i2))
  ] });
}
const getFileToastPos = (id) => {
  return new Promise((resolve, reject) => {
    axiosInstance.get(`${IP}/noventy/imageToasdPos?id=${id}`).then((response) => resolve(response)).catch((error) => reject(error));
  });
};
const deleteFileToasPos = (id) => {
  return new Promise((resolve, reject) => {
    axiosInstance.delete(`${IP}/noventy/imageToasdPos?id=${id}`).then((response) => resolve(response)).catch((error) => reject(error));
  });
};
function calculateTime(time1, time2) {
  if (!time1 && !time2) return "";
  let hourTotal = time2.split(":")[0] - time1.split(":")[0];
  let minuteTotal = time2.split(":")[1] - time1.split(":")[1];
  let secondTotal = time2.split(":")[2] - time1.split(":")[2];
  if (secondTotal < 0) {
    secondTotal = 60 - Math.abs(secondTotal);
    --minuteTotal;
  }
  if (minuteTotal < 0) {
    minuteTotal = 60 - Math.abs(minuteTotal);
    --hourTotal;
  }
  if (minuteTotal < 10) minuteTotal = `0${minuteTotal}`;
  if (secondTotal < 10) secondTotal = `0${secondTotal}`;
  if (hourTotal < 9) hourTotal = `0${hourTotal}`;
  return ` ${isNaN(hourTotal) ? "❌" : hourTotal}:${isNaN(minuteTotal) ? "❌" : minuteTotal}:${isNaN(secondTotal) ? "❌" : secondTotal}`;
}
function toSeconds(time) {
  if (typeof time !== "string") return NaN;
  const parts = time.trim().split(":");
  if (parts.length !== 3) return NaN;
  const [h, m, s] = parts.map(Number);
  if ([h, m, s].some(Number.isNaN)) return NaN;
  return h * 3600 + m * 60 + s;
}
function toHHMMSS(totalSeconds) {
  const pad = (n2) => String(n2).padStart(2, "0");
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds % 3600 / 60);
  const s = totalSeconds % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}
function getTimeReport(startTime, endTime, timeLimit) {
  const start = toSeconds(startTime);
  const end = toSeconds(endTime);
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return { timeTotal: "❌:❌:❌", exceeded: null };
  }
  const totalSeconds = end - start;
  const timeTotal = toHHMMSS(totalSeconds);
  const limit = toSeconds(timeLimit);
  const exceeded = Number.isNaN(limit) ? null : totalSeconds > limit;
  return { timeTotal, exceeded };
}
const base64ToFile = (base64, filename) => {
  let arr = base64.split(","), mime = arr[0].match(/:(.*?);/)[1], bstr = atob(arr[1]), n2 = bstr.length, u8arr = new Uint8Array(n2);
  while (n2--) {
    u8arr[n2] = bstr.charCodeAt(n2);
  }
  return new File([u8arr], filename, { type: mime });
};
const blobToFile = (blob) => {
  const newFile = new File([blob], "reporte.png", {
    type: blob.type,
    lastModified: Date.now()
  });
  return newFile;
};
function FormLayaut({
  title,
  icon: icon2,
  description,
  btnLabel = "Enviar",
  hiddenBtn = false,
  event,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      className: "w-full items-center justify-center",
      onSubmit: event,
      style: {
        height: "100%",
        overflowY: "scroll",
        background: "rgba(3, 12, 26, 0.82)",
        border: "1.5px solid rgba(0, 185, 255, 0.22)",
        borderRadius: "18px",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: "0 0 40px rgba(0, 119, 255, 0.34), 0 25px 70px rgba(0, 0, 0, 0.66)"
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          width: "100%",
          background: "linear-gradient(135deg, rgb(1 49 68) 0%, rgb(1 21 40 / 97%) 100%)",
          borderBottom: "1px solid rgba(0, 185, 255, 0.18)",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          position: "sticky",
          top: 0,
          zIndex: "100"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "3px",
            background: "linear-gradient(to bottom, #00b9ff, #39ff14)",
            borderRadius: "0 2px 2px 0"
          } }),
          icon2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: icon2,
              alt: "",
              draggable: false,
              style: {
                width: "35px",
                height: "35px",
                objectFit: "contain",
                flexShrink: 0,
                filter: "drop-shadow(0 0 8px rgba(0, 185, 255, 0.65))"
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: {
              color: "rgba(210, 238, 255, 0.95)",
              textShadow: "0 0 12px rgba(0, 185, 255, 0.35), 0 0 24px rgba(0, 185, 255, 0.15)",
              fontSize: "1.1rem",
              fontWeight: 700,
              letterSpacing: "0.6px",
              margin: 0
            }, children: title }),
            description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
              color: "rgba(0, 185, 255, 0.5)",
              fontSize: "0.72rem",
              fontWeight: 600,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              margin: "0.25rem 0 0 0"
            }, children: description })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full flex flex-col justify-center items-center gap-[1rem]", style: { padding: "1.25rem" }, children: [
          children,
          !hiddenBtn && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full flex justify-center items-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "btnSend", children: btnLabel }) })
        ] })
      ]
    }
  );
}
function returnTimeExceding(time, timelimit) {
  const hour = Number(time.split(":")[0]);
  const minute = Number(time.split(":")[1]);
  const second = Number(time.split(":")[2]);
  let hourLimit = Number(timelimit.split(":")[0]);
  let minuteLimit = Number(timelimit.split(":")[1]);
  let secondLimit = Number(timelimit.split(":")[2]);
  let timeDecimal = hour + minute / 60 + second / 3600;
  let timeLimitDecimal = hourLimit + minuteLimit / 60 + secondLimit / 3600;
  const result = timeDecimal - timeLimitDecimal;
  let hourResult = Math.floor(result);
  let minuteResultDecimal = (result - Number(hourResult)) * 60;
  let minuteResult = Math.floor(minuteResultDecimal);
  let secondResult = Math.round((minuteResultDecimal - Math.floor(minuteResultDecimal)) * 60);
  if (Number(secondResult) === 60) {
    secondResult = 0;
    minuteResult = minuteResult + 1;
  }
  return `${isNaN(hourResult) ? "00" : `0${hourResult}`.substr(-2)}:${isNaN(minuteResult) ? "00" : `0${minuteResult}`.substr(-2)}:${isNaN(secondResult) ? "00" : `0${secondResult}`.substr(-2)}`;
}
const trash = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20height='48'%20width='48'%3e%3cpath%20d='M13.05%2042q-1.25%200-2.125-.875T10.05%2039V10.5H8v-3h9.4V6h13.2v1.5H40v3h-2.05V39q0%201.2-.9%202.1-.9.9-2.1.9Zm21.9-31.5h-21.9V39h21.9Zm-16.6%2024.2h3V14.75h-3Zm8.3%200h3V14.75h-3Zm-13.6-24.2V39Z'/%3e%3c/svg%3e";
const icoEdit = "" + new URL("content_cut-DjBeChSV.svg", import.meta.url).href;
const reply = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20height='48'%20viewBox='0%20-960%20960%20960'%20width='48'%3e%3cpath%20d='M780-200v-174q0-54-38-92t-92-38H234l154%20154-42%2042-226-226%20226-226%2042%2042-154%20154h416q78%200%20134%2055.5T840-374v174h-60Z'/%3e%3c/svg%3e";
const save = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20height='48'%20viewBox='0%20-960%20960%20960'%20width='48'%3e%3cpath%20d='M840-683v503q0%2024-18%2042t-42%2018H180q-24%200-42-18t-18-42v-600q0-24%2018-42t42-18h503l157%20157Zm-60%2027L656-780H180v600h600v-476ZM479.765-245Q523-245%20553.5-275.265q30.5-30.264%2030.5-73.5Q584-392%20553.735-422.5q-30.264-30.5-73.5-30.5Q437-453%20406.5-422.735q-30.5%2030.264-30.5%2073.5Q376-306%20406.265-275.5q30.264%2030.5%2073.5%2030.5ZM233-584h358v-143H233v143Zm-53-72v476-600%20124Z'/%3e%3c/svg%3e";
/*!
 * Cropper.js v1.6.2
 * https://fengyuanchen.github.io/cropperjs
 *
 * Copyright 2015-present Chen Fengyuan
 * Released under the MIT license
 *
 * Date: 2024-04-21T07:43:05.335Z
 */
function ownKeys(e2, r) {
  var t = Object.keys(e2);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e2);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e2, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e2) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e2, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e2, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e2, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e2;
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e2 = t[Symbol.toPrimitive];
  if (void 0 !== e2) {
    var i2 = e2.call(t, r);
    if ("object" != typeof i2) return i2;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return String(t);
}
function _toPropertyKey(t) {
  var i2 = _toPrimitive(t, "string");
  return "symbol" == typeof i2 ? i2 : i2 + "";
}
function _typeof(o) {
  "@babel/helpers - typeof";
  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o2) {
    return typeof o2;
  } : function(o2) {
    return o2 && "function" == typeof Symbol && o2.constructor === Symbol && o2 !== Symbol.prototype ? "symbol" : typeof o2;
  }, _typeof(o);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i2 = 0; i2 < props.length; i2++) {
    var descriptor = props[i2];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}
function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n2 = Object.prototype.toString.call(o).slice(8, -1);
  if (n2 === "Object" && o.constructor) n2 = o.constructor.name;
  if (n2 === "Map" || n2 === "Set") return Array.from(o);
  if (n2 === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n2)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i2 = 0, arr2 = new Array(len); i2 < len; i2++) arr2[i2] = arr[i2];
  return arr2;
}
function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
var IS_BROWSER = typeof window !== "undefined" && typeof window.document !== "undefined";
var WINDOW = IS_BROWSER ? window : {};
var IS_TOUCH_DEVICE = IS_BROWSER && WINDOW.document.documentElement ? "ontouchstart" in WINDOW.document.documentElement : false;
var HAS_POINTER_EVENT = IS_BROWSER ? "PointerEvent" in WINDOW : false;
var NAMESPACE = "cropper";
var ACTION_ALL = "all";
var ACTION_CROP = "crop";
var ACTION_MOVE = "move";
var ACTION_ZOOM = "zoom";
var ACTION_EAST = "e";
var ACTION_WEST = "w";
var ACTION_SOUTH = "s";
var ACTION_NORTH = "n";
var ACTION_NORTH_EAST = "ne";
var ACTION_NORTH_WEST = "nw";
var ACTION_SOUTH_EAST = "se";
var ACTION_SOUTH_WEST = "sw";
var CLASS_CROP = "".concat(NAMESPACE, "-crop");
var CLASS_DISABLED = "".concat(NAMESPACE, "-disabled");
var CLASS_HIDDEN = "".concat(NAMESPACE, "-hidden");
var CLASS_HIDE = "".concat(NAMESPACE, "-hide");
var CLASS_INVISIBLE = "".concat(NAMESPACE, "-invisible");
var CLASS_MODAL = "".concat(NAMESPACE, "-modal");
var CLASS_MOVE = "".concat(NAMESPACE, "-move");
var DATA_ACTION = "".concat(NAMESPACE, "Action");
var DATA_PREVIEW = "".concat(NAMESPACE, "Preview");
var DRAG_MODE_CROP = "crop";
var DRAG_MODE_MOVE = "move";
var DRAG_MODE_NONE = "none";
var EVENT_CROP = "crop";
var EVENT_CROP_END = "cropend";
var EVENT_CROP_MOVE = "cropmove";
var EVENT_CROP_START = "cropstart";
var EVENT_DBLCLICK = "dblclick";
var EVENT_TOUCH_START = IS_TOUCH_DEVICE ? "touchstart" : "mousedown";
var EVENT_TOUCH_MOVE = IS_TOUCH_DEVICE ? "touchmove" : "mousemove";
var EVENT_TOUCH_END = IS_TOUCH_DEVICE ? "touchend touchcancel" : "mouseup";
var EVENT_POINTER_DOWN = HAS_POINTER_EVENT ? "pointerdown" : EVENT_TOUCH_START;
var EVENT_POINTER_MOVE = HAS_POINTER_EVENT ? "pointermove" : EVENT_TOUCH_MOVE;
var EVENT_POINTER_UP = HAS_POINTER_EVENT ? "pointerup pointercancel" : EVENT_TOUCH_END;
var EVENT_READY = "ready";
var EVENT_RESIZE = "resize";
var EVENT_WHEEL = "wheel";
var EVENT_ZOOM = "zoom";
var MIME_TYPE_JPEG = "image/jpeg";
var REGEXP_ACTIONS = /^e|w|s|n|se|sw|ne|nw|all|crop|move|zoom$/;
var REGEXP_DATA_URL = /^data:/;
var REGEXP_DATA_URL_JPEG = /^data:image\/jpeg;base64,/;
var REGEXP_TAG_NAME = /^img|canvas$/i;
var MIN_CONTAINER_WIDTH = 200;
var MIN_CONTAINER_HEIGHT = 100;
var DEFAULTS = {
  // Define the view mode of the cropper
  viewMode: 0,
  // 0, 1, 2, 3
  // Define the dragging mode of the cropper
  dragMode: DRAG_MODE_CROP,
  // 'crop', 'move' or 'none'
  // Define the initial aspect ratio of the crop box
  initialAspectRatio: NaN,
  // Define the aspect ratio of the crop box
  aspectRatio: NaN,
  // An object with the previous cropping result data
  data: null,
  // A selector for adding extra containers to preview
  preview: "",
  // Re-render the cropper when resize the window
  responsive: true,
  // Restore the cropped area after resize the window
  restore: true,
  // Check if the current image is a cross-origin image
  checkCrossOrigin: true,
  // Check the current image's Exif Orientation information
  checkOrientation: true,
  // Show the black modal
  modal: true,
  // Show the dashed lines for guiding
  guides: true,
  // Show the center indicator for guiding
  center: true,
  // Show the white modal to highlight the crop box
  highlight: true,
  // Show the grid background
  background: true,
  // Enable to crop the image automatically when initialize
  autoCrop: true,
  // Define the percentage of automatic cropping area when initializes
  autoCropArea: 0.8,
  // Enable to move the image
  movable: true,
  // Enable to rotate the image
  rotatable: true,
  // Enable to scale the image
  scalable: true,
  // Enable to zoom the image
  zoomable: true,
  // Enable to zoom the image by dragging touch
  zoomOnTouch: true,
  // Enable to zoom the image by wheeling mouse
  zoomOnWheel: true,
  // Define zoom ratio when zoom the image by wheeling mouse
  wheelZoomRatio: 0.1,
  // Enable to move the crop box
  cropBoxMovable: true,
  // Enable to resize the crop box
  cropBoxResizable: true,
  // Toggle drag mode between "crop" and "move" when click twice on the cropper
  toggleDragModeOnDblclick: true,
  // Size limitation
  minCanvasWidth: 0,
  minCanvasHeight: 0,
  minCropBoxWidth: 0,
  minCropBoxHeight: 0,
  minContainerWidth: MIN_CONTAINER_WIDTH,
  minContainerHeight: MIN_CONTAINER_HEIGHT,
  // Shortcuts of events
  ready: null,
  cropstart: null,
  cropmove: null,
  cropend: null,
  crop: null,
  zoom: null
};
var TEMPLATE = '<div class="cropper-container" touch-action="none"><div class="cropper-wrap-box"><div class="cropper-canvas"></div></div><div class="cropper-drag-box"></div><div class="cropper-crop-box"><span class="cropper-view-box"></span><span class="cropper-dashed dashed-h"></span><span class="cropper-dashed dashed-v"></span><span class="cropper-center"></span><span class="cropper-face"></span><span class="cropper-line line-e" data-cropper-action="e"></span><span class="cropper-line line-n" data-cropper-action="n"></span><span class="cropper-line line-w" data-cropper-action="w"></span><span class="cropper-line line-s" data-cropper-action="s"></span><span class="cropper-point point-e" data-cropper-action="e"></span><span class="cropper-point point-n" data-cropper-action="n"></span><span class="cropper-point point-w" data-cropper-action="w"></span><span class="cropper-point point-s" data-cropper-action="s"></span><span class="cropper-point point-ne" data-cropper-action="ne"></span><span class="cropper-point point-nw" data-cropper-action="nw"></span><span class="cropper-point point-sw" data-cropper-action="sw"></span><span class="cropper-point point-se" data-cropper-action="se"></span></div></div>';
var isNaN$1 = Number.isNaN || WINDOW.isNaN;
function isNumber(value) {
  return typeof value === "number" && !isNaN$1(value);
}
var isPositiveNumber2 = function isPositiveNumber3(value) {
  return value > 0 && value < Infinity;
};
function isUndefined(value) {
  return typeof value === "undefined";
}
function isObject(value) {
  return _typeof(value) === "object" && value !== null;
}
var hasOwnProperty = Object.prototype.hasOwnProperty;
function isPlainObject(value) {
  if (!isObject(value)) {
    return false;
  }
  try {
    var _constructor = value.constructor;
    var prototype = _constructor.prototype;
    return _constructor && prototype && hasOwnProperty.call(prototype, "isPrototypeOf");
  } catch (error) {
    return false;
  }
}
function isFunction(value) {
  return typeof value === "function";
}
var slice = Array.prototype.slice;
function toArray(value) {
  return Array.from ? Array.from(value) : slice.call(value);
}
function forEach(data, callback) {
  if (data && isFunction(callback)) {
    if (Array.isArray(data) || isNumber(data.length)) {
      toArray(data).forEach(function(value, key) {
        callback.call(data, value, key, data);
      });
    } else if (isObject(data)) {
      Object.keys(data).forEach(function(key) {
        callback.call(data, data[key], key, data);
      });
    }
  }
  return data;
}
var assign = Object.assign || function assign2(target) {
  for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }
  if (isObject(target) && args.length > 0) {
    args.forEach(function(arg) {
      if (isObject(arg)) {
        Object.keys(arg).forEach(function(key) {
          target[key] = arg[key];
        });
      }
    });
  }
  return target;
};
var REGEXP_DECIMALS = /\.\d*(?:0|9){12}\d*$/;
function normalizeDecimalNumber(value) {
  var times = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : 1e11;
  return REGEXP_DECIMALS.test(value) ? Math.round(value * times) / times : value;
}
var REGEXP_SUFFIX = /^width|height|left|top|marginLeft|marginTop$/;
function setStyle(element, styles) {
  var style = element.style;
  forEach(styles, function(value, property) {
    if (REGEXP_SUFFIX.test(property) && isNumber(value)) {
      value = "".concat(value, "px");
    }
    style[property] = value;
  });
}
function hasClass(element, value) {
  return element.classList ? element.classList.contains(value) : element.className.indexOf(value) > -1;
}
function addClass(element, value) {
  if (!value) {
    return;
  }
  if (isNumber(element.length)) {
    forEach(element, function(elem) {
      addClass(elem, value);
    });
    return;
  }
  if (element.classList) {
    element.classList.add(value);
    return;
  }
  var className = element.className.trim();
  if (!className) {
    element.className = value;
  } else if (className.indexOf(value) < 0) {
    element.className = "".concat(className, " ").concat(value);
  }
}
function removeClass(element, value) {
  if (!value) {
    return;
  }
  if (isNumber(element.length)) {
    forEach(element, function(elem) {
      removeClass(elem, value);
    });
    return;
  }
  if (element.classList) {
    element.classList.remove(value);
    return;
  }
  if (element.className.indexOf(value) >= 0) {
    element.className = element.className.replace(value, "");
  }
}
function toggleClass(element, value, added) {
  if (!value) {
    return;
  }
  if (isNumber(element.length)) {
    forEach(element, function(elem) {
      toggleClass(elem, value, added);
    });
    return;
  }
  if (added) {
    addClass(element, value);
  } else {
    removeClass(element, value);
  }
}
var REGEXP_CAMEL_CASE = /([a-z\d])([A-Z])/g;
function toParamCase(value) {
  return value.replace(REGEXP_CAMEL_CASE, "$1-$2").toLowerCase();
}
function getData(element, name) {
  if (isObject(element[name])) {
    return element[name];
  }
  if (element.dataset) {
    return element.dataset[name];
  }
  return element.getAttribute("data-".concat(toParamCase(name)));
}
function setData(element, name, data) {
  if (isObject(data)) {
    element[name] = data;
  } else if (element.dataset) {
    element.dataset[name] = data;
  } else {
    element.setAttribute("data-".concat(toParamCase(name)), data);
  }
}
function removeData(element, name) {
  if (isObject(element[name])) {
    try {
      delete element[name];
    } catch (error) {
      element[name] = void 0;
    }
  } else if (element.dataset) {
    try {
      delete element.dataset[name];
    } catch (error) {
      element.dataset[name] = void 0;
    }
  } else {
    element.removeAttribute("data-".concat(toParamCase(name)));
  }
}
var REGEXP_SPACES = /\s\s*/;
var onceSupported = function() {
  var supported = false;
  if (IS_BROWSER) {
    var once = false;
    var listener = function listener2() {
    };
    var options = Object.defineProperty({}, "once", {
      get: function get() {
        supported = true;
        return once;
      },
      /**
       * This setter can fix a `TypeError` in strict mode
       * {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Getter_only}
       * @param {boolean} value - The value to set
       */
      set: function set(value) {
        once = value;
      }
    });
    WINDOW.addEventListener("test", listener, options);
    WINDOW.removeEventListener("test", listener, options);
  }
  return supported;
}();
function removeListener(element, type, listener) {
  var options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
  var handler = listener;
  type.trim().split(REGEXP_SPACES).forEach(function(event) {
    if (!onceSupported) {
      var listeners = element.listeners;
      if (listeners && listeners[event] && listeners[event][listener]) {
        handler = listeners[event][listener];
        delete listeners[event][listener];
        if (Object.keys(listeners[event]).length === 0) {
          delete listeners[event];
        }
        if (Object.keys(listeners).length === 0) {
          delete element.listeners;
        }
      }
    }
    element.removeEventListener(event, handler, options);
  });
}
function addListener(element, type, listener) {
  var options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
  var _handler = listener;
  type.trim().split(REGEXP_SPACES).forEach(function(event) {
    if (options.once && !onceSupported) {
      var _element$listeners = element.listeners, listeners = _element$listeners === void 0 ? {} : _element$listeners;
      _handler = function handler() {
        delete listeners[event][listener];
        element.removeEventListener(event, _handler, options);
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        listener.apply(element, args);
      };
      if (!listeners[event]) {
        listeners[event] = {};
      }
      if (listeners[event][listener]) {
        element.removeEventListener(event, listeners[event][listener], options);
      }
      listeners[event][listener] = _handler;
      element.listeners = listeners;
    }
    element.addEventListener(event, _handler, options);
  });
}
function dispatchEvent(element, type, data) {
  var event;
  if (isFunction(Event) && isFunction(CustomEvent)) {
    event = new CustomEvent(type, {
      detail: data,
      bubbles: true,
      cancelable: true
    });
  } else {
    event = document.createEvent("CustomEvent");
    event.initCustomEvent(type, true, true, data);
  }
  return element.dispatchEvent(event);
}
function getOffset(element) {
  var box = element.getBoundingClientRect();
  return {
    left: box.left + (window.pageXOffset - document.documentElement.clientLeft),
    top: box.top + (window.pageYOffset - document.documentElement.clientTop)
  };
}
var location$1 = WINDOW.location;
var REGEXP_ORIGINS = /^(\w+:)\/\/([^:/?#]*):?(\d*)/i;
function isCrossOriginURL(url) {
  var parts = url.match(REGEXP_ORIGINS);
  return parts !== null && (parts[1] !== location$1.protocol || parts[2] !== location$1.hostname || parts[3] !== location$1.port);
}
function addTimestamp(url) {
  var timestamp = "timestamp=".concat((/* @__PURE__ */ new Date()).getTime());
  return url + (url.indexOf("?") === -1 ? "?" : "&") + timestamp;
}
function getTransforms(_ref) {
  var rotate2 = _ref.rotate, scaleX2 = _ref.scaleX, scaleY2 = _ref.scaleY, translateX = _ref.translateX, translateY = _ref.translateY;
  var values = [];
  if (isNumber(translateX) && translateX !== 0) {
    values.push("translateX(".concat(translateX, "px)"));
  }
  if (isNumber(translateY) && translateY !== 0) {
    values.push("translateY(".concat(translateY, "px)"));
  }
  if (isNumber(rotate2) && rotate2 !== 0) {
    values.push("rotate(".concat(rotate2, "deg)"));
  }
  if (isNumber(scaleX2) && scaleX2 !== 1) {
    values.push("scaleX(".concat(scaleX2, ")"));
  }
  if (isNumber(scaleY2) && scaleY2 !== 1) {
    values.push("scaleY(".concat(scaleY2, ")"));
  }
  var transform = values.length ? values.join(" ") : "none";
  return {
    WebkitTransform: transform,
    msTransform: transform,
    transform
  };
}
function getMaxZoomRatio(pointers) {
  var pointers2 = _objectSpread2({}, pointers);
  var maxRatio = 0;
  forEach(pointers, function(pointer, pointerId) {
    delete pointers2[pointerId];
    forEach(pointers2, function(pointer2) {
      var x1 = Math.abs(pointer.startX - pointer2.startX);
      var y1 = Math.abs(pointer.startY - pointer2.startY);
      var x2 = Math.abs(pointer.endX - pointer2.endX);
      var y2 = Math.abs(pointer.endY - pointer2.endY);
      var z1 = Math.sqrt(x1 * x1 + y1 * y1);
      var z2 = Math.sqrt(x2 * x2 + y2 * y2);
      var ratio = (z2 - z1) / z1;
      if (Math.abs(ratio) > Math.abs(maxRatio)) {
        maxRatio = ratio;
      }
    });
  });
  return maxRatio;
}
function getPointer(_ref2, endOnly) {
  var pageX = _ref2.pageX, pageY = _ref2.pageY;
  var end = {
    endX: pageX,
    endY: pageY
  };
  return endOnly ? end : _objectSpread2({
    startX: pageX,
    startY: pageY
  }, end);
}
function getPointersCenter(pointers) {
  var pageX = 0;
  var pageY = 0;
  var count = 0;
  forEach(pointers, function(_ref3) {
    var startX = _ref3.startX, startY = _ref3.startY;
    pageX += startX;
    pageY += startY;
    count += 1;
  });
  pageX /= count;
  pageY /= count;
  return {
    pageX,
    pageY
  };
}
function getAdjustedSizes(_ref4) {
  var aspectRatio = _ref4.aspectRatio, height = _ref4.height, width = _ref4.width;
  var type = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "contain";
  var isValidWidth = isPositiveNumber2(width);
  var isValidHeight = isPositiveNumber2(height);
  if (isValidWidth && isValidHeight) {
    var adjustedWidth = height * aspectRatio;
    if (type === "contain" && adjustedWidth > width || type === "cover" && adjustedWidth < width) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }
  } else if (isValidWidth) {
    height = width / aspectRatio;
  } else if (isValidHeight) {
    width = height * aspectRatio;
  }
  return {
    width,
    height
  };
}
function getRotatedSizes(_ref5) {
  var width = _ref5.width, height = _ref5.height, degree = _ref5.degree;
  degree = Math.abs(degree) % 180;
  if (degree === 90) {
    return {
      width: height,
      height: width
    };
  }
  var arc = degree % 90 * Math.PI / 180;
  var sinArc = Math.sin(arc);
  var cosArc = Math.cos(arc);
  var newWidth = width * cosArc + height * sinArc;
  var newHeight = width * sinArc + height * cosArc;
  return degree > 90 ? {
    width: newHeight,
    height: newWidth
  } : {
    width: newWidth,
    height: newHeight
  };
}
function getSourceCanvas(image, _ref6, _ref7, _ref8) {
  var imageAspectRatio = _ref6.aspectRatio, imageNaturalWidth = _ref6.naturalWidth, imageNaturalHeight = _ref6.naturalHeight, _ref6$rotate = _ref6.rotate, rotate2 = _ref6$rotate === void 0 ? 0 : _ref6$rotate, _ref6$scaleX = _ref6.scaleX, scaleX2 = _ref6$scaleX === void 0 ? 1 : _ref6$scaleX, _ref6$scaleY = _ref6.scaleY, scaleY2 = _ref6$scaleY === void 0 ? 1 : _ref6$scaleY;
  var aspectRatio = _ref7.aspectRatio, naturalWidth = _ref7.naturalWidth, naturalHeight = _ref7.naturalHeight;
  var _ref8$fillColor = _ref8.fillColor, fillColor = _ref8$fillColor === void 0 ? "transparent" : _ref8$fillColor, _ref8$imageSmoothingE = _ref8.imageSmoothingEnabled, imageSmoothingEnabled = _ref8$imageSmoothingE === void 0 ? true : _ref8$imageSmoothingE, _ref8$imageSmoothingQ = _ref8.imageSmoothingQuality, imageSmoothingQuality = _ref8$imageSmoothingQ === void 0 ? "low" : _ref8$imageSmoothingQ, _ref8$maxWidth = _ref8.maxWidth, maxWidth = _ref8$maxWidth === void 0 ? Infinity : _ref8$maxWidth, _ref8$maxHeight = _ref8.maxHeight, maxHeight = _ref8$maxHeight === void 0 ? Infinity : _ref8$maxHeight, _ref8$minWidth = _ref8.minWidth, minWidth = _ref8$minWidth === void 0 ? 0 : _ref8$minWidth, _ref8$minHeight = _ref8.minHeight, minHeight = _ref8$minHeight === void 0 ? 0 : _ref8$minHeight;
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  var maxSizes = getAdjustedSizes({
    aspectRatio,
    width: maxWidth,
    height: maxHeight
  });
  var minSizes = getAdjustedSizes({
    aspectRatio,
    width: minWidth,
    height: minHeight
  }, "cover");
  var width = Math.min(maxSizes.width, Math.max(minSizes.width, naturalWidth));
  var height = Math.min(maxSizes.height, Math.max(minSizes.height, naturalHeight));
  var destMaxSizes = getAdjustedSizes({
    aspectRatio: imageAspectRatio,
    width: maxWidth,
    height: maxHeight
  });
  var destMinSizes = getAdjustedSizes({
    aspectRatio: imageAspectRatio,
    width: minWidth,
    height: minHeight
  }, "cover");
  var destWidth = Math.min(destMaxSizes.width, Math.max(destMinSizes.width, imageNaturalWidth));
  var destHeight = Math.min(destMaxSizes.height, Math.max(destMinSizes.height, imageNaturalHeight));
  var params = [-destWidth / 2, -destHeight / 2, destWidth, destHeight];
  canvas.width = normalizeDecimalNumber(width);
  canvas.height = normalizeDecimalNumber(height);
  context.fillStyle = fillColor;
  context.fillRect(0, 0, width, height);
  context.save();
  context.translate(width / 2, height / 2);
  context.rotate(rotate2 * Math.PI / 180);
  context.scale(scaleX2, scaleY2);
  context.imageSmoothingEnabled = imageSmoothingEnabled;
  context.imageSmoothingQuality = imageSmoothingQuality;
  context.drawImage.apply(context, [image].concat(_toConsumableArray(params.map(function(param) {
    return Math.floor(normalizeDecimalNumber(param));
  }))));
  context.restore();
  return canvas;
}
var fromCharCode = String.fromCharCode;
function getStringFromCharCode(dataView, start, length) {
  var str = "";
  length += start;
  for (var i2 = start; i2 < length; i2 += 1) {
    str += fromCharCode(dataView.getUint8(i2));
  }
  return str;
}
var REGEXP_DATA_URL_HEAD = /^data:.*,/;
function dataURLToArrayBuffer(dataURL) {
  var base64 = dataURL.replace(REGEXP_DATA_URL_HEAD, "");
  var binary = atob(base64);
  var arrayBuffer = new ArrayBuffer(binary.length);
  var uint8 = new Uint8Array(arrayBuffer);
  forEach(uint8, function(value, i2) {
    uint8[i2] = binary.charCodeAt(i2);
  });
  return arrayBuffer;
}
function arrayBufferToDataURL(arrayBuffer, mimeType) {
  var chunks = [];
  var chunkSize = 8192;
  var uint8 = new Uint8Array(arrayBuffer);
  while (uint8.length > 0) {
    chunks.push(fromCharCode.apply(null, toArray(uint8.subarray(0, chunkSize))));
    uint8 = uint8.subarray(chunkSize);
  }
  return "data:".concat(mimeType, ";base64,").concat(btoa(chunks.join("")));
}
function resetAndGetOrientation(arrayBuffer) {
  var dataView = new DataView(arrayBuffer);
  var orientation;
  try {
    var littleEndian;
    var app1Start;
    var ifdStart;
    if (dataView.getUint8(0) === 255 && dataView.getUint8(1) === 216) {
      var length = dataView.byteLength;
      var offset = 2;
      while (offset + 1 < length) {
        if (dataView.getUint8(offset) === 255 && dataView.getUint8(offset + 1) === 225) {
          app1Start = offset;
          break;
        }
        offset += 1;
      }
    }
    if (app1Start) {
      var exifIDCode = app1Start + 4;
      var tiffOffset = app1Start + 10;
      if (getStringFromCharCode(dataView, exifIDCode, 4) === "Exif") {
        var endianness = dataView.getUint16(tiffOffset);
        littleEndian = endianness === 18761;
        if (littleEndian || endianness === 19789) {
          if (dataView.getUint16(tiffOffset + 2, littleEndian) === 42) {
            var firstIFDOffset = dataView.getUint32(tiffOffset + 4, littleEndian);
            if (firstIFDOffset >= 8) {
              ifdStart = tiffOffset + firstIFDOffset;
            }
          }
        }
      }
    }
    if (ifdStart) {
      var _length = dataView.getUint16(ifdStart, littleEndian);
      var _offset;
      var i2;
      for (i2 = 0; i2 < _length; i2 += 1) {
        _offset = ifdStart + i2 * 12 + 2;
        if (dataView.getUint16(_offset, littleEndian) === 274) {
          _offset += 8;
          orientation = dataView.getUint16(_offset, littleEndian);
          dataView.setUint16(_offset, 1, littleEndian);
          break;
        }
      }
    }
  } catch (error) {
    orientation = 1;
  }
  return orientation;
}
function parseOrientation(orientation) {
  var rotate2 = 0;
  var scaleX2 = 1;
  var scaleY2 = 1;
  switch (orientation) {
    case 2:
      scaleX2 = -1;
      break;
    case 3:
      rotate2 = -180;
      break;
    case 4:
      scaleY2 = -1;
      break;
    case 5:
      rotate2 = 90;
      scaleY2 = -1;
      break;
    case 6:
      rotate2 = 90;
      break;
    case 7:
      rotate2 = 90;
      scaleX2 = -1;
      break;
    case 8:
      rotate2 = -90;
      break;
  }
  return {
    rotate: rotate2,
    scaleX: scaleX2,
    scaleY: scaleY2
  };
}
var render = {
  render: function render2() {
    this.initContainer();
    this.initCanvas();
    this.initCropBox();
    this.renderCanvas();
    if (this.cropped) {
      this.renderCropBox();
    }
  },
  initContainer: function initContainer() {
    var element = this.element, options = this.options, container = this.container, cropper = this.cropper;
    var minWidth = Number(options.minContainerWidth);
    var minHeight = Number(options.minContainerHeight);
    addClass(cropper, CLASS_HIDDEN);
    removeClass(element, CLASS_HIDDEN);
    var containerData = {
      width: Math.max(container.offsetWidth, minWidth >= 0 ? minWidth : MIN_CONTAINER_WIDTH),
      height: Math.max(container.offsetHeight, minHeight >= 0 ? minHeight : MIN_CONTAINER_HEIGHT)
    };
    this.containerData = containerData;
    setStyle(cropper, {
      width: containerData.width,
      height: containerData.height
    });
    addClass(element, CLASS_HIDDEN);
    removeClass(cropper, CLASS_HIDDEN);
  },
  // Canvas (image wrapper)
  initCanvas: function initCanvas() {
    var containerData = this.containerData, imageData = this.imageData;
    var viewMode = this.options.viewMode;
    var rotated = Math.abs(imageData.rotate) % 180 === 90;
    var naturalWidth = rotated ? imageData.naturalHeight : imageData.naturalWidth;
    var naturalHeight = rotated ? imageData.naturalWidth : imageData.naturalHeight;
    var aspectRatio = naturalWidth / naturalHeight;
    var canvasWidth = containerData.width;
    var canvasHeight = containerData.height;
    if (containerData.height * aspectRatio > containerData.width) {
      if (viewMode === 3) {
        canvasWidth = containerData.height * aspectRatio;
      } else {
        canvasHeight = containerData.width / aspectRatio;
      }
    } else if (viewMode === 3) {
      canvasHeight = containerData.width / aspectRatio;
    } else {
      canvasWidth = containerData.height * aspectRatio;
    }
    var canvasData = {
      aspectRatio,
      naturalWidth,
      naturalHeight,
      width: canvasWidth,
      height: canvasHeight
    };
    this.canvasData = canvasData;
    this.limited = viewMode === 1 || viewMode === 2;
    this.limitCanvas(true, true);
    canvasData.width = Math.min(Math.max(canvasData.width, canvasData.minWidth), canvasData.maxWidth);
    canvasData.height = Math.min(Math.max(canvasData.height, canvasData.minHeight), canvasData.maxHeight);
    canvasData.left = (containerData.width - canvasData.width) / 2;
    canvasData.top = (containerData.height - canvasData.height) / 2;
    canvasData.oldLeft = canvasData.left;
    canvasData.oldTop = canvasData.top;
    this.initialCanvasData = assign({}, canvasData);
  },
  limitCanvas: function limitCanvas(sizeLimited, positionLimited) {
    var options = this.options, containerData = this.containerData, canvasData = this.canvasData, cropBoxData = this.cropBoxData;
    var viewMode = options.viewMode;
    var aspectRatio = canvasData.aspectRatio;
    var cropped = this.cropped && cropBoxData;
    if (sizeLimited) {
      var minCanvasWidth = Number(options.minCanvasWidth) || 0;
      var minCanvasHeight = Number(options.minCanvasHeight) || 0;
      if (viewMode > 1) {
        minCanvasWidth = Math.max(minCanvasWidth, containerData.width);
        minCanvasHeight = Math.max(minCanvasHeight, containerData.height);
        if (viewMode === 3) {
          if (minCanvasHeight * aspectRatio > minCanvasWidth) {
            minCanvasWidth = minCanvasHeight * aspectRatio;
          } else {
            minCanvasHeight = minCanvasWidth / aspectRatio;
          }
        }
      } else if (viewMode > 0) {
        if (minCanvasWidth) {
          minCanvasWidth = Math.max(minCanvasWidth, cropped ? cropBoxData.width : 0);
        } else if (minCanvasHeight) {
          minCanvasHeight = Math.max(minCanvasHeight, cropped ? cropBoxData.height : 0);
        } else if (cropped) {
          minCanvasWidth = cropBoxData.width;
          minCanvasHeight = cropBoxData.height;
          if (minCanvasHeight * aspectRatio > minCanvasWidth) {
            minCanvasWidth = minCanvasHeight * aspectRatio;
          } else {
            minCanvasHeight = minCanvasWidth / aspectRatio;
          }
        }
      }
      var _getAdjustedSizes = getAdjustedSizes({
        aspectRatio,
        width: minCanvasWidth,
        height: minCanvasHeight
      });
      minCanvasWidth = _getAdjustedSizes.width;
      minCanvasHeight = _getAdjustedSizes.height;
      canvasData.minWidth = minCanvasWidth;
      canvasData.minHeight = minCanvasHeight;
      canvasData.maxWidth = Infinity;
      canvasData.maxHeight = Infinity;
    }
    if (positionLimited) {
      if (viewMode > (cropped ? 0 : 1)) {
        var newCanvasLeft = containerData.width - canvasData.width;
        var newCanvasTop = containerData.height - canvasData.height;
        canvasData.minLeft = Math.min(0, newCanvasLeft);
        canvasData.minTop = Math.min(0, newCanvasTop);
        canvasData.maxLeft = Math.max(0, newCanvasLeft);
        canvasData.maxTop = Math.max(0, newCanvasTop);
        if (cropped && this.limited) {
          canvasData.minLeft = Math.min(cropBoxData.left, cropBoxData.left + (cropBoxData.width - canvasData.width));
          canvasData.minTop = Math.min(cropBoxData.top, cropBoxData.top + (cropBoxData.height - canvasData.height));
          canvasData.maxLeft = cropBoxData.left;
          canvasData.maxTop = cropBoxData.top;
          if (viewMode === 2) {
            if (canvasData.width >= containerData.width) {
              canvasData.minLeft = Math.min(0, newCanvasLeft);
              canvasData.maxLeft = Math.max(0, newCanvasLeft);
            }
            if (canvasData.height >= containerData.height) {
              canvasData.minTop = Math.min(0, newCanvasTop);
              canvasData.maxTop = Math.max(0, newCanvasTop);
            }
          }
        }
      } else {
        canvasData.minLeft = -canvasData.width;
        canvasData.minTop = -canvasData.height;
        canvasData.maxLeft = containerData.width;
        canvasData.maxTop = containerData.height;
      }
    }
  },
  renderCanvas: function renderCanvas(changed, transformed) {
    var canvasData = this.canvasData, imageData = this.imageData;
    if (transformed) {
      var _getRotatedSizes = getRotatedSizes({
        width: imageData.naturalWidth * Math.abs(imageData.scaleX || 1),
        height: imageData.naturalHeight * Math.abs(imageData.scaleY || 1),
        degree: imageData.rotate || 0
      }), naturalWidth = _getRotatedSizes.width, naturalHeight = _getRotatedSizes.height;
      var width = canvasData.width * (naturalWidth / canvasData.naturalWidth);
      var height = canvasData.height * (naturalHeight / canvasData.naturalHeight);
      canvasData.left -= (width - canvasData.width) / 2;
      canvasData.top -= (height - canvasData.height) / 2;
      canvasData.width = width;
      canvasData.height = height;
      canvasData.aspectRatio = naturalWidth / naturalHeight;
      canvasData.naturalWidth = naturalWidth;
      canvasData.naturalHeight = naturalHeight;
      this.limitCanvas(true, false);
    }
    if (canvasData.width > canvasData.maxWidth || canvasData.width < canvasData.minWidth) {
      canvasData.left = canvasData.oldLeft;
    }
    if (canvasData.height > canvasData.maxHeight || canvasData.height < canvasData.minHeight) {
      canvasData.top = canvasData.oldTop;
    }
    canvasData.width = Math.min(Math.max(canvasData.width, canvasData.minWidth), canvasData.maxWidth);
    canvasData.height = Math.min(Math.max(canvasData.height, canvasData.minHeight), canvasData.maxHeight);
    this.limitCanvas(false, true);
    canvasData.left = Math.min(Math.max(canvasData.left, canvasData.minLeft), canvasData.maxLeft);
    canvasData.top = Math.min(Math.max(canvasData.top, canvasData.minTop), canvasData.maxTop);
    canvasData.oldLeft = canvasData.left;
    canvasData.oldTop = canvasData.top;
    setStyle(this.canvas, assign({
      width: canvasData.width,
      height: canvasData.height
    }, getTransforms({
      translateX: canvasData.left,
      translateY: canvasData.top
    })));
    this.renderImage(changed);
    if (this.cropped && this.limited) {
      this.limitCropBox(true, true);
    }
  },
  renderImage: function renderImage(changed) {
    var canvasData = this.canvasData, imageData = this.imageData;
    var width = imageData.naturalWidth * (canvasData.width / canvasData.naturalWidth);
    var height = imageData.naturalHeight * (canvasData.height / canvasData.naturalHeight);
    assign(imageData, {
      width,
      height,
      left: (canvasData.width - width) / 2,
      top: (canvasData.height - height) / 2
    });
    setStyle(this.image, assign({
      width: imageData.width,
      height: imageData.height
    }, getTransforms(assign({
      translateX: imageData.left,
      translateY: imageData.top
    }, imageData))));
    if (changed) {
      this.output();
    }
  },
  initCropBox: function initCropBox() {
    var options = this.options, canvasData = this.canvasData;
    var aspectRatio = options.aspectRatio || options.initialAspectRatio;
    var autoCropArea = Number(options.autoCropArea) || 0.8;
    var cropBoxData = {
      width: canvasData.width,
      height: canvasData.height
    };
    if (aspectRatio) {
      if (canvasData.height * aspectRatio > canvasData.width) {
        cropBoxData.height = cropBoxData.width / aspectRatio;
      } else {
        cropBoxData.width = cropBoxData.height * aspectRatio;
      }
    }
    this.cropBoxData = cropBoxData;
    this.limitCropBox(true, true);
    cropBoxData.width = Math.min(Math.max(cropBoxData.width, cropBoxData.minWidth), cropBoxData.maxWidth);
    cropBoxData.height = Math.min(Math.max(cropBoxData.height, cropBoxData.minHeight), cropBoxData.maxHeight);
    cropBoxData.width = Math.max(cropBoxData.minWidth, cropBoxData.width * autoCropArea);
    cropBoxData.height = Math.max(cropBoxData.minHeight, cropBoxData.height * autoCropArea);
    cropBoxData.left = canvasData.left + (canvasData.width - cropBoxData.width) / 2;
    cropBoxData.top = canvasData.top + (canvasData.height - cropBoxData.height) / 2;
    cropBoxData.oldLeft = cropBoxData.left;
    cropBoxData.oldTop = cropBoxData.top;
    this.initialCropBoxData = assign({}, cropBoxData);
  },
  limitCropBox: function limitCropBox(sizeLimited, positionLimited) {
    var options = this.options, containerData = this.containerData, canvasData = this.canvasData, cropBoxData = this.cropBoxData, limited = this.limited;
    var aspectRatio = options.aspectRatio;
    if (sizeLimited) {
      var minCropBoxWidth = Number(options.minCropBoxWidth) || 0;
      var minCropBoxHeight = Number(options.minCropBoxHeight) || 0;
      var maxCropBoxWidth = limited ? Math.min(containerData.width, canvasData.width, canvasData.width + canvasData.left, containerData.width - canvasData.left) : containerData.width;
      var maxCropBoxHeight = limited ? Math.min(containerData.height, canvasData.height, canvasData.height + canvasData.top, containerData.height - canvasData.top) : containerData.height;
      minCropBoxWidth = Math.min(minCropBoxWidth, containerData.width);
      minCropBoxHeight = Math.min(minCropBoxHeight, containerData.height);
      if (aspectRatio) {
        if (minCropBoxWidth && minCropBoxHeight) {
          if (minCropBoxHeight * aspectRatio > minCropBoxWidth) {
            minCropBoxHeight = minCropBoxWidth / aspectRatio;
          } else {
            minCropBoxWidth = minCropBoxHeight * aspectRatio;
          }
        } else if (minCropBoxWidth) {
          minCropBoxHeight = minCropBoxWidth / aspectRatio;
        } else if (minCropBoxHeight) {
          minCropBoxWidth = minCropBoxHeight * aspectRatio;
        }
        if (maxCropBoxHeight * aspectRatio > maxCropBoxWidth) {
          maxCropBoxHeight = maxCropBoxWidth / aspectRatio;
        } else {
          maxCropBoxWidth = maxCropBoxHeight * aspectRatio;
        }
      }
      cropBoxData.minWidth = Math.min(minCropBoxWidth, maxCropBoxWidth);
      cropBoxData.minHeight = Math.min(minCropBoxHeight, maxCropBoxHeight);
      cropBoxData.maxWidth = maxCropBoxWidth;
      cropBoxData.maxHeight = maxCropBoxHeight;
    }
    if (positionLimited) {
      if (limited) {
        cropBoxData.minLeft = Math.max(0, canvasData.left);
        cropBoxData.minTop = Math.max(0, canvasData.top);
        cropBoxData.maxLeft = Math.min(containerData.width, canvasData.left + canvasData.width) - cropBoxData.width;
        cropBoxData.maxTop = Math.min(containerData.height, canvasData.top + canvasData.height) - cropBoxData.height;
      } else {
        cropBoxData.minLeft = 0;
        cropBoxData.minTop = 0;
        cropBoxData.maxLeft = containerData.width - cropBoxData.width;
        cropBoxData.maxTop = containerData.height - cropBoxData.height;
      }
    }
  },
  renderCropBox: function renderCropBox() {
    var options = this.options, containerData = this.containerData, cropBoxData = this.cropBoxData;
    if (cropBoxData.width > cropBoxData.maxWidth || cropBoxData.width < cropBoxData.minWidth) {
      cropBoxData.left = cropBoxData.oldLeft;
    }
    if (cropBoxData.height > cropBoxData.maxHeight || cropBoxData.height < cropBoxData.minHeight) {
      cropBoxData.top = cropBoxData.oldTop;
    }
    cropBoxData.width = Math.min(Math.max(cropBoxData.width, cropBoxData.minWidth), cropBoxData.maxWidth);
    cropBoxData.height = Math.min(Math.max(cropBoxData.height, cropBoxData.minHeight), cropBoxData.maxHeight);
    this.limitCropBox(false, true);
    cropBoxData.left = Math.min(Math.max(cropBoxData.left, cropBoxData.minLeft), cropBoxData.maxLeft);
    cropBoxData.top = Math.min(Math.max(cropBoxData.top, cropBoxData.minTop), cropBoxData.maxTop);
    cropBoxData.oldLeft = cropBoxData.left;
    cropBoxData.oldTop = cropBoxData.top;
    if (options.movable && options.cropBoxMovable) {
      setData(this.face, DATA_ACTION, cropBoxData.width >= containerData.width && cropBoxData.height >= containerData.height ? ACTION_MOVE : ACTION_ALL);
    }
    setStyle(this.cropBox, assign({
      width: cropBoxData.width,
      height: cropBoxData.height
    }, getTransforms({
      translateX: cropBoxData.left,
      translateY: cropBoxData.top
    })));
    if (this.cropped && this.limited) {
      this.limitCanvas(true, true);
    }
    if (!this.disabled) {
      this.output();
    }
  },
  output: function output() {
    this.preview();
    dispatchEvent(this.element, EVENT_CROP, this.getData());
  }
};
var preview = {
  initPreview: function initPreview() {
    var element = this.element, crossOrigin = this.crossOrigin;
    var preview3 = this.options.preview;
    var url = crossOrigin ? this.crossOriginUrl : this.url;
    var alt = element.alt || "The image to preview";
    var image = document.createElement("img");
    if (crossOrigin) {
      image.crossOrigin = crossOrigin;
    }
    image.src = url;
    image.alt = alt;
    this.viewBox.appendChild(image);
    this.viewBoxImage = image;
    if (!preview3) {
      return;
    }
    var previews = preview3;
    if (typeof preview3 === "string") {
      previews = element.ownerDocument.querySelectorAll(preview3);
    } else if (preview3.querySelector) {
      previews = [preview3];
    }
    this.previews = previews;
    forEach(previews, function(el) {
      var img = document.createElement("img");
      setData(el, DATA_PREVIEW, {
        width: el.offsetWidth,
        height: el.offsetHeight,
        html: el.innerHTML
      });
      if (crossOrigin) {
        img.crossOrigin = crossOrigin;
      }
      img.src = url;
      img.alt = alt;
      img.style.cssText = 'display:block;width:100%;height:auto;min-width:0!important;min-height:0!important;max-width:none!important;max-height:none!important;image-orientation:0deg!important;"';
      el.innerHTML = "";
      el.appendChild(img);
    });
  },
  resetPreview: function resetPreview() {
    forEach(this.previews, function(element) {
      var data = getData(element, DATA_PREVIEW);
      setStyle(element, {
        width: data.width,
        height: data.height
      });
      element.innerHTML = data.html;
      removeData(element, DATA_PREVIEW);
    });
  },
  preview: function preview2() {
    var imageData = this.imageData, canvasData = this.canvasData, cropBoxData = this.cropBoxData;
    var cropBoxWidth = cropBoxData.width, cropBoxHeight = cropBoxData.height;
    var width = imageData.width, height = imageData.height;
    var left = cropBoxData.left - canvasData.left - imageData.left;
    var top = cropBoxData.top - canvasData.top - imageData.top;
    if (!this.cropped || this.disabled) {
      return;
    }
    setStyle(this.viewBoxImage, assign({
      width,
      height
    }, getTransforms(assign({
      translateX: -left,
      translateY: -top
    }, imageData))));
    forEach(this.previews, function(element) {
      var data = getData(element, DATA_PREVIEW);
      var originalWidth = data.width;
      var originalHeight = data.height;
      var newWidth = originalWidth;
      var newHeight = originalHeight;
      var ratio = 1;
      if (cropBoxWidth) {
        ratio = originalWidth / cropBoxWidth;
        newHeight = cropBoxHeight * ratio;
      }
      if (cropBoxHeight && newHeight > originalHeight) {
        ratio = originalHeight / cropBoxHeight;
        newWidth = cropBoxWidth * ratio;
        newHeight = originalHeight;
      }
      setStyle(element, {
        width: newWidth,
        height: newHeight
      });
      setStyle(element.getElementsByTagName("img")[0], assign({
        width: width * ratio,
        height: height * ratio
      }, getTransforms(assign({
        translateX: -left * ratio,
        translateY: -top * ratio
      }, imageData))));
    });
  }
};
var events = {
  bind: function bind() {
    var element = this.element, options = this.options, cropper = this.cropper;
    if (isFunction(options.cropstart)) {
      addListener(element, EVENT_CROP_START, options.cropstart);
    }
    if (isFunction(options.cropmove)) {
      addListener(element, EVENT_CROP_MOVE, options.cropmove);
    }
    if (isFunction(options.cropend)) {
      addListener(element, EVENT_CROP_END, options.cropend);
    }
    if (isFunction(options.crop)) {
      addListener(element, EVENT_CROP, options.crop);
    }
    if (isFunction(options.zoom)) {
      addListener(element, EVENT_ZOOM, options.zoom);
    }
    addListener(cropper, EVENT_POINTER_DOWN, this.onCropStart = this.cropStart.bind(this));
    if (options.zoomable && options.zoomOnWheel) {
      addListener(cropper, EVENT_WHEEL, this.onWheel = this.wheel.bind(this), {
        passive: false,
        capture: true
      });
    }
    if (options.toggleDragModeOnDblclick) {
      addListener(cropper, EVENT_DBLCLICK, this.onDblclick = this.dblclick.bind(this));
    }
    addListener(element.ownerDocument, EVENT_POINTER_MOVE, this.onCropMove = this.cropMove.bind(this));
    addListener(element.ownerDocument, EVENT_POINTER_UP, this.onCropEnd = this.cropEnd.bind(this));
    if (options.responsive) {
      addListener(window, EVENT_RESIZE, this.onResize = this.resize.bind(this));
    }
  },
  unbind: function unbind() {
    var element = this.element, options = this.options, cropper = this.cropper;
    if (isFunction(options.cropstart)) {
      removeListener(element, EVENT_CROP_START, options.cropstart);
    }
    if (isFunction(options.cropmove)) {
      removeListener(element, EVENT_CROP_MOVE, options.cropmove);
    }
    if (isFunction(options.cropend)) {
      removeListener(element, EVENT_CROP_END, options.cropend);
    }
    if (isFunction(options.crop)) {
      removeListener(element, EVENT_CROP, options.crop);
    }
    if (isFunction(options.zoom)) {
      removeListener(element, EVENT_ZOOM, options.zoom);
    }
    removeListener(cropper, EVENT_POINTER_DOWN, this.onCropStart);
    if (options.zoomable && options.zoomOnWheel) {
      removeListener(cropper, EVENT_WHEEL, this.onWheel, {
        passive: false,
        capture: true
      });
    }
    if (options.toggleDragModeOnDblclick) {
      removeListener(cropper, EVENT_DBLCLICK, this.onDblclick);
    }
    removeListener(element.ownerDocument, EVENT_POINTER_MOVE, this.onCropMove);
    removeListener(element.ownerDocument, EVENT_POINTER_UP, this.onCropEnd);
    if (options.responsive) {
      removeListener(window, EVENT_RESIZE, this.onResize);
    }
  }
};
var handlers = {
  resize: function resize() {
    if (this.disabled) {
      return;
    }
    var options = this.options, container = this.container, containerData = this.containerData;
    var ratioX = container.offsetWidth / containerData.width;
    var ratioY = container.offsetHeight / containerData.height;
    var ratio = Math.abs(ratioX - 1) > Math.abs(ratioY - 1) ? ratioX : ratioY;
    if (ratio !== 1) {
      var canvasData;
      var cropBoxData;
      if (options.restore) {
        canvasData = this.getCanvasData();
        cropBoxData = this.getCropBoxData();
      }
      this.render();
      if (options.restore) {
        this.setCanvasData(forEach(canvasData, function(n2, i2) {
          canvasData[i2] = n2 * ratio;
        }));
        this.setCropBoxData(forEach(cropBoxData, function(n2, i2) {
          cropBoxData[i2] = n2 * ratio;
        }));
      }
    }
  },
  dblclick: function dblclick() {
    if (this.disabled || this.options.dragMode === DRAG_MODE_NONE) {
      return;
    }
    this.setDragMode(hasClass(this.dragBox, CLASS_CROP) ? DRAG_MODE_MOVE : DRAG_MODE_CROP);
  },
  wheel: function wheel(event) {
    var _this = this;
    var ratio = Number(this.options.wheelZoomRatio) || 0.1;
    var delta = 1;
    if (this.disabled) {
      return;
    }
    event.preventDefault();
    if (this.wheeling) {
      return;
    }
    this.wheeling = true;
    setTimeout(function() {
      _this.wheeling = false;
    }, 50);
    if (event.deltaY) {
      delta = event.deltaY > 0 ? 1 : -1;
    } else if (event.wheelDelta) {
      delta = -event.wheelDelta / 120;
    } else if (event.detail) {
      delta = event.detail > 0 ? 1 : -1;
    }
    this.zoom(-delta * ratio, event);
  },
  cropStart: function cropStart(event) {
    var buttons = event.buttons, button = event.button;
    if (this.disabled || (event.type === "mousedown" || event.type === "pointerdown" && event.pointerType === "mouse") && // No primary button (Usually the left button)
    (isNumber(buttons) && buttons !== 1 || isNumber(button) && button !== 0 || event.ctrlKey)) {
      return;
    }
    var options = this.options, pointers = this.pointers;
    var action;
    if (event.changedTouches) {
      forEach(event.changedTouches, function(touch) {
        pointers[touch.identifier] = getPointer(touch);
      });
    } else {
      pointers[event.pointerId || 0] = getPointer(event);
    }
    if (Object.keys(pointers).length > 1 && options.zoomable && options.zoomOnTouch) {
      action = ACTION_ZOOM;
    } else {
      action = getData(event.target, DATA_ACTION);
    }
    if (!REGEXP_ACTIONS.test(action)) {
      return;
    }
    if (dispatchEvent(this.element, EVENT_CROP_START, {
      originalEvent: event,
      action
    }) === false) {
      return;
    }
    event.preventDefault();
    this.action = action;
    this.cropping = false;
    if (action === ACTION_CROP) {
      this.cropping = true;
      addClass(this.dragBox, CLASS_MODAL);
    }
  },
  cropMove: function cropMove(event) {
    var action = this.action;
    if (this.disabled || !action) {
      return;
    }
    var pointers = this.pointers;
    event.preventDefault();
    if (dispatchEvent(this.element, EVENT_CROP_MOVE, {
      originalEvent: event,
      action
    }) === false) {
      return;
    }
    if (event.changedTouches) {
      forEach(event.changedTouches, function(touch) {
        assign(pointers[touch.identifier] || {}, getPointer(touch, true));
      });
    } else {
      assign(pointers[event.pointerId || 0] || {}, getPointer(event, true));
    }
    this.change(event);
  },
  cropEnd: function cropEnd(event) {
    if (this.disabled) {
      return;
    }
    var action = this.action, pointers = this.pointers;
    if (event.changedTouches) {
      forEach(event.changedTouches, function(touch) {
        delete pointers[touch.identifier];
      });
    } else {
      delete pointers[event.pointerId || 0];
    }
    if (!action) {
      return;
    }
    event.preventDefault();
    if (!Object.keys(pointers).length) {
      this.action = "";
    }
    if (this.cropping) {
      this.cropping = false;
      toggleClass(this.dragBox, CLASS_MODAL, this.cropped && this.options.modal);
    }
    dispatchEvent(this.element, EVENT_CROP_END, {
      originalEvent: event,
      action
    });
  }
};
var change = {
  change: function change2(event) {
    var options = this.options, canvasData = this.canvasData, containerData = this.containerData, cropBoxData = this.cropBoxData, pointers = this.pointers;
    var action = this.action;
    var aspectRatio = options.aspectRatio;
    var left = cropBoxData.left, top = cropBoxData.top, width = cropBoxData.width, height = cropBoxData.height;
    var right = left + width;
    var bottom = top + height;
    var minLeft = 0;
    var minTop = 0;
    var maxWidth = containerData.width;
    var maxHeight = containerData.height;
    var renderable = true;
    var offset;
    if (!aspectRatio && event.shiftKey) {
      aspectRatio = width && height ? width / height : 1;
    }
    if (this.limited) {
      minLeft = cropBoxData.minLeft;
      minTop = cropBoxData.minTop;
      maxWidth = minLeft + Math.min(containerData.width, canvasData.width, canvasData.left + canvasData.width);
      maxHeight = minTop + Math.min(containerData.height, canvasData.height, canvasData.top + canvasData.height);
    }
    var pointer = pointers[Object.keys(pointers)[0]];
    var range = {
      x: pointer.endX - pointer.startX,
      y: pointer.endY - pointer.startY
    };
    var check = function check2(side) {
      switch (side) {
        case ACTION_EAST:
          if (right + range.x > maxWidth) {
            range.x = maxWidth - right;
          }
          break;
        case ACTION_WEST:
          if (left + range.x < minLeft) {
            range.x = minLeft - left;
          }
          break;
        case ACTION_NORTH:
          if (top + range.y < minTop) {
            range.y = minTop - top;
          }
          break;
        case ACTION_SOUTH:
          if (bottom + range.y > maxHeight) {
            range.y = maxHeight - bottom;
          }
          break;
      }
    };
    switch (action) {
      case ACTION_ALL:
        left += range.x;
        top += range.y;
        break;
      case ACTION_EAST:
        if (range.x >= 0 && (right >= maxWidth || aspectRatio && (top <= minTop || bottom >= maxHeight))) {
          renderable = false;
          break;
        }
        check(ACTION_EAST);
        width += range.x;
        if (width < 0) {
          action = ACTION_WEST;
          width = -width;
          left -= width;
        }
        if (aspectRatio) {
          height = width / aspectRatio;
          top += (cropBoxData.height - height) / 2;
        }
        break;
      case ACTION_NORTH:
        if (range.y <= 0 && (top <= minTop || aspectRatio && (left <= minLeft || right >= maxWidth))) {
          renderable = false;
          break;
        }
        check(ACTION_NORTH);
        height -= range.y;
        top += range.y;
        if (height < 0) {
          action = ACTION_SOUTH;
          height = -height;
          top -= height;
        }
        if (aspectRatio) {
          width = height * aspectRatio;
          left += (cropBoxData.width - width) / 2;
        }
        break;
      case ACTION_WEST:
        if (range.x <= 0 && (left <= minLeft || aspectRatio && (top <= minTop || bottom >= maxHeight))) {
          renderable = false;
          break;
        }
        check(ACTION_WEST);
        width -= range.x;
        left += range.x;
        if (width < 0) {
          action = ACTION_EAST;
          width = -width;
          left -= width;
        }
        if (aspectRatio) {
          height = width / aspectRatio;
          top += (cropBoxData.height - height) / 2;
        }
        break;
      case ACTION_SOUTH:
        if (range.y >= 0 && (bottom >= maxHeight || aspectRatio && (left <= minLeft || right >= maxWidth))) {
          renderable = false;
          break;
        }
        check(ACTION_SOUTH);
        height += range.y;
        if (height < 0) {
          action = ACTION_NORTH;
          height = -height;
          top -= height;
        }
        if (aspectRatio) {
          width = height * aspectRatio;
          left += (cropBoxData.width - width) / 2;
        }
        break;
      case ACTION_NORTH_EAST:
        if (aspectRatio) {
          if (range.y <= 0 && (top <= minTop || right >= maxWidth)) {
            renderable = false;
            break;
          }
          check(ACTION_NORTH);
          height -= range.y;
          top += range.y;
          width = height * aspectRatio;
        } else {
          check(ACTION_NORTH);
          check(ACTION_EAST);
          if (range.x >= 0) {
            if (right < maxWidth) {
              width += range.x;
            } else if (range.y <= 0 && top <= minTop) {
              renderable = false;
            }
          } else {
            width += range.x;
          }
          if (range.y <= 0) {
            if (top > minTop) {
              height -= range.y;
              top += range.y;
            }
          } else {
            height -= range.y;
            top += range.y;
          }
        }
        if (width < 0 && height < 0) {
          action = ACTION_SOUTH_WEST;
          height = -height;
          width = -width;
          top -= height;
          left -= width;
        } else if (width < 0) {
          action = ACTION_NORTH_WEST;
          width = -width;
          left -= width;
        } else if (height < 0) {
          action = ACTION_SOUTH_EAST;
          height = -height;
          top -= height;
        }
        break;
      case ACTION_NORTH_WEST:
        if (aspectRatio) {
          if (range.y <= 0 && (top <= minTop || left <= minLeft)) {
            renderable = false;
            break;
          }
          check(ACTION_NORTH);
          height -= range.y;
          top += range.y;
          width = height * aspectRatio;
          left += cropBoxData.width - width;
        } else {
          check(ACTION_NORTH);
          check(ACTION_WEST);
          if (range.x <= 0) {
            if (left > minLeft) {
              width -= range.x;
              left += range.x;
            } else if (range.y <= 0 && top <= minTop) {
              renderable = false;
            }
          } else {
            width -= range.x;
            left += range.x;
          }
          if (range.y <= 0) {
            if (top > minTop) {
              height -= range.y;
              top += range.y;
            }
          } else {
            height -= range.y;
            top += range.y;
          }
        }
        if (width < 0 && height < 0) {
          action = ACTION_SOUTH_EAST;
          height = -height;
          width = -width;
          top -= height;
          left -= width;
        } else if (width < 0) {
          action = ACTION_NORTH_EAST;
          width = -width;
          left -= width;
        } else if (height < 0) {
          action = ACTION_SOUTH_WEST;
          height = -height;
          top -= height;
        }
        break;
      case ACTION_SOUTH_WEST:
        if (aspectRatio) {
          if (range.x <= 0 && (left <= minLeft || bottom >= maxHeight)) {
            renderable = false;
            break;
          }
          check(ACTION_WEST);
          width -= range.x;
          left += range.x;
          height = width / aspectRatio;
        } else {
          check(ACTION_SOUTH);
          check(ACTION_WEST);
          if (range.x <= 0) {
            if (left > minLeft) {
              width -= range.x;
              left += range.x;
            } else if (range.y >= 0 && bottom >= maxHeight) {
              renderable = false;
            }
          } else {
            width -= range.x;
            left += range.x;
          }
          if (range.y >= 0) {
            if (bottom < maxHeight) {
              height += range.y;
            }
          } else {
            height += range.y;
          }
        }
        if (width < 0 && height < 0) {
          action = ACTION_NORTH_EAST;
          height = -height;
          width = -width;
          top -= height;
          left -= width;
        } else if (width < 0) {
          action = ACTION_SOUTH_EAST;
          width = -width;
          left -= width;
        } else if (height < 0) {
          action = ACTION_NORTH_WEST;
          height = -height;
          top -= height;
        }
        break;
      case ACTION_SOUTH_EAST:
        if (aspectRatio) {
          if (range.x >= 0 && (right >= maxWidth || bottom >= maxHeight)) {
            renderable = false;
            break;
          }
          check(ACTION_EAST);
          width += range.x;
          height = width / aspectRatio;
        } else {
          check(ACTION_SOUTH);
          check(ACTION_EAST);
          if (range.x >= 0) {
            if (right < maxWidth) {
              width += range.x;
            } else if (range.y >= 0 && bottom >= maxHeight) {
              renderable = false;
            }
          } else {
            width += range.x;
          }
          if (range.y >= 0) {
            if (bottom < maxHeight) {
              height += range.y;
            }
          } else {
            height += range.y;
          }
        }
        if (width < 0 && height < 0) {
          action = ACTION_NORTH_WEST;
          height = -height;
          width = -width;
          top -= height;
          left -= width;
        } else if (width < 0) {
          action = ACTION_SOUTH_WEST;
          width = -width;
          left -= width;
        } else if (height < 0) {
          action = ACTION_NORTH_EAST;
          height = -height;
          top -= height;
        }
        break;
      case ACTION_MOVE:
        this.move(range.x, range.y);
        renderable = false;
        break;
      case ACTION_ZOOM:
        this.zoom(getMaxZoomRatio(pointers), event);
        renderable = false;
        break;
      case ACTION_CROP:
        if (!range.x || !range.y) {
          renderable = false;
          break;
        }
        offset = getOffset(this.cropper);
        left = pointer.startX - offset.left;
        top = pointer.startY - offset.top;
        width = cropBoxData.minWidth;
        height = cropBoxData.minHeight;
        if (range.x > 0) {
          action = range.y > 0 ? ACTION_SOUTH_EAST : ACTION_NORTH_EAST;
        } else if (range.x < 0) {
          left -= width;
          action = range.y > 0 ? ACTION_SOUTH_WEST : ACTION_NORTH_WEST;
        }
        if (range.y < 0) {
          top -= height;
        }
        if (!this.cropped) {
          removeClass(this.cropBox, CLASS_HIDDEN);
          this.cropped = true;
          if (this.limited) {
            this.limitCropBox(true, true);
          }
        }
        break;
    }
    if (renderable) {
      cropBoxData.width = width;
      cropBoxData.height = height;
      cropBoxData.left = left;
      cropBoxData.top = top;
      this.action = action;
      this.renderCropBox();
    }
    forEach(pointers, function(p) {
      p.startX = p.endX;
      p.startY = p.endY;
    });
  }
};
var methods = {
  // Show the crop box manually
  crop: function crop() {
    if (this.ready && !this.cropped && !this.disabled) {
      this.cropped = true;
      this.limitCropBox(true, true);
      if (this.options.modal) {
        addClass(this.dragBox, CLASS_MODAL);
      }
      removeClass(this.cropBox, CLASS_HIDDEN);
      this.setCropBoxData(this.initialCropBoxData);
    }
    return this;
  },
  // Reset the image and crop box to their initial states
  reset: function reset() {
    if (this.ready && !this.disabled) {
      this.imageData = assign({}, this.initialImageData);
      this.canvasData = assign({}, this.initialCanvasData);
      this.cropBoxData = assign({}, this.initialCropBoxData);
      this.renderCanvas();
      if (this.cropped) {
        this.renderCropBox();
      }
    }
    return this;
  },
  // Clear the crop box
  clear: function clear() {
    if (this.cropped && !this.disabled) {
      assign(this.cropBoxData, {
        left: 0,
        top: 0,
        width: 0,
        height: 0
      });
      this.cropped = false;
      this.renderCropBox();
      this.limitCanvas(true, true);
      this.renderCanvas();
      removeClass(this.dragBox, CLASS_MODAL);
      addClass(this.cropBox, CLASS_HIDDEN);
    }
    return this;
  },
  /**
   * Replace the image's src and rebuild the cropper
   * @param {string} url - The new URL.
   * @param {boolean} [hasSameSize] - Indicate if the new image has the same size as the old one.
   * @returns {Cropper} this
   */
  replace: function replace(url) {
    var hasSameSize = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : false;
    if (!this.disabled && url) {
      if (this.isImg) {
        this.element.src = url;
      }
      if (hasSameSize) {
        this.url = url;
        this.image.src = url;
        if (this.ready) {
          this.viewBoxImage.src = url;
          forEach(this.previews, function(element) {
            element.getElementsByTagName("img")[0].src = url;
          });
        }
      } else {
        if (this.isImg) {
          this.replaced = true;
        }
        this.options.data = null;
        this.uncreate();
        this.load(url);
      }
    }
    return this;
  },
  // Enable (unfreeze) the cropper
  enable: function enable() {
    if (this.ready && this.disabled) {
      this.disabled = false;
      removeClass(this.cropper, CLASS_DISABLED);
    }
    return this;
  },
  // Disable (freeze) the cropper
  disable: function disable() {
    if (this.ready && !this.disabled) {
      this.disabled = true;
      addClass(this.cropper, CLASS_DISABLED);
    }
    return this;
  },
  /**
   * Destroy the cropper and remove the instance from the image
   * @returns {Cropper} this
   */
  destroy: function destroy() {
    var element = this.element;
    if (!element[NAMESPACE]) {
      return this;
    }
    element[NAMESPACE] = void 0;
    if (this.isImg && this.replaced) {
      element.src = this.originalUrl;
    }
    this.uncreate();
    return this;
  },
  /**
   * Move the canvas with relative offsets
   * @param {number} offsetX - The relative offset distance on the x-axis.
   * @param {number} [offsetY=offsetX] - The relative offset distance on the y-axis.
   * @returns {Cropper} this
   */
  move: function move(offsetX) {
    var offsetY = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : offsetX;
    var _this$canvasData = this.canvasData, left = _this$canvasData.left, top = _this$canvasData.top;
    return this.moveTo(isUndefined(offsetX) ? offsetX : left + Number(offsetX), isUndefined(offsetY) ? offsetY : top + Number(offsetY));
  },
  /**
   * Move the canvas to an absolute point
   * @param {number} x - The x-axis coordinate.
   * @param {number} [y=x] - The y-axis coordinate.
   * @returns {Cropper} this
   */
  moveTo: function moveTo(x) {
    var y = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : x;
    var canvasData = this.canvasData;
    var changed = false;
    x = Number(x);
    y = Number(y);
    if (this.ready && !this.disabled && this.options.movable) {
      if (isNumber(x)) {
        canvasData.left = x;
        changed = true;
      }
      if (isNumber(y)) {
        canvasData.top = y;
        changed = true;
      }
      if (changed) {
        this.renderCanvas(true);
      }
    }
    return this;
  },
  /**
   * Zoom the canvas with a relative ratio
   * @param {number} ratio - The target ratio.
   * @param {Event} _originalEvent - The original event if any.
   * @returns {Cropper} this
   */
  zoom: function zoom(ratio, _originalEvent) {
    var canvasData = this.canvasData;
    ratio = Number(ratio);
    if (ratio < 0) {
      ratio = 1 / (1 - ratio);
    } else {
      ratio = 1 + ratio;
    }
    return this.zoomTo(canvasData.width * ratio / canvasData.naturalWidth, null, _originalEvent);
  },
  /**
   * Zoom the canvas to an absolute ratio
   * @param {number} ratio - The target ratio.
   * @param {Object} pivot - The zoom pivot point coordinate.
   * @param {Event} _originalEvent - The original event if any.
   * @returns {Cropper} this
   */
  zoomTo: function zoomTo(ratio, pivot, _originalEvent) {
    var options = this.options, canvasData = this.canvasData;
    var width = canvasData.width, height = canvasData.height, naturalWidth = canvasData.naturalWidth, naturalHeight = canvasData.naturalHeight;
    ratio = Number(ratio);
    if (ratio >= 0 && this.ready && !this.disabled && options.zoomable) {
      var newWidth = naturalWidth * ratio;
      var newHeight = naturalHeight * ratio;
      if (dispatchEvent(this.element, EVENT_ZOOM, {
        ratio,
        oldRatio: width / naturalWidth,
        originalEvent: _originalEvent
      }) === false) {
        return this;
      }
      if (_originalEvent) {
        var pointers = this.pointers;
        var offset = getOffset(this.cropper);
        var center = pointers && Object.keys(pointers).length ? getPointersCenter(pointers) : {
          pageX: _originalEvent.pageX,
          pageY: _originalEvent.pageY
        };
        canvasData.left -= (newWidth - width) * ((center.pageX - offset.left - canvasData.left) / width);
        canvasData.top -= (newHeight - height) * ((center.pageY - offset.top - canvasData.top) / height);
      } else if (isPlainObject(pivot) && isNumber(pivot.x) && isNumber(pivot.y)) {
        canvasData.left -= (newWidth - width) * ((pivot.x - canvasData.left) / width);
        canvasData.top -= (newHeight - height) * ((pivot.y - canvasData.top) / height);
      } else {
        canvasData.left -= (newWidth - width) / 2;
        canvasData.top -= (newHeight - height) / 2;
      }
      canvasData.width = newWidth;
      canvasData.height = newHeight;
      this.renderCanvas(true);
    }
    return this;
  },
  /**
   * Rotate the canvas with a relative degree
   * @param {number} degree - The rotate degree.
   * @returns {Cropper} this
   */
  rotate: function rotate(degree) {
    return this.rotateTo((this.imageData.rotate || 0) + Number(degree));
  },
  /**
   * Rotate the canvas to an absolute degree
   * @param {number} degree - The rotate degree.
   * @returns {Cropper} this
   */
  rotateTo: function rotateTo(degree) {
    degree = Number(degree);
    if (isNumber(degree) && this.ready && !this.disabled && this.options.rotatable) {
      this.imageData.rotate = degree % 360;
      this.renderCanvas(true, true);
    }
    return this;
  },
  /**
   * Scale the image on the x-axis.
   * @param {number} scaleX - The scale ratio on the x-axis.
   * @returns {Cropper} this
   */
  scaleX: function scaleX(_scaleX) {
    var scaleY2 = this.imageData.scaleY;
    return this.scale(_scaleX, isNumber(scaleY2) ? scaleY2 : 1);
  },
  /**
   * Scale the image on the y-axis.
   * @param {number} scaleY - The scale ratio on the y-axis.
   * @returns {Cropper} this
   */
  scaleY: function scaleY(_scaleY) {
    var scaleX2 = this.imageData.scaleX;
    return this.scale(isNumber(scaleX2) ? scaleX2 : 1, _scaleY);
  },
  /**
   * Scale the image
   * @param {number} scaleX - The scale ratio on the x-axis.
   * @param {number} [scaleY=scaleX] - The scale ratio on the y-axis.
   * @returns {Cropper} this
   */
  scale: function scale(scaleX2) {
    var scaleY2 = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : scaleX2;
    var imageData = this.imageData;
    var transformed = false;
    scaleX2 = Number(scaleX2);
    scaleY2 = Number(scaleY2);
    if (this.ready && !this.disabled && this.options.scalable) {
      if (isNumber(scaleX2)) {
        imageData.scaleX = scaleX2;
        transformed = true;
      }
      if (isNumber(scaleY2)) {
        imageData.scaleY = scaleY2;
        transformed = true;
      }
      if (transformed) {
        this.renderCanvas(true, true);
      }
    }
    return this;
  },
  /**
   * Get the cropped area position and size data (base on the original image)
   * @param {boolean} [rounded=false] - Indicate if round the data values or not.
   * @returns {Object} The result cropped data.
   */
  getData: function getData2() {
    var rounded = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : false;
    var options = this.options, imageData = this.imageData, canvasData = this.canvasData, cropBoxData = this.cropBoxData;
    var data;
    if (this.ready && this.cropped) {
      data = {
        x: cropBoxData.left - canvasData.left,
        y: cropBoxData.top - canvasData.top,
        width: cropBoxData.width,
        height: cropBoxData.height
      };
      var ratio = imageData.width / imageData.naturalWidth;
      forEach(data, function(n2, i2) {
        data[i2] = n2 / ratio;
      });
      if (rounded) {
        var bottom = Math.round(data.y + data.height);
        var right = Math.round(data.x + data.width);
        data.x = Math.round(data.x);
        data.y = Math.round(data.y);
        data.width = right - data.x;
        data.height = bottom - data.y;
      }
    } else {
      data = {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    }
    if (options.rotatable) {
      data.rotate = imageData.rotate || 0;
    }
    if (options.scalable) {
      data.scaleX = imageData.scaleX || 1;
      data.scaleY = imageData.scaleY || 1;
    }
    return data;
  },
  /**
   * Set the cropped area position and size with new data
   * @param {Object} data - The new data.
   * @returns {Cropper} this
   */
  setData: function setData2(data) {
    var options = this.options, imageData = this.imageData, canvasData = this.canvasData;
    var cropBoxData = {};
    if (this.ready && !this.disabled && isPlainObject(data)) {
      var transformed = false;
      if (options.rotatable) {
        if (isNumber(data.rotate) && data.rotate !== imageData.rotate) {
          imageData.rotate = data.rotate;
          transformed = true;
        }
      }
      if (options.scalable) {
        if (isNumber(data.scaleX) && data.scaleX !== imageData.scaleX) {
          imageData.scaleX = data.scaleX;
          transformed = true;
        }
        if (isNumber(data.scaleY) && data.scaleY !== imageData.scaleY) {
          imageData.scaleY = data.scaleY;
          transformed = true;
        }
      }
      if (transformed) {
        this.renderCanvas(true, true);
      }
      var ratio = imageData.width / imageData.naturalWidth;
      if (isNumber(data.x)) {
        cropBoxData.left = data.x * ratio + canvasData.left;
      }
      if (isNumber(data.y)) {
        cropBoxData.top = data.y * ratio + canvasData.top;
      }
      if (isNumber(data.width)) {
        cropBoxData.width = data.width * ratio;
      }
      if (isNumber(data.height)) {
        cropBoxData.height = data.height * ratio;
      }
      this.setCropBoxData(cropBoxData);
    }
    return this;
  },
  /**
   * Get the container size data.
   * @returns {Object} The result container data.
   */
  getContainerData: function getContainerData() {
    return this.ready ? assign({}, this.containerData) : {};
  },
  /**
   * Get the image position and size data.
   * @returns {Object} The result image data.
   */
  getImageData: function getImageData() {
    return this.sized ? assign({}, this.imageData) : {};
  },
  /**
   * Get the canvas position and size data.
   * @returns {Object} The result canvas data.
   */
  getCanvasData: function getCanvasData() {
    var canvasData = this.canvasData;
    var data = {};
    if (this.ready) {
      forEach(["left", "top", "width", "height", "naturalWidth", "naturalHeight"], function(n2) {
        data[n2] = canvasData[n2];
      });
    }
    return data;
  },
  /**
   * Set the canvas position and size with new data.
   * @param {Object} data - The new canvas data.
   * @returns {Cropper} this
   */
  setCanvasData: function setCanvasData(data) {
    var canvasData = this.canvasData;
    var aspectRatio = canvasData.aspectRatio;
    if (this.ready && !this.disabled && isPlainObject(data)) {
      if (isNumber(data.left)) {
        canvasData.left = data.left;
      }
      if (isNumber(data.top)) {
        canvasData.top = data.top;
      }
      if (isNumber(data.width)) {
        canvasData.width = data.width;
        canvasData.height = data.width / aspectRatio;
      } else if (isNumber(data.height)) {
        canvasData.height = data.height;
        canvasData.width = data.height * aspectRatio;
      }
      this.renderCanvas(true);
    }
    return this;
  },
  /**
   * Get the crop box position and size data.
   * @returns {Object} The result crop box data.
   */
  getCropBoxData: function getCropBoxData() {
    var cropBoxData = this.cropBoxData;
    var data;
    if (this.ready && this.cropped) {
      data = {
        left: cropBoxData.left,
        top: cropBoxData.top,
        width: cropBoxData.width,
        height: cropBoxData.height
      };
    }
    return data || {};
  },
  /**
   * Set the crop box position and size with new data.
   * @param {Object} data - The new crop box data.
   * @returns {Cropper} this
   */
  setCropBoxData: function setCropBoxData(data) {
    var cropBoxData = this.cropBoxData;
    var aspectRatio = this.options.aspectRatio;
    var widthChanged;
    var heightChanged;
    if (this.ready && this.cropped && !this.disabled && isPlainObject(data)) {
      if (isNumber(data.left)) {
        cropBoxData.left = data.left;
      }
      if (isNumber(data.top)) {
        cropBoxData.top = data.top;
      }
      if (isNumber(data.width) && data.width !== cropBoxData.width) {
        widthChanged = true;
        cropBoxData.width = data.width;
      }
      if (isNumber(data.height) && data.height !== cropBoxData.height) {
        heightChanged = true;
        cropBoxData.height = data.height;
      }
      if (aspectRatio) {
        if (widthChanged) {
          cropBoxData.height = cropBoxData.width / aspectRatio;
        } else if (heightChanged) {
          cropBoxData.width = cropBoxData.height * aspectRatio;
        }
      }
      this.renderCropBox();
    }
    return this;
  },
  /**
   * Get a canvas drawn the cropped image.
   * @param {Object} [options={}] - The config options.
   * @returns {HTMLCanvasElement} - The result canvas.
   */
  getCroppedCanvas: function getCroppedCanvas() {
    var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    if (!this.ready || !window.HTMLCanvasElement) {
      return null;
    }
    var canvasData = this.canvasData;
    var source = getSourceCanvas(this.image, this.imageData, canvasData, options);
    if (!this.cropped) {
      return source;
    }
    var _this$getData = this.getData(options.rounded), initialX = _this$getData.x, initialY = _this$getData.y, initialWidth = _this$getData.width, initialHeight = _this$getData.height;
    var ratio = source.width / Math.floor(canvasData.naturalWidth);
    if (ratio !== 1) {
      initialX *= ratio;
      initialY *= ratio;
      initialWidth *= ratio;
      initialHeight *= ratio;
    }
    var aspectRatio = initialWidth / initialHeight;
    var maxSizes = getAdjustedSizes({
      aspectRatio,
      width: options.maxWidth || Infinity,
      height: options.maxHeight || Infinity
    });
    var minSizes = getAdjustedSizes({
      aspectRatio,
      width: options.minWidth || 0,
      height: options.minHeight || 0
    }, "cover");
    var _getAdjustedSizes = getAdjustedSizes({
      aspectRatio,
      width: options.width || (ratio !== 1 ? source.width : initialWidth),
      height: options.height || (ratio !== 1 ? source.height : initialHeight)
    }), width = _getAdjustedSizes.width, height = _getAdjustedSizes.height;
    width = Math.min(maxSizes.width, Math.max(minSizes.width, width));
    height = Math.min(maxSizes.height, Math.max(minSizes.height, height));
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.width = normalizeDecimalNumber(width);
    canvas.height = normalizeDecimalNumber(height);
    context.fillStyle = options.fillColor || "transparent";
    context.fillRect(0, 0, width, height);
    var _options$imageSmoothi = options.imageSmoothingEnabled, imageSmoothingEnabled = _options$imageSmoothi === void 0 ? true : _options$imageSmoothi, imageSmoothingQuality = options.imageSmoothingQuality;
    context.imageSmoothingEnabled = imageSmoothingEnabled;
    if (imageSmoothingQuality) {
      context.imageSmoothingQuality = imageSmoothingQuality;
    }
    var sourceWidth = source.width;
    var sourceHeight = source.height;
    var srcX = initialX;
    var srcY = initialY;
    var srcWidth;
    var srcHeight;
    var dstX;
    var dstY;
    var dstWidth;
    var dstHeight;
    if (srcX <= -initialWidth || srcX > sourceWidth) {
      srcX = 0;
      srcWidth = 0;
      dstX = 0;
      dstWidth = 0;
    } else if (srcX <= 0) {
      dstX = -srcX;
      srcX = 0;
      srcWidth = Math.min(sourceWidth, initialWidth + srcX);
      dstWidth = srcWidth;
    } else if (srcX <= sourceWidth) {
      dstX = 0;
      srcWidth = Math.min(initialWidth, sourceWidth - srcX);
      dstWidth = srcWidth;
    }
    if (srcWidth <= 0 || srcY <= -initialHeight || srcY > sourceHeight) {
      srcY = 0;
      srcHeight = 0;
      dstY = 0;
      dstHeight = 0;
    } else if (srcY <= 0) {
      dstY = -srcY;
      srcY = 0;
      srcHeight = Math.min(sourceHeight, initialHeight + srcY);
      dstHeight = srcHeight;
    } else if (srcY <= sourceHeight) {
      dstY = 0;
      srcHeight = Math.min(initialHeight, sourceHeight - srcY);
      dstHeight = srcHeight;
    }
    var params = [srcX, srcY, srcWidth, srcHeight];
    if (dstWidth > 0 && dstHeight > 0) {
      var scale2 = width / initialWidth;
      params.push(dstX * scale2, dstY * scale2, dstWidth * scale2, dstHeight * scale2);
    }
    context.drawImage.apply(context, [source].concat(_toConsumableArray(params.map(function(param) {
      return Math.floor(normalizeDecimalNumber(param));
    }))));
    return canvas;
  },
  /**
   * Change the aspect ratio of the crop box.
   * @param {number} aspectRatio - The new aspect ratio.
   * @returns {Cropper} this
   */
  setAspectRatio: function setAspectRatio(aspectRatio) {
    var options = this.options;
    if (!this.disabled && !isUndefined(aspectRatio)) {
      options.aspectRatio = Math.max(0, aspectRatio) || NaN;
      if (this.ready) {
        this.initCropBox();
        if (this.cropped) {
          this.renderCropBox();
        }
      }
    }
    return this;
  },
  /**
   * Change the drag mode.
   * @param {string} mode - The new drag mode.
   * @returns {Cropper} this
   */
  setDragMode: function setDragMode(mode) {
    var options = this.options, dragBox = this.dragBox, face = this.face;
    if (this.ready && !this.disabled) {
      var croppable = mode === DRAG_MODE_CROP;
      var movable = options.movable && mode === DRAG_MODE_MOVE;
      mode = croppable || movable ? mode : DRAG_MODE_NONE;
      options.dragMode = mode;
      setData(dragBox, DATA_ACTION, mode);
      toggleClass(dragBox, CLASS_CROP, croppable);
      toggleClass(dragBox, CLASS_MOVE, movable);
      if (!options.cropBoxMovable) {
        setData(face, DATA_ACTION, mode);
        toggleClass(face, CLASS_CROP, croppable);
        toggleClass(face, CLASS_MOVE, movable);
      }
    }
    return this;
  }
};
var AnotherCropper = WINDOW.Cropper;
var Cropper = /* @__PURE__ */ function() {
  function Cropper2(element) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    _classCallCheck(this, Cropper2);
    if (!element || !REGEXP_TAG_NAME.test(element.tagName)) {
      throw new Error("The first argument is required and must be an <img> or <canvas> element.");
    }
    this.element = element;
    this.options = assign({}, DEFAULTS, isPlainObject(options) && options);
    this.cropped = false;
    this.disabled = false;
    this.pointers = {};
    this.ready = false;
    this.reloading = false;
    this.replaced = false;
    this.sized = false;
    this.sizing = false;
    this.init();
  }
  return _createClass(Cropper2, [{
    key: "init",
    value: function init() {
      var element = this.element;
      var tagName = element.tagName.toLowerCase();
      var url;
      if (element[NAMESPACE]) {
        return;
      }
      element[NAMESPACE] = this;
      if (tagName === "img") {
        this.isImg = true;
        url = element.getAttribute("src") || "";
        this.originalUrl = url;
        if (!url) {
          return;
        }
        url = element.src;
      } else if (tagName === "canvas" && window.HTMLCanvasElement) {
        url = element.toDataURL();
      }
      this.load(url);
    }
  }, {
    key: "load",
    value: function load(url) {
      var _this = this;
      if (!url) {
        return;
      }
      this.url = url;
      this.imageData = {};
      var element = this.element, options = this.options;
      if (!options.rotatable && !options.scalable) {
        options.checkOrientation = false;
      }
      if (!options.checkOrientation || !window.ArrayBuffer) {
        this.clone();
        return;
      }
      if (REGEXP_DATA_URL.test(url)) {
        if (REGEXP_DATA_URL_JPEG.test(url)) {
          this.read(dataURLToArrayBuffer(url));
        } else {
          this.clone();
        }
        return;
      }
      var xhr = new XMLHttpRequest();
      var clone = this.clone.bind(this);
      this.reloading = true;
      this.xhr = xhr;
      xhr.onabort = clone;
      xhr.onerror = clone;
      xhr.ontimeout = clone;
      xhr.onprogress = function() {
        if (xhr.getResponseHeader("content-type") !== MIME_TYPE_JPEG) {
          xhr.abort();
        }
      };
      xhr.onload = function() {
        _this.read(xhr.response);
      };
      xhr.onloadend = function() {
        _this.reloading = false;
        _this.xhr = null;
      };
      if (options.checkCrossOrigin && isCrossOriginURL(url) && element.crossOrigin) {
        url = addTimestamp(url);
      }
      xhr.open("GET", url, true);
      xhr.responseType = "arraybuffer";
      xhr.withCredentials = element.crossOrigin === "use-credentials";
      xhr.send();
    }
  }, {
    key: "read",
    value: function read(arrayBuffer) {
      var options = this.options, imageData = this.imageData;
      var orientation = resetAndGetOrientation(arrayBuffer);
      var rotate2 = 0;
      var scaleX2 = 1;
      var scaleY2 = 1;
      if (orientation > 1) {
        this.url = arrayBufferToDataURL(arrayBuffer, MIME_TYPE_JPEG);
        var _parseOrientation = parseOrientation(orientation);
        rotate2 = _parseOrientation.rotate;
        scaleX2 = _parseOrientation.scaleX;
        scaleY2 = _parseOrientation.scaleY;
      }
      if (options.rotatable) {
        imageData.rotate = rotate2;
      }
      if (options.scalable) {
        imageData.scaleX = scaleX2;
        imageData.scaleY = scaleY2;
      }
      this.clone();
    }
  }, {
    key: "clone",
    value: function clone() {
      var element = this.element, url = this.url;
      var crossOrigin = element.crossOrigin;
      var crossOriginUrl = url;
      if (this.options.checkCrossOrigin && isCrossOriginURL(url)) {
        if (!crossOrigin) {
          crossOrigin = "anonymous";
        }
        crossOriginUrl = addTimestamp(url);
      }
      this.crossOrigin = crossOrigin;
      this.crossOriginUrl = crossOriginUrl;
      var image = document.createElement("img");
      if (crossOrigin) {
        image.crossOrigin = crossOrigin;
      }
      image.src = crossOriginUrl || url;
      image.alt = element.alt || "The image to crop";
      this.image = image;
      image.onload = this.start.bind(this);
      image.onerror = this.stop.bind(this);
      addClass(image, CLASS_HIDE);
      element.parentNode.insertBefore(image, element.nextSibling);
    }
  }, {
    key: "start",
    value: function start() {
      var _this2 = this;
      var image = this.image;
      image.onload = null;
      image.onerror = null;
      this.sizing = true;
      var isIOSWebKit = WINDOW.navigator && /(?:iPad|iPhone|iPod).*?AppleWebKit/i.test(WINDOW.navigator.userAgent);
      var done = function done2(naturalWidth, naturalHeight) {
        assign(_this2.imageData, {
          naturalWidth,
          naturalHeight,
          aspectRatio: naturalWidth / naturalHeight
        });
        _this2.initialImageData = assign({}, _this2.imageData);
        _this2.sizing = false;
        _this2.sized = true;
        _this2.build();
      };
      if (image.naturalWidth && !isIOSWebKit) {
        done(image.naturalWidth, image.naturalHeight);
        return;
      }
      var sizingImage = document.createElement("img");
      var body = document.body || document.documentElement;
      this.sizingImage = sizingImage;
      sizingImage.onload = function() {
        done(sizingImage.width, sizingImage.height);
        if (!isIOSWebKit) {
          body.removeChild(sizingImage);
        }
      };
      sizingImage.src = image.src;
      if (!isIOSWebKit) {
        sizingImage.style.cssText = "left:0;max-height:none!important;max-width:none!important;min-height:0!important;min-width:0!important;opacity:0;position:absolute;top:0;z-index:-1;";
        body.appendChild(sizingImage);
      }
    }
  }, {
    key: "stop",
    value: function stop() {
      var image = this.image;
      image.onload = null;
      image.onerror = null;
      image.parentNode.removeChild(image);
      this.image = null;
    }
  }, {
    key: "build",
    value: function build() {
      if (!this.sized || this.ready) {
        return;
      }
      var element = this.element, options = this.options, image = this.image;
      var container = element.parentNode;
      var template = document.createElement("div");
      template.innerHTML = TEMPLATE;
      var cropper = template.querySelector(".".concat(NAMESPACE, "-container"));
      var canvas = cropper.querySelector(".".concat(NAMESPACE, "-canvas"));
      var dragBox = cropper.querySelector(".".concat(NAMESPACE, "-drag-box"));
      var cropBox = cropper.querySelector(".".concat(NAMESPACE, "-crop-box"));
      var face = cropBox.querySelector(".".concat(NAMESPACE, "-face"));
      this.container = container;
      this.cropper = cropper;
      this.canvas = canvas;
      this.dragBox = dragBox;
      this.cropBox = cropBox;
      this.viewBox = cropper.querySelector(".".concat(NAMESPACE, "-view-box"));
      this.face = face;
      canvas.appendChild(image);
      addClass(element, CLASS_HIDDEN);
      container.insertBefore(cropper, element.nextSibling);
      removeClass(image, CLASS_HIDE);
      this.initPreview();
      this.bind();
      options.initialAspectRatio = Math.max(0, options.initialAspectRatio) || NaN;
      options.aspectRatio = Math.max(0, options.aspectRatio) || NaN;
      options.viewMode = Math.max(0, Math.min(3, Math.round(options.viewMode))) || 0;
      addClass(cropBox, CLASS_HIDDEN);
      if (!options.guides) {
        addClass(cropBox.getElementsByClassName("".concat(NAMESPACE, "-dashed")), CLASS_HIDDEN);
      }
      if (!options.center) {
        addClass(cropBox.getElementsByClassName("".concat(NAMESPACE, "-center")), CLASS_HIDDEN);
      }
      if (options.background) {
        addClass(cropper, "".concat(NAMESPACE, "-bg"));
      }
      if (!options.highlight) {
        addClass(face, CLASS_INVISIBLE);
      }
      if (options.cropBoxMovable) {
        addClass(face, CLASS_MOVE);
        setData(face, DATA_ACTION, ACTION_ALL);
      }
      if (!options.cropBoxResizable) {
        addClass(cropBox.getElementsByClassName("".concat(NAMESPACE, "-line")), CLASS_HIDDEN);
        addClass(cropBox.getElementsByClassName("".concat(NAMESPACE, "-point")), CLASS_HIDDEN);
      }
      this.render();
      this.ready = true;
      this.setDragMode(options.dragMode);
      if (options.autoCrop) {
        this.crop();
      }
      this.setData(options.data);
      if (isFunction(options.ready)) {
        addListener(element, EVENT_READY, options.ready, {
          once: true
        });
      }
      dispatchEvent(element, EVENT_READY);
    }
  }, {
    key: "unbuild",
    value: function unbuild() {
      if (!this.ready) {
        return;
      }
      this.ready = false;
      this.unbind();
      this.resetPreview();
      var parentNode = this.cropper.parentNode;
      if (parentNode) {
        parentNode.removeChild(this.cropper);
      }
      removeClass(this.element, CLASS_HIDDEN);
    }
  }, {
    key: "uncreate",
    value: function uncreate() {
      if (this.ready) {
        this.unbuild();
        this.ready = false;
        this.cropped = false;
      } else if (this.sizing) {
        this.sizingImage.onload = null;
        this.sizing = false;
        this.sized = false;
      } else if (this.reloading) {
        this.xhr.onabort = null;
        this.xhr.abort();
      } else if (this.image) {
        this.stop();
      }
    }
    /**
     * Get the no conflict cropper class.
     * @returns {Cropper} The cropper class.
     */
  }], [{
    key: "noConflict",
    value: function noConflict() {
      window.Cropper = AnotherCropper;
      return Cropper2;
    }
    /**
     * Change the default options.
     * @param {Object} options - The new default options.
     */
  }, {
    key: "setDefaults",
    value: function setDefaults3(options) {
      assign(DEFAULTS, isPlainObject(options) && options);
    }
  }]);
}();
assign(Cropper.prototype, render, preview, events, handlers, change, methods);
var n = function() {
  return n = Object.assign || function(e2) {
    for (var r, o = 1, t = arguments.length; o < t; o++) for (var n2 in r = arguments[o]) Object.prototype.hasOwnProperty.call(r, n2) && (e2[n2] = r[n2]);
    return e2;
  }, n.apply(this, arguments);
};
function a(e2, r) {
  var o = {};
  for (var t in e2) Object.prototype.hasOwnProperty.call(e2, t) && r.indexOf(t) < 0 && (o[t] = e2[t]);
  if (null != e2 && "function" == typeof Object.getOwnPropertySymbols) {
    var n2 = 0;
    for (t = Object.getOwnPropertySymbols(e2); n2 < t.length; n2++) r.indexOf(t[n2]) < 0 && Object.prototype.propertyIsEnumerable.call(e2, t[n2]) && (o[t[n2]] = e2[t[n2]]);
  }
  return o;
}
var c = ["aspectRatio", "autoCrop", "autoCropArea", "background", "center", "checkCrossOrigin", "checkOrientation", "cropBoxMovable", "cropBoxResizable", "data", "dragMode", "guides", "highlight", "initialAspectRatio", "minCanvasHeight", "minCanvasWidth", "minContainerHeight", "minContainerWidth", "minCropBoxHeight", "minCropBoxWidth", "modal", "movable", "preview", "responsive", "restore", "rotatable", "scalable", "toggleDragModeOnDblclick", "viewMode", "wheelZoomRatio", "zoomOnTouch", "zoomOnWheel", "zoomable", "cropstart", "cropmove", "cropend", "crop", "zoom", "ready"], i = { opacity: 0, maxWidth: "100%" }, l = e.forwardRef(function(l2, s) {
  var u = a(l2, []), p = u.dragMode, d = void 0 === p ? "crop" : p, v = u.src, f = u.style, m = u.className, g = u.crossOrigin, y = u.scaleX, b = u.scaleY, h = u.enable, O = u.zoomTo, T = u.rotateTo, z = u.alt, C = void 0 === z ? "picture" : z, w = u.ready, x = u.onInitialized, j = a(u, ["dragMode", "src", "style", "className", "crossOrigin", "scaleX", "scaleY", "enable", "zoomTo", "rotateTo", "alt", "ready", "onInitialized"]), M = { scaleY: b, scaleX: y, enable: h, zoomTo: O, rotateTo: T }, E = function() {
    for (var o = [], t = 0; t < arguments.length; t++) o[t] = arguments[t];
    var n2 = reactExports.useRef(null);
    return e.useEffect(function() {
      o.forEach(function(e2) {
        e2 && ("function" == typeof e2 ? e2(n2.current) : e2.current = n2.current);
      });
    }, [o]), n2;
  }(s, reactExports.useRef(null));
  reactExports.useEffect(function() {
    var e2;
    (null === (e2 = E.current) || void 0 === e2 ? void 0 : e2.cropper) && "number" == typeof O && E.current.cropper.zoomTo(O);
  }, [u.zoomTo]), reactExports.useEffect(function() {
    var e2;
    (null === (e2 = E.current) || void 0 === e2 ? void 0 : e2.cropper) && void 0 !== v && E.current.cropper.reset().clear().replace(v);
  }, [v]), reactExports.useEffect(function() {
    if (null !== E.current) {
      var e2 = new Cropper(E.current, n(n({ dragMode: d }, j), { ready: function(e3) {
        null !== e3.currentTarget && function(e4, r) {
          void 0 === r && (r = {});
          var o = r.enable, t = void 0 === o || o, n2 = r.scaleX, a2 = void 0 === n2 ? 1 : n2, c2 = r.scaleY, i2 = void 0 === c2 ? 1 : c2, l3 = r.zoomTo, s2 = void 0 === l3 ? 0 : l3, u2 = r.rotateTo;
          t ? e4.enable() : e4.disable(), e4.scaleX(a2), e4.scaleY(i2), void 0 !== u2 && e4.rotateTo(u2), s2 > 0 && e4.zoomTo(s2);
        }(e3.currentTarget.cropper, M), w && w(e3);
      } }));
      x && x(e2);
    }
    return function() {
      var e3, r;
      null === (r = null === (e3 = E.current) || void 0 === e3 ? void 0 : e3.cropper) || void 0 === r || r.destroy();
    };
  }, [E]);
  var R = function(e2) {
    return c.reduce(function(e3, r) {
      var o = e3, t = r;
      return o[t], a(o, ["symbol" == typeof t ? t : t + ""]);
    }, e2);
  }(n(n({}, j), { crossOrigin: g, src: v, alt: C }));
  return e.createElement("div", { style: f, className: m }, e.createElement("img", n({}, R, { style: i, ref: E })));
});
function EditorImg({ img, deleteImg, createNewImg, closeWindow }) {
  const cropperRef = reactExports.useRef(null);
  const newImg = reactExports.useRef();
  const saveChangue = () => {
    toPng(newImg.current, { quality: 10 }).then((dataUrl) => {
      const file = base64ToFile(dataUrl, "newImage");
      deleteImg();
      createNewImg(file, false);
    }).catch((err) => {
      console.log(err);
    }).finally(() => {
      closeWindow();
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "componentImgEdit", style: {
    width: "100%",
    height: "100%"
  }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "componentImgEdit-section", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "componentImgEdit-bannerBtn", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "componentImgEdit-BtnContent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "componentImgEdit-Btn",
            type: "button",
            onClick: saveChangue,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "componentImgEdit-btnImg", src: save, alt: "" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "componentImgEdit-BtnText", children: " save " })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            className: "componentImgEdit-Btn",
            type: "button",
            onClick: closeWindow,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "componentImgEdit-btnImg", src: reply, alt: "" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "componentImgEdit-BtnText", children: " back " })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "componentImgEdit-label", children: [
        " Zoom",
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "range",
            name: "Zoom",
            min: "1",
            max: "200",
            onChange: (e2) => {
            }
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "componentImgEdit-imgContent",
        style: {
          height: "85%"
        },
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            l,
            {
              style: { height: 400, width: "100%" },
              initialAspectRatio: 1,
              preview: ".img-preview",
              src: img,
              ref: cropperRef,
              viewMode: 1,
              guides: true,
              minCropBoxHeight: 10,
              minCropBoxWidth: 10,
              background: false,
              responsive: true,
              checkOrientation: false
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
            width: "100%",
            height: "50%",
            display: "flex",
            justify: "center",
            alignItems: "center",
            flexDirection: "column",
            gap: "1rem"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              height: "100%"
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                ref: newImg,
                style: {
                  width: "50%",
                  backgroundColor: "#000000",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  position: "relative"
                },
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "img-preview",
                    style: { width: "100%", float: "left", height: "300px", overflow: "hidden" }
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: "/RBG-Logo-AMAZONAS 365-Original.png", alt: "logo" })
          ] })
        ]
      }
    )
  ] }) }) });
}
function ImgBoxImg({ data, boxModal, deleteImg, setImg, language, index_image, config, redimention = { w: 500, h: 480 } }) {
  let imgBackground;
  isMobile_1 ? imgBackground = camera : imgBackground = srcDefault;
  let [visivility, setVisivility] = reactExports.useState(false);
  let [srcImg, setSrcImg] = reactExports.useState(null);
  let [isDragging, setIsDragging] = reactExports.useState(false);
  const imgCanvas = reactExports.useRef(null);
  const btnDelete = reactExports.useRef(null);
  const btnEdit = reactExports.useRef(null);
  const img = reactExports.useRef(null);
  const boxText = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (srcImg === null) return;
    createImg();
  }, [srcImg]);
  const createImg = async (isRequireCompression = true) => {
    if (btnEdit.current !== null) btnEdit.current.style.display = "none";
    btnDelete.current.style.display = "none";
    img.current.classList.add("toBorder");
    boxText.current.classList.add("boxTextSend");
    const quality = isRequireCompression ? isMobile_1 ? 0.8 : 0.7 : 10;
    language === "es" ? boxText.current.textContent = data.es : boxText.current.textContent = data.en;
    toBlob(imgCanvas.current, { quality }).then(async (dataUrl) => {
      const responseUrl = await sendFile(blobToFile(dataUrl));
      const caption = language === "es" ? boxText.current.textContent = data.es : boxText.current.textContent = data.en;
      setImg({ file: dataUrl, caption, image_index: index_image, url: responseUrl.data.url });
    }).finally(() => {
      if (btnEdit.current !== null) btnEdit.current.style.display = "flex";
      btnDelete.current.style.display = "flex";
      img.current.classList.remove("toBorder");
      boxText.current.classList.remove("boxTextSend");
      boxText.current.textContent = language === "es" ? data.es : data.en;
    });
  };
  const readtImg = (file) => {
    if (srcImg !== null) return boxModal.open({ title: "Aviso", description: "Elimine la imagen para agregar otra" });
    const type = ["image/jpg", "image/jpeg", "image/png"].filter((type2) => type2 === file.type);
    if (!type.length) return boxModal.open({ title: "Aviso", description: "Extención del archivo inválido" });
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onload = (e2) => {
      setSrcImg(srcImg = e2.target.result);
      btnDelete.current.style.display = "flex";
    };
    new Compressor(file, {
      cuality: 0.7,
      width: redimention.w,
      height: redimention.h,
      success: (compressedResult) => {
        const fileReader2 = new FileReader();
        fileReader2.readAsDataURL(compressedResult);
        fileReader2.onload = (e2) => {
          setSrcImg(srcImg = e2.target.result);
          btnDelete.current.style.display = "flex";
        };
      }
    });
  };
  const deleteSrc = () => {
    setSrcImg(srcImg = null);
    deleteImg(language === "es" ? data.es : data.en, () => setSrcImg((srcImg2) => null));
  };
  const visivilityEditImg = () => {
    setVisivility(!visivility);
  };
  const label = language === "es" ? data.es : data.en;
  console.log(language);
  console.log(label);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `dropzone${srcImg ? " dropzone--has-image" : ""}${isDragging ? " dropzone--dragging" : ""}`, ref: imgCanvas, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "div",
        {
          className: "dropzone__area",
          onDragLeave: (e2) => {
            e2.preventDefault();
            setIsDragging(false);
          },
          onDragEnter: (e2) => {
            e2.preventDefault();
            setIsDragging(true);
          },
          onDragOver: (e2) => e2.preventDefault(),
          onDrop: (e2) => {
            e2.preventDefault();
            setIsDragging(false);
            const { items } = e2.dataTransfer;
            readtImg(e2.dataTransfer.files[0]);
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropzone__img-wrap", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "dropzone__action-btn dropzone__action-btn--delete", type: "button", onClick: deleteSrc, ref: btnDelete, children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { style: { width: "16px", height: "16px", filter: "invert()" }, src: trash, alt: "delete" }) }),
              config?.edit && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  className: "dropzone__action-btn dropzone__action-btn--edit",
                  type: "button",
                  ref: btnEdit,
                  onClick: () => {
                    srcImg !== null ? setVisivility(!visivility) : boxModal.open({ title: "Aviso", description: "Selecione una imagen" });
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { style: { width: "16px", height: "16px" }, src: icoEdit, alt: "edit" })
                }
              ),
              !srcImg && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "dropzone__placeholder", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "21 15 16 10 5 21" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: isMobile_1 ? "Toca para capturar" : "Arrastra una imagen aquí" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: `dropzone__img${srcImg ? "" : " dropzone__img--hidden"}`, src: srcImg ? srcImg : imgBackground, ref: img, draggable: false })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "dropzone__label", ref: boxText, style: config?.hiddenBoxText ? { display: "none" } : {}, children: label })
          ]
        }
      ),
      isMobile_1 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          className: "dropzone__file-input",
          type: "file",
          accept: "image/*,capture=camera",
          onChange: (e2) => {
            e2.preventDefault();
            readtImg(e2.target.files[0]);
          }
        }
      )
    ] }),
    visivility && /* @__PURE__ */ jsxRuntimeExports.jsx(EditorImg, { img: srcImg, deleteImg: deleteSrc, createNewImg: readtImg, closeWindow: visivilityEditImg })
  ] });
}
function DivAttention({ awaitWindow, boxModal, reset: reset2, title, data }) {
  const user = useSelector((store) => store.user);
  const establishment2 = useSelector((store) => store.establishment);
  const saveNoveltie = useSaveNoveltie();
  let [table, setNumberTable] = reactExports.useState(data?.tableNumber || "");
  let [time1, setTime1] = reactExports.useState(data?.customerSeatedTime || "");
  let [time2, setTime2] = reactExports.useState(data?.firtAtenttionTime || "");
  let timeTotal = calculateTime(time1, time2);
  let [description, setDescription] = reactExports.useState("");
  const [hasFinishedState, setHasFinishedState] = reactExports.useState(true);
  let file1 = reactExports.useRef(null);
  let file2 = reactExports.useRef(null);
  let TIME_EXCEDING = reactExports.useRef("00:03:00");
  const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });
  reactExports.useEffect(() => {
    if (establishment2.name === "Mister Aventura" || establishment2.name === "Mister Brickell P." || establishment2.name === "Mister Coconut" || establishment2.name === "Mister Wynwood" || establishment2.name === "Mister PineCrest") {
      TIME_EXCEDING.current = "00:02:00";
    } else {
      TIME_EXCEDING.current = "00:03:30";
    }
  }, []);
  const deleteImg = (number2) => {
    if (number2 === 0) file1.current = null;
    if (number2 === 1) file2.current = null;
  };
  function catBoxImg() {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "box-imgComponenContent gridx4", ref: htmlAdapterRef, children: hasFinishedState ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ImgBoxImg, { data: title.photos.caption[0], boxModal, setImg: (files) => {
        file1.current = files;
      }, deleteImg: () => deleteImg(0), language: establishment2?.lang }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ImgBoxImg, { data: title.photos.caption[1], boxModal, setImg: (files) => {
        file2.current = files;
      }, deleteImg: () => deleteImg(1), language: establishment2?.lang })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ImgBoxImg, { data: { index: 1, es: "En vivo", en: "now" }, boxModal, setImg: (files) => {
      file1.current = files;
    }, deleteImg, language: establishment2?.lang }) });
  }
  const sendImg = async (e2) => {
    try {
      e2.preventDefault();
      awaitWindow.open("Enviando novedad...");
      let text;
      const data2 = useDataUser(user, establishment2);
      if (data2.localData.name === "Mister Aventura" || data2.localData.name === "Mister Brickell P." || data2.localData.name === "Mister Coconut" || data2.localData.name === "Mister Wynwood") {
        TIME_EXCEDING.current = "00:02:00";
      }
      const FOR_MISTER01 = `${data2.franchise === "Mister01" ? `tiempo que excede: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}` : ""}`;
      const caption = [
        data2.LANG === "es" ? `ocupa - mesa ${table}` : `occupies - table ${table}`,
        data2.LANG === "es" ? `primera atencion - mesa ${table}` : `first attention - table ${table}`
      ];
      if (data2.LANG === "es" && hasFinishedState) {
        text = `*${data2.localData.name}*
_*Demora de primera atención*_
Mesa: ${table}
${establishment2.alertLength === "extended" ? `Ocupa: ${time1}
Primera atención: ${time2}
Tiempo total de demora: ${timeTotal}
*Mesa no cumple protocolo de primera atención ❌*` : `Hora: ${time2}
Tiempo total: ${timeTotal}`}${description !== "" ? `
Nota: ${description.toLowerCase()}` : ""}`;
      } else if (data2.LANG === "en" && hasFinishedState) {
        if (data2.localData.name === "Mister Turtle Creek" || data2.localData.name === "Mister Grapevine" || data2.localData.name === "Mister Fort Lauderdale" || data2.localData.name === "Mister Wynwood" || data2.localData.name === "Mister Coconut" || data2.localData.name === "Mister Brickell P." || data2.localData.name === "Mister Aventura" || data2.localData.name === "Mister Bay Harbor") {
          text = `*${data2.localData.name}*
_*First attention delay*_
Table: ${table}
Occupies: ${time1}
First attention: ${time2}
Time exceeding minutes: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}
Total time: ${timeTotal}
*The table does not follow the first attention protocol ❌*${description !== "" ? `
Note: ${description.toLowerCase()}` : ""}`;
        } else {
          text = `*${data2.localData.name}*
_*First attention delay*_
Table: ${table}
Time exceeding: ${returnTimeExceding(timeTotal, TIME_EXCEDING.current)}
*The table does not follow the first attention protocol ❌*${description !== "" ? `
Note: ${description.toLowerCase()}` : ""}`;
        }
      } else {
        data2.LANG === "es" ? text = `*${data2.localData.name}*
Mesa: *${table}* fue ocupada a las *${time1}* tiene demora de primera atención de: *${returnTimeExceding(time2, time1)}*
Aún no cumple el protocolo de primera atención ❌${description !== "" ? `
Nota: ${description.toLowerCase()}` : ""}` : text = `*${data2.localData.name}*
Table ${table} and has a first service delay of *${returnTimeExceding(time2, time1)}
*, it still does not comply with the first service protocol ❌*${description !== "" ? `
Note: ${description.toLowerCase()}` : ""}`;
      }
      let dataForRequest = {};
      const html = await useImgAlternative(htmlAdapterRef.current, (htmlForImg) => {
      });
      const responseUrl = await sendFile(blobToFile(html));
      dataForRequest.imageToShare = responseUrl.data.url;
      if (hasFinishedState) {
        [file1.current, file2.current].map((file, index) => {
          if (!file) throw new Error(`Debe ingresas las imagenes cor;respondiente, imagen: ${index + 1}`);
          if (!dataForRequest.imageUrl) dataForRequest.imageUrl = [];
          dataForRequest.imageUrl.push({ url: file.url, caption: file.caption });
        });
      }
      dataForRequest.title = hasFinishedState ? "Demora de primera atención" : "Mesa no recibe protocolo de PA1 aún (aviso)";
      dataForRequest.table = table;
      dataForRequest.userName = data2.userData.userName;
      dataForRequest.userId = data2.userData.userId;
      dataForRequest.localName = data2.localData.name;
      dataForRequest.localId = data2.localData.localId;
      dataForRequest.description = `ocupa ${time1}, primera atención ${time2} total: ${timeTotal} ${FOR_MISTER01}`;
      dataForRequest.menu = text;
      dataForRequest.rulesForBonus = title.rulesForBonus;
      dataForRequest.alertId = title._id;
      dataForRequest.for_the_report = hasFinishedState ? true : false;
      dataForRequest.startTime = time1;
      dataForRequest.endTime = time2;
      dataForRequest.timePeriod = {
        init: time1,
        end: time2
      };
      const response = await axiosInstance.post(`${URL$2}/novelties`, dataForRequest);
      if (response.status === 200) {
        saveNoveltie.save(`Demora de primera atención - mesa ${table}`, data2.userData);
        setNumberTable("");
        setTime1(time1 = "");
        setTime2(time2 = "");
        boxModal.open({ title: "Aviso", description: "Novedad enviada" });
        reset2();
      }
    } catch (error) {
      console.log(error);
      if (error.message) boxModal.open({ title: "Error", description: error.message });
      else boxModal.open("Error", error);
    } finally {
      awaitWindow.close();
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    FormLayaut,
    {
      title: title.es,
      icon: "/ico/icons8-waiter-24.png",
      event: (e2) => sendImg(e2),
      description: "Registra el tiempo desde que una mesa se ocupa hasta que recibe su primera atención. Si supera el protocolo, se genera una novedad de incumplimiento",
      children: [
        catBoxImg(),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FieldInput,
          {
            type: "text",
            required: true,
            label: "Número de mesa",
            value: table,
            onChange: (v) => setNumberTable(v)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FieldInput,
          {
            type: "hour",
            required: true,
            label: "Tiempo del ocupa de la mesa",
            value: time1,
            onChange: (v) => setTime1(v)
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          FieldInput,
          {
            type: "checkbox",
            label: "ya tiene la primera atención",
            value: hasFinishedState,
            onChange: (v) => setHasFinishedState(v)
          }
        ) }),
        hasFinishedState ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FieldInput,
            {
              type: "hour",
              required: true,
              label: "Timpo de la primera atención a la mesa",
              value: time2,
              onChange: (v) => setTime2(v)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "box-textHourResult", children: [
            "Tiempo total en recibir la primera atención a la mesa: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: calculateTime(time1, time2) })
          ] }),
          establishment2.franchise === "Mister01" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "box-textHourResult", children: [
            "Tiempo excedido: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: calculateTime(calculateTime(time1, time2), TIME_EXCEDING.current) })
          ] }) : null
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            FieldInput,
            {
              type: "hour",
              label: "Tiempo en vivo sin la primera atención",
              value: time2,
              onChange: (e2) => setTime2(e2)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "box-textHourResult", children: [
            "Tiempo en que continua sin primera atención: ",
            returnTimeExceding(time2, time1)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "box-label", htmlFor: "", children: [
          "Nota",
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { className: "box-textArea", spellCheck: "true", autoComplete: "true", placeholder: "en caso que lo amerite", cols: "30", rows: "10", value: description, onChange: (e2) => setDescription(description = e2.target.value) })
        ] })
      ]
    }
  );
}
class PromiseResolver {
  #promise;
  get promise() {
    return this.#promise;
  }
  #resolve;
  #reject;
  #state = "running";
  get state() {
    return this.#state;
  }
  constructor() {
    this.#promise = new Promise((resolve, reject) => {
      this.#resolve = resolve;
      this.#reject = reject;
    });
  }
  resolve = (value) => {
    this.#resolve(value);
    this.#state = "resolved";
  };
  reject = (reason) => {
    this.#reject(reason);
    this.#state = "rejected";
  };
}
class AsyncOperationManager {
  nextId;
  pendingResolvers = /* @__PURE__ */ new Map();
  constructor(startId = 0) {
    this.nextId = startId;
  }
  add() {
    const id = this.nextId++;
    const resolver = new PromiseResolver();
    this.pendingResolvers.set(id, resolver);
    return [id, resolver.promise];
  }
  getResolver(id) {
    if (!this.pendingResolvers.has(id)) {
      return null;
    }
    const resolver = this.pendingResolvers.get(id);
    this.pendingResolvers.delete(id);
    return resolver;
  }
  resolve(id, result) {
    const resolver = this.getResolver(id);
    if (resolver !== null) {
      resolver.resolve(result);
      return true;
    }
    return false;
  }
  reject(id, reason) {
    const resolver = this.getResolver(id);
    if (resolver !== null) {
      resolver.reject(reason);
      return true;
    }
    return false;
  }
}
function delay(time) {
  return new Promise((resolve) => {
    globalThis.setTimeout(() => resolve(), time);
  });
}
function isPromiseLike(value) {
  return typeof value === "object" && value !== null && "then" in value;
}
function advance(iterator, next) {
  while (true) {
    const { done, value } = iterator.next(next);
    if (done) {
      return value;
    }
    if (isPromiseLike(value)) {
      return value.then((value2) => advance(iterator, { resolved: value2 }), (error) => advance(iterator, { error }));
    }
    next = value;
  }
}
// @__NO_SIDE_EFFECTS__
function bipedal(fn, bindThis) {
  function result(...args) {
    const iterator = fn.call(this, function* (value) {
      if (isPromiseLike(value)) {
        const result2 = yield value;
        if ("resolved" in result2) {
          return result2.resolved;
        } else {
          throw result2.error;
        }
      }
      return value;
    }, ...args);
    return advance(iterator, void 0);
  }
  {
    return result;
  }
}
function defaultFieldSerializer(serializer) {
  return (source, context) => {
    if ("buffer" in context) {
      const buffer2 = serializer(source, context);
      context.buffer.set(buffer2, context.index);
      return buffer2.length;
    } else {
      return serializer(source, context);
    }
  };
}
function byobFieldSerializer(size, serializer) {
  return (source, context) => {
    if ("buffer" in context) {
      context.index ??= 0;
      serializer(source, context);
      return size;
    } else {
      const buffer2 = new Uint8Array(size);
      serializer(source, {
        buffer: buffer2,
        index: 0,
        littleEndian: context.littleEndian
      });
      return buffer2;
    }
  };
}
// @__NO_SIDE_EFFECTS__
function _field(size, type, serialize, deserialize, options) {
  const field2 = {
    size,
    type,
    serialize: type === "default" ? defaultFieldSerializer(serialize) : byobFieldSerializer(size, serialize),
    deserialize: /* @__PURE__ */ bipedal(deserialize),
    omitInit: options?.omitInit
  };
  if (options?.init) {
    field2.init = options.init;
  }
  return field2;
}
const field = _field;
const EmptyUint8Array = new Uint8Array(0);
function copyMaybeDifferentLength(dest, source, index, length) {
  if (source.length < length) {
    dest.set(source, index);
    dest.fill(0, index + source.length, index + length);
  } else if (source.length === length) {
    dest.set(source, index);
  } else {
    dest.set(source.subarray(0, length), index);
  }
}
// @__NO_SIDE_EFFECTS__
function buffer(lengthOrField, converter) {
  if (typeof lengthOrField === "number") {
    let serialize;
    let deserialize2;
    let init2;
    if (lengthOrField === 0) {
      serialize = () => {
      };
      if (converter) {
        deserialize2 = function* () {
          return converter.convert(EmptyUint8Array);
        };
      } else {
        deserialize2 = function* () {
          return EmptyUint8Array;
        };
      }
    } else {
      serialize = (value, { buffer: buffer2, index }) => copyMaybeDifferentLength(buffer2, value, index, lengthOrField);
      if (converter) {
        deserialize2 = function* (then, reader) {
          const array = reader.readExactly(lengthOrField);
          return converter.convert(yield* then(array));
        };
        init2 = (value) => converter.back(value);
      } else {
        deserialize2 = function* (_then, reader) {
          const array = reader.readExactly(lengthOrField);
          return array;
        };
      }
    }
    return field(lengthOrField, "byob", serialize, deserialize2, { init: init2 });
  }
  if ((typeof lengthOrField === "object" || typeof lengthOrField === "function") && "serialize" in lengthOrField) {
    let deserialize2;
    let init2;
    if (converter) {
      deserialize2 = function* (then, reader, context) {
        const length = yield* then(lengthOrField.deserialize(reader, context));
        const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
        return converter.convert(yield* then(array));
      };
      init2 = (value) => converter.back(value);
    } else {
      deserialize2 = function* (then, reader, context) {
        const length = yield* then(lengthOrField.deserialize(reader, context));
        const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
        return array;
      };
    }
    return field(lengthOrField.size, "default", (value, { littleEndian }) => {
      if (lengthOrField.type === "default") {
        const lengthBuffer = lengthOrField.serialize(value.length, {
          littleEndian
        });
        if (value.length === 0) {
          return lengthBuffer;
        }
        const result = new Uint8Array(lengthBuffer.length + value.length);
        result.set(lengthBuffer, 0);
        result.set(value, lengthBuffer.length);
        return result;
      } else {
        const result = new Uint8Array(lengthOrField.size + value.length);
        lengthOrField.serialize(value.length, {
          buffer: result,
          index: 0,
          littleEndian
        });
        result.set(value, lengthOrField.size);
        return result;
      }
    }, deserialize2, { init: init2 });
  }
  if (typeof lengthOrField === "string") {
    let deserialize2;
    let init2;
    if (converter) {
      deserialize2 = function* (then, reader, { dependencies }) {
        const length = dependencies[lengthOrField];
        const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
        return converter.convert(yield* then(array));
      };
      init2 = (value, dependencies) => {
        const array = converter.back(value);
        dependencies[lengthOrField] = array.length;
        return array;
      };
    } else {
      deserialize2 = function* (_then, reader, { dependencies }) {
        const length = dependencies[lengthOrField];
        const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
        return array;
      };
      init2 = (value, dependencies) => {
        const array = value;
        dependencies[lengthOrField] = array.length;
        return array;
      };
    }
    return field(0, "default", (source) => source, deserialize2, { init: init2 });
  }
  let deserialize;
  let init;
  if (converter) {
    deserialize = function* (then, reader, { dependencies }) {
      const rawLength = dependencies[lengthOrField.field];
      const length = lengthOrField.convert(rawLength);
      const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
      return converter.convert(yield* then(array));
    };
    init = (value, dependencies) => {
      const array = converter.back(value);
      dependencies[lengthOrField.field] = lengthOrField.back(array.length);
      return array;
    };
  } else {
    deserialize = function* (_then, reader, { dependencies }) {
      const rawLength = dependencies[lengthOrField.field];
      const length = lengthOrField.convert(rawLength);
      const array = length !== 0 ? reader.readExactly(length) : EmptyUint8Array;
      return array;
    };
    init = (value, dependencies) => {
      const array = value;
      dependencies[lengthOrField.field] = lengthOrField.back(array.length);
      return array;
    };
  }
  return field(0, "default", (source) => source, deserialize, { init });
}
class ExactReadableEndedError extends Error {
  constructor() {
    super("ExactReadable ended");
  }
}
class Uint8ArrayExactReadable {
  #data;
  #position;
  get position() {
    return this.#position;
  }
  constructor(data) {
    this.#data = data;
    this.#position = 0;
  }
  readExactly(length) {
    if (this.#position + length > this.#data.length) {
      throw new ExactReadableEndedError();
    }
    const result = this.#data.subarray(this.#position, this.#position + length);
    this.#position += length;
    return result;
  }
}
class StructDeserializeError extends Error {
  constructor(message) {
    super(message);
  }
}
class StructNotEnoughDataError extends StructDeserializeError {
  constructor() {
    super("The underlying readable was ended before the struct was fully deserialized");
  }
}
class StructEmptyError extends StructDeserializeError {
  constructor() {
    super("The underlying readable doesn't contain any more struct");
  }
}
// @__NO_SIDE_EFFECTS__
function struct(fields, options) {
  const fieldList = Object.entries(fields);
  let size = 0;
  let byob = true;
  for (const [, field2] of fieldList) {
    size += field2.size;
    if (byob && field2.type !== "byob") {
      byob = false;
    }
  }
  const littleEndian = options.littleEndian;
  const extra = options.extra ? Object.getOwnPropertyDescriptors(options.extra) : void 0;
  return {
    littleEndian,
    fields,
    extra: options.extra,
    type: byob ? "byob" : "default",
    size,
    serialize(source, bufferOrContext) {
      const temp = { ...source };
      for (const [key, field2] of fieldList) {
        if (key in temp && "init" in field2) {
          const result = field2.init?.(temp[key], temp);
          temp[key] = result;
        }
      }
      const sizes = new Array(fieldList.length);
      const buffers = new Array(fieldList.length);
      {
        const context2 = { littleEndian };
        for (const [index2, [key, field2]] of fieldList.entries()) {
          if (field2.type === "byob") {
            sizes[index2] = field2.size;
          } else {
            buffers[index2] = field2.serialize(temp[key], context2);
            sizes[index2] = buffers[index2].length;
          }
        }
      }
      const size2 = sizes.reduce((sum, size3) => sum + size3, 0);
      let externalBuffer;
      let buffer2;
      let index;
      if (bufferOrContext instanceof Uint8Array) {
        if (bufferOrContext.length < size2) {
          throw new Error("Buffer too small");
        }
        externalBuffer = true;
        buffer2 = bufferOrContext;
        index = 0;
      } else if (typeof bufferOrContext === "object" && "buffer" in bufferOrContext) {
        externalBuffer = true;
        buffer2 = bufferOrContext.buffer;
        index = bufferOrContext.index ?? 0;
        if (buffer2.length - index < size2) {
          throw new Error("Buffer too small");
        }
      } else {
        externalBuffer = false;
        buffer2 = new Uint8Array(size2);
        index = 0;
      }
      const context = {
        buffer: buffer2,
        index,
        littleEndian
      };
      for (const [index2, [key, field2]] of fieldList.entries()) {
        if (buffers[index2]) {
          buffer2.set(buffers[index2], context.index);
        } else {
          field2.serialize(temp[key], context);
        }
        context.index += sizes[index2];
      }
      if (externalBuffer) {
        return size2;
      } else {
        return buffer2;
      }
    },
    deserialize: /* @__PURE__ */ bipedal(function* (then, reader) {
      const startPosition = reader.position;
      const result = {};
      const context = {
        dependencies: result,
        littleEndian
      };
      try {
        for (const [key, field2] of fieldList) {
          result[key] = yield* then(field2.deserialize(reader, context));
        }
      } catch (e2) {
        if (!(e2 instanceof ExactReadableEndedError)) {
          throw e2;
        }
        if (reader.position === startPosition) {
          throw new StructEmptyError();
        } else {
          throw new StructNotEnoughDataError();
        }
      }
      if (extra) {
        Object.defineProperties(result, extra);
      }
      if (options.postDeserialize) {
        return options.postDeserialize.call(result, result);
      } else {
        return result;
      }
    })
  };
}
// @__NO_SIDE_EFFECTS__
function extend(base, fields, options) {
  return /* @__PURE__ */ struct(Object.assign({}, base.fields, fields), {
    littleEndian: options?.littleEndian ?? base.littleEndian,
    extra: base.extra,
    postDeserialize: options?.postDeserialize
  });
}
// @__NO_SIDE_EFFECTS__
function getInt32(buffer2, offset, littleEndian) {
  return littleEndian ? buffer2[offset] | buffer2[offset + 1] << 8 | buffer2[offset + 2] << 16 | buffer2[offset + 3] << 24 : buffer2[offset] << 24 | buffer2[offset + 1] << 16 | buffer2[offset + 2] << 8 | buffer2[offset + 3];
}
function setInt32(buffer2, offset, value, littleEndian) {
  if (littleEndian) {
    buffer2[offset] = value;
    buffer2[offset + 1] = value >> 8;
    buffer2[offset + 2] = value >> 16;
    buffer2[offset + 3] = value >> 24;
  } else {
    buffer2[offset] = value >> 24;
    buffer2[offset + 1] = value >> 16;
    buffer2[offset + 2] = value >> 8;
    buffer2[offset + 3] = value;
  }
}
function setInt64LittleEndian(buffer2, offset, value) {
  buffer2[offset] = Number(value & 0xffn);
  buffer2[offset + 1] = Number(value >> 8n & 0xffn);
  buffer2[offset + 2] = Number(value >> 16n & 0xffn);
  buffer2[offset + 3] = Number(value >> 24n & 0xffn);
  buffer2[offset + 4] = Number(value >> 32n & 0xffn);
  buffer2[offset + 5] = Number(value >> 40n & 0xffn);
  buffer2[offset + 6] = Number(value >> 48n & 0xffn);
  buffer2[offset + 7] = Number(value >> 56n & 0xffn);
}
function setInt64BigEndian(buffer2, offset, value) {
  buffer2[offset] = Number(value >> 56n & 0xffn);
  buffer2[offset + 1] = Number(value >> 48n & 0xffn);
  buffer2[offset + 2] = Number(value >> 40n & 0xffn);
  buffer2[offset + 3] = Number(value >> 32n & 0xffn);
  buffer2[offset + 4] = Number(value >> 24n & 0xffn);
  buffer2[offset + 5] = Number(value >> 16n & 0xffn);
  buffer2[offset + 6] = Number(value >> 8n & 0xffn);
  buffer2[offset + 7] = Number(value & 0xffn);
}
// @__NO_SIDE_EFFECTS__
function getUint32LittleEndian(buffer2, offset) {
  return (buffer2[offset] | buffer2[offset + 1] << 8 | buffer2[offset + 2] << 16 | buffer2[offset + 3] << 24) >>> 0;
}
// @__NO_SIDE_EFFECTS__
function getUint32(buffer2, offset, littleEndian) {
  return littleEndian ? (buffer2[offset] | buffer2[offset + 1] << 8 | buffer2[offset + 2] << 16 | buffer2[offset + 3] << 24) >>> 0 : (buffer2[offset] << 24 | buffer2[offset + 1] << 16 | buffer2[offset + 2] << 8 | buffer2[offset + 3]) >>> 0;
}
function setUint32LittleEndian(buffer2, offset, value) {
  buffer2[offset] = value;
  buffer2[offset + 1] = value >> 8;
  buffer2[offset + 2] = value >> 16;
  buffer2[offset + 3] = value >> 24;
}
function setUint32(buffer2, offset, value, littleEndian) {
  if (littleEndian) {
    buffer2[offset] = value;
    buffer2[offset + 1] = value >> 8;
    buffer2[offset + 2] = value >> 16;
    buffer2[offset + 3] = value >> 24;
  } else {
    buffer2[offset] = value >> 24;
    buffer2[offset + 1] = value >> 16;
    buffer2[offset + 2] = value >> 8;
    buffer2[offset + 3] = value;
  }
}
function getUint64BigEndian(buffer2, offset) {
  return BigInt(buffer2[offset]) << 56n | BigInt(buffer2[offset + 1]) << 48n | BigInt(buffer2[offset + 2]) << 40n | BigInt(buffer2[offset + 3]) << 32n | BigInt(buffer2[offset + 4]) << 24n | BigInt(buffer2[offset + 5]) << 16n | BigInt(buffer2[offset + 6]) << 8n | BigInt(buffer2[offset + 7]);
}
function getUint64(buffer2, offset, littleEndian) {
  return littleEndian ? BigInt(buffer2[offset]) | BigInt(buffer2[offset + 1]) << 8n | BigInt(buffer2[offset + 2]) << 16n | BigInt(buffer2[offset + 3]) << 24n | BigInt(buffer2[offset + 4]) << 32n | BigInt(buffer2[offset + 5]) << 40n | BigInt(buffer2[offset + 6]) << 48n | BigInt(buffer2[offset + 7]) << 56n : BigInt(buffer2[offset]) << 56n | BigInt(buffer2[offset + 1]) << 48n | BigInt(buffer2[offset + 2]) << 40n | BigInt(buffer2[offset + 3]) << 32n | BigInt(buffer2[offset + 4]) << 24n | BigInt(buffer2[offset + 5]) << 16n | BigInt(buffer2[offset + 6]) << 8n | BigInt(buffer2[offset + 7]);
}
function setUint64(buffer2, offset, value, littleEndian) {
  if (littleEndian) {
    buffer2[offset] = Number(value & 0xffn);
    buffer2[offset + 1] = Number(value >> 8n & 0xffn);
    buffer2[offset + 2] = Number(value >> 16n & 0xffn);
    buffer2[offset + 3] = Number(value >> 24n & 0xffn);
    buffer2[offset + 4] = Number(value >> 32n & 0xffn);
    buffer2[offset + 5] = Number(value >> 40n & 0xffn);
    buffer2[offset + 6] = Number(value >> 48n & 0xffn);
    buffer2[offset + 7] = Number(value >> 56n & 0xffn);
  } else {
    buffer2[offset] = Number(value >> 56n & 0xffn);
    buffer2[offset + 1] = Number(value >> 48n & 0xffn);
    buffer2[offset + 2] = Number(value >> 40n & 0xffn);
    buffer2[offset + 3] = Number(value >> 32n & 0xffn);
    buffer2[offset + 4] = Number(value >> 24n & 0xffn);
    buffer2[offset + 5] = Number(value >> 16n & 0xffn);
    buffer2[offset + 6] = Number(value >> 8n & 0xffn);
    buffer2[offset + 7] = Number(value & 0xffn);
  }
}
// @__NO_SIDE_EFFECTS__
function number(size, serialize, deserialize) {
  const fn = () => fn;
  Object.assign(fn, field(size, "byob", serialize, deserialize));
  return fn;
}
const u8 = /* @__PURE__ */ number(1, (value, { buffer: buffer2, index }) => {
  buffer2[index] = value;
}, function* (then, reader) {
  const data = yield* then(reader.readExactly(1));
  return data[0];
});
const u32 = /* @__PURE__ */ number(4, (value, { buffer: buffer2, index, littleEndian }) => {
  setUint32(buffer2, index, value, littleEndian);
}, function* (then, reader, { littleEndian }) {
  const data = yield* then(reader.readExactly(4));
  return /* @__PURE__ */ getUint32(data, 0, littleEndian);
});
const s32 = /* @__PURE__ */ number(4, (value, { buffer: buffer2, index, littleEndian }) => {
  setInt32(buffer2, index, value, littleEndian);
}, function* (then, reader, { littleEndian }) {
  const data = yield* then(reader.readExactly(4));
  return /* @__PURE__ */ getInt32(data, 0, littleEndian);
});
const u64 = /* @__PURE__ */ number(8, (value, { buffer: buffer2, index, littleEndian }) => {
  setUint64(buffer2, index, value, littleEndian);
}, function* (then, reader, { littleEndian }) {
  const data = yield* then(reader.readExactly(8));
  return getUint64(data, 0, littleEndian);
});
const { TextEncoder, TextDecoder } = globalThis;
const SharedEncoder = /* @__PURE__ */ new TextEncoder();
const SharedDecoder = /* @__PURE__ */ new TextDecoder();
// @__NO_SIDE_EFFECTS__
function encodeUtf8(input) {
  return SharedEncoder.encode(input);
}
// @__NO_SIDE_EFFECTS__
function decodeUtf8(buffer2) {
  return SharedDecoder.decode(buffer2);
}
const string = /* @__NO_SIDE_EFFECTS__ */ (lengthOrField) => {
  const field2 = /* @__PURE__ */ buffer(lengthOrField, {
    convert: decodeUtf8,
    back: encodeUtf8
  });
  field2.as = () => field2;
  return field2;
};
const { AbortController } = globalThis;
const ReadableStream = /* @__PURE__ */ (() => {
  const { ReadableStream: ReadableStream2 } = globalThis;
  if (!ReadableStream2.from) {
    ReadableStream2.from = function(iterable) {
      const iterator = Symbol.asyncIterator in iterable ? iterable[Symbol.asyncIterator]() : iterable[Symbol.iterator]();
      return new ReadableStream2({
        async pull(controller) {
          const result = await iterator.next();
          if (result.done) {
            controller.close();
            return;
          }
          controller.enqueue(result.value);
        },
        async cancel(reason) {
          await iterator.return?.(reason);
        }
      });
    };
  }
  if (!ReadableStream2.prototype[Symbol.asyncIterator] || !ReadableStream2.prototype.values) {
    ReadableStream2.prototype.values = async function* (options) {
      const reader = this.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            return;
          }
          yield value;
        }
      } finally {
        if (!options?.preventCancel) {
          await reader.cancel();
        }
        reader.releaseLock();
      }
    };
    ReadableStream2.prototype[Symbol.asyncIterator] = // eslint-disable-next-line @typescript-eslint/unbound-method
    ReadableStream2.prototype.values;
  }
  return ReadableStream2;
})();
const { WritableStream, TransformStream } = globalThis;
class TaskQueue {
  #ready;
  #disposed = false;
  enqueue(task, bail = false) {
    if (this.#disposed) {
      throw new Error("TaskQueue is disposed");
    }
    if (!this.#ready) {
      try {
        const result2 = task();
        if (isPromiseLike(result2)) {
          this.#ready = result2.then(() => {
          }, (e2) => {
            if (bail) {
              throw e2;
            }
          });
        }
        return result2;
      } catch (e2) {
        if (bail) {
          const promise = Promise.reject(e2);
          void promise.catch(() => {
          });
          this.#ready = promise;
        }
        throw e2;
      }
    }
    const result = this.#ready.then(() => {
      if (this.#disposed) {
        throw new Error("TaskQueue is disposed");
      }
      return task();
    });
    this.#ready = result.then(() => {
    }, (e2) => {
      if (bail || this.#disposed) {
        throw e2;
      }
    });
    return result;
  }
  dispose() {
    this.#disposed = true;
  }
}
class PushReadableStream extends ReadableStream {
  /**
   * Create a new `PushReadableStream` from a source.
   *
   * @param source If `source` returns a `Promise`, the stream will be closed
   * when the `Promise` is resolved, and be errored when the `Promise` is rejected.
   * @param strategy
   */
  constructor(source, strategy, logger) {
    let controller;
    const tasks = new TaskQueue();
    let zeroHighWaterMarkAllowEnqueue = false;
    let waterMarkLow;
    const abortController = new AbortController();
    let stopped = false;
    const enqueue = (chunk) => {
      logger?.({
        source: "producer",
        operation: "enqueue",
        value: chunk,
        phase: "start"
      });
      if (abortController.signal.aborted) {
        logger?.({
          source: "producer",
          operation: "enqueue",
          value: chunk,
          phase: "ignored"
        });
        return false;
      }
      if (controller.desiredSize === null) {
        controller.enqueue(chunk);
        throw new Error("unreachable");
      }
      if (zeroHighWaterMarkAllowEnqueue) {
        zeroHighWaterMarkAllowEnqueue = false;
        controller.enqueue(chunk);
        logger?.({
          source: "producer",
          operation: "enqueue",
          value: chunk,
          phase: "complete"
        });
        return true;
      }
      if (controller.desiredSize <= 0) {
        logger?.({
          source: "producer",
          operation: "enqueue",
          value: chunk,
          phase: "waiting"
        });
        waterMarkLow = new PromiseResolver();
        return waterMarkLow.promise.then(() => {
          controller.enqueue(chunk);
          logger?.({
            source: "producer",
            operation: "enqueue",
            value: chunk,
            phase: "complete"
          });
          return true;
        }, () => {
          logger?.({
            source: "producer",
            operation: "enqueue",
            value: chunk,
            phase: "ignored"
          });
          return false;
        });
      }
      controller.enqueue(chunk);
      logger?.({
        source: "producer",
        operation: "enqueue",
        value: chunk,
        phase: "complete"
      });
      return true;
    };
    const close = (explicit) => {
      logger?.({
        source: "producer",
        operation: "close",
        explicit,
        phase: "start"
      });
      if (abortController.signal.aborted || stopped && !explicit) {
        logger?.({
          source: "producer",
          operation: "close",
          explicit,
          phase: "ignored"
        });
        return;
      }
      controller.close();
      stopped = true;
      waterMarkLow?.reject();
      logger?.({
        source: "producer",
        operation: "close",
        explicit,
        phase: "complete"
      });
    };
    const error = (error2, explicit) => {
      logger?.({
        source: "producer",
        operation: "error",
        explicit,
        phase: "start"
      });
      stopped = true;
      controller.error(error2);
      waterMarkLow?.reject();
      logger?.({
        source: "producer",
        operation: "error",
        explicit,
        phase: "complete"
      });
    };
    super({
      start: (controller_) => {
        controller = controller_;
        const result = source({
          abortSignal: abortController.signal,
          enqueue: async (chunk) => (
            // Run `enqueue`s in serial
            // Use `async/await` to always return a `Promise`
            await tasks.enqueue(() => enqueue(chunk))
          ),
          close() {
            close(true);
          },
          error(e2) {
            error(e2, true);
          }
        });
        if (!stopped && isPromiseLike(result)) {
          result.then(() => close(false), (e2) => error(e2, false));
        }
      },
      pull: () => {
        logger?.({
          source: "consumer",
          operation: "pull",
          phase: "start"
        });
        if (waterMarkLow) {
          waterMarkLow.resolve(void 0);
          waterMarkLow = void 0;
        } else if (strategy?.highWaterMark === 0) {
          zeroHighWaterMarkAllowEnqueue = true;
        }
        logger?.({
          source: "consumer",
          operation: "pull",
          phase: "complete"
        });
      },
      cancel: (reason) => {
        logger?.({
          source: "consumer",
          operation: "cancel",
          phase: "start"
        });
        stopped = true;
        abortController.abort(reason);
        waterMarkLow?.reject();
        logger?.({
          source: "consumer",
          operation: "cancel",
          phase: "complete"
        });
      }
    }, strategy);
  }
}
function tryClose(value) {
  try {
    const result = value.close();
    if (isPromiseLike(result)) {
      return result.then(() => true, () => false);
    }
    return true;
  } catch {
    return false;
  }
}
async function tryCancel(stream) {
  try {
    await stream.cancel();
    return true;
  } catch {
    return false;
  }
}
class BufferedReadableStream {
  #buffered;
  // PERF: `subarray` is slow
  // don't use it until absolutely necessary
  #bufferedOffset = 0;
  #bufferedLength = 0;
  #position = 0;
  get position() {
    return this.#position;
  }
  stream;
  reader;
  constructor(stream) {
    this.stream = stream;
    this.reader = stream.getReader();
  }
  #readBuffered(length) {
    if (!this.#buffered) {
      return void 0;
    }
    const value = this.#buffered.subarray(this.#bufferedOffset, this.#bufferedOffset + length);
    if (this.#bufferedLength > length) {
      this.#position += length;
      this.#bufferedOffset += length;
      this.#bufferedLength -= length;
      return value;
    }
    this.#position += this.#bufferedLength;
    this.#buffered = void 0;
    this.#bufferedOffset = 0;
    this.#bufferedLength = 0;
    return value;
  }
  async #readSource(length) {
    const { done, value } = await this.reader.read();
    if (done) {
      throw new ExactReadableEndedError();
    }
    if (value.length > length) {
      this.#buffered = value;
      this.#bufferedOffset = length;
      this.#bufferedLength = value.length - length;
      this.#position += length;
      return value.subarray(0, length);
    }
    this.#position += value.length;
    return value;
  }
  iterateExactly(length) {
    let state = this.#buffered ? 0 : 1;
    return {
      next: () => {
        switch (state) {
          case 0: {
            const value = this.#readBuffered(length);
            if (value.length === length) {
              state = 2;
            } else {
              length -= value.length;
              state = 1;
            }
            return { done: false, value };
          }
          case 1:
            state = 3;
            return {
              done: false,
              value: this.#readSource(length).then((value) => {
                if (value.length === length) {
                  state = 2;
                } else {
                  length -= value.length;
                  state = 1;
                }
                return value;
              })
            };
          case 2:
            return { done: true, value: void 0 };
          case 3:
            throw new Error("Can't call `next` before previous Promise resolves");
          default:
            throw new Error("unreachable");
        }
      }
    };
  }
  readExactly = /* @__PURE__ */ bipedal(function* (then, length) {
    let result;
    let index = 0;
    const initial = this.#readBuffered(length);
    if (initial) {
      if (initial.length === length) {
        return initial;
      }
      result = new Uint8Array(length);
      result.set(initial, index);
      index += initial.length;
      length -= initial.length;
    } else {
      result = new Uint8Array(length);
    }
    while (length > 0) {
      const value = yield* then(this.#readSource(length));
      result.set(value, index);
      index += value.length;
      length -= value.length;
    }
    return result;
  });
  /**
   * Return a readable stream with unconsumed data (if any) and
   * all data from the wrapped stream.
   * @returns A `ReadableStream`
   */
  release() {
    if (this.#bufferedLength > 0) {
      return new PushReadableStream(async (controller) => {
        const buffered = this.#buffered.subarray(this.#bufferedOffset);
        await controller.enqueue(buffered);
        controller.abortSignal.addEventListener("abort", () => {
          void tryCancel(this.reader);
        });
        while (true) {
          const { done, value } = await this.reader.read();
          if (done) {
            return;
          }
          await controller.enqueue(value);
        }
      });
    } else {
      this.reader.releaseLock();
      return this.stream;
    }
  }
  async cancel(reason) {
    await this.reader.cancel(reason);
  }
}
class BufferedTransformStream {
  #readable;
  get readable() {
    return this.#readable;
  }
  #writable;
  get writable() {
    return this.#writable;
  }
  constructor(transform) {
    let bufferedStreamController;
    let writableStreamController;
    const buffered = new BufferedReadableStream(new PushReadableStream((controller) => {
      bufferedStreamController = controller;
    }));
    this.#readable = new ReadableStream({
      async pull(controller) {
        try {
          const value = await transform(buffered);
          controller.enqueue(value);
        } catch (e2) {
          if (e2 instanceof StructEmptyError) {
            controller.close();
            return;
          }
          throw e2;
        }
      },
      cancel: (reason) => {
        return writableStreamController.error(reason);
      }
    });
    this.#writable = new WritableStream({
      start(controller) {
        writableStreamController = controller;
      },
      async write(chunk) {
        await bufferedStreamController.enqueue(chunk);
      },
      abort() {
        bufferedStreamController.close();
      },
      close() {
        bufferedStreamController.close();
      }
    });
  }
}
class ConcatStringStream {
  // PERF: rope (concat strings) is faster than `[].join('')`
  #result = "";
  #resolver = new PromiseResolver();
  #writable = new WritableStream({
    write: (chunk) => {
      this.#result += chunk;
    },
    close: () => {
      this.#resolver.resolve(this.#result);
      this.#readableController.enqueue(this.#result);
      this.#readableController.close();
    },
    abort: (reason) => {
      this.#resolver.reject(reason);
      this.#readableController.error(reason);
    }
  });
  get writable() {
    return this.#writable;
  }
  #readableController;
  #readable = new ReadableStream({
    start: (controller) => {
      this.#readableController = controller;
    }
  });
  get readable() {
    return this.#readable;
  }
  constructor() {
    void Object.defineProperties(this.#readable, {
      then: {
        get: () => this.#resolver.promise.then.bind(this.#resolver.promise)
      },
      catch: {
        get: () => this.#resolver.promise.catch.bind(this.#resolver.promise)
      },
      finally: {
        get: () => this.#resolver.promise.finally.bind(this.#resolver.promise)
      }
    });
  }
}
class ConcatBufferStream {
  #segments = [];
  #resolver = new PromiseResolver();
  #writable = new WritableStream({
    write: (chunk) => {
      this.#segments.push(chunk);
    },
    close: () => {
      let result;
      let offset = 0;
      switch (this.#segments.length) {
        case 0:
          result = EmptyUint8Array;
          break;
        case 1:
          result = this.#segments[0];
          break;
        default:
          result = new Uint8Array(this.#segments.reduce((prev, item) => prev + item.length, 0));
          for (const segment of this.#segments) {
            result.set(segment, offset);
            offset += segment.length;
          }
          break;
      }
      this.#resolver.resolve(result);
      this.#readableController.enqueue(result);
      this.#readableController.close();
    },
    abort: (reason) => {
      this.#resolver.reject(reason);
      this.#readableController.error(reason);
    }
  });
  get writable() {
    return this.#writable;
  }
  #readableController;
  #readable = new ReadableStream({
    start: (controller) => {
      this.#readableController = controller;
    }
  });
  get readable() {
    return this.#readable;
  }
  constructor() {
    void Object.defineProperties(this.#readable, {
      then: {
        get: () => this.#resolver.promise.then.bind(this.#resolver.promise)
      },
      catch: {
        get: () => this.#resolver.promise.catch.bind(this.#resolver.promise)
      },
      finally: {
        get: () => this.#resolver.promise.finally.bind(this.#resolver.promise)
      }
    });
  }
}
class ConsumableReadableStream extends ReadableStream {
  static async enqueue(controller, chunk) {
    const output2 = new Consumable(chunk);
    controller.enqueue(output2);
    await output2.consumed;
  }
  constructor(source, strategy) {
    let wrappedController;
    let wrappedStrategy;
    if (strategy) {
      wrappedStrategy = {};
      if ("highWaterMark" in strategy) {
        wrappedStrategy.highWaterMark = strategy.highWaterMark;
      }
      if ("size" in strategy) {
        wrappedStrategy.size = (chunk) => {
          return strategy.size(chunk.value);
        };
      }
    }
    super({
      start(controller) {
        wrappedController = {
          enqueue(chunk) {
            return ConsumableReadableStream.enqueue(controller, chunk);
          },
          close() {
            controller.close();
          },
          error(reason) {
            controller.error(reason);
          }
        };
        return source.start?.(wrappedController);
      },
      pull() {
        return source.pull?.(wrappedController);
      },
      cancel(reason) {
        return source.cancel?.(reason);
      }
    }, wrappedStrategy);
  }
}
class ConsumableWrapByteReadableStream extends ReadableStream {
  constructor(stream, chunkSize, min) {
    const reader = stream.getReader({ mode: "byob" });
    let array = new Uint8Array(chunkSize);
    super({
      async pull(controller) {
        const { done, value } = await reader.read(array, { min });
        if (done) {
          controller.close();
          return;
        }
        await ConsumableReadableStream.enqueue(controller, value);
        array = new Uint8Array(value.buffer);
      },
      cancel(reason) {
        return reader.cancel(reason);
      }
    });
  }
}
class ConsumableWrapWritableStream extends WritableStream {
  constructor(stream) {
    const writer = stream.getWriter();
    super({
      write(chunk) {
        return chunk.tryConsume((chunk2) => writer.write(chunk2));
      },
      abort(reason) {
        return writer.abort(reason);
      },
      close() {
        return writer.close();
      }
    });
  }
}
class ConsumableWritableStream extends WritableStream {
  static async write(writer, value) {
    const consumable = new Consumable(value);
    await writer.write(consumable);
    await consumable.consumed;
  }
  constructor(sink, strategy) {
    let wrappedStrategy;
    if (strategy) {
      wrappedStrategy = {};
      if ("highWaterMark" in strategy) {
        wrappedStrategy.highWaterMark = strategy.highWaterMark;
      }
      if ("size" in strategy) {
        wrappedStrategy.size = (chunk) => {
          return strategy.size(chunk instanceof Consumable ? chunk.value : chunk);
        };
      }
    }
    super({
      start(controller) {
        return sink.start?.(controller);
      },
      write(chunk, controller) {
        return chunk.tryConsume((chunk2) => sink.write?.(chunk2, controller));
      },
      abort(reason) {
        return sink.abort?.(reason);
      },
      close() {
        return sink.close?.();
      }
    }, wrappedStrategy);
  }
}
const { console: console$1 } = globalThis;
const createTask = /* @__PURE__ */ (() => console$1?.createTask?.bind(console$1) ?? (() => ({
  run(callback) {
    return callback();
  }
})))();
class Consumable {
  static WritableStream = ConsumableWritableStream;
  static WrapWritableStream = ConsumableWrapWritableStream;
  static ReadableStream = ConsumableReadableStream;
  static WrapByteReadableStream = ConsumableWrapByteReadableStream;
  #task;
  #resolver;
  value;
  consumed;
  constructor(value) {
    this.#task = createTask("Consumable");
    this.value = value;
    this.#resolver = new PromiseResolver();
    this.consumed = this.#resolver.promise;
  }
  consume() {
    this.#resolver.resolve();
  }
  error(error) {
    this.#resolver.reject(error);
  }
  tryConsume(callback) {
    try {
      let result = this.#task.run(() => callback(this.value));
      if (isPromiseLike(result)) {
        result = result.then((value) => {
          this.#resolver.resolve();
          return value;
        }, (e2) => {
          this.#resolver.reject(e2);
          throw e2;
        });
      } else {
        this.#resolver.resolve();
      }
      return result;
    } catch (e2) {
      this.#resolver.reject(e2);
      throw e2;
    }
  }
}
function tryConsume(value, callback) {
  if (value instanceof Consumable) {
    return value.tryConsume(callback);
  } else {
    return callback(value);
  }
}
class MaybeConsumableWritableStream extends WritableStream {
  constructor(sink, strategy) {
    let wrappedStrategy;
    if (strategy) {
      wrappedStrategy = {};
      if ("highWaterMark" in strategy) {
        wrappedStrategy.highWaterMark = strategy.highWaterMark;
      }
      if ("size" in strategy) {
        wrappedStrategy.size = (chunk) => {
          return strategy.size(chunk instanceof Consumable ? chunk.value : chunk);
        };
      }
    }
    super({
      start(controller) {
        return sink.start?.(controller);
      },
      write(chunk, controller) {
        return tryConsume(chunk, (chunk2) => sink.write?.(chunk2, controller));
      },
      abort(reason) {
        return sink.abort?.(reason);
      },
      close() {
        return sink.close?.();
      }
    }, wrappedStrategy);
  }
}
class BufferCombiner {
  #capacity;
  #buffer;
  #offset;
  #available;
  constructor(size) {
    this.#capacity = size;
    this.#buffer = new Uint8Array(size);
    this.#offset = 0;
    this.#available = size;
  }
  /**
   * Pushes data to the combiner.
   * @param data The input data to be split or combined.
   * @returns
   * A generator that yields buffers of specified size.
   * It may yield the same buffer multiple times, consume the data before calling `next`.
   */
  *push(data) {
    let offset = 0;
    let available = data.length;
    if (this.#offset !== 0) {
      if (available >= this.#available) {
        this.#buffer.set(data.subarray(0, this.#available), this.#offset);
        offset += this.#available;
        available -= this.#available;
        yield this.#buffer;
        this.#offset = 0;
        this.#available = this.#capacity;
        if (available === 0) {
          return;
        }
      } else {
        this.#buffer.set(data, this.#offset);
        this.#offset += available;
        this.#available -= available;
        return;
      }
    }
    while (available >= this.#capacity) {
      const end = offset + this.#capacity;
      yield data.subarray(offset, end);
      offset = end;
      available -= this.#capacity;
    }
    if (available > 0) {
      this.#buffer.set(data.subarray(offset), this.#offset);
      this.#offset += available;
      this.#available -= available;
    }
  }
  flush() {
    if (this.#offset === 0) {
      return void 0;
    }
    const output2 = this.#buffer.subarray(0, this.#offset);
    this.#offset = 0;
    this.#available = this.#capacity;
    return output2;
  }
}
class DistributionStream extends TransformStream {
  constructor(size, combine = false) {
    const combiner = combine ? new BufferCombiner(size) : void 0;
    super({
      async transform(chunk, controller) {
        await tryConsume(chunk, async (chunk2) => {
          if (combiner) {
            for (const buffer2 of combiner.push(chunk2)) {
              await Consumable.ReadableStream.enqueue(controller, buffer2);
            }
          } else {
            let offset = 0;
            let available = chunk2.length;
            while (available > 0) {
              const end = offset + size;
              await Consumable.ReadableStream.enqueue(controller, chunk2.subarray(offset, end));
              offset = end;
              available -= size;
            }
          }
        });
      },
      flush(controller) {
        if (combiner) {
          const data = combiner.flush();
          if (data) {
            controller.enqueue(data);
          }
        }
      }
    });
  }
}
function getWrappedReadableStream(wrapper, controller) {
  if ("start" in wrapper) {
    return wrapper.start(controller);
  } else if (typeof wrapper === "function") {
    return wrapper(controller);
  } else {
    return wrapper;
  }
}
class WrapReadableStream extends ReadableStream {
  readable;
  #reader;
  constructor(wrapper, strategy) {
    super({
      start: async (controller) => {
        const readable = await getWrappedReadableStream(wrapper, controller);
        this.readable = readable;
        this.#reader = this.readable.getReader();
      },
      pull: async (controller) => {
        const { done, value } = await this.#reader.read().catch((e2) => {
          if ("error" in wrapper) {
            wrapper.error(e2);
          }
          throw e2;
        });
        if (done) {
          controller.close();
          if ("close" in wrapper) {
            await wrapper.close?.();
          }
        } else {
          controller.enqueue(value);
        }
      },
      cancel: async (reason) => {
        await this.#reader.cancel(reason);
        if ("cancel" in wrapper) {
          await wrapper.cancel?.(reason);
        }
      }
    }, strategy);
  }
}
const NOOP$1 = () => {
};
class DuplexStreamFactory {
  #readableControllers = [];
  #writers = [];
  #writableClosed = false;
  get writableClosed() {
    return this.#writableClosed;
  }
  #closed = new PromiseResolver();
  get closed() {
    return this.#closed.promise;
  }
  #options;
  constructor(options) {
    this.#options = options ?? {};
  }
  wrapReadable(readable, strategy) {
    return new WrapReadableStream({
      start: (controller) => {
        this.#readableControllers.push(controller);
        return readable;
      },
      cancel: async () => {
        await this.close();
      },
      close: async () => {
        await this.dispose();
      }
    }, strategy);
  }
  createWritable(stream) {
    const writer = stream.getWriter();
    this.#writers.push(writer);
    return new WritableStream({
      write: async (chunk) => {
        await writer.write(chunk);
      },
      abort: async (reason) => {
        await writer.abort(reason);
        await this.close();
      },
      close: async () => {
        await writer.close().catch(NOOP$1);
        await this.close();
      }
    });
  }
  async close() {
    if (this.#writableClosed) {
      return;
    }
    this.#writableClosed = true;
    if (await this.#options.close?.() !== false) {
      await this.dispose();
    }
    for (const writer of this.#writers) {
      writer.close().catch(NOOP$1);
    }
  }
  async dispose() {
    this.#writableClosed = true;
    this.#closed.resolve();
    for (const controller of this.#readableControllers) {
      tryClose(controller);
    }
    await this.#options.dispose?.();
  }
}
const Global = globalThis;
const TextDecoderStream = Global.TextDecoderStream;
function pipeFrom(writable, pair) {
  const writer = pair.writable.getWriter();
  const pipe = pair.readable.pipeTo(writable);
  return new WritableStream({
    async write(chunk) {
      await writer.write(chunk);
    },
    async close() {
      await writer.close();
      await pipe;
    }
  });
}
class StructDeserializeStream extends BufferedTransformStream {
  constructor(struct2) {
    super((stream) => {
      return struct2.deserialize(stream);
    });
  }
}
class AutoDisposable {
  #disposables = [];
  constructor() {
    this.dispose = this.dispose.bind(this);
  }
  addDisposable(disposable) {
    this.#disposables.push(disposable);
    return disposable;
  }
  dispose() {
    for (const disposable of this.#disposables) {
      disposable.dispose();
    }
    this.#disposables = [];
  }
}
class EventEmitter {
  listeners = [];
  constructor() {
    this.event = this.event.bind(this);
  }
  addEventListener(info) {
    this.listeners.push(info);
    const remove = () => {
      const index = this.listeners.indexOf(info);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
    remove.dispose = remove;
    return remove;
  }
  event = (listener, thisArg, ...args) => {
    const info = {
      listener,
      thisArg,
      args
    };
    return this.addEventListener(info);
  };
  fire(e2) {
    for (const info of this.listeners.slice()) {
      info.listener.call(info.thisArg, e2, ...info.args);
    }
  }
  dispose() {
    this.listeners.length = 0;
  }
}
const Undefined = Symbol("undefined");
class StickyEventEmitter extends EventEmitter {
  #value = Undefined;
  addEventListener(info) {
    if (this.#value !== Undefined) {
      info.listener.call(info.thisArg, this.#value, ...info.args);
    }
    return super.addEventListener(info);
  }
  fire(e2) {
    this.#value = e2;
    super.fire(e2);
  }
}
class AdbServiceBase extends AutoDisposable {
  #adb;
  get adb() {
    return this.#adb;
  }
  constructor(adb) {
    super();
    this.#adb = adb;
  }
}
const Version = /* @__PURE__ */ struct({ version: u32 }, { littleEndian: true });
const AdbFrameBufferV1 = /* @__PURE__ */ struct({
  bpp: u32,
  size: u32,
  width: u32,
  height: u32,
  red_offset: u32,
  red_length: u32,
  blue_offset: u32,
  blue_length: u32,
  green_offset: u32,
  green_length: u32,
  alpha_offset: u32,
  alpha_length: u32,
  data: /* @__PURE__ */ buffer("size")
}, { littleEndian: true });
const AdbFrameBufferV2 = /* @__PURE__ */ struct({
  bpp: u32,
  colorSpace: u32,
  size: u32,
  width: u32,
  height: u32,
  red_offset: u32,
  red_length: u32,
  blue_offset: u32,
  blue_length: u32,
  green_offset: u32,
  green_length: u32,
  alpha_offset: u32,
  alpha_length: u32,
  data: /* @__PURE__ */ buffer("size")
}, { littleEndian: true });
class AdbFrameBufferError extends Error {
  constructor(message, options) {
    super(message, options);
  }
}
class AdbFrameBufferUnsupportedVersionError extends AdbFrameBufferError {
  constructor(version) {
    super(`Unsupported FrameBuffer version ${version}`);
  }
}
class AdbFrameBufferForbiddenError extends AdbFrameBufferError {
  constructor() {
    super("FrameBuffer is disabled by current app");
  }
}
async function framebuffer(adb) {
  const socket2 = await adb.createSocket("framebuffer:");
  const stream = new BufferedReadableStream(socket2.readable);
  let version;
  try {
    ({ version } = await Version.deserialize(stream));
  } catch (e2) {
    if (e2 instanceof StructEmptyError) {
      throw new AdbFrameBufferForbiddenError();
    }
    throw e2;
  }
  switch (version) {
    case 1:
      return await AdbFrameBufferV1.deserialize(stream);
    case 2:
      return await AdbFrameBufferV2.deserialize(stream);
    default:
      throw new AdbFrameBufferUnsupportedVersionError(version);
  }
}
class AdbPower extends AdbServiceBase {
  reboot(mode = "") {
    return this.adb.createSocketAndWait(`reboot:${mode}`);
  }
  bootloader() {
    return this.reboot("bootloader");
  }
  fastboot() {
    return this.reboot("fastboot");
  }
  recovery() {
    return this.reboot("recovery");
  }
  sideload() {
    return this.reboot("sideload");
  }
  /**
   * Reboot to Qualcomm Emergency Download (EDL) Mode.
   *
   * Only works on some Qualcomm devices.
   */
  qualcommEdlMode() {
    return this.reboot("edl");
  }
  powerOff() {
    return this.adb.subprocess.noneProtocol.spawnWaitText(["reboot", "-p"]);
  }
  powerButton(longPress = false) {
    const args = ["input", "keyevent"];
    if (longPress) {
      args.push("--longpress");
    }
    args.push("POWER");
    return this.adb.subprocess.noneProtocol.spawnWaitText(args);
  }
  /**
   * Reboot to Samsung Odin download mode.
   *
   * Only works on Samsung devices.
   */
  samsungOdin() {
    return this.reboot("download");
  }
}
function toLocalUint8Array(value) {
  if (value.buffer instanceof ArrayBuffer) {
    return value;
  }
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy;
}
class AutoResetEvent {
  #set;
  #queue = [];
  constructor(initialSet = false) {
    this.#set = initialSet;
  }
  wait() {
    if (!this.#set) {
      this.#set = true;
      if (this.#queue.length === 0) {
        return Promise.resolve();
      }
    }
    const resolver = new PromiseResolver();
    this.#queue.push(resolver);
    return resolver.promise;
  }
  notifyOne() {
    if (this.#queue.length !== 0) {
      this.#queue.pop().resolve();
    } else {
      this.#set = false;
    }
  }
  dispose() {
    for (const item of this.#queue) {
      item.reject(new Error("The AutoResetEvent has been disposed"));
    }
    this.#queue.length = 0;
  }
}
const [charToIndex, indexToChar, paddingChar] = /* @__PURE__ */ (() => {
  const charToIndex2 = [];
  const indexToChar2 = [];
  const paddingChar2 = "=".charCodeAt(0);
  function addRange(start, end) {
    const charCodeStart = start.charCodeAt(0);
    const charCodeEnd = end.charCodeAt(0);
    for (let charCode = charCodeStart; charCode <= charCodeEnd; charCode += 1) {
      charToIndex2[charCode] = indexToChar2.length;
      indexToChar2.push(charCode);
    }
  }
  addRange("A", "Z");
  addRange("a", "z");
  addRange("0", "9");
  addRange("+", "+");
  addRange("/", "/");
  return [charToIndex2, indexToChar2, paddingChar2];
})();
function calculateBase64EncodedLength(inputLength) {
  const remainder = inputLength % 3;
  const paddingLength = remainder !== 0 ? 3 - remainder : 0;
  return [(inputLength + paddingLength) / 3 * 4, paddingLength];
}
function encodeBase64(input, output2) {
  const [outputLength, paddingLength] = calculateBase64EncodedLength(input.length);
  if (!output2) {
    output2 = new Uint8Array(outputLength);
    encodeForward(input, output2, paddingLength);
    return output2;
  } else {
    if (output2.length < outputLength) {
      throw new TypeError("output buffer is too small");
    }
    output2 = output2.subarray(0, outputLength);
    if (input.buffer !== output2.buffer) {
      encodeForward(input, output2, paddingLength);
    } else if (output2.byteOffset + output2.length - (paddingLength + 1) <= input.byteOffset + input.length) {
      encodeForward(input, output2, paddingLength);
    } else if (output2.byteOffset >= input.byteOffset - 1) {
      encodeBackward(input, output2, paddingLength);
    } else {
      throw new TypeError("input and output cannot overlap");
    }
    return outputLength;
  }
}
function encodeForward(input, output2, paddingLength) {
  let inputIndex = 0;
  let outputIndex = 0;
  while (inputIndex < input.length - 2) {
    const x = input[inputIndex];
    inputIndex += 1;
    const y = input[inputIndex];
    inputIndex += 1;
    const z = input[inputIndex];
    inputIndex += 1;
    output2[outputIndex] = indexToChar[x >> 2];
    outputIndex += 1;
    output2[outputIndex] = indexToChar[(x & 3) << 4 | y >> 4];
    outputIndex += 1;
    output2[outputIndex] = indexToChar[(y & 15) << 2 | z >> 6];
    outputIndex += 1;
    output2[outputIndex] = indexToChar[z & 63];
    outputIndex += 1;
  }
  if (paddingLength === 2) {
    const x = input[inputIndex];
    inputIndex += 1;
    output2[outputIndex] = indexToChar[x >> 2];
    outputIndex += 1;
    output2[outputIndex] = indexToChar[(x & 3) << 4];
    outputIndex += 1;
    output2[outputIndex] = paddingChar;
    outputIndex += 1;
    output2[outputIndex] = paddingChar;
  } else if (paddingLength === 1) {
    const x = input[inputIndex];
    inputIndex += 1;
    const y = input[inputIndex];
    inputIndex += 1;
    output2[outputIndex] = indexToChar[x >> 2];
    outputIndex += 1;
    output2[outputIndex] = indexToChar[(x & 3) << 4 | y >> 4];
    outputIndex += 1;
    output2[outputIndex] = indexToChar[(y & 15) << 2];
    outputIndex += 1;
    output2[outputIndex] = paddingChar;
  }
}
function encodeBackward(input, output2, paddingLength) {
  let inputIndex = input.length - 1;
  let outputIndex = output2.length - 1;
  if (paddingLength === 2) {
    const x = input[inputIndex];
    inputIndex -= 1;
    output2[outputIndex] = paddingChar;
    outputIndex -= 1;
    output2[outputIndex] = paddingChar;
    outputIndex -= 1;
    output2[outputIndex] = indexToChar[(x & 3) << 4];
    outputIndex -= 1;
    output2[outputIndex] = indexToChar[x >> 2];
    outputIndex -= 1;
  } else if (paddingLength === 1) {
    const y = input[inputIndex];
    inputIndex -= 1;
    const x = input[inputIndex];
    inputIndex -= 1;
    output2[outputIndex] = paddingChar;
    outputIndex -= 1;
    output2[outputIndex] = indexToChar[(y & 15) << 2];
    outputIndex -= 1;
    output2[outputIndex] = indexToChar[(x & 3) << 4 | y >> 4];
    outputIndex -= 1;
    output2[outputIndex] = indexToChar[x >> 2];
    outputIndex -= 1;
  }
  while (inputIndex >= 0) {
    const z = input[inputIndex];
    inputIndex -= 1;
    const y = input[inputIndex];
    inputIndex -= 1;
    const x = input[inputIndex];
    inputIndex -= 1;
    output2[outputIndex] = indexToChar[z & 63];
    outputIndex -= 1;
    output2[outputIndex] = indexToChar[(y & 15) << 2 | z >> 6];
    outputIndex -= 1;
    output2[outputIndex] = indexToChar[(x & 3) << 4 | y >> 4];
    outputIndex -= 1;
    output2[outputIndex] = indexToChar[x >> 2];
    outputIndex -= 1;
  }
}
function hexCharToNumber(char) {
  if (char < 48) {
    throw new TypeError(`Invalid hex char ${char}`);
  }
  if (char < 58) {
    return char - 48;
  }
  if (char < 65) {
    throw new TypeError(`Invalid hex char ${char}`);
  }
  if (char < 71) {
    return char - 55;
  }
  if (char < 97) {
    throw new TypeError(`Invalid hex char ${char}`);
  }
  if (char < 103) {
    return char - 87;
  }
  throw new TypeError(`Invalid hex char ${char}`);
}
function hexToNumber(data) {
  let result = 0;
  for (let i2 = 0; i2 < data.length; i2 += 1) {
    result = result << 4 | hexCharToNumber(data[i2]);
  }
  return result;
}
const NOOP = /* @__NO_SIDE_EFFECTS__ */ () => {
};
function unreachable(...args) {
  throw new Error("Unreachable. Arguments:\n" + args.join("\n"));
}
function sequenceEqual(a2, b) {
  if (a2.length !== b.length) {
    return false;
  }
  for (let i2 = 0; i2 < a2.length; i2 += 1) {
    if (a2[i2] !== b[i2]) {
      return false;
    }
  }
  return true;
}
const AdbReverseStringResponse = /* @__PURE__ */ struct({
  length: /* @__PURE__ */ string(4),
  content: /* @__PURE__ */ string({
    field: "length",
    convert(value) {
      return Number.parseInt(value, 16);
    },
    back(value) {
      return value.toString(16).padStart(4, "0");
    }
  })
}, { littleEndian: true });
class AdbReverseError extends Error {
  constructor(message) {
    super(message);
  }
}
class AdbReverseNotSupportedError extends AdbReverseError {
  constructor() {
    super("ADB reverse tunnel is not supported on this device when connected wirelessly.");
  }
}
const AdbReverseErrorResponse = /* @__PURE__ */ extend(AdbReverseStringResponse, {}, {
  postDeserialize(value) {
    if (value.content === "more than one device/emulator") {
      throw new AdbReverseNotSupportedError();
    } else {
      throw new AdbReverseError(value.content);
    }
  }
});
function decimalToNumber(buffer2) {
  let value = 0;
  for (const byte of buffer2) {
    if (byte < 48 || byte > 57) {
      return value;
    }
    value = value * 10 + byte - 48;
  }
  return value;
}
const OKAY = /* @__PURE__ */ encodeUtf8("OKAY");
class AdbReverseService extends AdbServiceBase {
  #deviceAddressToLocalAddress = /* @__PURE__ */ new Map();
  async createBufferedStream(service) {
    const socket2 = await this.adb.createSocket(service);
    return new BufferedReadableStream(socket2.readable);
  }
  async sendRequest(service) {
    const stream = await this.createBufferedStream(service);
    const response = await stream.readExactly(4);
    if (!sequenceEqual(response, OKAY)) {
      await AdbReverseErrorResponse.deserialize(stream);
    }
    return stream;
  }
  /**
   * Get a list of all reverse port forwarding on the device.
   */
  async list() {
    const stream = await this.createBufferedStream("reverse:list-forward");
    const response = await AdbReverseStringResponse.deserialize(stream);
    return response.content.split("\n").filter((line) => !!line).map((line) => {
      const [deviceSerial, localName, remoteName] = line.split(" ");
      return { deviceSerial, localName, remoteName };
    });
  }
  /**
   * Add a reverse port forwarding for a program that already listens on a port.
   */
  async addExternal(deviceAddress, localAddress) {
    const stream = await this.sendRequest(`reverse:forward:${deviceAddress};${localAddress}`);
    if (deviceAddress.startsWith("tcp:")) {
      const position = stream.position;
      try {
        const length = hexToNumber(await stream.readExactly(4));
        const port = decimalToNumber(await stream.readExactly(length));
        deviceAddress = `tcp:${port}`;
      } catch (e2) {
        if (e2 instanceof ExactReadableEndedError && stream.position === position) ;
        else {
          throw e2;
        }
      }
    }
    return deviceAddress;
  }
  /**
   * Add a reverse port forwarding.
   */
  async add(deviceAddress, handler, localAddress) {
    localAddress = await this.adb.transport.addReverseTunnel(handler, localAddress);
    try {
      deviceAddress = await this.addExternal(deviceAddress, localAddress);
      this.#deviceAddressToLocalAddress.set(deviceAddress, localAddress);
      return deviceAddress;
    } catch (e2) {
      await this.adb.transport.removeReverseTunnel(localAddress);
      throw e2;
    }
  }
  /**
   * Remove a reverse port forwarding.
   */
  async remove(deviceAddress) {
    const localAddress = this.#deviceAddressToLocalAddress.get(deviceAddress);
    if (localAddress) {
      await this.adb.transport.removeReverseTunnel(localAddress);
    }
    await this.sendRequest(`reverse:killforward:${deviceAddress}`);
  }
  /**
   * Remove all reverse port forwarding, including the ones added by other programs.
   */
  async removeAll() {
    await this.adb.transport.clearReverseTunnels();
    this.#deviceAddressToLocalAddress.clear();
    await this.sendRequest(`reverse:killforward-all`);
  }
}
class AdbNoneProtocolProcessImpl {
  #socket;
  get stdin() {
    return this.#socket.writable;
  }
  get output() {
    return this.#socket.readable;
  }
  #exited;
  get exited() {
    return this.#exited;
  }
  constructor(socket2, signal) {
    this.#socket = socket2;
    if (signal) {
      const exited = new PromiseResolver();
      this.#socket.closed.then(() => exited.resolve(void 0), (e2) => exited.reject(e2));
      signal.addEventListener("abort", () => {
        exited.reject(signal.reason);
        this.#socket.close();
      });
      this.#exited = exited.promise;
    } else {
      this.#exited = this.#socket.closed;
    }
  }
  kill() {
    return this.#socket.close();
  }
}
class AdbNoneProtocolPtyProcess {
  #socket;
  #writer;
  #input;
  get input() {
    return this.#input;
  }
  get output() {
    return this.#socket.readable;
  }
  get exited() {
    return this.#socket.closed;
  }
  constructor(socket2) {
    this.#socket = socket2;
    this.#writer = this.#socket.writable.getWriter();
    this.#input = new MaybeConsumableWritableStream({
      write: (chunk) => this.#writer.write(chunk)
    });
  }
  sigint() {
    return this.#writer.write(new Uint8Array([3]));
  }
  kill() {
    return this.#socket.close();
  }
}
function escapeArg(s) {
  let result = "";
  result += `'`;
  let base = 0;
  while (true) {
    const found = s.indexOf(`'`, base);
    if (found === -1) {
      result += s.substring(base);
      break;
    }
    result += s.substring(base, found);
    result += String.raw`'\''`;
    base = found + 1;
  }
  result += `'`;
  return result;
}
function splitCommand(command) {
  const result = [];
  let quote;
  let isEscaped = false;
  let start = 0;
  for (let i2 = 0, len = command.length; i2 < len; i2 += 1) {
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    const char = command.charAt(i2);
    switch (char) {
      case " ":
        if (!quote && i2 !== start) {
          result.push(command.substring(start, i2));
          start = i2 + 1;
        }
        break;
      case "'":
      case '"':
        if (!quote) {
          quote = char;
        } else if (char === quote) {
          quote = void 0;
        }
        break;
      case "\\":
        isEscaped = true;
        break;
    }
  }
  if (start < command.length) {
    result.push(command.substring(start));
  }
  return result;
}
class AdbNoneProtocolSpawner {
  #spawn;
  constructor(spawn) {
    this.#spawn = spawn;
  }
  spawn(command, signal) {
    signal?.throwIfAborted();
    if (typeof command === "string") {
      command = splitCommand(command);
    }
    return this.#spawn(command, signal);
  }
  async spawnWait(command) {
    const process2 = await this.spawn(command);
    return await process2.output.pipeThrough(new ConcatBufferStream());
  }
  async spawnWaitText(command) {
    const process2 = await this.spawn(command);
    return await process2.output.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream());
  }
}
class AdbNoneProtocolSubprocessService extends AdbNoneProtocolSpawner {
  #adb;
  get adb() {
    return this.#adb;
  }
  constructor(adb) {
    super(async (command, signal) => {
      const socket2 = await this.#adb.createSocket(`exec:${command.join(" ")}`);
      if (signal?.aborted) {
        await socket2.close();
        throw signal.reason;
      }
      return new AdbNoneProtocolProcessImpl(socket2, signal);
    });
    this.#adb = adb;
  }
  async pty(command) {
    if (command === void 0) {
      command = "";
    } else if (Array.isArray(command)) {
      command = command.join(" ");
    }
    return new AdbNoneProtocolPtyProcess(
      // https://github.com/microsoft/typescript/issues/17002
      await this.#adb.createSocket(`shell:${command}`)
    );
  }
}
const AdbFeature = {
  ShellV2: "shell_v2",
  Cmd: "cmd",
  StatV2: "stat_v2",
  ListV2: "ls_v2",
  FixedPushMkdir: "fixed_push_mkdir",
  Abb: "abb",
  AbbExec: "abb_exec",
  SendReceiveV2: "sendrecv_v2",
  DelayedAck: "delayed_ack"
};
const AdbShellProtocolId = {
  Stdin: 0,
  Stdout: 1,
  Stderr: 2,
  Exit: 3,
  CloseStdin: 4,
  WindowSizeChange: 5
};
const AdbShellProtocolPacket = /* @__PURE__ */ struct({
  id: u8(),
  data: /* @__PURE__ */ buffer(u32)
}, { littleEndian: true });
class AdbShellProtocolProcessImpl {
  #socket;
  #writer;
  #stdin;
  get stdin() {
    return this.#stdin;
  }
  #stdout;
  get stdout() {
    return this.#stdout;
  }
  #stderr;
  get stderr() {
    return this.#stderr;
  }
  #exited;
  get exited() {
    return this.#exited;
  }
  constructor(socket2, signal) {
    this.#socket = socket2;
    let stdoutController;
    let stderrController;
    this.#stdout = new PushReadableStream((controller) => {
      stdoutController = controller;
    });
    this.#stderr = new PushReadableStream((controller) => {
      stderrController = controller;
    });
    const exited = new PromiseResolver();
    this.#exited = exited.promise;
    socket2.readable.pipeThrough(new StructDeserializeStream(AdbShellProtocolPacket)).pipeTo(new WritableStream({
      write: async (chunk) => {
        switch (chunk.id) {
          case AdbShellProtocolId.Exit:
            exited.resolve(chunk.data[0]);
            break;
          case AdbShellProtocolId.Stdout:
            await stdoutController.enqueue(chunk.data);
            break;
          case AdbShellProtocolId.Stderr:
            await stderrController.enqueue(chunk.data);
            break;
        }
      }
    })).then(() => {
      stdoutController.close();
      stderrController.close();
      exited.reject(new Error("Socket ended without exit message"));
    }, (e2) => {
      stdoutController.error(e2);
      stderrController.error(e2);
      exited.reject(e2);
    });
    if (signal) {
      signal.addEventListener("abort", () => {
        exited.reject(signal.reason);
        this.#socket.close();
      });
    }
    this.#writer = this.#socket.writable.getWriter();
    this.#stdin = new MaybeConsumableWritableStream({
      write: async (chunk) => {
        await this.#writer.write(AdbShellProtocolPacket.serialize({
          id: AdbShellProtocolId.Stdin,
          data: chunk
        }));
      },
      close: () => (
        // Only shell protocol + raw mode supports closing stdin
        this.#writer.write(AdbShellProtocolPacket.serialize({
          id: AdbShellProtocolId.CloseStdin,
          data: EmptyUint8Array
        }))
      )
    });
  }
  kill() {
    return this.#socket.close();
  }
}
class AdbShellProtocolPtyProcess {
  #socket;
  #writer;
  #input;
  get input() {
    return this.#input;
  }
  #stdout;
  get output() {
    return this.#stdout;
  }
  #exited = new PromiseResolver();
  get exited() {
    return this.#exited.promise;
  }
  constructor(socket2) {
    this.#socket = socket2;
    let stdoutController;
    this.#stdout = new PushReadableStream((controller) => {
      stdoutController = controller;
    });
    socket2.readable.pipeThrough(new StructDeserializeStream(AdbShellProtocolPacket)).pipeTo(new WritableStream({
      write: async (chunk) => {
        switch (chunk.id) {
          case AdbShellProtocolId.Exit:
            this.#exited.resolve(chunk.data[0]);
            break;
          case AdbShellProtocolId.Stdout:
            await stdoutController.enqueue(chunk.data);
            break;
        }
      }
    })).then(() => {
      stdoutController.close();
      this.#exited.reject(new Error("Socket ended without exit message"));
    }, (e2) => {
      stdoutController.error(e2);
      this.#exited.reject(e2);
    });
    this.#writer = this.#socket.writable.getWriter();
    this.#input = new MaybeConsumableWritableStream({
      write: (chunk) => this.#writeStdin(chunk)
    });
  }
  #writeStdin(chunk) {
    return this.#writer.write(AdbShellProtocolPacket.serialize({
      id: AdbShellProtocolId.Stdin,
      data: chunk
    }));
  }
  async resize(rows, cols) {
    await this.#writer.write(AdbShellProtocolPacket.serialize({
      id: AdbShellProtocolId.WindowSizeChange,
      // The "correct" format is `${rows}x${cols},${x_pixels}x${y_pixels}`
      // However, according to https://linux.die.net/man/4/tty_ioctl
      // `x_pixels` and `y_pixels` are unused, so always sending `0` should be fine.
      data: /* @__PURE__ */ encodeUtf8(`${rows}x${cols},0x0\0`)
    }));
  }
  sigint() {
    return this.#writeStdin(new Uint8Array([3]));
  }
  kill() {
    return this.#socket.close();
  }
}
class AdbShellProtocolSpawner {
  #spawn;
  constructor(spawn) {
    this.#spawn = spawn;
  }
  spawn(command, signal) {
    signal?.throwIfAborted();
    if (typeof command === "string") {
      command = splitCommand(command);
    }
    return this.#spawn(command, signal);
  }
  async spawnWait(command) {
    const process2 = await this.spawn(command);
    const [stdout, stderr, exitCode] = await Promise.all([
      process2.stdout.pipeThrough(new ConcatBufferStream()),
      process2.stderr.pipeThrough(new ConcatBufferStream()),
      process2.exited
    ]);
    return { stdout, stderr, exitCode };
  }
  async spawnWaitText(command) {
    const process2 = await this.spawn(command);
    const [stdout, stderr, exitCode] = await Promise.all([
      process2.stdout.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream()),
      process2.stderr.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream()),
      process2.exited
    ]);
    return { stdout, stderr, exitCode };
  }
}
class AdbShellProtocolSubprocessService extends AdbShellProtocolSpawner {
  #adb;
  get adb() {
    return this.#adb;
  }
  get isSupported() {
    return this.#adb.canUseFeature(AdbFeature.ShellV2);
  }
  constructor(adb) {
    super(async (command, signal) => {
      const socket2 = await this.#adb.createSocket(`shell,v2,raw:${command.join(" ")}`);
      if (signal?.aborted) {
        await socket2.close();
        throw signal.reason;
      }
      return new AdbShellProtocolProcessImpl(socket2, signal);
    });
    this.#adb = adb;
  }
  async pty(options) {
    let service = "shell,v2,pty";
    if (options?.terminalType) {
      service += `,TERM=` + options.terminalType;
    }
    service += ":";
    if (options) {
      if (typeof options.command === "string") {
        service += options.command;
      } else if (Array.isArray(options.command)) {
        service += options.command.join(" ");
      }
    }
    return new AdbShellProtocolPtyProcess(await this.#adb.createSocket(service));
  }
}
class AdbSubprocessService {
  #adb;
  get adb() {
    return this.#adb;
  }
  #noneProtocol;
  get noneProtocol() {
    return this.#noneProtocol;
  }
  #shellProtocol;
  get shellProtocol() {
    return this.#shellProtocol;
  }
  constructor(adb) {
    this.#adb = adb;
    this.#noneProtocol = new AdbNoneProtocolSubprocessService(adb);
    if (adb.canUseFeature(AdbFeature.ShellV2)) {
      this.#shellProtocol = new AdbShellProtocolSubprocessService(adb);
    }
  }
}
function encodeAsciiUnchecked(value) {
  const result = new Uint8Array(value.length);
  for (let i2 = 0; i2 < value.length; i2 += 1) {
    result[i2] = value.charCodeAt(i2);
  }
  return result;
}
// @__NO_SIDE_EFFECTS__
function adbSyncEncodeId(value) {
  const buffer2 = encodeAsciiUnchecked(value);
  return /* @__PURE__ */ getUint32LittleEndian(buffer2, 0);
}
const AdbSyncResponseId = {
  Entry: /* @__PURE__ */ adbSyncEncodeId("DENT"),
  Entry2: /* @__PURE__ */ adbSyncEncodeId("DNT2"),
  Lstat: /* @__PURE__ */ adbSyncEncodeId("STAT"),
  Stat: /* @__PURE__ */ adbSyncEncodeId("STA2"),
  Lstat2: /* @__PURE__ */ adbSyncEncodeId("LST2"),
  Done: /* @__PURE__ */ adbSyncEncodeId("DONE"),
  Data: /* @__PURE__ */ adbSyncEncodeId("DATA"),
  Ok: /* @__PURE__ */ adbSyncEncodeId("OKAY"),
  Fail: /* @__PURE__ */ adbSyncEncodeId("FAIL")
};
class AdbSyncError extends Error {
}
const AdbSyncFailResponse = /* @__PURE__ */ struct({ message: /* @__PURE__ */ string(u32) }, {
  littleEndian: true,
  postDeserialize(value) {
    throw new AdbSyncError(value.message);
  }
});
async function adbSyncReadResponse(stream, id, type) {
  if (typeof id === "string") {
    id = /* @__PURE__ */ adbSyncEncodeId(id);
  }
  const buffer2 = await stream.readExactly(4);
  switch (/* @__PURE__ */ getUint32LittleEndian(buffer2, 0)) {
    case AdbSyncResponseId.Fail:
      await AdbSyncFailResponse.deserialize(stream);
      throw new Error("Unreachable");
    case id:
      return await type.deserialize(stream);
    default:
      throw new Error(`Expected '${id}', but got '${/* @__PURE__ */ decodeUtf8(buffer2)}'`);
  }
}
async function* adbSyncReadResponses(stream, id, type) {
  if (typeof id === "string") {
    id = /* @__PURE__ */ adbSyncEncodeId(id);
  }
  while (true) {
    const buffer2 = await stream.readExactly(4);
    switch (/* @__PURE__ */ getUint32LittleEndian(buffer2, 0)) {
      case AdbSyncResponseId.Fail:
        await AdbSyncFailResponse.deserialize(stream);
        unreachable();
      case AdbSyncResponseId.Done:
        await stream.readExactly(type.size);
        return;
      case id:
        yield await type.deserialize(stream);
        break;
      default:
        throw new Error(`Expected '${id}' or '${AdbSyncResponseId.Done}', but got '${/* @__PURE__ */ decodeUtf8(buffer2)}'`);
    }
  }
}
const AdbSyncRequestId = {
  List: /* @__PURE__ */ adbSyncEncodeId("LIST"),
  ListV2: /* @__PURE__ */ adbSyncEncodeId("LIS2"),
  Send: /* @__PURE__ */ adbSyncEncodeId("SEND"),
  SendV2: /* @__PURE__ */ adbSyncEncodeId("SND2"),
  Lstat: /* @__PURE__ */ adbSyncEncodeId("STAT"),
  Stat: /* @__PURE__ */ adbSyncEncodeId("STA2"),
  LstatV2: /* @__PURE__ */ adbSyncEncodeId("LST2"),
  Data: /* @__PURE__ */ adbSyncEncodeId("DATA"),
  Done: /* @__PURE__ */ adbSyncEncodeId("DONE"),
  Receive: /* @__PURE__ */ adbSyncEncodeId("RECV")
};
const AdbSyncNumberRequest = /* @__PURE__ */ struct({ id: u32, arg: u32 }, { littleEndian: true });
async function adbSyncWriteRequest(writable, id, value) {
  if (typeof id === "string") {
    id = /* @__PURE__ */ adbSyncEncodeId(id);
  }
  if (typeof value === "number") {
    await writable.write(AdbSyncNumberRequest.serialize({ id, arg: value }));
    return;
  }
  if (typeof value === "string") {
    value = /* @__PURE__ */ encodeUtf8(value);
  }
  await writable.write(AdbSyncNumberRequest.serialize({ id, arg: value.length }));
  await writable.write(value);
}
const LinuxFileType = {
  File: 8
};
const AdbSyncLstatResponse = /* @__PURE__ */ struct({ mode: u32, size: u32, mtime: u32 }, {
  littleEndian: true,
  extra: {
    get type() {
      return this.mode >> 12;
    },
    get permission() {
      return this.mode & 4095;
    }
  },
  postDeserialize(value) {
    if (value.mode === 0 && value.size === 0 && value.mtime === 0) {
      throw new Error("lstat error");
    }
    return value;
  }
});
const AdbSyncStatErrorCode = {
  SUCCESS: 0,
  EACCES: 13,
  EEXIST: 17,
  EFAULT: 14,
  EFBIG: 27,
  EINTR: 4,
  EINVAL: 22,
  EIO: 5,
  EISDIR: 21,
  ELOOP: 40,
  EMFILE: 24,
  ENAMETOOLONG: 36,
  ENFILE: 23,
  ENOENT: 2,
  ENOMEM: 12,
  ENOSPC: 28,
  ENOTDIR: 20,
  EOVERFLOW: 75,
  EPERM: 1,
  EROFS: 30,
  ETXTBSY: 26
};
const AdbSyncStatErrorName = /* @__PURE__ */ (() => Object.fromEntries(Object.entries(AdbSyncStatErrorCode).map(([key, value]) => [
  value,
  key
])))();
const AdbSyncStatResponse = /* @__PURE__ */ struct({
  error: u32(),
  dev: u64,
  ino: u64,
  mode: u32,
  nlink: u32,
  uid: u32,
  gid: u32,
  size: u64,
  atime: u64,
  mtime: u64,
  ctime: u64
}, {
  littleEndian: true,
  extra: {
    get type() {
      return this.mode >> 12;
    },
    get permission() {
      return this.mode & 4095;
    }
  },
  postDeserialize(value) {
    if (value.error) {
      throw new Error(AdbSyncStatErrorName[value.error]);
    }
    return value;
  }
});
async function adbSyncLstat(socket2, path, v2) {
  const locked = await socket2.lock();
  try {
    if (v2) {
      await adbSyncWriteRequest(locked, AdbSyncRequestId.LstatV2, path);
      return await adbSyncReadResponse(locked, AdbSyncResponseId.Lstat2, AdbSyncStatResponse);
    } else {
      await adbSyncWriteRequest(locked, AdbSyncRequestId.Lstat, path);
      const response = await adbSyncReadResponse(locked, AdbSyncResponseId.Lstat, AdbSyncLstatResponse);
      return {
        mode: response.mode,
        // Convert to `BigInt` to make it compatible with `AdbSyncStatResponse`
        size: BigInt(response.size),
        mtime: BigInt(response.mtime),
        get type() {
          return response.type;
        },
        get permission() {
          return response.permission;
        }
      };
    }
  } finally {
    locked.release();
  }
}
async function adbSyncStat(socket2, path) {
  const locked = await socket2.lock();
  try {
    await adbSyncWriteRequest(locked, AdbSyncRequestId.Stat, path);
    return await adbSyncReadResponse(locked, AdbSyncResponseId.Stat, AdbSyncStatResponse);
  } finally {
    locked.release();
  }
}
const AdbSyncEntryResponse = /* @__PURE__ */ extend(AdbSyncLstatResponse, {
  name: /* @__PURE__ */ string(u32)
});
const AdbSyncEntry2Response = /* @__PURE__ */ extend(AdbSyncStatResponse, {
  name: /* @__PURE__ */ string(u32)
});
async function* adbSyncOpenDirV2(socket2, path) {
  const locked = await socket2.lock();
  try {
    await adbSyncWriteRequest(locked, AdbSyncRequestId.ListV2, path);
    for await (const item of adbSyncReadResponses(locked, AdbSyncResponseId.Entry2, AdbSyncEntry2Response)) {
      if (item.error !== AdbSyncStatErrorCode.SUCCESS) {
        continue;
      }
      yield item;
    }
  } finally {
    locked.release();
  }
}
async function* adbSyncOpenDirV1(socket2, path) {
  const locked = await socket2.lock();
  try {
    await adbSyncWriteRequest(locked, AdbSyncRequestId.List, path);
    for await (const item of adbSyncReadResponses(locked, AdbSyncResponseId.Entry, AdbSyncEntryResponse)) {
      yield item;
    }
  } finally {
    locked.release();
  }
}
async function* adbSyncOpenDir(socket2, path, v2) {
  if (v2) {
    yield* adbSyncOpenDirV2(socket2, path);
  } else {
    for await (const item of adbSyncOpenDirV1(socket2, path)) {
      yield {
        mode: item.mode,
        size: BigInt(item.size),
        mtime: BigInt(item.mtime),
        get type() {
          return item.type;
        },
        get permission() {
          return item.permission;
        },
        name: item.name
      };
    }
  }
}
const AdbSyncDataResponse = /* @__PURE__ */ struct({ data: /* @__PURE__ */ buffer(u32) }, { littleEndian: true });
async function* adbSyncPullGenerator(socket2, path) {
  const locked = await socket2.lock();
  let done = false;
  try {
    await adbSyncWriteRequest(locked, AdbSyncRequestId.Receive, path);
    for await (const packet of adbSyncReadResponses(locked, AdbSyncResponseId.Data, AdbSyncDataResponse)) {
      yield packet.data;
    }
    done = true;
  } catch (e2) {
    done = true;
    throw e2;
  } finally {
    if (!done) {
      for await (const packet of adbSyncReadResponses(locked, AdbSyncResponseId.Data, AdbSyncDataResponse)) {
      }
    }
    locked.release();
  }
}
function adbSyncPull(socket2, path) {
  return ReadableStream.from(adbSyncPullGenerator(socket2, path));
}
const ADB_SYNC_MAX_PACKET_SIZE = 64 * 1024;
const AdbSyncOkResponse = /* @__PURE__ */ struct({ unused: u32 }, { littleEndian: true });
async function pipeFileData(locked, file, packetSize, mtime) {
  const abortController = new AbortController();
  file.pipeThrough(new DistributionStream(packetSize, true)).pipeTo(new MaybeConsumableWritableStream({
    write(chunk) {
      return adbSyncWriteRequest(locked, AdbSyncRequestId.Data, chunk);
    }
  }), { signal: abortController.signal }).then(async () => {
    await adbSyncWriteRequest(locked, AdbSyncRequestId.Done, mtime);
    await locked.flush();
  }, NOOP);
  await adbSyncReadResponse(locked, AdbSyncResponseId.Ok, AdbSyncOkResponse).catch((e2) => {
    abortController.abort();
    throw e2;
  });
}
async function adbSyncPushV1({ socket: socket2, filename, file, type = LinuxFileType.File, permission = 438, mtime = Date.now() / 1e3 | 0, packetSize = ADB_SYNC_MAX_PACKET_SIZE }) {
  const locked = await socket2.lock();
  try {
    const mode = type << 12 | permission;
    const pathAndMode = `${filename},${mode.toString()}`;
    await adbSyncWriteRequest(locked, AdbSyncRequestId.Send, pathAndMode);
    await pipeFileData(locked, file, packetSize, mtime);
  } finally {
    locked.release();
  }
}
const AdbSyncSendV2Flags = {
  None: 0,
  Brotli: 1,
  /**
   * 2
   */
  Lz4: 1 << 1,
  /**
   * 4
   */
  Zstd: 1 << 2,
  DryRun: 2147483648
};
const AdbSyncSendV2Request = /* @__PURE__ */ struct({ id: u32, mode: u32, flags: u32() }, { littleEndian: true });
async function adbSyncPushV2({ socket: socket2, filename, file, type = LinuxFileType.File, permission = 438, mtime = Date.now() / 1e3 | 0, packetSize = ADB_SYNC_MAX_PACKET_SIZE, dryRun = false }) {
  const locked = await socket2.lock();
  try {
    await adbSyncWriteRequest(locked, AdbSyncRequestId.SendV2, filename);
    const mode = type << 12 | permission;
    let flags = AdbSyncSendV2Flags.None;
    if (dryRun) {
      flags |= AdbSyncSendV2Flags.DryRun;
    }
    await locked.write(AdbSyncSendV2Request.serialize({
      id: AdbSyncRequestId.SendV2,
      mode,
      flags
    }));
    await pipeFileData(locked, file, packetSize, mtime);
  } finally {
    locked.release();
  }
}
function adbSyncPush(options) {
  if (options.v2) {
    return adbSyncPushV2(options);
  }
  if (options.dryRun) {
    throw new Error("dryRun is not supported in v1");
  }
  return adbSyncPushV1(options);
}
class AdbSyncSocketLocked {
  #writer;
  #readable;
  #socketLock;
  #writeLock = new AutoResetEvent();
  #combiner;
  get position() {
    return this.#readable.position;
  }
  constructor(writer, readable, bufferSize, lock) {
    this.#writer = writer;
    this.#readable = readable;
    this.#socketLock = lock;
    this.#combiner = new BufferCombiner(bufferSize);
  }
  #write(buffer2) {
    return Consumable.WritableStream.write(this.#writer, buffer2);
  }
  async flush() {
    try {
      await this.#writeLock.wait();
      const buffer2 = this.#combiner.flush();
      if (buffer2) {
        await this.#write(buffer2);
      }
    } finally {
      this.#writeLock.notifyOne();
    }
  }
  async write(data) {
    try {
      await this.#writeLock.wait();
      for (const buffer2 of this.#combiner.push(data)) {
        await this.#write(buffer2);
      }
    } finally {
      this.#writeLock.notifyOne();
    }
  }
  async readExactly(length) {
    await this.flush();
    return await this.#readable.readExactly(length);
  }
  release() {
    this.#combiner.flush();
    this.#socketLock.notifyOne();
  }
  async close() {
    await this.#readable.cancel();
  }
}
class AdbSyncSocket {
  #lock = new AutoResetEvent();
  #socket;
  #locked;
  constructor(socket2, bufferSize) {
    this.#socket = socket2;
    this.#locked = new AdbSyncSocketLocked(socket2.writable.getWriter(), new BufferedReadableStream(socket2.readable), bufferSize, this.#lock);
  }
  async lock() {
    await this.#lock.wait();
    return this.#locked;
  }
  async close() {
    await this.#locked.close();
    await this.#socket.close();
  }
}
function dirname(path) {
  const end = path.lastIndexOf("/");
  if (end === -1) {
    throw new Error(`Invalid path`);
  }
  if (end === 0) {
    return "/";
  }
  return path.substring(0, end);
}
class AdbSync {
  _adb;
  _socket;
  #supportsStat;
  #supportsListV2;
  #fixedPushMkdir;
  #supportsSendReceiveV2;
  #needPushMkdirWorkaround;
  get supportsStat() {
    return this.#supportsStat;
  }
  get supportsListV2() {
    return this.#supportsListV2;
  }
  get fixedPushMkdir() {
    return this.#fixedPushMkdir;
  }
  get supportsSendReceiveV2() {
    return this.#supportsSendReceiveV2;
  }
  get needPushMkdirWorkaround() {
    return this.#needPushMkdirWorkaround;
  }
  constructor(adb, socket2) {
    this._adb = adb;
    this._socket = new AdbSyncSocket(socket2, adb.maxPayloadSize);
    this.#supportsStat = adb.canUseFeature(AdbFeature.StatV2);
    this.#supportsListV2 = adb.canUseFeature(AdbFeature.ListV2);
    this.#fixedPushMkdir = adb.canUseFeature(AdbFeature.FixedPushMkdir);
    this.#supportsSendReceiveV2 = adb.canUseFeature(AdbFeature.SendReceiveV2);
    this.#needPushMkdirWorkaround = this._adb.canUseFeature(AdbFeature.ShellV2) && !this.fixedPushMkdir;
  }
  /**
   * Gets information of a file or folder.
   *
   * If `path` points to a symbolic link, the returned information is about the link itself (with `type` being `LinuxFileType.Link`).
   */
  async lstat(path) {
    return await adbSyncLstat(this._socket, path, this.#supportsStat);
  }
  /**
   * Gets the information of a file or folder.
   *
   * If `path` points to a symbolic link, it will be resolved and the returned information is about the target (with `type` being `LinuxFileType.File` or `LinuxFileType.Directory`).
   */
  async stat(path) {
    if (!this.#supportsStat) {
      throw new Error("Not supported");
    }
    return await adbSyncStat(this._socket, path);
  }
  /**
   * Checks if `path` is a directory, or a symbolic link to a directory.
   *
   * This uses `lstat` internally, thus works on all Android versions.
   */
  async isDirectory(path) {
    try {
      await this.lstat(path + "/");
      return true;
    } catch {
      return false;
    }
  }
  opendir(path) {
    return adbSyncOpenDir(this._socket, path, this.supportsListV2);
  }
  async readdir(path) {
    const results = [];
    for await (const entry of this.opendir(path)) {
      results.push(entry);
    }
    return results;
  }
  /**
   * Reads the content of a file on device.
   *
   * @param filename The full path of the file on device to read.
   * @returns A `ReadableStream` that contains the file content.
   */
  read(filename) {
    return adbSyncPull(this._socket, filename);
  }
  /**
   * Writes a file on device. If the file name already exists, it will be overwritten.
   *
   * @param options The content and options of the file to write.
   */
  async write(options) {
    if (this.needPushMkdirWorkaround) {
      await this._adb.subprocess.noneProtocol.spawnWait([
        "mkdir",
        "-p",
        escapeArg(dirname(options.filename))
      ]);
    }
    await adbSyncPush({
      v2: this.supportsSendReceiveV2,
      socket: this._socket,
      ...options
    });
  }
  lockSocket() {
    return this._socket.lock();
  }
  dispose() {
    return this._socket.close();
  }
}
function parsePort(value) {
  if (!value || value === "0") {
    return void 0;
  }
  return Number.parseInt(value, 10);
}
class AdbTcpIpService extends AdbServiceBase {
  async getListenAddresses() {
    const serviceListenAddresses = await this.adb.getProp("service.adb.listen_addrs");
    const servicePort = await this.adb.getProp("service.adb.tcp.port");
    const persistPort = await this.adb.getProp("persist.adb.tcp.port");
    return {
      serviceListenAddresses: serviceListenAddresses != "" ? serviceListenAddresses.split(",") : [],
      servicePort: parsePort(servicePort),
      persistPort: parsePort(persistPort)
    };
  }
  async setPort(port) {
    if (port <= 0) {
      throw new TypeError(`Invalid port ${port}`);
    }
    const output2 = await this.adb.createSocketAndWait(`tcpip:${port}`);
    if (output2 !== `restarting in TCP mode port: ${port}
`) {
      throw new Error(output2);
    }
    return output2;
  }
  async disable() {
    const output2 = await this.adb.createSocketAndWait("usb:");
    if (output2 !== "restarting in USB mode\n") {
      throw new Error(output2);
    }
    return output2;
  }
}
class Adb {
  #transport;
  get transport() {
    return this.#transport;
  }
  get serial() {
    return this.#transport.serial;
  }
  get maxPayloadSize() {
    return this.#transport.maxPayloadSize;
  }
  get banner() {
    return this.#transport.banner;
  }
  get disconnected() {
    return this.#transport.disconnected;
  }
  get clientFeatures() {
    return this.#transport.clientFeatures;
  }
  get deviceFeatures() {
    return this.banner.features;
  }
  subprocess;
  power;
  reverse;
  tcpip;
  constructor(transport) {
    this.#transport = transport;
    this.subprocess = new AdbSubprocessService(this);
    this.power = new AdbPower(this);
    this.reverse = new AdbReverseService(this);
    this.tcpip = new AdbTcpIpService(this);
  }
  canUseFeature(feature) {
    return this.clientFeatures.includes(feature) && this.deviceFeatures.includes(feature);
  }
  /**
   * Creates a new ADB Socket to the specified service or socket address.
   */
  async createSocket(service) {
    return this.#transport.connect(service);
  }
  async createSocketAndWait(service) {
    const socket2 = await this.createSocket(service);
    return await socket2.readable.pipeThrough(new TextDecoderStream()).pipeThrough(new ConcatStringStream());
  }
  getProp(key) {
    return this.subprocess.noneProtocol.spawnWaitText(["getprop", key]).then((output2) => output2.trim());
  }
  rm(filenames, options) {
    const args = ["rm"];
    if (options?.recursive) {
      args.push("-r");
    }
    if (options?.force) {
      args.push("-f");
    }
    if (Array.isArray(filenames)) {
      for (const filename of filenames) {
        args.push(escapeArg(filename));
      }
    } else {
      args.push(escapeArg(filenames));
    }
    args.push("</dev/null");
    return this.subprocess.noneProtocol.spawnWaitText(args);
  }
  async sync() {
    const socket2 = await this.createSocket("sync:");
    return new AdbSync(this, socket2);
  }
  async framebuffer() {
    return framebuffer(this);
  }
  async close() {
    await this.#transport.close();
  }
}
const AdbBannerKey = {
  Product: "ro.product.name",
  Model: "ro.product.model",
  Device: "ro.product.device",
  Features: "features"
};
class AdbBanner {
  static parse(banner) {
    let state;
    let product;
    let model;
    let device2;
    let features = [];
    const pieces = banner.split("::");
    if (pieces.length > 1) {
      state = pieces[0].trim() || void 0;
      const props = pieces[1];
      for (const prop of props.split(";")) {
        if (!prop) {
          continue;
        }
        const keyValue = prop.split("=");
        if (keyValue.length !== 2) {
          continue;
        }
        const [key, value] = keyValue;
        switch (key) {
          case AdbBannerKey.Product:
            product = value;
            break;
          case AdbBannerKey.Model:
            model = value;
            break;
          case AdbBannerKey.Device:
            device2 = value;
            break;
          case AdbBannerKey.Features:
            features = value.split(",");
            break;
        }
      }
    }
    return new AdbBanner(state, product, model, device2, features);
  }
  #state;
  get state() {
    return this.#state;
  }
  #product;
  get product() {
    return this.#product;
  }
  #model;
  get model() {
    return this.#model;
  }
  #device;
  get device() {
    return this.#device;
  }
  #features = [];
  get features() {
    return this.#features;
  }
  // eslint-disable-next-line @typescript-eslint/max-params
  constructor(state, product, model, device2, features) {
    this.#state = state;
    this.#product = product;
    this.#model = model;
    this.#device = device2;
    this.#features = features;
  }
}
function getBigUint(array, byteOffset, length) {
  let result = 0n;
  for (let i2 = byteOffset; i2 < byteOffset + length; i2 += 8) {
    result <<= 64n;
    const value = getUint64BigEndian(array, i2);
    result |= value;
  }
  return result;
}
function setBigUint(array, byteOffset, length, value, littleEndian) {
  if (littleEndian) {
    while (value > 0n) {
      setInt64LittleEndian(array, byteOffset, value);
      byteOffset += 8;
      value >>= 64n;
    }
  } else {
    let position = byteOffset + length - 8;
    while (value > 0n) {
      setInt64BigEndian(array, position, value);
      position -= 8;
      value >>= 64n;
    }
  }
}
const RsaPrivateKeyNOffset = 38;
const RsaPrivateKeyNLength = 2048 / 8;
const RsaPrivateKeyDOffset = 303;
const RsaPrivateKeyDLength = 2048 / 8;
function rsaParsePrivateKey(key) {
  const n2 = getBigUint(key, RsaPrivateKeyNOffset, RsaPrivateKeyNLength);
  const d = getBigUint(key, RsaPrivateKeyDOffset, RsaPrivateKeyDLength);
  return [n2, d];
}
function nonNegativeMod(m, d) {
  const r = m % d;
  if (r > 0) {
    return r;
  }
  return r + d;
}
function modInverse(a2, m) {
  a2 = nonNegativeMod(a2, m);
  if (!a2 || m < 2) {
    return NaN;
  }
  const s = [];
  let b = m;
  while (b) {
    [a2, b] = [b, a2 % b];
    s.push({ a: a2, b });
  }
  if (a2 !== 1) {
    return NaN;
  }
  let x = 1;
  let y = 0;
  for (let i2 = s.length - 2; i2 >= 0; i2 -= 1) {
    [x, y] = [y, x - y * Math.floor(s[i2].a / s[i2].b)];
  }
  return nonNegativeMod(y, m);
}
const ModulusLengthInBytes = 2048 / 8;
const ModulusLengthInWords = ModulusLengthInBytes / 4;
function adbGetPublicKeySize() {
  return 4 + 4 + ModulusLengthInBytes + ModulusLengthInBytes + 4;
}
function adbGeneratePublicKey(privateKey, output2) {
  let outputType;
  const outputLength = adbGetPublicKeySize();
  if (!output2) {
    output2 = new Uint8Array(outputLength);
    outputType = "Uint8Array";
  } else {
    if (output2.length < outputLength) {
      throw new TypeError("output buffer is too small");
    }
    outputType = "number";
  }
  const outputView = new DataView(output2.buffer, output2.byteOffset, output2.length);
  let outputOffset = 0;
  outputView.setUint32(outputOffset, ModulusLengthInWords, true);
  outputOffset += 4;
  const [n2] = rsaParsePrivateKey(privateKey);
  const n0inv = -modInverse(Number(n2 % 2n ** 32n), 2 ** 32);
  outputView.setInt32(outputOffset, n0inv, true);
  outputOffset += 4;
  setBigUint(output2, outputOffset, ModulusLengthInBytes, n2, true);
  outputOffset += ModulusLengthInBytes;
  const rr = 2n ** 4096n % n2;
  setBigUint(output2, outputOffset, ModulusLengthInBytes, rr, true);
  outputOffset += ModulusLengthInBytes;
  outputView.setUint32(outputOffset, 65537, true);
  outputOffset += 4;
  if (outputType === "Uint8Array") {
    return output2;
  } else {
    return outputLength;
  }
}
function powMod(base, exponent, modulus) {
  if (modulus === 1n) {
    return 0n;
  }
  let r = 1n;
  base = base % modulus;
  while (exponent > 0n) {
    if (BigInt.asUintN(1, exponent) === 1n) {
      r = r * base % modulus;
    }
    base = base * base % modulus;
    exponent >>= 1n;
  }
  return r;
}
const SHA1_DIGEST_LENGTH = 20;
const ASN1_SEQUENCE = 48;
const ASN1_OCTET_STRING = 4;
const ASN1_NULL = 5;
const ASN1_OID = 6;
const SHA1_DIGEST_INFO = new Uint8Array([
  ASN1_SEQUENCE,
  13 + SHA1_DIGEST_LENGTH,
  ASN1_SEQUENCE,
  9,
  // SHA-1 (1 3 14 3 2 26)
  ASN1_OID,
  5,
  1 * 40 + 3,
  14,
  3,
  2,
  26,
  ASN1_NULL,
  0,
  ASN1_OCTET_STRING,
  SHA1_DIGEST_LENGTH
]);
function rsaSign(privateKey, data) {
  const [n2, d] = rsaParsePrivateKey(privateKey);
  const padded = new Uint8Array(256);
  let index = 0;
  padded[index] = 0;
  index += 1;
  padded[index] = 1;
  index += 1;
  const fillLength = padded.length - SHA1_DIGEST_INFO.length - data.length - 1;
  while (index < fillLength) {
    padded[index] = 255;
    index += 1;
  }
  padded[index] = 0;
  index += 1;
  padded.set(SHA1_DIGEST_INFO, index);
  index += SHA1_DIGEST_INFO.length;
  padded.set(data, index);
  const signature = powMod(getBigUint(padded, 0, padded.length), d, n2);
  setBigUint(padded, 0, padded.length, signature, false);
  return padded;
}
const AdbCommand = {
  Auth: 1213486401,
  // 'AUTH'
  Close: 1163086915,
  // 'CLSE'
  Connect: 1314410051,
  // 'CNXN'
  Okay: 1497451343,
  // 'OKAY'
  Open: 1313165391,
  // 'OPEN'
  Write: 1163154007
  // 'WRTE'
};
const AdbPacketHeader = /* @__PURE__ */ struct({
  command: u32,
  arg0: u32,
  arg1: u32,
  payloadLength: u32,
  checksum: u32,
  magic: s32
}, { littleEndian: true });
function calculateChecksum(payload) {
  return payload.reduce((result, item) => result + item, 0);
}
class AdbPacketSerializeStream extends TransformStream {
  constructor() {
    const headerBuffer = new Uint8Array(AdbPacketHeader.size);
    super({
      transform: async (chunk, controller) => {
        await chunk.tryConsume(async (chunk2) => {
          const init = chunk2;
          init.payloadLength = init.payload.length;
          AdbPacketHeader.serialize(init, headerBuffer);
          await Consumable.ReadableStream.enqueue(controller, headerBuffer);
          if (init.payloadLength) {
            await Consumable.ReadableStream.enqueue(controller, init.payload);
          }
        });
      }
    });
  }
}
const AdbAuthType = {
  Token: 1,
  Signature: 2,
  PublicKey: 3
};
const AdbSignatureAuthenticator = async function* (credentialStore, getNextRequest) {
  for await (const key of credentialStore.iterateKeys()) {
    const packet = await getNextRequest();
    if (packet.arg0 !== AdbAuthType.Token) {
      return;
    }
    const signature = rsaSign(key.buffer, packet.payload);
    yield {
      command: AdbCommand.Auth,
      arg0: AdbAuthType.Signature,
      arg1: 0,
      payload: signature
    };
  }
};
const AdbPublicKeyAuthenticator = async function* (credentialStore, getNextRequest) {
  const packet = await getNextRequest();
  if (packet.arg0 !== AdbAuthType.Token) {
    return;
  }
  let privateKey;
  for await (const key of credentialStore.iterateKeys()) {
    privateKey = key;
    break;
  }
  if (!privateKey) {
    privateKey = await credentialStore.generateKey();
  }
  const publicKeyLength = adbGetPublicKeySize();
  const [publicKeyBase64Length] = calculateBase64EncodedLength(publicKeyLength);
  const nameBuffer = privateKey.name?.length ? /* @__PURE__ */ encodeUtf8(privateKey.name) : EmptyUint8Array;
  const publicKeyBuffer = new Uint8Array(publicKeyBase64Length + (nameBuffer.length ? nameBuffer.length + 1 : 0) + // Space character + name
  1);
  adbGeneratePublicKey(privateKey.buffer, publicKeyBuffer);
  encodeBase64(publicKeyBuffer.subarray(0, publicKeyLength), publicKeyBuffer);
  if (nameBuffer.length) {
    publicKeyBuffer[publicKeyBase64Length] = 32;
    publicKeyBuffer.set(nameBuffer, publicKeyBase64Length + 1);
  }
  yield {
    command: AdbCommand.Auth,
    arg0: AdbAuthType.PublicKey,
    arg1: 0,
    payload: publicKeyBuffer
  };
};
const ADB_DEFAULT_AUTHENTICATORS = [
  AdbSignatureAuthenticator,
  AdbPublicKeyAuthenticator
];
class AdbAuthenticationProcessor {
  authenticators;
  #credentialStore;
  #pendingRequest = new PromiseResolver();
  #iterator;
  constructor(authenticators, credentialStore) {
    this.authenticators = authenticators;
    this.#credentialStore = credentialStore;
  }
  #getNextRequest = () => {
    return this.#pendingRequest.promise;
  };
  async *#invokeAuthenticator() {
    for (const authenticator of this.authenticators) {
      for await (const packet of authenticator(this.#credentialStore, this.#getNextRequest)) {
        this.#pendingRequest = new PromiseResolver();
        yield packet;
      }
    }
  }
  async process(packet) {
    if (!this.#iterator) {
      this.#iterator = this.#invokeAuthenticator();
    }
    this.#pendingRequest.resolve(packet);
    const result = await this.#iterator.next();
    if (result.done) {
      throw new Error("No authenticator can handle the request");
    }
    return result.value;
  }
  dispose() {
    void this.#iterator?.return?.();
  }
}
class AdbDaemonSocketController {
  #dispatcher;
  localId;
  remoteId;
  localCreated;
  service;
  #readable;
  #readableController;
  get readable() {
    return this.#readable;
  }
  #writableController;
  writable;
  #closed = false;
  #closedPromise = new PromiseResolver();
  get closed() {
    return this.#closedPromise.promise;
  }
  #socket;
  get socket() {
    return this.#socket;
  }
  #availableWriteBytesChanged;
  /**
   * When delayed ack is disabled, returns `Infinity` if the socket is ready to write
   * (exactly one packet can be written no matter how large it is), or `-1` if the socket
   * is waiting for ack message.
   *
   * When delayed ack is enabled, returns a non-negative finite number indicates the number of
   * bytes that can be written to the socket before waiting for ack message.
   */
  #availableWriteBytes = 0;
  constructor(options) {
    this.#dispatcher = options.dispatcher;
    this.localId = options.localId;
    this.remoteId = options.remoteId;
    this.localCreated = options.localCreated;
    this.service = options.service;
    this.#readable = new PushReadableStream((controller) => {
      this.#readableController = controller;
    });
    this.writable = new MaybeConsumableWritableStream({
      start: (controller) => {
        this.#writableController = controller;
        controller.signal.addEventListener("abort", () => {
          this.#availableWriteBytesChanged?.reject(controller.signal.reason);
        });
      },
      write: async (data) => {
        const size = data.length;
        const chunkSize = this.#dispatcher.options.maxPayloadSize;
        for (let start = 0, end = chunkSize; start < size; start = end, end += chunkSize) {
          const chunk = data.subarray(start, end);
          await this.#writeChunk(chunk);
        }
      }
    });
    this.#socket = new AdbDaemonSocket(this);
    this.#availableWriteBytes = options.availableWriteBytes;
  }
  async #writeChunk(data) {
    const length = data.length;
    while (this.#availableWriteBytes < length) {
      const resolver = new PromiseResolver();
      this.#availableWriteBytesChanged = resolver;
      await resolver.promise;
    }
    if (this.#availableWriteBytes === Infinity) {
      this.#availableWriteBytes = -1;
    } else {
      this.#availableWriteBytes -= length;
    }
    await this.#dispatcher.sendPacket(AdbCommand.Write, this.localId, this.remoteId, data);
  }
  async enqueue(data) {
    await this.#readableController.enqueue(data);
  }
  ack(bytes) {
    this.#availableWriteBytes += bytes;
    this.#availableWriteBytesChanged?.resolve();
  }
  async close() {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    this.#availableWriteBytesChanged?.reject(new Error("Socket closed"));
    try {
      this.#writableController.error(new Error("Socket closed"));
    } catch {
    }
    await this.#dispatcher.sendPacket(AdbCommand.Close, this.localId, this.remoteId, EmptyUint8Array);
  }
  dispose() {
    this.#readableController.close();
    this.#closedPromise.resolve(void 0);
  }
}
class AdbDaemonSocket {
  #controller;
  get localId() {
    return this.#controller.localId;
  }
  get remoteId() {
    return this.#controller.remoteId;
  }
  get localCreated() {
    return this.#controller.localCreated;
  }
  get service() {
    return this.#controller.service;
  }
  get readable() {
    return this.#controller.readable;
  }
  get writable() {
    return this.#controller.writable;
  }
  get closed() {
    return this.#controller.closed;
  }
  constructor(controller) {
    this.#controller = controller;
  }
  close() {
    return this.#controller.close();
  }
}
class AdbPacketDispatcher {
  // ADB socket id starts from 1
  // (0 means open failed)
  #initializers = new AsyncOperationManager(1);
  /**
   * Socket local ID to the socket controller.
   */
  #sockets = /* @__PURE__ */ new Map();
  #writer;
  options;
  #closed = false;
  #disconnected = new PromiseResolver();
  get disconnected() {
    return this.#disconnected.promise;
  }
  #incomingSocketHandlers = /* @__PURE__ */ new Map();
  #readAbortController = new AbortController();
  constructor(connection, options) {
    this.options = options;
    if (this.options.initialDelayedAckBytes < 0) {
      this.options.initialDelayedAckBytes = 0;
    }
    connection.readable.pipeTo(new WritableStream({
      write: async (packet, controller) => {
        switch (packet.command) {
          case AdbCommand.Close:
            await this.#handleClose(packet);
            break;
          case AdbCommand.Okay:
            this.#handleOkay(packet);
            break;
          case AdbCommand.Open:
            await this.#handleOpen(packet);
            break;
          case AdbCommand.Write:
            this.#handleWrite(packet).catch((e2) => {
              controller.error(e2);
            });
            break;
          default:
            throw new Error(`Unknown command: ${packet.command.toString(16)}`);
        }
      }
    }), {
      preventCancel: options.preserveConnection ?? false,
      signal: this.#readAbortController.signal
    }).then(() => {
      this.#dispose();
    }, (e2) => {
      if (!this.#closed) {
        this.#disconnected.reject(e2);
      }
      this.#dispose();
    });
    this.#writer = connection.writable.getWriter();
  }
  async #handleClose(packet) {
    if (packet.arg0 === 0 && this.#initializers.reject(packet.arg1, new Error("Socket open failed"))) {
      return;
    }
    const socket2 = this.#sockets.get(packet.arg1);
    if (socket2) {
      await socket2.close();
      socket2.dispose();
      this.#sockets.delete(packet.arg1);
      return;
    }
  }
  #handleOkay(packet) {
    let ackBytes;
    if (this.options.initialDelayedAckBytes !== 0) {
      if (packet.payload.length !== 4) {
        throw new Error("Invalid OKAY packet. Payload size should be 4");
      }
      ackBytes = /* @__PURE__ */ getUint32LittleEndian(packet.payload, 0);
    } else {
      if (packet.payload.length !== 0) {
        throw new Error("Invalid OKAY packet. Payload size should be 0");
      }
      ackBytes = Infinity;
    }
    if (this.#initializers.resolve(packet.arg1, {
      remoteId: packet.arg0,
      availableWriteBytes: ackBytes
    })) {
      return;
    }
    const socket2 = this.#sockets.get(packet.arg1);
    if (socket2) {
      socket2.ack(ackBytes);
      return;
    }
    void this.sendPacket(AdbCommand.Close, packet.arg1, packet.arg0, EmptyUint8Array);
  }
  #sendOkay(localId, remoteId, ackBytes) {
    let payload;
    if (this.options.initialDelayedAckBytes !== 0) {
      payload = new Uint8Array(4);
      setUint32LittleEndian(payload, 0, ackBytes);
    } else {
      payload = EmptyUint8Array;
    }
    return this.sendPacket(AdbCommand.Okay, localId, remoteId, payload);
  }
  async #handleOpen(packet) {
    const [localId] = this.#initializers.add();
    this.#initializers.resolve(localId, void 0);
    const remoteId = packet.arg0;
    let availableWriteBytes = packet.arg1;
    let service = /* @__PURE__ */ decodeUtf8(packet.payload);
    if (service.endsWith("\0")) {
      service = service.substring(0, service.length - 1);
    }
    if (this.options.initialDelayedAckBytes === 0) {
      if (availableWriteBytes !== 0) {
        throw new Error("Invalid OPEN packet. arg1 should be 0");
      }
      availableWriteBytes = Infinity;
    } else {
      if (availableWriteBytes === 0) {
        throw new Error("Invalid OPEN packet. arg1 should be greater than 0");
      }
    }
    const handler = this.#incomingSocketHandlers.get(service);
    if (!handler) {
      await this.sendPacket(AdbCommand.Close, 0, remoteId, EmptyUint8Array);
      return;
    }
    const controller = new AdbDaemonSocketController({
      dispatcher: this,
      localId,
      remoteId,
      localCreated: false,
      service,
      availableWriteBytes
    });
    try {
      await handler(controller.socket);
      this.#sockets.set(localId, controller);
      await this.#sendOkay(localId, remoteId, this.options.initialDelayedAckBytes);
    } catch {
      await this.sendPacket(AdbCommand.Close, 0, remoteId, EmptyUint8Array);
    }
  }
  async #handleWrite(packet) {
    const socket2 = this.#sockets.get(packet.arg1);
    if (!socket2) {
      throw new Error(`Unknown local socket id: ${packet.arg1}`);
    }
    let handled = false;
    const promises = [
      (async () => {
        await socket2.enqueue(packet.payload);
        await this.#sendOkay(packet.arg1, packet.arg0, packet.payload.length);
        handled = true;
      })()
    ];
    if (this.options.readTimeLimit) {
      promises.push((async () => {
        await delay(this.options.readTimeLimit);
        if (!handled) {
          throw new Error(`readable of \`${socket2.service}\` has stalled for ${this.options.readTimeLimit} milliseconds`);
        }
      })());
    }
    await Promise.race(promises);
  }
  async createSocket(service) {
    if (this.options.appendNullToServiceString) {
      service += "\0";
    }
    const [localId, initializer] = this.#initializers.add();
    await this.sendPacket(AdbCommand.Open, localId, this.options.initialDelayedAckBytes, service);
    const { remoteId, availableWriteBytes } = await initializer;
    const controller = new AdbDaemonSocketController({
      dispatcher: this,
      localId,
      remoteId,
      localCreated: true,
      service,
      availableWriteBytes
    });
    this.#sockets.set(localId, controller);
    return controller.socket;
  }
  addReverseTunnel(service, handler) {
    this.#incomingSocketHandlers.set(service, handler);
  }
  removeReverseTunnel(address) {
    this.#incomingSocketHandlers.delete(address);
  }
  clearReverseTunnels() {
    this.#incomingSocketHandlers.clear();
  }
  async sendPacket(command, arg0, arg1, payload) {
    if (typeof payload === "string") {
      payload = /* @__PURE__ */ encodeUtf8(payload);
    }
    if (payload.length > this.options.maxPayloadSize) {
      throw new TypeError("payload too large");
    }
    await Consumable.WritableStream.write(this.#writer, {
      command,
      arg0,
      arg1,
      payload,
      checksum: this.options.calculateChecksum ? calculateChecksum(payload) : 0,
      magic: command ^ 4294967295
    });
  }
  async close() {
    await Promise.all(Array.from(this.#sockets.values(), (socket2) => socket2.close()));
    this.#closed = true;
    this.#readAbortController.abort();
    if (this.options.preserveConnection) {
      this.#writer.releaseLock();
    } else {
      await this.#writer.close();
    }
  }
  #dispose() {
    for (const socket2 of this.#sockets.values()) {
      socket2.dispose();
    }
    this.#disconnected.resolve();
  }
}
const ADB_DAEMON_VERSION_OMIT_CHECKSUM = 16777217;
const ADB_DAEMON_DEFAULT_FEATURES = /* @__PURE__ */ (() => [
  AdbFeature.ShellV2,
  AdbFeature.Cmd,
  AdbFeature.StatV2,
  AdbFeature.ListV2,
  AdbFeature.FixedPushMkdir,
  "apex",
  AdbFeature.Abb,
  // only tells the client the symlink timestamp issue in `adb push --sync` has been fixed.
  // No special handling required.
  "fixed_push_symlink_timestamp",
  AdbFeature.AbbExec,
  "remount_shell",
  "track_app",
  AdbFeature.SendReceiveV2,
  "sendrecv_v2_brotli",
  "sendrecv_v2_lz4",
  "sendrecv_v2_zstd",
  "sendrecv_v2_dry_run_send",
  AdbFeature.DelayedAck
])();
const ADB_DAEMON_DEFAULT_INITIAL_PAYLOAD_SIZE = 32 * 1024 * 1024;
class AdbDaemonTransport {
  /**
   * Authenticate with the ADB Daemon and create a new transport.
   */
  static async authenticate({ serial, connection, credentialStore, authenticators = ADB_DEFAULT_AUTHENTICATORS, features = ADB_DAEMON_DEFAULT_FEATURES, initialDelayedAckBytes = ADB_DAEMON_DEFAULT_INITIAL_PAYLOAD_SIZE, ...options }) {
    let version = 16777217;
    let maxPayloadSize = 1024 * 1024;
    const resolver = new PromiseResolver();
    const authProcessor = new AdbAuthenticationProcessor(authenticators, credentialStore);
    const abortController = new AbortController();
    const pipe = connection.readable.pipeTo(new WritableStream({
      async write(packet) {
        switch (packet.command) {
          case AdbCommand.Connect:
            version = Math.min(version, packet.arg0);
            maxPayloadSize = Math.min(maxPayloadSize, packet.arg1);
            resolver.resolve(/* @__PURE__ */ decodeUtf8(packet.payload));
            break;
          case AdbCommand.Auth: {
            const response = await authProcessor.process(packet);
            await sendPacket(response);
            break;
          }
        }
      }
    }), {
      // Don't cancel the source ReadableStream on AbortSignal abort.
      preventCancel: true,
      signal: abortController.signal
    }).then(() => {
      resolver.reject(new Error("Connection closed unexpectedly"));
    }, (e2) => {
      resolver.reject(e2);
    });
    const writer = connection.writable.getWriter();
    async function sendPacket(init) {
      init.checksum = calculateChecksum(init.payload);
      init.magic = init.command ^ 4294967295;
      await Consumable.WritableStream.write(writer, init);
    }
    const actualFeatures = features.slice();
    if (initialDelayedAckBytes <= 0) {
      const index = features.indexOf(AdbFeature.DelayedAck);
      if (index !== -1) {
        actualFeatures.splice(index, 1);
      }
    }
    let banner;
    try {
      await sendPacket({
        command: AdbCommand.Connect,
        arg0: version,
        arg1: maxPayloadSize,
        // The terminating `;` is required in formal definition
        // But ADB daemon (all versions) can still work without it
        payload: /* @__PURE__ */ encodeUtf8(`host::features=${actualFeatures.join(",")}`)
      });
      banner = await resolver.promise;
    } finally {
      abortController.abort();
      writer.releaseLock();
      await pipe;
    }
    return new AdbDaemonTransport({
      serial,
      connection,
      version,
      maxPayloadSize,
      banner,
      features: actualFeatures,
      initialDelayedAckBytes,
      ...options
    });
  }
  #connection;
  get connection() {
    return this.#connection;
  }
  #dispatcher;
  #serial;
  get serial() {
    return this.#serial;
  }
  #protocolVersion;
  get protocolVersion() {
    return this.#protocolVersion;
  }
  get maxPayloadSize() {
    return this.#dispatcher.options.maxPayloadSize;
  }
  #banner;
  get banner() {
    return this.#banner;
  }
  get disconnected() {
    return this.#dispatcher.disconnected;
  }
  #clientFeatures;
  get clientFeatures() {
    return this.#clientFeatures;
  }
  constructor({ serial, connection, version, banner, features = ADB_DAEMON_DEFAULT_FEATURES, initialDelayedAckBytes, ...options }) {
    this.#serial = serial;
    this.#connection = connection;
    this.#banner = AdbBanner.parse(banner);
    this.#clientFeatures = features;
    if (features.includes(AdbFeature.DelayedAck)) {
      if (initialDelayedAckBytes <= 0) {
        throw new TypeError("`initialDelayedAckBytes` must be greater than 0 when DelayedAck feature is enabled.");
      }
      if (!this.#banner.features.includes(AdbFeature.DelayedAck)) {
        initialDelayedAckBytes = 0;
      }
    } else {
      initialDelayedAckBytes = 0;
    }
    let calculateChecksum2;
    let appendNullToServiceString;
    if (version >= ADB_DAEMON_VERSION_OMIT_CHECKSUM) {
      calculateChecksum2 = false;
      appendNullToServiceString = false;
    } else {
      calculateChecksum2 = true;
      appendNullToServiceString = true;
    }
    this.#dispatcher = new AdbPacketDispatcher(connection, {
      calculateChecksum: calculateChecksum2,
      appendNullToServiceString,
      initialDelayedAckBytes,
      ...options
    });
    this.#protocolVersion = version;
  }
  connect(service) {
    return this.#dispatcher.createSocket(service);
  }
  addReverseTunnel(handler, address) {
    if (!address) {
      const id = Math.random().toString().substring(2);
      address = `localabstract:reverse_${id}`;
    }
    this.#dispatcher.addReverseTunnel(address, handler);
    return address;
  }
  removeReverseTunnel(address) {
    this.#dispatcher.removeReverseTunnel(address);
  }
  clearReverseTunnels() {
    this.#dispatcher.clearReverseTunnels();
  }
  close() {
    return this.#dispatcher.close();
  }
}
function unorderedRemove(array, index) {
  if (index < 0 || index >= array.length) {
    return;
  }
  array[index] = array[array.length - 1];
  array.length -= 1;
}
class DeviceBusyError extends Error {
  constructor(cause) {
    super("The device is already in used by another program", {
      cause
    });
  }
}
function isErrorName(e2, name) {
  return typeof e2 === "object" && e2 !== null && "name" in e2 && e2.name === name;
}
function isUsbInterfaceFilter(filter) {
  return filter.classCode !== void 0 && filter.subclassCode !== void 0 && filter.protocolCode !== void 0;
}
function matchUsbInterfaceFilter(alternate, filter) {
  return alternate.interfaceClass === filter.classCode && alternate.interfaceSubclass === filter.subclassCode && alternate.interfaceProtocol === filter.protocolCode;
}
function findUsbInterface(device2, filter) {
  for (const configuration of device2.configurations) {
    for (const interface_ of configuration.interfaces) {
      for (const alternate of interface_.alternates) {
        if (matchUsbInterfaceFilter(alternate, filter)) {
          return { configuration, interface_, alternate };
        }
      }
    }
  }
  return void 0;
}
function padNumber(value) {
  return value.toString(16).padStart(4, "0");
}
function getSerialNumber(device2) {
  if (device2.serialNumber) {
    return device2.serialNumber;
  }
  return padNumber(device2.vendorId) + "x" + padNumber(device2.productId);
}
function findUsbEndpoints(endpoints) {
  if (endpoints.length === 0) {
    throw new TypeError("No endpoints given");
  }
  let inEndpoint;
  let outEndpoint;
  for (const endpoint of endpoints) {
    switch (endpoint.direction) {
      case "in":
        inEndpoint = endpoint;
        if (outEndpoint) {
          return { inEndpoint, outEndpoint };
        }
        break;
      case "out":
        outEndpoint = endpoint;
        if (inEndpoint) {
          return { inEndpoint, outEndpoint };
        }
        break;
    }
  }
  if (!inEndpoint) {
    throw new TypeError("No input endpoint found.");
  }
  if (!outEndpoint) {
    throw new TypeError("No output endpoint found.");
  }
  throw new Error("unreachable");
}
function matchFilter(device2, filter) {
  if (filter.vendorId !== void 0 && device2.vendorId !== filter.vendorId) {
    return false;
  }
  if (filter.productId !== void 0 && device2.productId !== filter.productId) {
    return false;
  }
  if (filter.serialNumber !== void 0 && getSerialNumber(device2) !== filter.serialNumber) {
    return false;
  }
  if (isUsbInterfaceFilter(filter)) {
    return findUsbInterface(device2, filter) || false;
  }
  return true;
}
function matchFilters(device2, filters, exclusionFilters) {
  if (exclusionFilters && exclusionFilters.length > 0) {
    if (matchFilters(device2, exclusionFilters)) {
      return false;
    }
  }
  for (const filter of filters) {
    const result = matchFilter(device2, filter);
    if (result) {
      return result;
    }
  }
  return false;
}
const AdbDefaultInterfaceFilter = {
  classCode: 255,
  subclassCode: 66,
  protocolCode: 1
};
function mergeDefaultAdbInterfaceFilter(filters) {
  if (!filters || filters.length === 0) {
    return [AdbDefaultInterfaceFilter];
  } else {
    return filters.map((filter) => ({
      ...filter,
      classCode: filter.classCode ?? AdbDefaultInterfaceFilter.classCode,
      subclassCode: filter.subclassCode ?? AdbDefaultInterfaceFilter.subclassCode,
      protocolCode: filter.protocolCode ?? AdbDefaultInterfaceFilter.protocolCode
    }));
  }
}
class AdbDaemonWebUsbConnection {
  #device;
  get device() {
    return this.#device;
  }
  #inEndpoint;
  get inEndpoint() {
    return this.#inEndpoint;
  }
  #outEndpoint;
  get outEndpoint() {
    return this.#outEndpoint;
  }
  #readable;
  get readable() {
    return this.#readable;
  }
  #writable;
  get writable() {
    return this.#writable;
  }
  constructor(device2, inEndpoint, outEndpoint, usbManager) {
    this.#device = device2;
    this.#inEndpoint = inEndpoint;
    this.#outEndpoint = outEndpoint;
    let closed2 = false;
    const duplex = new DuplexStreamFactory({
      close: async () => {
        try {
          closed2 = true;
          await device2.raw.close();
        } catch {
        }
      },
      dispose: () => {
        closed2 = true;
        usbManager.removeEventListener("disconnect", handleUsbDisconnect);
      }
    });
    function handleUsbDisconnect(e2) {
      if (e2.device === device2.raw) {
        duplex.dispose().catch(unreachable);
      }
    }
    usbManager.addEventListener("disconnect", handleUsbDisconnect);
    this.#readable = duplex.wrapReadable(new ReadableStream({
      pull: async (controller) => {
        const packet = await this.#transferIn();
        if (packet) {
          controller.enqueue(packet);
        } else {
          controller.close();
        }
      }
    }, { highWaterMark: 0 }));
    const zeroMask = outEndpoint.packetSize - 1;
    this.#writable = pipeFrom(duplex.createWritable(new MaybeConsumableWritableStream({
      write: async (chunk) => {
        try {
          await device2.raw.transferOut(outEndpoint.endpointNumber, toLocalUint8Array(chunk));
          if (zeroMask && (chunk.length & zeroMask) === 0) {
            await device2.raw.transferOut(outEndpoint.endpointNumber, EmptyUint8Array);
          }
        } catch (e2) {
          if (closed2) {
            return;
          }
          throw e2;
        }
      }
    })), new AdbPacketSerializeStream());
  }
  async #transferIn() {
    try {
      while (true) {
        const result = await this.#device.raw.transferIn(this.#inEndpoint.endpointNumber, this.#inEndpoint.packetSize);
        if (result.data.byteLength !== 24) {
          continue;
        }
        const buffer2 = new Uint8Array(result.data.buffer);
        const stream = new Uint8ArrayExactReadable(buffer2);
        const packet = AdbPacketHeader.deserialize(stream);
        if (packet.magic !== (packet.command ^ 4294967295)) {
          continue;
        }
        if (packet.payloadLength !== 0) {
          const result2 = await this.#device.raw.transferIn(this.#inEndpoint.endpointNumber, packet.payloadLength);
          packet.payload = new Uint8Array(result2.data.buffer);
        } else {
          packet.payload = EmptyUint8Array;
        }
        return packet;
      }
    } catch (e2) {
      if (isErrorName(e2, "NetworkError")) {
        await new Promise((resolve) => {
          setTimeout(() => {
            resolve();
          }, 100);
        });
        if (closed) {
          return void 0;
        }
      }
      throw e2;
    }
  }
}
class AdbDaemonWebUsbDevice {
  static DeviceBusyError = DeviceBusyError;
  #interface;
  #usbManager;
  #raw;
  get raw() {
    return this.#raw;
  }
  #serial;
  get serial() {
    return this.#serial;
  }
  get name() {
    return this.#raw.productName;
  }
  /**
   * Create a new instance of `AdbDaemonWebUsbConnection` using a specified `USBDevice` instance
   *
   * @param device The `USBDevice` instance obtained elsewhere.
   * @param filters The filters to use when searching for ADB interface. Defaults to {@link ADB_DEFAULT_DEVICE_FILTER}.
   */
  constructor(device2, interface_, usbManager) {
    this.#raw = device2;
    this.#serial = getSerialNumber(device2);
    this.#interface = interface_;
    this.#usbManager = usbManager;
  }
  async #claimInterface() {
    if (!this.#raw.opened) {
      await this.#raw.open();
    }
    const { configuration, interface_, alternate } = this.#interface;
    if (this.#raw.configuration?.configurationValue !== configuration.configurationValue) {
      await this.#raw.selectConfiguration(configuration.configurationValue);
    }
    if (!interface_.claimed) {
      try {
        await this.#raw.claimInterface(interface_.interfaceNumber);
      } catch (e2) {
        if (isErrorName(e2, "NetworkError")) {
          throw new AdbDaemonWebUsbDevice.DeviceBusyError(e2);
        }
        throw e2;
      }
    }
    if (interface_.alternate.alternateSetting !== alternate.alternateSetting) {
      await this.#raw.selectAlternateInterface(interface_.interfaceNumber, alternate.alternateSetting);
    }
    return findUsbEndpoints(alternate.endpoints);
  }
  /**
   * Open the device and create a new connection to the ADB Daemon.
   */
  async connect() {
    const { inEndpoint, outEndpoint } = await this.#claimInterface();
    return new AdbDaemonWebUsbConnection(this, inEndpoint, outEndpoint, this.#usbManager);
  }
}
class AdbDaemonWebUsbDeviceObserver {
  static async create(usb, options = {}) {
    const devices = await usb.getDevices();
    return new AdbDaemonWebUsbDeviceObserver(usb, devices, options);
  }
  #filters;
  #exclusionFilters;
  #usbManager;
  #onDeviceAdd = new EventEmitter();
  onDeviceAdd = this.#onDeviceAdd.event;
  #onDeviceRemove = new EventEmitter();
  onDeviceRemove = this.#onDeviceRemove.event;
  #onListChange = new StickyEventEmitter();
  onListChange = this.#onListChange.event;
  current = [];
  constructor(usb, initial, options = {}) {
    this.#filters = mergeDefaultAdbInterfaceFilter(options.filters);
    this.#exclusionFilters = options.exclusionFilters;
    this.#usbManager = usb;
    this.current = initial.map((device2) => this.#convertDevice(device2)).filter((device2) => !!device2);
    this.#onListChange.fire(this.current);
    this.#usbManager.addEventListener("connect", this.#handleConnect);
    this.#usbManager.addEventListener("disconnect", this.#handleDisconnect);
  }
  #convertDevice(device2) {
    const interface_ = matchFilters(device2, this.#filters, this.#exclusionFilters);
    if (!interface_) {
      return void 0;
    }
    return new AdbDaemonWebUsbDevice(device2, interface_, this.#usbManager);
  }
  #handleConnect = (e2) => {
    const device2 = this.#convertDevice(e2.device);
    if (!device2) {
      return;
    }
    if (this.current.some((item) => item.raw === device2.raw)) {
      return;
    }
    const next = this.current.slice();
    next.push(device2);
    this.current = next;
    this.#onDeviceAdd.fire([device2]);
    this.#onListChange.fire(this.current);
  };
  #handleDisconnect = (e2) => {
    const index = this.current.findIndex((device2) => device2.raw === e2.device);
    if (index !== -1) {
      const device2 = this.current[index];
      const next = this.current.slice();
      unorderedRemove(next, index);
      this.current = next;
      this.#onDeviceRemove.fire([device2]);
      this.#onListChange.fire(this.current);
    }
  };
  stop() {
    this.#usbManager.removeEventListener("connect", this.#handleConnect);
    this.#usbManager.removeEventListener("disconnect", this.#handleDisconnect);
    this.#onDeviceAdd.dispose();
    this.#onDeviceRemove.dispose();
    this.#onListChange.dispose();
  }
}
class AdbDaemonWebUsbDeviceManager {
  /**
   * Gets the instance of {@link AdbDaemonWebUsbDeviceManager} using browser WebUSB implementation.
   *
   * May be `undefined` if current runtime does not support WebUSB.
   */
  static BROWSER = /* @__PURE__ */ (() => typeof globalThis.navigator !== "undefined" && globalThis.navigator.usb ? new AdbDaemonWebUsbDeviceManager(globalThis.navigator.usb) : void 0)();
  #usbManager;
  /**
   * Create a new instance of {@link AdbDaemonWebUsbDeviceManager} using the specified WebUSB implementation.
   * @param usbManager A WebUSB compatible interface.
   */
  constructor(usbManager) {
    this.#usbManager = usbManager;
  }
  /**
   * Call `USB#requestDevice()` to prompt the user to select a device.
   */
  async requestDevice(options = {}) {
    const filters = mergeDefaultAdbInterfaceFilter(options.filters);
    try {
      const device2 = await this.#usbManager.requestDevice({
        filters,
        exclusionFilters: options.exclusionFilters
      });
      const interface_ = matchFilters(device2, filters, options.exclusionFilters);
      if (!interface_) {
        return void 0;
      }
      this.#usbManager.dispatchEvent(new USBConnectionEvent("connect", { device: device2 }));
      return new AdbDaemonWebUsbDevice(device2, interface_, this.#usbManager);
    } catch (e2) {
      if (isErrorName(e2, "NotFoundError")) {
        return void 0;
      }
      throw e2;
    }
  }
  /**
   * Get all connected and requested devices that match the specified filters.
   */
  async getDevices(options = {}) {
    const filters = mergeDefaultAdbInterfaceFilter(options.filters);
    const devices = await this.#usbManager.getDevices();
    const result = [];
    for (const device2 of devices) {
      const interface_ = matchFilters(device2, filters, options.exclusionFilters);
      if (interface_) {
        result.push(new AdbDaemonWebUsbDevice(device2, interface_, this.#usbManager));
      }
    }
    return result;
  }
  trackDevices(options = {}) {
    return AdbDaemonWebUsbDeviceObserver.create(this.#usbManager, options);
  }
}
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("Tango", 1);
    request.onerror = () => {
      reject(request.error);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("Authentication", { autoIncrement: true });
    };
    request.onsuccess = () => {
      const db = request.result;
      resolve(db);
    };
  });
}
async function saveKey(key) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("Authentication", "readwrite");
    const store = transaction.objectStore("Authentication");
    const putRequest = store.add(key);
    putRequest.onerror = () => {
      reject(putRequest.error);
    };
    putRequest.onsuccess = () => {
      resolve();
    };
    transaction.onerror = () => {
      reject(transaction.error);
    };
    transaction.oncomplete = () => {
      db.close();
    };
  });
}
async function getAllKeys() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("Authentication", "readonly");
    const store = transaction.objectStore("Authentication");
    const getRequest = store.getAll();
    getRequest.onerror = () => {
      reject(getRequest.error);
    };
    getRequest.onsuccess = () => {
      resolve(getRequest.result);
    };
    transaction.onerror = () => {
      reject(transaction.error);
    };
    transaction.oncomplete = () => {
      db.close();
    };
  });
}
class AdbWebCredentialStore {
  #appName;
  constructor(appName = "Tango") {
    this.#appName = appName;
  }
  /**
   * Generates a RSA private key and store it into LocalStorage.
   *
   * Calling this method multiple times will overwrite the previous key.
   *
   * @returns The private key in PKCS #8 format.
   */
  async generateKey() {
    const { privateKey: cryptoKey } = await crypto.subtle.generateKey({
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      // 65537
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-1"
    }, true, ["sign", "verify"]);
    const privateKey = new Uint8Array(await crypto.subtle.exportKey("pkcs8", cryptoKey));
    await saveKey(privateKey);
    return {
      buffer: privateKey,
      name: `${this.#appName}@${globalThis.location.hostname}`
    };
  }
  /**
   * Yields the stored RSA private key.
   *
   * This method returns a generator, so `for await...of...` loop should be used to read the key.
   */
  async *iterateKeys() {
    for (const key of await getAllKeys()) {
      yield {
        buffer: key,
        name: `${this.#appName}@${globalThis.location.hostname}`
      };
    }
  }
}
function TabletScreen({ refreshMs = 1e3 }) {
  const [connected, setConnected] = reactExports.useState(false);
  const [statusText, setStatusText] = reactExports.useState("Sin conectar");
  const [imgUrl, setImgUrl] = reactExports.useState(null);
  const adbRef = reactExports.useRef(null);
  const intervalRef = reactExports.useRef(null);
  const lastUrlRef = reactExports.useRef(null);
  const handdlerConnect = async () => {
    try {
      setStatusText("Solicitando dispositivo...");
      const manager = AdbDaemonWebUsbDeviceManager.BROWSER;
      if (!manager) return setStatusText("Este navegador no soporta WebUSB (usa Chrome/Edge)");
      const device2 = await manager.requestDevice();
      if (!device2) return setStatusText("No se seleccionó ningún dispositivo");
      const connection = await device2.connect();
      setStatusText("Autorizando... acepta el aviso en la tablet");
      const transport = await AdbDaemonTransport.authenticate({
        serial: device2.serial,
        connection,
        credentialStore: new AdbWebCredentialStore()
      });
      adbRef.current = new Adb(transport);
      setConnected(true);
      setStatusText("Conectado");
    } catch (error) {
      console.log(error);
      setStatusText("Error: " + error.message);
    }
  };
  const handdlerDisconnect = async () => {
    try {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (adbRef.current) await adbRef.current.close();
    } catch (error) {
      console.log(error);
    } finally {
      adbRef.current = null;
      setConnected(false);
      setImgUrl(null);
      setStatusText("Sin conectar");
    }
  };
  const capturarPantalla = async () => {
    try {
      if (!adbRef.current) return;
      const png = await adbRef.current.subprocess.noneProtocol.spawnWait(["screencap", "-p"]);
      const blob = new Blob([png], { type: "image/png" });
      const url = URL.createObjectURL(blob);
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      lastUrlRef.current = url;
      setImgUrl(url);
    } catch (error) {
      console.log(error);
    }
  };
  reactExports.useEffect(() => {
    if (!connected) return;
    capturarPantalla();
    intervalRef.current = setInterval(capturarPantalla, refreshMs);
    return () => clearInterval(intervalRef.current);
  }, [connected, refreshMs]);
  reactExports.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (lastUrlRef.current) URL.revokeObjectURL(lastUrlRef.current);
      if (adbRef.current) adbRef.current.close();
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-[60px] right-[20px] z-[1000] resize overflow-auto w-[320px] h-[520px] min-w-[220px] min-h-[300px] rounded-xl border border-[#0a3a66] bg-[#01122c] shadow-[0_0_40px_rgba(0,120,255,0.15)]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-2 bg-[#021a38] border-b border-[#0a3a66]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold uppercase tracking-[0.6px] text-[#5e7ba0] truncate", children: statusText }),
      !connected ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-[#066ca8] hover:bg-[#0890c0]", onClick: handdlerConnect, children: "Conectar" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-2.5 py-1 rounded-md text-[11px] font-bold text-white bg-[#7a1f2b] hover:bg-[#9a2533]", onClick: handdlerDisconnect, children: "Desconectar" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-[calc(100%-44px)] flex items-center justify-center", children: imgUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "w-full h-full object-contain", src: imgUrl, alt: "pantalla tablet", draggable: false }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] text-[#33486a] px-4 text-center", children: "Conecta la tablet para ver su pantalla" }) })
  ] });
}
function Main({ value, selectNovelty, awaitWindow, boxModal, menu }) {
  useSelector((store) => store.establishment);
  const [typeDelay, setTypeDelay] = reactExports.useState({ data: null, type: "" });
  reactExports.useEffect(() => {
    if (isTablet_1 && document.documentElement?.requestFullscreen) {
      document.documentElement.requestFullscreen().then(() => {
        if (screen?.orientation) {
          screen.orientation.lock("portrait").then(() => {
          }).catch((error) => console.error(error));
        }
      }).catch((error) => {
        console.log(error);
      });
    }
  }, []);
  const changeStateForm = (type, data) => {
    setTypeDelay({ type, data });
  };
  if (!menu) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "main-content", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full h-[100%] min-h-0 overflow-auto rounded-xl border border-[#0a3a66]/60 bg-[#01122c]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-0 h-[45px] bg-[#021a38] flex w-full items-center justify-around", children: ["Mesa", "Ocupa", "Primera atención", "Demora", "Desocupa", "Limpieza", "Demora"].map((text) => {
        return /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperCell, { classStyles: "h-full uppercase tracking-[0.6px] font-semibold text-[#5e7ba0] bg-[#021a38]", children: text }, text);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, { setDelay: changeStateForm }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(RotationLine, {})
    ] }),
    typeDelay.type === "1raAttention" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed right-0 w-[50%]  p-[52px_0_0_0] top-0 h-[100%]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      DivAttention,
      {
        titlesJson: menu.filter((menu2) => menu2.category === "delay")[0],
        awaitWindow,
        boxModal,
        reset: selectNovelty,
        title: menu.filter((menu2) => menu2.category === "delay")[0],
        data: typeDelay?.data
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TabletScreen, {})
  ] }) });
}
function RotationLine({ setDelay }) {
  const [tableNumber, setTableNumber] = reactExports.useState("");
  const [customerSeatedTime, setCustomerSeatedTime] = reactExports.useState("");
  const [firtAtenttionTime, setFirtAttentionTime] = reactExports.useState("");
  const timeLimit = "00:03:00";
  const totalTime = reactExports.useMemo(() => getTimeReport(customerSeatedTime, firtAtenttionTime, timeLimit), [customerSeatedTime, firtAtenttionTime]);
  const timeWhitTouch = customerSeatedTime === "" && firtAtenttionTime === "";
  const handdlerChengeTable = (e2) => {
    setTableNumber(e2.target.value);
  };
  const handdlerDelay1raAttention = () => {
    if (tableNumber === "") return alert("Indique el número de mesa");
    setDelay("1raAttention", { tableNumber, customerSeatedTime, firtAtenttionTime });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full items-center justify-around bg-[#0e1223] transition-colors hover:bg-[#10203c]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperCell, { classStyles: "font-semibold", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        className: "w-full h-full text-center",
        type: "text",
        value: tableNumber,
        onChange: handdlerChengeTable
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperCell, { classStyles: "text-[#aecbf0]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      WrapperText,
      {
        value: customerSeatedTime,
        updateValue: (value) => setCustomerSeatedTime(value)
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperCell, { classStyles: "text-[#aecbf0]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      WrapperText,
      {
        value: firtAtenttionTime,
        updateValue: (value) => setFirtAttentionTime(value)
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(WrapperCell, { classStyles: "text-[#39ff14] font-semibold relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        WrapperText,
        {
          classStyles: timeWhitTouch ? "text-[#33486a]" : totalTime.exceeded ? "text-[red]" : "text-lime-500",
          value: timeWhitTouch ? "00:00:00" : totalTime.timeTotal
        }
      ),
      totalTime.exceeded && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "absolute w-[60px] right-[0px]", onClick: handdlerDelay1raAttention, children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "w-full h-full", src: "/ico/icons8-delay-64.png", alt: "ico-delay" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperCell, { classStyles: "text-[#33486a]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperText, { value: "00:00:00" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperCell, { classStyles: "text-[#33486a]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperText, { value: "00:00:00" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperCell, { classStyles: "text-[#33486a]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WrapperText, { value: "00:00:00" }) })
  ] });
}
function WrapperCell({ classStyles = "", children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `cursor-pointer flex-1 h-7 flex items-center justify-center text-[12px] border-b border-b-[#0a3a66]/25 text-center leading-[1.15] border-r border-r-[#0a3a66]/25 ${classStyles}`, children });
}
function WrapperText({ classStyles = "", value, updateValue }) {
  const [modeEdit, setModeEdit] = reactExports.useState(false);
  const handdlerClick = () => {
    if (typeof updateValue === "function") updateValue(getBiteDAte());
  };
  const haddlerOnDoubleClick = () => {
    if (!modeEdit) setModeEdit(true);
  };
  if (modeEdit) return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      className: "w-full h-full text-center",
      type: "text",
      name: "impút",
      value,
      onChange: (e2) => {
        console.log(e2.target.value);
        updateValue(e2.target.value);
      }
    }
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "w-full h-full flex items-center justify-center",
      onClick: handdlerClick,
      onDoubleClick: haddlerOnDoubleClick,
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: `tracking-[0.3px] font-mono tabular-nums ${classStyles}`, children: value === "" ? "-" : value })
    }
  );
}
function getBiteDAte() {
  const ahora = /* @__PURE__ */ new Date();
  const pad = (n2) => String(n2).padStart(2, "0");
  return `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}:${pad(ahora.getSeconds())}`;
}
const getMessageForChat = ({ page, limit }) => {
  return new Promise((resolve, reject) => {
    axiosInstance.get(`${IP}/chat?page=${page ?? 0}&limit=${limit}`).then((response) => resolve(response)).catch((error) => reject(error));
  });
};
const setMessageForChat = (body) => {
  return new Promise((resolve, reject) => {
    axiosInstance.post(`${IP}/chat`, body).then((response) => resolve(response)).catch((error) => reject(error));
  });
};
function Chat() {
  if (!isDesktop_1) return null;
  const userSeled = useSelector((state) => state.user);
  const [chatState, setChatState] = reactExports.useState([]);
  const [hiddenWindowState, setWindowState] = reactExports.useState(false);
  const inputRef = reactExports.useRef(null);
  const establishment2 = useSelector((store) => store.establishment);
  const refPaginate = reactExports.useRef(0);
  reactExports.useEffect(() => {
    getChat(refPaginate.current);
  }, []);
  reactExports.useEffect(() => {
    let key = true;
    const recibeData = (message) => {
      if (key) {
        console.log(message);
        setChatState([message, ...chatState]);
        setWindowState(true);
      }
    };
    socketAppManager.on("receive_message", recibeData);
    return () => {
      socketAppManager.off("receive_message", recibeData);
      key = false;
    };
  }, [chatState]);
  const getChat = reactExports.useCallback((numberPge) => {
    getMessageForChat({ page: numberPge, limit: 10 }).then((response) => {
      setChatState([...chatState, ...response.data.result]);
    }).catch((error) => {
      console.log(error);
    });
  }, [chatState]);
  const printText = (message) => {
    const newDate = new Date(message.date);
    const options = {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    const readableDate = newDate.toLocaleDateString("es-ES", options);
    const isMe = message.submittedByUser?.userId === userSeled?._id;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: isMe ? "msm-contain myText" : "msm-contain", children: [
      !isMe && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "msm-name", children: [
        message?.submittedByUser?.name?.toLowerCase(),
        message?.establishment?.name ? ` · ${message.establishment.name.toLowerCase()}` : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "msm-body", children: message.message }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "msm-time", children: readableDate })
    ] }, message._id);
  };
  const handdlerSubmit = (e2) => {
    e2.preventDefault();
    if (inputRef.current.value === "") return null;
    setMessageForChat({
      message: inputRef.current.value.trim(),
      establishment: {
        name: establishment2.name,
        establishmentId: establishment2._id
      }
    }).then((response) => {
      const text = `_*${userSeled?.name} ${userSeled?.surName} ha escrito:*_
${inputRef.current.value}${establishment2 ? `
*en: ${establishment2.name}*` : ""}`;
      axios.post("https://72.68.60.254:4000/bot/imgV2/number=120363370695210667@g.us", { "my-text": text }).then((response2) => {
        console.log(response2);
      }).catch((error) => {
        console.log(error);
      });
      inputRef.current.value = "";
    }).catch((error) => {
      console.log(error);
    });
  };
  return isDesktop_1 ? /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chat-component", children: userSeled?._id !== "65a9620cf47d628f65772149" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chat-chatContain", style: { overflow: hiddenWindowState ? "inherit" : "hidden" }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chat-boxText", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chat-boxText-header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chat-header-avatar", children: "💬" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "chat-header-info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "chat-header-name", children: "Chat Jarvis" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "chat-header-status", children: "en línea" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-chat", children: chatState.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        chatState.map((data) => printText(data)),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "chat-load-more",
            onClick: () => getChat(refPaginate.current + 1),
            children: "Ver mensajes anteriores"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chat-await", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "chat-await-p", children: "Sin mensajes aún…" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { className: "textContain", onSubmit: handdlerSubmit, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            className: "textContain-textArea",
            type: "text",
            placeholder: "Escribe un mensaje…",
            disabled: userSeled?._id === "65a9620cf47d628f65772149",
            ref: inputRef
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "textContain-btn", type: "submit", title: "Enviar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "chat-banner", onClick: () => setWindowState(!hiddenWindowState), children: "Chat Jarvis activo" })
  ] }) : null }) }) : null;
}
function Await({ config, close }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: config.open ? "awaitContain" : "hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "textAwait", children: config.text }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "lds-roller", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", {})
    ] })
  ] }) });
}
const imgDefault = "" + new URL("default-BQvI8fwW.png", import.meta.url).href;
function ListNovelties({ open }) {
  const useNoveltie = useSaveNoveltie();
  let [list, setList] = reactExports.useState([]);
  reactExports.useEffect(() => {
    setList(list = useNoveltie.getList());
  }, [open]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: open ? "listConponent scroll" : "listConponent scroll close", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "listConponent-ul", children: list.length > 0 ? list.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: "listConponent-li", children: item.titleNoveltie }, `${index}`)) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { color: "#fff" }, children: "sin reportar aun" }) }) }) });
}
const ListNovelties$1 = reactExports.memo(ListNovelties);
function NavBar({ clearLocal, openCloseSidebar, boxModal }) {
  const navigate = useNavigate();
  const [openList, setOpenList] = reactExports.useState(false);
  useSelector((state) => state.user);
  const dispatch = useDispatch();
  reactExports.useEffect(() => {
    const closeSession = () => {
      {
        boxModal.open("Aviso", "El administrador ha decidido que esta sessión ha caducado");
        closeSesscion();
      }
    };
    const resetApp = () => {
      {
        location.reload();
      }
    };
    socket.on("close-session-express", closeSession);
    socket.on("reset-session-express", resetApp);
    return () => {
      socket.off("close-session-express", closeSession);
      socket.off("reset-session-express", resetApp);
    };
  }, []);
  const closeSesscion = () => {
    axios.get(`${URL$2}/auth/logout`).then((response) => {
      if (response.status === 200) {
        dispatch(setUser({}));
        if (window.location.hostname !== "localhost") {
          dispatch(desconnectIo());
        }
        dispatch(setUser(null));
        sessionStorage.removeItem("session");
        localStorage.removeItem("local_appExpress");
        navigate("/");
      }
    }).catch((err) => {
      console.log(err);
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "nav-bar", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "nav-bar__left", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "nav-bar__toggle", onClick: openCloseSidebar, title: "Menú", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "6", x2: "21", y2: "6" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "12", x2: "21", y2: "12" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "18", x2: "21", y2: "18" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "nav-bar__brand", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "nav-bar__app-name", children: "JarvisExpress" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "nav-bar__actions", children: [
      !isMobile_1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "nav-bar__action-btn", onClick: () => navigate("/ModalData"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "5", width: "20", height: "14", rx: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "2", y1: "10", x2: "22", y2: "10" })
          ] }),
          "Mis bonos"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "nav-bar__action-btn", onClick: () => setOpenList(!openList), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "14 2 14 8 20 8" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" })
          ] }),
          "Mis novedades"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "nav-bar__action-btn nav-bar__action-btn--logout",
          onClick: closeSesscion,
          title: "Cerrar sesión",
          style: {
            display: "none"
          },
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "16 17 21 12 16 7" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "21", y1: "12", x2: "9", y2: "12" })
          ] })
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ListNovelties$1, { open: openList })
  ] });
}
const NavBar$1 = reactExports.memo(NavBar);
function BoxImg({ date, idEstablishment, submittedByUser, path, url, deleteImg, _id, isAnimate }) {
  const [fileState, setFileState] = reactExports.useState(null);
  const refContain = reactExports.useRef(null);
  const imgRefSrc = reactExports.useRef(null);
  const [newElementState, setNewElementState] = reactExports.useState(isAnimate);
  const newDate = new Date(date);
  const options = {
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  const readableDate = newDate.toLocaleDateString("es-ES", options);
  reactExports.useEffect(() => {
    const fetchImage = async () => {
      try {
        const response = await axiosInstance.get(url, { responseType: "blob" });
        const blob = response.data;
        const file = new File([blob], "image.jpg", { type: blob.type });
        setFileState(file);
      } catch (error) {
        console.error("Error fetching image:", error);
      }
    };
    fetchImage();
  }, [url]);
  reactExports.useEffect(() => {
    if (fileState) {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(fileState);
      fileReader.onload = (e2) => {
        imgRefSrc.current.src = e2.target.result;
        fileReader.onload = null;
      };
    }
  }, [fileState]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `inbox-card${newElementState ? " inbox-card--new" : ""}`,
      onClick: () => setNewElementState(false),
      ref: refContain,
      children: [
        newElementState && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inbox-card__badge-new", children: "nueva" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inbox-card__img-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              className: "inbox-card__img",
              draggable: true,
              ref: imgRefSrc,
              alt: "img-toast-post",
              onMouseDown: () => setNewElementState(false)
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => deleteImg(_id), className: "inbox-card__delete", title: "Eliminar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: "0 0 24 24", fill: "none", strokeWidth: "2.3", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "3 6 5 6 21 6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M10 11v6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 11v6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inbox-card__info", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "inbox-card__sender", children: submittedByUser }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "inbox-card__date", children: readableDate })
        ] })
      ]
    }
  );
}
function InboxImg() {
  if (isMobile_1 && !isTablet_1) return null;
  const [keyFecthState, setKeyFecthState] = reactExports.useState(true);
  const [errorState, setErrorState] = reactExports.useState(null);
  const [listImgState, setListImgState] = reactExports.useState([]);
  const userState = useSelector((state) => state.user);
  const [localState, setLocalState] = reactExports.useState(null);
  const [collapsed, setCollapsed] = reactExports.useState(true);
  reactExports.useEffect(() => {
    if (JSON.parse(localStorage.getItem("local_appExpress"))) {
      setLocalState(JSON.parse(localStorage.getItem("local_appExpress"))[0]);
    }
  }, []);
  reactExports.useEffect(() => {
    if (localState && userState && keyFecthState) {
      setKeyFecthState(false);
      getFileToastPos(localState._id).then((response) => {
        setListImgState(response.data);
      }).catch((error) => {
        console.log(error);
        setErrorState(error);
      });
    }
  }, [userState, localState, listImgState]);
  reactExports.useEffect(() => {
    const handdlerData = (data) => {
      if (data.idEstablishment === localState._id) {
        setListImgState([{ ...data, isAnimate: true }, ...listImgState]);
        setCollapsed(false);
      }
    };
    socketAppManager.on("fileLoader", handdlerData);
    return () => {
      socketAppManager.off("fileLoader", handdlerData);
    };
  }, [listImgState, localState]);
  const deleteItems = reactExports.useCallback((id) => {
    deleteFileToasPos(id).then((response) => {
      const idDeleted = response.data._id;
      const newList = listImgState.filter((items) => items._id !== idDeleted);
      setListImgState(newList);
    }).catch((error) => {
      console.log(error);
    });
  }, [listImgState]);
  const renderImages = (listImgState2) => {
    return listImgState2.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(BoxImg, { ...item, deleteImg: deleteItems }, item._id));
  };
  const count = listImgState.length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        className: "inbox-toggle z-[1001]",
        onClick: () => setCollapsed(!collapsed),
        title: "Bandeja de imagenes del Toast POS",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "max-w-none w-[40px]", src: "/ico/icons8-imagen-50.png", alt: "ico-image-box" }),
          count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inbox-toggle__badge", children: count })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: `inbox-panel ${collapsed ? "inbox-panel--collapsed" : "inbox-panel--open"} z-[1000]`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inbox-panel__header", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "inbox-panel__title", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" })
          ] }),
          "Toast POS"
        ] }),
        count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inbox-panel__count", children: count }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "inbox-panel__close", onClick: () => setCollapsed(true), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "inbox-panel__body", children: listImgState.length > 0 ? renderImages(listImgState) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inbox-panel__empty", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", style: { opacity: 0.3 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "22 12 16 12 14 15 10 15 8 12 2 12" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Sin archivos nuevos" })
      ] }) })
    ] })
  ] });
}
function AsideBar({ clearLocal, localMonitoring, selectNovelty, openBoleanSidebar }) {
  let isLocalVisivility = localMonitoring[0] ? true : false;
  const userSelet = useSelector((state) => state.user);
  const { deleteListNoveltie } = useSaveNoveltie();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const closeSesscion = () => {
    axiosInstance.get(`${URL$2}/auth/logout`).then((response) => {
      if (response.status === 200) {
        dispatch(setUser(null));
        if (window.location.hostname !== "localhost") {
          dispatch(desconnectIo());
        }
        sessionStorage.removeItem("session");
        localStorage.removeItem("local_appExpress");
        deleteListNoveltie();
        navigate("/");
      }
    }).catch((err) => {
      console.log(err);
    });
  };
  const menuItems = [
    { id: "delay-1ra", label: "Primera atención", icon: "/ico/icons8-book-50.png", hideOnTablet: true },
    { id: "limpieza-02", label: "Limpieza", icon: "/ico/icons8-cleaning-a-surface-50.png", hideOnTablet: true },
    { id: "services-03", label: "Servicio", icon: "/ico/icons8-food-64.png", hideOnTablet: true },
    { id: "delivery-04", label: "Entrega de plato", icon: "/ico/icons8-food-trolley-48.png", hideOnTablet: true },
    { id: "tablet-05", label: "Toast POS", icon: "/ico/icons8-tablet-50.png", hideOnTablet: true },
    { id: "touch-06", label: "Marcada antes de estar listo", icon: "/ico/icons8-touch-50.png", hideOnTablet: true },
    { id: "imagen-1", label: "Novedades", icon: "/ico/icons8-google-alerts-48.png", hideOnTablet: true },
    { id: "imagen-2", label: "Producción", icon: "/ico/icons8-knife-64.png", hideOnMobile: true, hideOnTablet: true },
    { id: "imagen-pizza", label: "Estándares de calidad", icon: "/ico/icons8-warranty-32.png", hideOnMobile: true, hideOnTablet: true }
  ];
  const tabletItems = [
    { id: "delayTabletForTablet", label: "Demora en preparación" },
    { id: "loadImage", label: "Subir imagen a mi Jarvis" }
  ];
  const infoItems = [
    { id: "show-manager", label: "Gerentes", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" }
  ];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    openBoleanSidebar && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sidebar-overlay", onClick: () => selectNovelty("") }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: `sidebar ${openBoleanSidebar ? "sidebar--open" : "sidebar--closed"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sidebar__header", children: !isMobile_1 || isTablet_1 ? isLocalVisivility ? /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "sidebar__local-name", children: localMonitoring[0].name }) : /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "sidebar__local-name sidebar__local-name--waiting", children: "Esperando..." }) : null }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sidebar__nav", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sidebar__section-label", children: "Reportar" }),
        !isTablet_1 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          menuItems.map((item) => {
            if (item.hideOnMobile && isMobile_1) return null;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "sidebar__btn",
                onClick: (e2) => selectNovelty(e2.currentTarget.id),
                id: item.id,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "sidebar__btn-icon", src: item.icon, alt: "primera-atención" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sidebar__btn-text", children: item.label })
                ]
              },
              item.id
            );
          }),
          isLocalVisivility && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sidebar__section-label", style: { marginTop: "0.75rem" }, children: "Información" }),
            infoItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "sidebar__btn",
                onClick: (e2) => selectNovelty(e2.currentTarget.id),
                id: item.id,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("img", { clasName: "", src: icon, alt: "" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sidebar__btn-text", children: item.label })
                ]
              },
              item.id
            ))
          ] })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: tabletItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            className: "sidebar__btn",
            onClick: (e2) => selectNovelty(e2.currentTarget.id),
            id: item.id,
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sidebar__btn-text", children: item.label })
          },
          item.id
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sidebar__footer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full flex justify-start items-center gap-4 p-0", children: [
          userSelet?.img ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "w-[40px] h-[50px] object-cover", src: userSelet.img, alt: "avatar" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "7", r: "4" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "font-bold text-[#ff6fbb] text-[.9rem]", children: [
              userSelet?.name,
              " ",
              userSelet?.surName
            ] }),
            userSelet?.jobInformation?.position && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "font-medium text-[#ffffff] text-[.8rem]", children: userSelet?.jobInformation?.position }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sidebar__btn sidebar__btn_highlighted sidebar__btn--ghost", onClick: clearLocal, id: "change-local", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { className: "sidebar__btn-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sidebar__btn-text", children: "Cambiar establecimiento" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "sidebar__btn sidebar__btn_highlighted sidebar__btn--danger", onClick: closeSesscion, id: "logout", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "sidebar__btn-icon", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "16 17 21 12 16 7" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "21", y1: "12", x2: "9", y2: "12" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sidebar__btn-text", children: "Cerrar sesión" })
        ] })
      ] })
    ] })
  ] });
}
const AsideBar$1 = reactExports.memo(AsideBar);
function BoxModal({ config, close }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: config.open ? "awaitContain boxModal-contain" : "hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "boxModal-div", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "boxModal-titleContain", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "boxModal-title", children: config.text.title }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "boxModal-descriptionContain", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "boxModal-description", children: config.text.description }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "boxModal-btnContain", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "asideComponent-btnAction boxModal-btnClose", onClick: () => close(), children: "cerrar" }) })
  ] }) }) });
}
const IconCheck = ({ active }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "svg",
  {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
    style: active ? { filter: "drop-shadow(0 0 4px #4e8300)" } : {},
    className: `w-3.5 h-3.5 transition-all duration-300 ${active ? "text-green-600" : "text-slate-300"}`,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.5 12.75l6 6 9-13.5" })
  }
);
const IconWhatsapp = ({ active }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  "svg",
  {
    viewBox: "0 0 24 24",
    fill: "currentColor",
    style: active ? { filter: "drop-shadow(0 0 4px #4e8300)" } : {},
    className: `w-3.5 h-3.5 transition-all duration-300 ${active ? "text-green-600 notif-icon-active" : "text-slate-300"}`,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.116 1.524 5.845L.057 23.571a.75.75 0 00.921.921l5.726-1.467A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.891 0-3.667-.518-5.186-1.42l-.371-.22-3.851.988.988-3.851-.22-.371A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" })
    ]
  }
);
const IconX = () => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "svg",
  {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.5,
    className: "w-3.5 h-3.5 text-red-500",
    style: { filter: "drop-shadow(0 0 4px #ef4444)" },
    children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" })
  }
);
function getInitials(name = "") {
  return name.trim().split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
const AVATAR_COLORS = [
  { from: "#3a6c00", to: "#82c91e" },
  // green
  { from: "#334155", to: "#64748b" },
  // slate
  { from: "#4f46e5", to: "#818cf8" },
  // indigo
  { from: "#0891b2", to: "#38bdf8" },
  // cyan
  { from: "#b45309", to: "#fbbf24" },
  // amber
  { from: "#9d174d", to: "#f472b6" }
  // pink
];
function avatarStyle(name = "") {
  const { from, to } = AVATAR_COLORS[(name.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}
function resolveStatus(validationResult, givenToTheGroup) {
  const isApproved = validationResult?.isApproved;
  const discardClient = validationResult?.validationToDiscard?.byTheClient;
  const discardDept = validationResult?.validationToDiscard?.reportingDepartment;
  const isInvalid = discardClient || discardDept || isApproved === false;
  if (isInvalid) return {
    label: "Invalidada",
    accent: "#ef4444",
    badgeBg: "rgba(239,68,68,0.10)",
    badgeColor: "#dc2626",
    dotColor: "#ef4444",
    cardBg: "#fda6a6",
    invalid: true
  };
  if (isApproved && givenToTheGroup) return {
    label: "Enviado",
    accent: "#4e8300",
    badgeBg: "rgba(78,131,0,0.10)",
    badgeColor: "#3a6c00",
    dotColor: "#5d9a10",
    cardBg: "#d3fdca",
    invalid: false
  };
  if (isApproved) return {
    label: "Aprobada",
    accent: "#4f46e5",
    badgeBg: "rgba(79,70,229,0.08)",
    badgeColor: "#4338ca",
    dotColor: "#6366f1",
    cardBg: "#d3fdca",
    invalid: false
  };
  return {
    label: "Pendiente",
    accent: "#f59e0b",
    badgeBg: "rgba(245,158,11,0.10)",
    badgeColor: "#d97706",
    dotColor: "#f59e0b",
    cardBg: "#fff",
    invalid: false
  };
}
function AlertUpdateCard({ data }) {
  const validationResult = data?.validationResult;
  const sentToGroup = !!data?.givenToTheGroup;
  const validatorName = validationResult?.validatedByUser?.user?.nameUser || "";
  const senderName = data?.sharedByUser?.user?.nameUser || "";
  const title = data?.title || "Sin título";
  const localName = data?.local?.name || "";
  const imgUrl = data?.imageToShare || data?.imageUrl?.[0]?.url || null;
  const table = data?.table || null;
  const ticket = data?.orderTicketNumber ?? null;
  const validatedAt = validationResult?.updatedAt ? new Date(validationResult.updatedAt).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" }) : null;
  const status = resolveStatus(validationResult, sentToGroup);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full h-full overflow-hidden", style: { backgroundColor: status.cardBg }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "w-[3px] min-w-[3px] h-full flex-shrink-0",
        style: { background: status.accent }
      }
    ),
    imgUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[52px] min-w-[52px] h-full overflow-hidden flex-shrink-0 relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "img",
        {
          src: imgUrl,
          alt: title,
          className: "w-full h-full object-cover"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-y-0 right-0 w-px bg-slate-200" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between flex-1 min-w-0 p-[1rem]", style: { padding: "0.5rem" }, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "notif-dot w-[6px] h-[6px] rounded-full flex-shrink-0",
              style: { backgroundColor: status.dotColor, boxShadow: `0 0 6px 1px ${status.dotColor}88` }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-[0.15em] text-slate-700", children: "Novedad" }),
          validatedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] font-bold text-slate-700", children: [
            "· ",
            validatedAt
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "notif-badge text-[8px] font-bold uppercase tracking-wide px-2 py-[3px] rounded-full border",
            style: {
              background: status.badgeBg,
              color: status.badgeColor,
              borderColor: status.badgeBg.replace("0.10", "0.3").replace("0.08", "0.25"),
              padding: ".2rem .5rem"
            },
            children: status.label
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[12px] font-bold text-slate-900 leading-snug line-clamp-2", children: title }),
        localName && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] font-medium text-slate-800 uppercase tracking-widest mt-[3px] truncate", children: localName }),
        (table || ticket !== null) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-[3px]", children: [
          table && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] font-semibold text-slate-600", children: [
            "Mesa: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-800", children: table })
          ] }),
          ticket !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] font-semibold text-slate-600", children: [
            "Ticket: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-slate-800", children: ticket })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-px bg-slate-100 mt-auto mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-9 h-6 flex-shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                title: senderName,
                className: "absolute right-0 bottom-0 w-5 h-5 rounded-full flex items-center justify-center ring-[1.5px] ring-white",
                style: avatarStyle(senderName),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[6px] font-black text-white leading-none", children: getInitials(senderName) })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                title: validatorName,
                className: "absolute left-0 bottom-0 w-6 h-6 rounded-full flex items-center justify-center ring-[1.5px] ring-white shadow-sm",
                style: avatarStyle(validatorName),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[8px] font-black text-white leading-none", children: getInitials(validatorName) })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-medium text-bacl leading-tight truncate", children: validatorName || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-slate-600 leading-tight truncate", children: senderName || "—" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full flex-shrink-0 bg-slate-50 border border-slate-200", children: [
          status.invalid ? /* @__PURE__ */ jsxRuntimeExports.jsx(IconX, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(IconCheck, { active: validationResult?.isApproved }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-px h-3 bg-slate-200" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(IconWhatsapp, { active: sentToGroup })
        ] })
      ] })
    ] })
  ] });
}
async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn("[osNotification] Este entorno no soporta notificaciones.");
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}
function pushOSNotification({ title, body = "", icon: icon2, tag, silent = false, onClick }) {
  if (!("Notification" in window)) return null;
  if (Notification.permission !== "granted") {
    console.warn("[osNotification] Permiso no concedido. Llamar requestNotificationPermission() primero.");
    return null;
  }
  const notification = new Notification(title, {
    body,
    icon: icon2 || void 0,
    tag: tag || void 0,
    silent
  });
  return notification;
}
function notifyAlertUpdate(data, onClick) {
  const isApproved = data?.validationResult?.isApproved;
  const discardClient = data?.validationResult?.validationToDiscard?.byTheClient;
  const discardDept = data?.validationResult?.validationToDiscard?.reportingDepartment;
  const isInvalid = discardClient || discardDept;
  const sentToGroup = !!data?.givenToTheGroup;
  const title = data?.title || "Novedad";
  const local = data?.local?.name || "";
  const validator = data?.validationResult?.validatedByUser?.user?.nameUser || "";
  const sender = data?.sharedByUser?.user?.nameUser || "";
  const icon2 = data?.imageToShare || data?.imageUrl?.[0]?.url || void 0;
  let statusLabel = "Aprobada";
  if (isInvalid) statusLabel = "Invalidada";
  else if (isApproved && sentToGroup) statusLabel = "Enviada al grupo";
  const bodyLines = [
    local && `📍 ${local}`,
    sender && `✉️  ${sender}`,
    validator && `✅ Validado por ${validator}`,
    `→ ${statusLabel}`
  ].filter(Boolean).join("\n");
  pushOSNotification({
    title: `Novedad — ${title}`,
    body: bodyLines,
    icon: icon2,
    tag: data?._id,
    // evita duplicar la misma novedad
    onClick
  });
}
function Notifications() {
  const dispatch = useDispatch();
  const alerts = useSelector((store) => store.alert_line);
  const user = useSelector((store) => store.user);
  const localSeleted = useSelector((store) => store.establishment);
  reactExports.useEffect(() => {
    requestNotificationPermission();
  }, []);
  const pushData = (data2) => {
    const userShareId = data2?.doc?.sharedByUser?.user?.id?._id;
    const localSeletedId = localSeleted?._id;
    const localDataId = data2?.doc?.local?.idLocal;
    if (localSeletedId === localDataId && user?._id === userShareId) {
      dispatch(pushNotifications({
        type: "alertUpdate",
        data: data2?.doc,
        id: data2?.doc?._id
      }));
      notifyAlertUpdate(data2?.doc);
    }
  };
  reactExports.useEffect(() => {
    let subcript = true;
    !isMobile_1 && subcript && socketAppManager.on("document_updated", pushData);
    return () => {
      subcript = false;
      socketAppManager.off("document_updated", pushData);
    };
  }, [user, localSeleted]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute h-[240px] bottom-[0] right-[0] p-[3rem] flex items-center gap-[1rem] pointer-events-none z-1000 ", children: alerts.map((data2) => {
    if (data2.type === "alertUpdate") return /* @__PURE__ */ jsxRuntimeExports.jsx(CardNotifications, { id: data2.id, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AlertUpdateCard, { data: data2.data }) }, data2.id);
    else return null;
  }) });
}
function CardNotifications({ id, children }) {
  const dispatch = useDispatch();
  reactExports.useEffect(() => {
    const timeDelete = 1e5;
    const timeOut = setTimeout(() => {
      dispatch(deleteNotifications(id));
    }, timeDelete);
    return () => clearTimeout(timeOut);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "notif-enter w-[300px] h-[162px] overflow-hidden rounded-xl border border-slate-200 pointer-events-auto",
      onDoubleClick: () => {
        dispatch(deleteNotifications(id));
      },
      style: { boxShadow: "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)" },
      children
    }
  );
}
const getEstablishmentByIdFull = (id) => {
  return new Promise((resolve, reject) => {
    axiosInstance.get(`${URL$2}/local/id=${id}?populate=timeServices shedules dishes managers`).then((response) => resolve(response)).catch((error) => reject(error));
  });
};
function Home() {
  const selectEstablishment = useSelector((state) => state.establishment);
  const userSelector = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const localSelector = useSelector((state) => state.locals);
  let [listMenu, setListMenu] = reactExports.useState([]);
  let [openAwaitWindow, setOpenAwait] = reactExports.useState({ text: "", open: false });
  let [openModal, setOpenModal] = reactExports.useState({ text: "", open: false });
  let [render3, setRender] = reactExports.useState(JSON.parse(localStorage.getItem("local_appExpress")));
  let [renderValue, setRenderValue] = reactExports.useState(String);
  let [openSideBar, setOpenSideBar] = reactExports.useState(false);
  reactExports.useEffect(() => {
    let key = true;
    const resetSocket = (event) => {
      if (key) {
        if (event.client === "express") window.location.reload();
        if (event.client === "all") window.location.reload();
      }
    };
    socketAppManager.on("reset_client", resetSocket);
    return () => {
      key = false;
      socketAppManager.off("reset_clien", resetSocket);
    };
  }, []);
  const emitUserData = () => {
    const dataUser = {
      sessionId: `${userSelector._id}`,
      user: {
        username: `${userSelector.name} ${userSelector.surName}`,
        userId: userSelector._id,
        userImg: userSelector?.img ? userSelector?.img : null
      },
      localInfo: {
        localname: selectEstablishment.name,
        localId: selectEstablishment._id
      }
    };
    socketAppManager.emit("user-data", dataUser);
  };
  reactExports.useEffect(() => {
    if (userSelector && selectEstablishment) emitUserData();
  }, [userSelector, selectEstablishment]);
  const resetLocal = () => {
    setRender(render3 = false);
    dispatch(setLocals(null));
  };
  const enter = () => {
    if (window.location.host !== "localhost") {
      dispatch(createIo());
    }
    setRender(render3 = true);
  };
  const selectNovelty = (value) => {
    if (typeof value !== "string") throw "Type err, param not string";
    setRenderValue(renderValue = value);
    if (window?.innerWidth < 721) closeOpenAsideBar();
  };
  const configAwait = {
    open: (text) => {
      setOpenAwait(openAwaitWindow = { text, open: true });
    },
    close: () => {
      setOpenAwait(openAwaitWindow = { text: "", open: false });
    }
  };
  const configBoxModal = {
    open: (text) => {
      setOpenModal(openModal = { text: { title: text.title, description: text.description }, open: true });
    },
    close: () => {
      setOpenModal(openModal = { text: { title: "", description: "" }, open: false });
    }
  };
  const closeOpenAsideBar = () => {
    setOpenSideBar(!openSideBar);
  };
  reactExports.useEffect(() => {
    axiosInstance.get(`${URL$2}/localLigth`).then((response) => {
      console.log(response);
      dispatch(setLocals(response.data));
    }).catch((err) => {
      console.log(err);
    });
    axiosInstance.get(`${URL$2}/menu?alertLive=true`).then((response) => {
      setListMenu(response.data);
    }).catch((err) => {
      console.log(err);
    });
    if (isMobile_1 && !isTablet_1) setRender(render3 = true);
  }, []);
  reactExports.useEffect(() => {
    const isEstablishmen = JSON.parse(localStorage.getItem("local_appExpress"));
    if (localSelector.length > 0 && !selectEstablishment && isEstablishmen && isEstablishmen.length > 0) {
      getEstablishmentByIdFull(isEstablishmen[0]._id).then((response) => {
        dispatch(setEstablishment(response.data));
        setLocal(isEstablishmen);
      }).catch((error) => {
        console.log(error);
      });
    }
  }, [localSelector]);
  const handdlerClickSeleted = reactExports.useCallback((e2) => {
    const localSelect = localSelector.filter((local) => local._id === e2.target.value);
    getEstablishmentByIdFull(localSelect[0]._id).then((response) => {
      dispatch(setEstablishment(response.data));
    }).catch((error) => {
      console.log(error);
    });
  }, [localSelector]);
  const orderEstablishment = reactExports.useMemo(() => {
    return [...localSelector].sort((a2, b) => a2.name.localeCompare(b.name));
  }, [localSelector]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: render3 && listMenu.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "homeComponent", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(NavBar$1, { clearLocal: resetLocal, openCloseSidebar: closeOpenAsideBar, boxModal: configBoxModal }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AsideBar$1, { clearLocal: resetLocal, localMonitoring: establishment, selectNovelty, openBoleanSidebar: openSideBar }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Main, { value: renderValue, selectNovelty, awaitWindow: configAwait, boxModal: configBoxModal, menu: listMenu }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(InboxImg, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Chat, {}, "chats"),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Notifications, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Await, { config: openAwaitWindow, close: configAwait.close }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(BoxModal, { config: openModal, close: configBoxModal.close })
  ] }) : localSelector.length > 0 && listMenu.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "local-selectComponent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "local-selectContain", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "local-title", children: "Seleciones el local a monitorear" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "select",
      {
        className: "local-input-select",
        onChange: handdlerClickSeleted,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { className: "local-option", value: "", children: "- Selecciones un local -" }),
          orderEstablishment.sort((a2, b) => a2.name - b.name).map((local) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { className: "local-option", value: local._id, children: local.name }, local._id))
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("img", { className: "local-img ", src: selectEstablishment && selectEstablishment?.image ? selectEstablishment.image : imgDefault, alt: "" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "local-btn-closeWindow", disabled: selectEstablishment ? false : true, onClick: enter, children: "Next" })
  ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "local-selectComponent", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner" }) }) });
}
export {
  Home as default
};
