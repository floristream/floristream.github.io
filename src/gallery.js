// Minimalistic gallery where the images are stored on Google Drive.
// Copyright (c) 2025, Vladimir Kamenar.
// All rights reserved.

var arr = [], slice = arr.slice, push = arr.push, push_native = push, class2type = {}, toString = class2type.toString,
 hasOwn = class2type.hasOwnProperty, readyList, jlib = function(){ return this }, nonce = +(new Date()), rquery = (/\?/), rprotocol = /^\/\//,
 ajaxLoc = window.location.href, ajaxLocParts = /^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/.exec(ajaxLoc.toLowerCase()) || [];

try{
 push.apply((arr = slice.call(document.childNodes)), document.childNodes);
 arr[document.childNodes.length].nodeType
}catch(e){
 push = { apply: arr.length ?
  function(tgt, ee){ push_native.apply(tgt, slice.call(ee)) } :
  function(tgt, ee){
   var j = tgt.length, i = 0;
   while((tgt[j++] = ee[i++]));
   tgt.length = j - 1
  }
 }
}

function detach(){
 if(document.addEventListener){
  document.removeEventListener("DOMContentLoaded", completed);
  window.removeEventListener("load", completed)
 }else{
  document.detachEvent("onreadystatechange", completed);
  window.detachEvent("onload", completed)
 }
}

function completed(){
 if(document.addEventListener || window.event.type === "load" || document.readyState === "complete"){
  detach();
  jlib.ready()
 }
}

function ajaxExt(tgt, src){
 var deep, key;
 for(key in src)
  if(src[key] !== undefined)
   (key == "url" || key == "context" ? tgt : (deep || (deep = {})))[key] = src[key];
 if(deep)
  jlib.ext(true, tgt, deep);
 return tgt
}

jlib.ext = function(){
 var src, copyIsArray, copy, name, options, clone, tgt = arguments[0] || {}, i = 1, length = arguments.length, deep = false;
 if(typeof tgt === "boolean"){
  deep = tgt;
  tgt = arguments[i++] || {}
 }
 if(typeof tgt !== "object" && !jlib.isFn(tgt))
  tgt = {};
 if(i === length){
  tgt = this;
  i--
 }
 while(i < length)
  if((options = arguments[i++]) != null)
   for(name in options){
    src = tgt[name];
    copy = options[name];
    if(tgt === copy)
     continue;
    if(deep && copy && (jlib.isPojo(copy) || (copyIsArray = jlib.isArray(copy)))){
     if(copyIsArray){
      copyIsArray = 0;
      clone = src && jlib.isArray(src) ? src : []
     }else
      clone = src && jlib.isPojo(src) ? src : {};
     tgt[name] = jlib.ext(deep, clone, copy)
    }else if(copy !== undefined)
     tgt[name] = copy
   }
 return tgt
};

jlib.ext({

 isReady: false,
 noop: function(){},
 isFn: function(obj){ return jlib.type(obj) === "function" },
 isArray: Array.isArray || function(obj){ return jlib.type(obj) === "array" },
 isWin: function(obj){ return obj != null && obj == obj.window },

 isPojo: function(obj){
  var key;
  if(!obj || jlib.type(obj) !== "object" || obj.nodeType || jlib.isWin(obj))
   return 0;
  try{
   if(obj.constructor && !hasOwn.call(obj, "constructor") && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf"))
    return 0
  }catch(e){ // IE8,9 Will throw exceptions on certain host objects
   return 0
  }
  for(key in obj)
   return hasOwn.call(obj, key);
  return key === undefined || hasOwn.call(obj, key)
 },

 type: function(obj){
  return obj == null ? obj + "" : typeof obj === "object" || typeof obj === "function" ? class2type[toString.call(obj)] || "object" : typeof obj
 },

 each: function(obj, callback){
  var i = 0, length = !!obj && "length" in obj && obj.length, type = jlib.type(obj);
  if(type !== "function" && !jlib.isWin(obj) && (type === "array" || length === 0 || typeof length === "number" && length > 0 && (length - 1) in obj))
   for(length = obj.length; i < length && callback.call(obj[i], i, obj[i]) !== false; i++);
  else
   for(i in obj)
    if(callback.call(obj[i], i, obj[i]) === false)
     break;
   return obj
 },

 Deferred: function(func){
  var prom = {
   als: function(){ deferred.done(arguments).fail(arguments) },
   prom: function(obj){ return jlib.ext(obj, prom) }
   },
   deferred = {};
   jlib.each([["resolve", "done", true], ["reject", "fail", true], ["notify", "progress"]], function(i, tuple){
   var list = jlib.CB(tuple[2]);
   prom[tuple[1]] = list.add;
   deferred[tuple[0]] = function(){
    deferred[tuple[0] + "With"](this === deferred ? prom : this, arguments);
    return this
   };
   deferred[tuple[0] + "With"] = list.fireWith
  });
  prom.prom(deferred);
  if(func)
   func.call(deferred, deferred);
  return deferred
 },

 ready: function(){
  if(!jlib.isReady){
   jlib.isReady = true;
   readyList.resolveWith(document, [jlib]);
   loadGallery()
  }
 },

 ajaxCFG: {
  url: ajaxLoc,
  async: true
 },

 ajax: function(options){
  var i, cacheURL, timeoutTimer, transport, s = ajaxExt(ajaxExt({}, jlib.ajaxCFG), options),
   callbackContext = s.context || s, deferred = jlib.Deferred(), completeDeferred = jlib.CB(true),
   statusCode = s.statusCode || {}, requestHeaders = {}, state = 0, strAbort = "canceled",
  jqXHR = {
   readyState: 0,
   setRequestHeader: function(name, value){
    if(!state)
     requestHeaders[name] = value
   },
   statusCode: function(map){
    var code;
    if(map){
     if(state < 2){
      for(code in map)
       statusCode[code] = [statusCode[code], map[code]]
     }else
      jqXHR.als(map[jqXHR.status])
    }
    return this
   },
   abort: function(){
    var finalText = strAbort;
    if(transport)
     transport.abort(finalText);
    done(0, finalText)
   }
  };
  deferred.prom(jqXHR).complete = completeDeferred.add;
  jqXHR.success = jqXHR.done;
  jqXHR.error = jqXHR.fail;
  s.url = ((s.url || ajaxLoc) + "").replace(rprotocol, ajaxLocParts[1] + "//");
  if(state === 2)
   return;
  cacheURL = s.url;
  if(s.data){
   cacheURL = (s.url += (rquery.test(cacheURL) ? "&" : "?") + s.data);
   delete s.data
  }
  if(s.cache === false)
   s.url = cacheURL + (rquery.test(cacheURL) ? "&" : "?") + "_=" + nonce++;
  jqXHR.setRequestHeader("Accept", "*/".concat("*"));
  for(i in s.headers)
   jqXHR.setRequestHeader(i, s.headers[i]);
  strAbort = "abort";
  for(i in { success: 1, error: 1, complete: 1 })
   jqXHR[i](s[i]);
  transport = inspectTransports(s);
  if(!transport)
   done(-1, "No Transport");
  else{
   jqXHR.readyState = 1;
   if(state === 2)
    return;
   if(s.async && s.timeout > 0)
    timeoutTimer = window.setTimeout(function(){
     jqXHR.abort("timeout")
    }, s.timeout);
   try{
    state = 1;
    transport.send(requestHeaders, done)
   }catch(e){
    if(state >= 2)
     throw e;
    done(-1, e)
   }
  }

  function done(status, statusText, responses){
   var isSuccess, success, error, response, modified;
   if(state === 2)
    return;
   state = 2;
   if(timeoutTimer)
    window.clearTimeout(timeoutTimer);
   transport = undefined;
   jqXHR.readyState = status > 0 ? 4 : 0;
   isSuccess = status >= 200 && status < 300 || status === 304;
   if(responses)
    response = responses["text"];
   response = { state: "success", data: response };
   if(isSuccess){
    if(status !== 204 && status !== 304){
     success = response.data;
     error = response.error;
     isSuccess = !error
    }
   }else if(status < 0)
    status = 0;
   jqXHR.status = status;
   if(isSuccess)
    deferred.resolveWith(callbackContext, [ success, "", jqXHR ]);
   else
    deferred.rejectWith(callbackContext, [ jqXHR, "", error ]);
   jqXHR.statusCode(statusCode);
   statusCode = undefined;
   completeDeferred.fireWith(callbackContext, [ jqXHR, "" ])
  }
  return jqXHR
 }
});

jlib.each("Boolean Number String Function Array Date RegExp Object Error Symbol".split(" "),
function(i, name){
 class2type["[object " + name + "]"] = name.toLowerCase()
});

jlib.CB = function(once){
 var options = once, firing, memory, locked, list = [], queue = [], firingIndex = -1,
 fire = function(){
  locked = options;
  firing = true;
  for(; queue.length; firingIndex = -1){
   memory = queue.shift();
   while(++firingIndex < list.length)
    list[firingIndex].apply(memory[0], memory[1])
  }
  firing = false;
  if(locked)
   list = memory ? [] : ""
 },

 self = {
  add: function(){
   if(list){
    if(memory && !firing){
     firingIndex = list.length - 1;
     queue.push(memory)
    }
    (function add(args){
     jlib.each(args, function(_, arg){
      if(jlib.isFn(arg))
       list.push(arg);
      else if(arg && arg.length && jlib.type(arg) !== "string")
       add(arg)
     })
    })(arguments);
    if(memory && !firing)
     fire()
   }
   return this
  },

  fireWith: function(context, args){
   if(!locked){
    args = args || [];
    queue.push([context, args.slice ? args.slice() : args]);
    if(!firing)
     fire()
   }
   return this
  },

  fire: function(){ self.fireWith(this, arguments) }
 };
 return self
};

jlib.ready.prom = function(obj){
 if(!readyList){
  readyList = jlib.Deferred();
  // Older IE might signal "interactive" too soon
  if(document.readyState === "complete" || (document.readyState !== "loading" && !document.documentElement.doScroll))
   window.setTimeout(jlib.ready);
  else if(document.addEventListener){
   document.addEventListener("DOMContentLoaded", completed);
   window.addEventListener("load", completed)
  }else{
   document.attachEvent("onreadystatechange", completed);
   window.attachEvent("onload", completed);
   var top = 0;
   try{
    top = document.documentElement
   }catch(e){}
   if(top && top.doScroll)
    (function doScrollCheck(){
     if(!jlib.isReady){
      try{
       top.doScroll("left")
      }catch(e){
       return window.setTimeout(doScrollCheck, 50)
      }
      detach();
      jlib.ready()
     }
    })()
   }
 }
};
jlib.ready.prom();

jlib.ajaxCFG.xhr = window.ActiveXObject !== undefined ? function(){
 try{
  return document.documentMode > 8 ? createStandardXHR() : new window.ActiveXObject("Microsoft.XMLHTTP")
 }catch(e){}
} : createStandardXHR;

var xhrSupported = jlib.ajaxCFG.xhr();

function inspectTransports(opt){
 var callback;
 if(!xhrSupported)
  return 0;
 return{
  send: function(headers, complete){
   var i, xhr = opt.xhr();
   xhr.open("GET", opt.url, opt.async);
   for(i in headers){
    if(headers[i] !== undefined)
     xhr.setRequestHeader(i, headers[i] + "")
   }
   xhr.send(null);
   callback = function(_, isAbort){
    var status, responses;
    if(callback && (isAbort || xhr.readyState === 4)){
     callback = undefined;
     xhr.onreadystatechange = jlib.noop;
     if(isAbort){
      if(xhr.readyState !== 4)
       xhr.abort()
     }else{
      responses = {};
      status = xhr.status;
      if(typeof xhr.responseText === "string")
       responses.text = xhr.responseText
     }
    }
    if(responses)
     complete(status, "", responses)
   };
   if(!opt.async)
    callback();
   else if(xhr.readyState === 4)
    window.setTimeout(callback);
   else
    xhr.onreadystatechange = callback
  },

  abort: function(){
   if(callback)
    callback(undefined, true)
  }
 }
};

function createStandardXHR(){
 try{ return new window.XMLHttpRequest() }catch(e){}
}

var VTO, transp = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

function S(id){ return document.getElementById(id) }

function T(id){
 var img = S('IMG');
 img.src = transp;
 img.src = 'https://drive.google.com/thumbnail?sz=w1000&id=' + id
}

function loadGallery(){
 var menu = S('MENU'), img = S('IMG');
 if(VTO)
  window.clearTimeout(VTO);
 menu.innerHTML = "Loading...";
 img.src = transp;
 jlib.ajax({
  url: "gallery.csv",
  cache: false,
  error: function(){
   menu.innerHTML = "Hold on. Retrying...";
   VTO = window.setTimeout('loadGallery()', 5100)
  },
  success: function(d){
   img.src = "bg.png";
   var s, j, k = 0, i = 0, eof = 0, innerT = "<table id=FLR cellspacing=0 cellpadding=0 border=0>";
   while(!eof){
    if((j = d.indexOf('\n', i)) < 0){
     j = d.length;
     eof = 1
    }
    s = d.substring(i, j).split(",", 3);
    if(s.length === 3)
     innerT += '<tr class=TONE onfocus="T(\'' + s[1] + '\');" tabindex="' + (k++) + '"><td style="width:32px;height:32px;background:#' + s[0] + '"><td>&nbsp;' + s[2];
    i = j + 1
   }
   menu.innerHTML = innerT + "</table>"
  },
  timeout: 10000
 });
}
