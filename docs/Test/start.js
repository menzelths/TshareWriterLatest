// saveAs zum Speichern von Dateien

var saveAs=saveAs||function(view){"use strict";if(typeof navigator!=="undefined"&&/MSIE [1-9]\./.test(navigator.userAgent)){return}var doc=view.document,get_URL=function(){return view.URL||view.webkitURL||view},save_link=doc.createElementNS("http://www.w3.org/1999/xhtml","a"),can_use_save_link="download"in save_link,click=function(node){var event=new MouseEvent("click");node.dispatchEvent(event)},is_safari=/Version\/[\d\.]+.*Safari/.test(navigator.userAgent),webkit_req_fs=view.webkitRequestFileSystem,req_fs=view.requestFileSystem||webkit_req_fs||view.mozRequestFileSystem,throw_outside=function(ex){(view.setImmediate||view.setTimeout)(function(){throw ex},0)},force_saveable_type="application/octet-stream",fs_min_size=0,arbitrary_revoke_timeout=500,revoke=function(file){var revoker=function(){if(typeof file==="string"){get_URL().revokeObjectURL(file)}else{file.remove()}};if(view.chrome){revoker()}else{setTimeout(revoker,arbitrary_revoke_timeout)}},dispatch=function(filesaver,event_types,event){event_types=[].concat(event_types);var i=event_types.length;while(i--){var listener=filesaver["on"+event_types[i]];if(typeof listener==="function"){try{listener.call(filesaver,event||filesaver)}catch(ex){throw_outside(ex)}}}},auto_bom=function(blob){if(/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)){return new Blob(["\ufeff",blob],{type:blob.type})}return blob},FileSaver=function(blob,name,no_auto_bom){if(!no_auto_bom){blob=auto_bom(blob)}var filesaver=this,type=blob.type,blob_changed=false,object_url,target_view,dispatch_all=function(){dispatch(filesaver,"writestart progress write writeend".split(" "))},fs_error=function(){if(target_view&&is_safari&&typeof FileReader!=="undefined"){var reader=new FileReader;reader.onloadend=function(){var base64Data=reader.result;target_view.location.href="data:attachment/file"+base64Data.slice(base64Data.search(/[,;]/));filesaver.readyState=filesaver.DONE;dispatch_all()};reader.readAsDataURL(blob);filesaver.readyState=filesaver.INIT;return}if(blob_changed||!object_url){object_url=get_URL().createObjectURL(blob)}if(target_view){target_view.location.href=object_url}else{var new_tab=view.open(object_url,"_blank");if(new_tab==undefined&&is_safari){view.location.href=object_url}}filesaver.readyState=filesaver.DONE;dispatch_all();revoke(object_url)},abortable=function(func){return function(){if(filesaver.readyState!==filesaver.DONE){return func.apply(this,arguments)}}},create_if_not_found={create:true,exclusive:false},slice;filesaver.readyState=filesaver.INIT;if(!name){name="download"}if(can_use_save_link){object_url=get_URL().createObjectURL(blob);setTimeout(function(){save_link.href=object_url;save_link.download=name;click(save_link);dispatch_all();revoke(object_url);filesaver.readyState=filesaver.DONE});return}if(view.chrome&&type&&type!==force_saveable_type){slice=blob.slice||blob.webkitSlice;blob=slice.call(blob,0,blob.size,force_saveable_type);blob_changed=true}if(webkit_req_fs&&name!=="download"){name+=".download"}if(type===force_saveable_type||webkit_req_fs){target_view=view}if(!req_fs){fs_error();return}fs_min_size+=blob.size;req_fs(view.TEMPORARY,fs_min_size,abortable(function(fs){fs.root.getDirectory("saved",create_if_not_found,abortable(function(dir){var save=function(){dir.getFile(name,create_if_not_found,abortable(function(file){file.createWriter(abortable(function(writer){writer.onwriteend=function(event){target_view.location.href=file.toURL();filesaver.readyState=filesaver.DONE;dispatch(filesaver,"writeend",event);revoke(file)};writer.onerror=function(){var error=writer.error;if(error.code!==error.ABORT_ERR){fs_error()}};"writestart progress write abort".split(" ").forEach(function(event){writer["on"+event]=filesaver["on"+event]});writer.write(blob);filesaver.abort=function(){writer.abort();filesaver.readyState=filesaver.DONE};filesaver.readyState=filesaver.WRITING}),fs_error)}),fs_error)};dir.getFile(name,{create:false},abortable(function(file){file.remove();save()}),abortable(function(ex){if(ex.code===ex.NOT_FOUND_ERR){save()}else{fs_error()}}))}),fs_error)}),fs_error)},FS_proto=FileSaver.prototype,saveAs=function(blob,name,no_auto_bom){return new FileSaver(blob,name,no_auto_bom)};if(typeof navigator!=="undefined"&&navigator.msSaveOrOpenBlob){return function(blob,name,no_auto_bom){if(!no_auto_bom){blob=auto_bom(blob)}return navigator.msSaveOrOpenBlob(blob,name||"download")}}FS_proto.abort=function(){var filesaver=this;filesaver.readyState=filesaver.DONE;dispatch(filesaver,"abort")};FS_proto.readyState=FS_proto.INIT=0;FS_proto.WRITING=1;FS_proto.DONE=2;FS_proto.error=FS_proto.onwritestart=FS_proto.onprogress=FS_proto.onwrite=FS_proto.onabort=FS_proto.onerror=FS_proto.onwriteend=null;return saveAs}(typeof self!=="undefined"&&self||typeof window!=="undefined"&&window||this.content);if(typeof module!=="undefined"&&module.exports){module.exports.saveAs=saveAs}else if(typeof define!=="undefined"&&define!==null&&define.amd!=null){define([],function(){return saveAs})}


$(function() {
    
    var saveAs64="dmFyIHNhdmVBcz1zYXZlQXN8fGZ1bmN0aW9uKHZpZXcpeyJ1c2Ugc3RyaWN0IjtpZih0eXBlb2YgbmF2aWdhdG9yIT09InVuZGVmaW5lZCImJi9NU0lFIFsxLTldXC4vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpe3JldHVybn12YXIgZG9jPXZpZXcuZG9jdW1lbnQsZ2V0X1VSTD1mdW5jdGlvbigpe3JldHVybiB2aWV3LlVSTHx8dmlldy53ZWJraXRVUkx8fHZpZXd9LHNhdmVfbGluaz1kb2MuY3JlYXRlRWxlbWVudE5TKCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiwiYSIpLGNhbl91c2Vfc2F2ZV9saW5rPSJkb3dubG9hZCJpbiBzYXZlX2xpbmssY2xpY2s9ZnVuY3Rpb24obm9kZSl7dmFyIGV2ZW50PW5ldyBNb3VzZUV2ZW50KCJjbGljayIpO25vZGUuZGlzcGF0Y2hFdmVudChldmVudCl9LGlzX3NhZmFyaT0vVmVyc2lvblwvW1xkXC5dKy4qU2FmYXJpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLHdlYmtpdF9yZXFfZnM9dmlldy53ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbSxyZXFfZnM9dmlldy5yZXF1ZXN0RmlsZVN5c3RlbXx8d2Via2l0X3JlcV9mc3x8dmlldy5tb3pSZXF1ZXN0RmlsZVN5c3RlbSx0aHJvd19vdXRzaWRlPWZ1bmN0aW9uKGV4KXsodmlldy5zZXRJbW1lZGlhdGV8fHZpZXcuc2V0VGltZW91dCkoZnVuY3Rpb24oKXt0aHJvdyBleH0sMCl9LGZvcmNlX3NhdmVhYmxlX3R5cGU9ImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSIsZnNfbWluX3NpemU9MCxhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQ9NTAwLHJldm9rZT1mdW5jdGlvbihmaWxlKXt2YXIgcmV2b2tlcj1mdW5jdGlvbigpe2lmKHR5cGVvZiBmaWxlPT09InN0cmluZyIpe2dldF9VUkwoKS5yZXZva2VPYmplY3RVUkwoZmlsZSl9ZWxzZXtmaWxlLnJlbW92ZSgpfX07aWYodmlldy5jaHJvbWUpe3Jldm9rZXIoKX1lbHNle3NldFRpbWVvdXQocmV2b2tlcixhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQpfX0sZGlzcGF0Y2g9ZnVuY3Rpb24oZmlsZXNhdmVyLGV2ZW50X3R5cGVzLGV2ZW50KXtldmVudF90eXBlcz1bXS5jb25jYXQoZXZlbnRfdHlwZXMpO3ZhciBpPWV2ZW50X3R5cGVzLmxlbmd0aDt3aGlsZShpLS0pe3ZhciBsaXN0ZW5lcj1maWxlc2F2ZXJbIm9uIitldmVudF90eXBlc1tpXV07aWYodHlwZW9mIGxpc3RlbmVyPT09ImZ1bmN0aW9uIil7dHJ5e2xpc3RlbmVyLmNhbGwoZmlsZXNhdmVyLGV2ZW50fHxmaWxlc2F2ZXIpfWNhdGNoKGV4KXt0aHJvd19vdXRzaWRlKGV4KX19fX0sYXV0b19ib209ZnVuY3Rpb24oYmxvYil7aWYoL15ccyooPzp0ZXh0XC9cUyp8YXBwbGljYXRpb25cL3htbHxcUypcL1xTKlwreG1sKVxzKjsuKmNoYXJzZXRccyo9XHMqdXRmLTgvaS50ZXN0KGJsb2IudHlwZSkpe3JldHVybiBuZXcgQmxvYihbIlx1ZmVmZiIsYmxvYl0se3R5cGU6YmxvYi50eXBlfSl9cmV0dXJuIGJsb2J9LEZpbGVTYXZlcj1mdW5jdGlvbihibG9iLG5hbWUsbm9fYXV0b19ib20pe2lmKCFub19hdXRvX2JvbSl7YmxvYj1hdXRvX2JvbShibG9iKX12YXIgZmlsZXNhdmVyPXRoaXMsdHlwZT1ibG9iLnR5cGUsYmxvYl9jaGFuZ2VkPWZhbHNlLG9iamVjdF91cmwsdGFyZ2V0X3ZpZXcsZGlzcGF0Y2hfYWxsPWZ1bmN0aW9uKCl7ZGlzcGF0Y2goZmlsZXNhdmVyLCJ3cml0ZXN0YXJ0IHByb2dyZXNzIHdyaXRlIHdyaXRlZW5kIi5zcGxpdCgiICIpKX0sZnNfZXJyb3I9ZnVuY3Rpb24oKXtpZih0YXJnZXRfdmlldyYmaXNfc2FmYXJpJiZ0eXBlb2YgRmlsZVJlYWRlciE9PSJ1bmRlZmluZWQiKXt2YXIgcmVhZGVyPW5ldyBGaWxlUmVhZGVyO3JlYWRlci5vbmxvYWRlbmQ9ZnVuY3Rpb24oKXt2YXIgYmFzZTY0RGF0YT1yZWFkZXIucmVzdWx0O3RhcmdldF92aWV3LmxvY2F0aW9uLmhyZWY9ImRhdGE6YXR0YWNobWVudC9maWxlIitiYXNlNjREYXRhLnNsaWNlKGJhc2U2NERhdGEuc2VhcmNoKC9bLDtdLykpO2ZpbGVzYXZlci5yZWFkeVN0YXRlPWZpbGVzYXZlci5ET05FO2Rpc3BhdGNoX2FsbCgpfTtyZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtmaWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuSU5JVDtyZXR1cm59aWYoYmxvYl9jaGFuZ2VkfHwhb2JqZWN0X3VybCl7b2JqZWN0X3VybD1nZXRfVVJMKCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpfWlmKHRhcmdldF92aWV3KXt0YXJnZXRfdmlldy5sb2NhdGlvbi5ocmVmPW9iamVjdF91cmx9ZWxzZXt2YXIgbmV3X3RhYj12aWV3Lm9wZW4ob2JqZWN0X3VybCwiX2JsYW5rIik7aWYobmV3X3RhYj09dW5kZWZpbmVkJiZpc19zYWZhcmkpe3ZpZXcubG9jYXRpb24uaHJlZj1vYmplY3RfdXJsfX1maWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuRE9ORTtkaXNwYXRjaF9hbGwoKTtyZXZva2Uob2JqZWN0X3VybCl9LGFib3J0YWJsZT1mdW5jdGlvbihmdW5jKXtyZXR1cm4gZnVuY3Rpb24oKXtpZihmaWxlc2F2ZXIucmVhZHlTdGF0ZSE9PWZpbGVzYXZlci5ET05FKXtyZXR1cm4gZnVuYy5hcHBseSh0aGlzLGFyZ3VtZW50cyl9fX0sY3JlYXRlX2lmX25vdF9mb3VuZD17Y3JlYXRlOnRydWUsZXhjbHVzaXZlOmZhbHNlfSxzbGljZTtmaWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuSU5JVDtpZighbmFtZSl7bmFtZT0iZG93bmxvYWQifWlmKGNhbl91c2Vfc2F2ZV9saW5rKXtvYmplY3RfdXJsPWdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7c2V0VGltZW91dChmdW5jdGlvbigpe3NhdmVfbGluay5ocmVmPW9iamVjdF91cmw7c2F2ZV9saW5rLmRvd25sb2FkPW5hbWU7Y2xpY2soc2F2ZV9saW5rKTtkaXNwYXRjaF9hbGwoKTtyZXZva2Uob2JqZWN0X3VybCk7ZmlsZXNhdmVyLnJlYWR5U3RhdGU9ZmlsZXNhdmVyLkRPTkV9KTtyZXR1cm59aWYodmlldy5jaHJvbWUmJnR5cGUmJnR5cGUhPT1mb3JjZV9zYXZlYWJsZV90eXBlKXtzbGljZT1ibG9iLnNsaWNlfHxibG9iLndlYmtpdFNsaWNlO2Jsb2I9c2xpY2UuY2FsbChibG9iLDAsYmxvYi5zaXplLGZvcmNlX3NhdmVhYmxlX3R5cGUpO2Jsb2JfY2hhbmdlZD10cnVlfWlmKHdlYmtpdF9yZXFfZnMmJm5hbWUhPT0iZG93bmxvYWQiKXtuYW1lKz0iLmRvd25sb2FkIn1pZih0eXBlPT09Zm9yY2Vfc2F2ZWFibGVfdHlwZXx8d2Via2l0X3JlcV9mcyl7dGFyZ2V0X3ZpZXc9dmlld31pZighcmVxX2ZzKXtmc19lcnJvcigpO3JldHVybn1mc19taW5fc2l6ZSs9YmxvYi5zaXplO3JlcV9mcyh2aWV3LlRFTVBPUkFSWSxmc19taW5fc2l6ZSxhYm9ydGFibGUoZnVuY3Rpb24oZnMpe2ZzLnJvb3QuZ2V0RGlyZWN0b3J5KCJzYXZlZCIsY3JlYXRlX2lmX25vdF9mb3VuZCxhYm9ydGFibGUoZnVuY3Rpb24oZGlyKXt2YXIgc2F2ZT1mdW5jdGlvbigpe2Rpci5nZXRGaWxlKG5hbWUsY3JlYXRlX2lmX25vdF9mb3VuZCxhYm9ydGFibGUoZnVuY3Rpb24oZmlsZSl7ZmlsZS5jcmVhdGVXcml0ZXIoYWJvcnRhYmxlKGZ1bmN0aW9uKHdyaXRlcil7d3JpdGVyLm9ud3JpdGVlbmQ9ZnVuY3Rpb24oZXZlbnQpe3RhcmdldF92aWV3LmxvY2F0aW9uLmhyZWY9ZmlsZS50b1VSTCgpO2ZpbGVzYXZlci5yZWFkeVN0YXRlPWZpbGVzYXZlci5ET05FO2Rpc3BhdGNoKGZpbGVzYXZlciwid3JpdGVlbmQiLGV2ZW50KTtyZXZva2UoZmlsZSl9O3dyaXRlci5vbmVycm9yPWZ1bmN0aW9uKCl7dmFyIGVycm9yPXdyaXRlci5lcnJvcjtpZihlcnJvci5jb2RlIT09ZXJyb3IuQUJPUlRfRVJSKXtmc19lcnJvcigpfX07IndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgYWJvcnQiLnNwbGl0KCIgIikuZm9yRWFjaChmdW5jdGlvbihldmVudCl7d3JpdGVyWyJvbiIrZXZlbnRdPWZpbGVzYXZlclsib24iK2V2ZW50XX0pO3dyaXRlci53cml0ZShibG9iKTtmaWxlc2F2ZXIuYWJvcnQ9ZnVuY3Rpb24oKXt3cml0ZXIuYWJvcnQoKTtmaWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuRE9ORX07ZmlsZXNhdmVyLnJlYWR5U3RhdGU9ZmlsZXNhdmVyLldSSVRJTkd9KSxmc19lcnJvcil9KSxmc19lcnJvcil9O2Rpci5nZXRGaWxlKG5hbWUse2NyZWF0ZTpmYWxzZX0sYWJvcnRhYmxlKGZ1bmN0aW9uKGZpbGUpe2ZpbGUucmVtb3ZlKCk7c2F2ZSgpfSksYWJvcnRhYmxlKGZ1bmN0aW9uKGV4KXtpZihleC5jb2RlPT09ZXguTk9UX0ZPVU5EX0VSUil7c2F2ZSgpfWVsc2V7ZnNfZXJyb3IoKX19KSl9KSxmc19lcnJvcil9KSxmc19lcnJvcil9LEZTX3Byb3RvPUZpbGVTYXZlci5wcm90b3R5cGUsc2F2ZUFzPWZ1bmN0aW9uKGJsb2IsbmFtZSxub19hdXRvX2JvbSl7cmV0dXJuIG5ldyBGaWxlU2F2ZXIoYmxvYixuYW1lLG5vX2F1dG9fYm9tKX07aWYodHlwZW9mIG5hdmlnYXRvciE9PSJ1bmRlZmluZWQiJiZuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYil7cmV0dXJuIGZ1bmN0aW9uKGJsb2IsbmFtZSxub19hdXRvX2JvbSl7aWYoIW5vX2F1dG9fYm9tKXtibG9iPWF1dG9fYm9tKGJsb2IpfXJldHVybiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihibG9iLG5hbWV8fCJkb3dubG9hZCIpfX1GU19wcm90by5hYm9ydD1mdW5jdGlvbigpe3ZhciBmaWxlc2F2ZXI9dGhpcztmaWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuRE9ORTtkaXNwYXRjaChmaWxlc2F2ZXIsImFib3J0Iil9O0ZTX3Byb3RvLnJlYWR5U3RhdGU9RlNfcHJvdG8uSU5JVD0wO0ZTX3Byb3RvLldSSVRJTkc9MTtGU19wcm90by5ET05FPTI7RlNfcHJvdG8uZXJyb3I9RlNfcHJvdG8ub253cml0ZXN0YXJ0PUZTX3Byb3RvLm9ucHJvZ3Jlc3M9RlNfcHJvdG8ub253cml0ZT1GU19wcm90by5vbmFib3J0PUZTX3Byb3RvLm9uZXJyb3I9RlNfcHJvdG8ub253cml0ZWVuZD1udWxsO3JldHVybiBzYXZlQXN9KHR5cGVvZiBzZWxmIT09InVuZGVmaW5lZCImJnNlbGZ8fHR5cGVvZiB3aW5kb3chPT0idW5kZWZpbmVkIiYmd2luZG93fHx0aGlzLmNvbnRlbnQpO2lmKHR5cGVvZiBtb2R1bGUhPT0idW5kZWZpbmVkIiYmbW9kdWxlLmV4cG9ydHMpe21vZHVsZS5leHBvcnRzLnNhdmVBcz1zYXZlQXN9ZWxzZSBpZih0eXBlb2YgZGVmaW5lIT09InVuZGVmaW5lZCImJmRlZmluZSE9PW51bGwmJmRlZmluZS5hbWQhPW51bGwpe2RlZmluZShbXSxmdW5jdGlvbigpe3JldHVybiBzYXZlQXN9KX0NCg==";
    
   var saveObject64="ICAgIHRoaXMuc2F2ZU9iamVjdD1mdW5jdGlvbigpew0KICAgICAgICB2YXIgZSA9IHdpbmRvdy5ldmVudC5zcmNFbGVtZW50Ow0KDQogICAgICAgIHZhciBvYmplY3REYXRhPWUucHJldmlvdXNTaWJsaW5nLmdldEF0dHJpYnV0ZSgnZGF0YScpOw0KICAgICAgICB2YXIgdHlwPWUucHJldmlvdXNTaWJsaW5nLmdldEF0dHJpYnV0ZSgndHlwZScpOw0KICAgICAgICB2YXIgbmFtZT1lLnByZXZpb3VzU2libGluZy5nZXRBdHRyaWJ1dGUoJ25hbWUnKTsNCiAgICAgICAgdmFyIGluZGV4PW9iamVjdERhdGEuaW5kZXhPZignLCcpOw0KICAgICAgIA0KICAgICAgICB2YXIgYnl0ZUNoYXJhY3RlcnMgPSBhdG9iKG9iamVjdERhdGEuc3Vic3RyaW5nKGluZGV4KzEpKTsNCiAgdmFyIGJ5dGVBcnJheXMgPSBbXTsgIA0KICB2YXIgc2xpY2VTaXplPTUxMjsNCg0KICBmb3IgKHZhciBvZmZzZXQgPSAwOyBvZmZzZXQgPCBieXRlQ2hhcmFjdGVycy5sZW5ndGg7IG9mZnNldCArPSBzbGljZVNpemUpIHsNCiAgICB2YXIgc2xpY2UgPSBieXRlQ2hhcmFjdGVycy5zbGljZShvZmZzZXQsIG9mZnNldCArIHNsaWNlU2l6ZSk7DQoNCiAgICB2YXIgYnl0ZU51bWJlcnMgPSBuZXcgQXJyYXkoc2xpY2UubGVuZ3RoKTsNCiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlLmxlbmd0aDsgaSsrKSB7DQogICAgICBieXRlTnVtYmVyc1tpXSA9IHNsaWNlLmNoYXJDb2RlQXQoaSk7DQogICAgfQ0KDQogICAgdmFyIGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ5dGVOdW1iZXJzKTsNCg0KICAgIGJ5dGVBcnJheXMucHVzaChieXRlQXJyYXkpOw0KICB9DQogICAgICAgIA0KICAgIHZhciBibG9iID0gbmV3IEJsb2IoYnl0ZUFycmF5cywge3R5cGU6IHR5cH0pOw0KCQkJc2F2ZUFzKGJsb2IsIG5hbWUpOw0KICAgIH0=";
	top();
	var druckansicht=false;
    var sichtbarkeiten=[1,0,1,1,1,1,1,1,1,1];
    var magicString="JEIF?EJFM?jmEHl§/87h78§FHLhl§F";
	var breite=998,hoehe=701; //701
	var breiteStandard=998, hoeheStandard=701;
	bearbeitungAn=false;
    var bearbeitungsTyp="";
	var aktuellerDateiname="";
	var aktuellesBild="";
	var zeichenbreite=0,zeichenhoehe=0,hochkant=false;
    var clipboard="";
    var knoepfe="<select class='sichtbarkeit'>";
	for (var i = 0; i < 10; i++) {
		if (i==0) {
			knoepfe += "<option selected sichtbarkeit='" + i + "'>" + i + "</option> ";
		} else {
			knoepfe += "<option sichtbarkeit='" + i + "'>" + i + "</option> ";
		
		}
	}
	knoepfe+="</select>";
    
    $(document).on("change",".sichtbarkeit",function(event) {
			event.preventDefault();
			var index=parseInt($(this).prop("selectedIndex"));
		    $(this).parent().prev().attr("sichtbarkeit",index);
			updateSichtbarkeit();
            
		});
    
    function updateSichtbarkeit(){
        $(".tshareElement").each(function(){
            var sichtbarkeitsebene=parseInt($(this).attr("sichtbarkeit"));
            if (sichtbarkeiten[sichtbarkeitsebene]==0){
                $(this).attr("visibility","hidden");
            } else {
                $(this).removeAttr("visibility");
            }
        });
    }
    knoepfe=""; // sichtbarkeit später einbauen
    
    var knopfJS="<span><button class='loeschen imageTonne oben'></button><button class='markieren imageSelect oben'></button><button class='kopiereAbschnitt imageCopy oben'></button><button class='einfuegen imageInsertInternal unten'></button><button class='einfuegenClipboard imagePaste unten'></button>"+knoepfe+"</span><button class='neueZeichenflaeche imageJournal unten' ></button><button class='pdf imagePDF unten'></button><button class='markdownEinfuegen imageNew unten'></button><button class='bildEinfuegen imageOpen unten'></button>";
   
	//$("body").html("<button id='druckansicht'>Druckansicht</button><button id='speichern'>Speichern</button><br><button class='neueZeichenflaeche' >Neue Zeichenfläche</button>");
	//QreatorBezier.init("#zeichnen");
	
	
	function left(){
		$("#header").removeClass("menuLeft").removeClass("menuRight").removeClass("menuTop").removeClass("menuBottom");
		$("#header").addClass("menuLeft");
		$("#content").removeClass("moveLeft").removeClass("moveDown").removeClass("moveUp");
		$("#content").addClass("moveLeft");
		$("[position='left']").hide();
		$("[position='right']").show();
		$("[position='top']").show();
		$("[position='bottom']").show();
		$(".auswahl").removeClass("selectMenu");
		$(".auswahl").addClass("selectMenu");
		
	}
	
	function right(){
		$("#header").removeClass("menuLeft").removeClass("menuRight").removeClass("menuTop").removeClass("menuBottom");
		$("#content").removeClass("moveLeft").removeClass("moveDown").removeClass("moveUp");
		$("#header").addClass("menuRight");
		$("[position='right']").hide();
		$("[position='left']").show();
		$("[position='top']").show();
		$("[position='bottom']").show();
		$(".auswahl").removeClass("selectMenu");
		$(".auswahl").addClass("selectMenu");
	}
	
	function top(){
		$("#header").removeClass("menuLeft").removeClass("menuRight").removeClass("menuTop").removeClass("menuBottom");
		$("#header").addClass("menuTop");
		$("#content").removeClass("moveLeft").removeClass("moveDown").removeClass("moveUp");
		$("#content").addClass("moveDown");
		$("[position='top']").hide();
		$("[position='right']").show();
		$("[position='left']").show();
		$("[position='bottom']").show();
		$(".auswahl").removeClass("selectMenu");
		
	}
	
	function bottom(){
		$("#header").removeClass("menuLeft").removeClass("menuRight").removeClass("menuTop").removeClass("menuBottom");
		$("#header").addClass("menuBottom");
		$("#content").removeClass("moveLeft").removeClass("moveDown").removeClass("moveUp");
		$("#content").addClass("moveUp");
		$("[position='bottom']").hide();
		$("[position='top']").show();
		$("[position='right']").show();
		$("[position='left']").show();
		$(".auswahl").removeClass("selectMenu");
		
	}
    
    $(document).ready(function(){
        new Clipboard('#kopieren',{
    text: function(trigger) {
        return holeMarkierteAbschnitteAlsString();
    }})

    });
    
    $(document).ready(function(){
        new Clipboard('.kopiereAbschnitt',{
    text: function(trigger) {
        
         raeumeAuf();
        var clipboardIntern="";
        var klasse="";
       var tshareElement=$(trigger).parent().prev();
        if (tshareElement.hasClass("markdown")){
                   klasse="markdown adoccss";
               } else if (tshareElement.hasClass("zeichenflaeche")){
                   klasse="zeichenflaeche zeichenflaecheKlick";
               } else if (tshareElement.hasClass("datei")){
                   klasse="datei";
               }
              clipboardIntern="<div class='tshareElement "+klasse+"'>"+$(trigger).parent().prev().html()+"</div>"+knopfJS;
            clipboard=clipboardIntern;
           return magicString+clipboardIntern;
       }
        } 
    )});

   
	
	window.addEventListener("beforeunload", function (e) {
		  var confirmationMessage = "Eventuelle Änderungen am Dokument könnten verloren gehen!";

		  e.returnValue = confirmationMessage;     // Gecko, Trident, Chrome 34+
		  return confirmationMessage;              // Gecko, WebKit, Chrome <34
		});
	
	document.addEventListener('paste', handlePaste, false);

	//$(document).bind("paste", function(e){
	//var evt=e.originalEvent;
    function handlePaste(evt) {
    	if ($("#rahmen").length==1 && $(".transparent").length==0){
      var fileList = evt.clipboardData.items; // Note that window.DataTransfer.files is not applicable.

      if (!fileList) {
        console.log("fileList is null.");
        return;
      }

      for (var i = 0; i < fileList.length; i++) {
        var file = fileList[i];
        if (file.type.startsWith("image/")){
        	var datei=file.getAsFile();
        	var fileReader = new FileReader();
    	    fileReader.onload = function(e) {
    	    	
    	    
    			aktuellesBild=new Image();
    			aktuellesBild.onload=function(){
    				//ctx.drawImage(this,0,0);
    				//var pngString=canvas.toDataURL();  // bild erst skalieren
    				zeichenbreite=0,zeichenhoehe=0;
    				hochkant=true;
    				if (this.width>this.height){
    					hochkant=false;
    				}
    				
    				if (hochkant==true){
    					zeichenhoehe=Math.min(hoehe,this.height);
    					if (zeichenhoehe<hoehe){
    						zeichenhoehe=hoehe;
    					}
    					zeichenbreite=this.width*zeichenhoehe/this.height;
    					if (zeichenbreite>breite){
    						zeichenhoehe=zeichenhoehe*breite/zeichenbreite;
    						zeichenbreite=breite;
    						hochkant=false;
    					}
    				} else {
    					zeichenbreite=Math.min(breite,this.width);
    					if (zeichenbreite<breite){
    						zeichenbreite=breite;
    					}
    					zeichenhoehe=this.height*zeichenbreite/this.width;
    					if (zeichenhoehe>hoehe){
    						zeichenbreite=zeichenbreite*hoehe/zeichenhoehe;
    						zeichenhoehe=hoehe;
    						hochkant=true;
    					}
    				}
    				
    				$("body").append("<div class='transparent'></div>");
    				$(".transparent").append("<div class='fenster'><div id='parameter'></div><button id='abbrechenBild'>Abbrechen</button></div>");
    				
    				if (hochkant==false){
    					$(".fenster #parameter").html("<br>Breite (in Prozent von Abschnittsbreite): <input typ='breite' class='parameter' type='range' min='0' max='100' value='"+parseInt(zeichenbreite*100/breite)+"'></input><span id='breite'>"+parseInt(zeichenbreite*100/breite)+"</span>%, Höhe:<span id='hoehe'>"+parseInt(zeichenhoehe*100/hoehe)+"</span>%");
    				} else {
    					$(".fenster #parameter").html("<br>Höhe (in Prozent von Abschnittshöhe): <input typ='hoehe' class='parameter' type='range' min='0' max='100' value='"+parseInt(zeichenhoehe*100/hoehe)+"'></input><span id='hoehe'>"+parseInt(zeichenhoehe*100/hoehe)+"</span>%, Breite: <span id='breite'>"+parseInt(zeichenbreite*100/breite)+"</span>%");
    					
    				}
    				$(".fenster #parameter").append("<br>x-Position links oben:  <input typ='x' class='parameter' type='range' min='0' max='100' value='0'></input><span id='xpos'>0</span><button class='mittig' typ='links'>linksbündig</button><button class='mittig' typ='xmitte'>horizontal zentrieren</button><button class='mittig' typ='rechts'>rechtsbündig</button>");
    				$(".fenster #parameter").append("<br>y-Position links oben:  <input typ='y' class='parameter' type='range' min='0' max='100' value='0'></input><span id='ypos'>0</span><button class='mittig' typ='oben'>oben bündig</button><button class='mittig' typ='ymitte'>vertikal zentrieren</button><button class='mittig' typ='unten'>unten bündig</button>");
    				$(".fenster #parameter").append("<br><button id='bildEinfuegen'>Bild einfügen</button>");
    				QreatorBezier.ladeBild(aktuellesBild,0,0,zeichenbreite,zeichenhoehe,false);
    				
    				//QreatorBezier.ladeBild(this);
    		       //$(".transparent").remove();
    			}
    			aktuellesBild.src=e.target.result;
    			   // ctx.drawImage(img, 0, 0, 400, 300);   
    			    
    			
    	      
    	    };
    	    fileReader.onerror = function(e) {
    	        console.log(e.target.error.name);
    	    };
    	    fileReader.onprogress = function(e) {
    	        console.log(e.loaded, e.total);
    	    };
    	    fileReader.readAsDataURL(datei);
    		
        }
        
       
      } // for
    	}
    } // handlePaste
	//);
	
	function holeZeitstempel(){
		var jetzt=new Date();
		var monat=jetzt.getMonth()+1;
		var monatsstring="";
		if (monat<10){
			monatsstring="0";
		}
		monatsstring+=monat;
		
		var tag=jetzt.getDate();
		var tagesstring="";
		if (tag<10){
			tagesstring="0";
		}
		tagesstring+=tag;
		
		var stundenstring="";
		var stunde=jetzt.getHours();
		if (stunde<10){
			stundenstring="0";
		}
		stundenstring+=stunde;
		
		var minutenstring="";
		var minute=jetzt.getMinutes();
		if (minute<10){
			minutenstring="0";
		}
		minutenstring+=minute;
		
		var sekundenstring="";
		var sekunde=jetzt.getSeconds();
		if (sekunde<10){
			sekundenstring="0";
		}
		sekundenstring+=sekunde;
		return ""+(1900+jetzt.getYear())+monatsstring+tagesstring+"_"+stundenstring+minutenstring+sekundenstring;
	}
	
	$("#speichern").click(function(){
		raeumeAuf();
		
		$("body").append("<div class='transparent'></div>");
		var platzhalter=aktuellerDateiname;
		if (aktuellerDateiname==""){
			platzhalter="Notiz";
		}
		$(".transparent").append("<div class='fenster'>Speichern der aktuellen Datei (Zeitstempel und Endung werden angehängt)<br>Dateiname: <input type='text' id='dateiname' value='"+platzhalter+"'></input><input type='checkbox' id='checkEditor'>Editor in Datei einbetten</input><br><button id='speichereDatei'>Speichern</button><button id='abbrechen'>Abbrechen</button></div>");
		
		
	});
	
	$("#menuansicht").click(function(){
		$("body").append("<div class='transparent'></div>");
		$(".transparent").append("<div class='fenster'>Position des Menüs wählen:<br><button class='menu-position' position='left'>Menü links</button><button class='menu-position' position='top'>Menü oben</button><button class='menu-position' position='bottom'>Menü unten</button><button class='menu-position' position='right'>Menü rechts</button><br><button id='abbrechen'>Abbrechen</button></div>");
		$(".fenster").append('<p>Info:<br><div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a>, <a href="http://www.flaticon.com/authors/yannick" title="Yannick">Yannick</a>, <a href="http://www.flaticon.com/authors/picol" title="Picol">Picol</a>, <a href="http://www.flaticon.com/authors/situ-herrera" title="Situ Herrera">Situ Herrera</a>, <a href="http://www.flaticon.com/authors/freepik">freepik</a>, <a href="http://www.flaticon.com/authors/egor-rumyantsev" title="Egor Rumyantsev">Egor Rumyantsev</a>, <a href="http://fontawesome.io/" title="Dave Gandy">Dave Gandy</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a>             is licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a></div>');
        
        
	});
		
    function sammelSchriften(speicherAlles){
        var gesamtText="";
        var tags=[".katex .delimsizing.size1",".katex .delimsizing.size2",".katex .delimsizing.size3",".katex .delimsizing.size4",".katex .delimsizing.mult .delim-size1 > span",".katex .delimsizing.mult .delim-size4 > span",".katex .op-symbol.small-op",".katex .op-symbol.large-op",".katex .mathit",".katex .mathbf",".katex .amsrm",".katex .mathbb",".katex .mathcal",".katex .mathfrak",".katex .mathtt",".katex .mathscr",".katex .mathsf",".katex .mainit"];
                var schriften=["KaTeX_Size1","KaTeX_Size2","KaTeX_Size3","KaTeX_Size4","KaTeX_Size1","KaTeX_Size4","KaTeX_Size1","KaTeX_Size2","KaTeX_Main","KaTeX_Main","KaTeX_Math","KaTeX_Main","KaTeX_AMS","KaTeX_AMS","KaTeX_Caligraphic","KaTeX_Fraktur","KaTeX_Typewriter","KaTeX_Script","KaTeX_SansSerif","KaTeX_Main"]
                          

                for (var i=0;i<tags.length;i++){
                    var tagzaehler=0;
                    $(tags[i]).each(function(){
                       var speichern=false; $(this).parents(".tshareElement").next().find(".markieren").each(function(){
                            speichern=$(this).hasClass("aktiv");
                       });
                        if (speichern==true||speicherAlles==true){
                            tagzaehler++;
                        }
                    });
                    //console.log("Tag "+tags[i]+": "+tagzaehler+", Font: "+schriften[i]);
                    tags[i]=tagzaehler;
                }
                var schriftenMenge=new Set();
                for (var i=0;i<tags.length;i++){
                    if (tags[i]>0){
                        schriftenMenge.add(schriften[i]);
                    }
                }
                if (schriftenMenge.size>0) schriftenMenge.add("KaTeX_Main");
                var arraySchriften = Array.from(schriftenMenge);
                console.log("Schriften: ");
                var schriftenText="";
                var cssKatex=$("#katexStyle").text().split("/* KateX_Fonts END */");
                var schriften=cssKatex[0].split("/**/");
                for (var i=0;i<arraySchriften.length;i++) {
                  var item=arraySchriften[i];
                    for (var j=0;j<schriften.length;j++){
                        if (schriften[j].indexOf(item)!=-1){
                            schriftenText+=schriften[j].trim();
                        }
                    }
                }
                
                gesamtText=schriftenText+cssKatex[1];
        /*if (schriftenMenge.size>0){
            gesamtText+=cssKatex[1];
        }*/
                return gesamtText;
    }
    
	$(document).on("click","#speichereDatei",function(){
		var dateiname=$("#dateiname").val();
		var editorSpeichern=$("#checkEditor").prop("checked");
		if (dateiname != null ) {
	    	if (dateiname==""){
	    		dateiname="Notiz";
	    	}
            
           // var js="<script>function nextLayer(evt){var a =evt.firstChild;var zaehler=0;for (var i=0;i<10;i++){var element=a.getElementById('layer_'+i);if (element!=null&&element.getAttribute('visibility')=='hidden'){element.setAttribute('visibility','visible');  break;}zaehler++;}if (zaehler==10){for (var i=0;i<10;i++){var element=a.getElementById('layer_'+i);if (element!=null) {element.setAttribute('visibility','hidden');  } } for (var i=0;i<10;i++){ var element=a.getElementById('layer_'+i);if (element!=null&&element.getAttribute('visibility')=='hidden'){ element.setAttribute('visibility','visible');break; }}}}</script>";
            
            var js="PHNjcmlwdD5mdW5jdGlvbiBuZXh0TGF5ZXIoZXZ0KXt2YXIgYSA9ZXZ0LmZpcnN0Q2hpbGQ7dmFyIHphZWhsZXI9MDtmb3IgKHZhciBpPTA7aTwxMDtpKyspe3ZhciBlbGVtZW50PWEuZ2V0RWxlbWVudEJ5SWQoJ2xheWVyXycraSk7aWYgKGVsZW1lbnQhPW51bGwmJmVsZW1lbnQuZ2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5Jyk9PSdoaWRkZW4nKXtlbGVtZW50LnNldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScsJ3Zpc2libGUnKTsgIGJyZWFrO316YWVobGVyKys7fWlmICh6YWVobGVyPT0xMCl7Zm9yICh2YXIgaT0wO2k8MTA7aSsrKXt2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsKSB7ZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3Zpc2liaWxpdHknLCdoaWRkZW4nKTsgIH0gfSBmb3IgKHZhciBpPTA7aTwxMDtpKyspeyB2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsJiZlbGVtZW50LmdldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScpPT0naGlkZGVuJyl7IGVsZW1lbnQuc2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5JywndmlzaWJsZScpO2JyZWFrOyB9fX19PC9zY3JpcHQ+";
            
        
	    	aktuellerDateiname=dateiname;
	    	var anhang=holeZeitstempel();
	    	$(".transparent").remove();
	    	if (editorSpeichern==true){
	    	var blob = new Blob(["<!DOCTYPE html><html>"+$("html").html()+"</html>"], {type: "text/html;charset=utf-8"});
			saveAs(blob,dateiname+"_Editor_"+anhang+".html");
	    	} else {
			var code="";
                var textElementZaehler=0;
        var dateiElementZaehler=0;
        
            // zähle markierte Elemente
        
            var elementZaehler=0;
            var markiertZaehler=0;
            var speicherAlles=false;
            $(".tshareElement").each(function(){
                elementZaehler++;
                $(this).next().find(".markieren").each(function(){
                    if($(this).hasClass("aktiv")){
                        markiertZaehler++;
                    }
                });
            });
            if (elementZaehler>0&&markiertZaehler==0){
                speicherAlles=true;
            }
        
			$(".tshareElement").each(function(){
				//code+=$(this).html()+"\n";
                var speichern=false;
                $(this).next().find(".markieren").each(function(){
                    speichern=$(this).hasClass("aktiv");
                });
                if (speicherAlles==true){
                    speichern=true; // falls alles gespeichert wird, entsprechend markieren
                }
                if (speichern==true){ 
                if ($(this).hasClass("zeichenflaeche")){
                code+="<div class='zeichenflaeche tshareElement' onClick='nextLayer(this)'>"+$(this).html()+"</div>\n";
                } else if ($(this).hasClass("markdown")){
                    code+="<div class='markdown tshareElement adoccss'>"+$(this).html()+"</div>\n";
                    textElementZaehler++;
                } else if ($(this).hasClass("datei")){
                    dateiElementZaehler++;
                    code+="<div class='datei tshareElement'>"+$(this).html()+"</div>\n";
                }
                }
                
			});
                var gesamtText="";
        var asciidoctorText="";
            if (textElementZaehler>0){ 
                gesamtText=sammelSchriften(speicherAlles);
                asciidoctorText=$("#asciidoctorstyle").text();

                
            } else if (dateiElementZaehler>0){
                asciidoctorText=$("#asciidoctorstyle").text();
            }
                var header="<meta name='description' content='Journal for HTML' ><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
			var blob = new Blob(["<!DOCTYPE html><head>"+header+window.atob(js)+"<script>"+window.atob(saveAs64)+"\n"+window.atob(saveObject64)+"</script><style>"+gesamtText+asciidoctorText+"</style></head><html>"+code+"</html>"], {type: "text/html;charset=utf-8"});
			saveAs(blob, dateiname+"_"+anhang+".html");
	    	}
		
	    }

		//window.open("data:text/csv,<!DOCTYPE html><html>"+$("html").html()+"</html>");
		//var blob = new Blob(["<!DOCTYPE html><html>"+$("html").html()+"</html>"], {type: "text/html;charset=utf-8"});
		//saveAs(blob, "hello world.html");
	});
	$("#druckansicht").click(function(){
	
			raeumeAuf();
			//$(".loeschen").hide();
			//$(".neueZeichenflaeche").hide();
			//druckansicht=true;
			
			// neu: alle svg-teile sammeln und dann in neuem fenster darstellen
		
             var js="PHNjcmlwdD5mdW5jdGlvbiBuZXh0TGF5ZXIoZXZ0KXt2YXIgYSA9ZXZ0LmZpcnN0Q2hpbGQ7dmFyIHphZWhsZXI9MDtmb3IgKHZhciBpPTA7aTwxMDtpKyspe3ZhciBlbGVtZW50PWEuZ2V0RWxlbWVudEJ5SWQoJ2xheWVyXycraSk7aWYgKGVsZW1lbnQhPW51bGwmJmVsZW1lbnQuZ2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5Jyk9PSdoaWRkZW4nKXtlbGVtZW50LnNldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScsJ3Zpc2libGUnKTsgIGJyZWFrO316YWVobGVyKys7fWlmICh6YWVobGVyPT0xMCl7Zm9yICh2YXIgaT0wO2k8MTA7aSsrKXt2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsKSB7ZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3Zpc2liaWxpdHknLCdoaWRkZW4nKTsgIH0gfSBmb3IgKHZhciBpPTA7aTwxMDtpKyspeyB2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsJiZlbGVtZW50LmdldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScpPT0naGlkZGVuJyl7IGVsZW1lbnQuc2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5JywndmlzaWJsZScpO2JyZWFrOyB9fX19PC9zY3JpcHQ+";
            
			var code="";
                var textElementZaehler=0;
        var dateiElementZaehler=0;
        
            // zähle markierte Elemente
        
            var elementZaehler=0;
            var markiertZaehler=0;
            var speicherAlles=false;
            $(".tshareElement").each(function(){
                elementZaehler++;
                $(this).next().find(".markieren").each(function(){
                    if($(this).hasClass("aktiv")){
                        markiertZaehler++;
                    }
                });
            });
            if (elementZaehler>0&&markiertZaehler==0){
                speicherAlles=true;
            }
        
			$(".tshareElement").each(function(){
				//code+=$(this).html()+"\n";
                var speichern=false;
                $(this).next().find(".markieren").each(function(){
                    speichern=$(this).hasClass("aktiv");
                });
                if (speicherAlles==true){
                    speichern=true; // falls alles gespeichert wird, entsprechend markieren
                }
                if (speichern==true){ 
                if ($(this).hasClass("zeichenflaeche")){
                code+="<div class='zeichenflaeche tshareElement' onClick='nextLayer(this)'>"+$(this).html()+"</div>\n";
                } else if ($(this).hasClass("markdown")){
                    code+="<div class='markdown tshareElement adoccss'>"+$(this).html()+"</div>\n";
                    textElementZaehler++;
                } else if ($(this).hasClass("datei")){
                    dateiElementZaehler++;
                    code+="<div class='datei tshareElement'>"+$(this).html()+"</div>\n";
                }
                }
                
			});
                var gesamtText="";
        var asciidoctorText="";
            if (textElementZaehler>0){ 
                gesamtText=sammelSchriften(speicherAlles);
                asciidoctorText=$("#asciidoctorstyle").text();

                
            } else if (dateiElementZaehler>0){
                asciidoctorText=$("#asciidoctorstyle").text();
            }
            var header="<meta name='description' content='Journal for HTML' ><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
			var w=window.open();
			w.document.open();
			w.document.write("<!DOCTYPE html><head>"+header+window.atob(js)+"<script>"+window.atob(saveAs64)+"\n"+window.atob(saveObject64)+"</script><style>"+gesamtText+asciidoctorText+"</style></head><html>"+code+"</html>");
			//w.document.close();
			//window.open("data:text/html,<!DOCTYPE html><html>"+code+"</html>");
			
			
			
		
	});
	

	
	
	$(document).on("click",".menu-position",function(){
		var orientation=$(this).attr("position");
		$(".transparent").remove();
		switch (orientation){
			case "left":
				left();
				break;
			case "right":
				right();
				break;
			case "bottom":
				bottom();
				break;
			default:
				top();
		}
	});
	
	$(document).on("click",".neueZeichenflaeche",function(){
		raeumeAuf();
		$(this).next().next().next().after("<div class='zeichenflaeche' id='zeichnung'></div>"+knopfJS); // wo erscheint der neue Abschnitt
		bearbeitungAn=true;
        bearbeitungsTyp="zeichenflaeche";
		breite=breiteStandard;
		hoehe=hoeheStandard;
		QreatorBezier.init("#zeichnung",breiteStandard,hoeheStandard,"#menu", true); // menu: id der fläche, wo das menü erscheint, true, dass es horizontal ist
		
	
	});
    
    $(document).on("click",".markieren",function(){
        raeumeAuf();
        $(this).toggleClass("aktiv");
    });
    
    $("#markiereAlle").click(function(){
        raeumeAuf();
        // elemente zaehlen
        var zaehlerElemente=0;
        $(".tshareElement").each(function(){
           zaehlerElemente++; 
        });
        var zaehlerMarkiert=0;
        $(".markieren").each(function(){
           if ($(this).hasClass("aktiv")){
               zaehlerMarkiert++;
           }
        });
        if (zaehlerMarkiert<zaehlerElemente){
            $(".markieren").each(function(){
                $(this).removeClass("aktiv").addClass("aktiv");
            })
        } else {
            $(".markieren").each(function(){
               $(this).removeClass("aktiv");
            });
        }
    });
    
    $("#auswahlLoeschen").click(function(){
        var nachfrage=confirm("Sind Sie sicher, dass die gewählten Abschnitte inklusive aller Inhalte entfernt werden soll? Dieser Schritt kann nicht rückgängig gemacht werden!");
		if (nachfrage==true){
            raeumeAuf();
        $(".markieren").each(function(){
            if ($(this).hasClass("aktiv")){
            
		$(this).parent().prev().remove(); //zeichenflaeche
		$(this).parent().next().remove(); //neu-knopf
		$(this).parent().next().remove(); // pdf einfügen
            
            $(this).parent().next().remove(); // Textabschnitt einfügen
            $(this).parent().next().remove(); // Bild einfügen
		$(this).parent().remove(); // knopf selber
            }
            });
		}
                             
    });
    
    $(document).on("click",".einfuegenClipboard",function(){
        $(this).parent().next().next().next().next().after("<div id='einsetzen'></div>");
        $("body").append("<div class='transparent'></div>");
		$(".transparent").append("<div class='fenster'><p>Bitte fügen Sie den Inhalt des Clipboards in das Textfeld ein (z. B. per Strg+V) und drücken Sie dann den Knopf \"Einfügen\"</p><textarea id='clipboardExtern' required='required' ></textArea><button id='clipboardExternEinfuegen'>Einfügen in Dokument</button><button id='abbrechen'>Abbrechen</button></div>");
    });
    
    $(document).on("click","#clipboardExternEinfuegen", function(){
        var inhalt=$("#clipboardExtern").val();
        if (inhalt.startsWith(magicString)){
              var nachfrage=confirm("Sind Sie sicher, dass dieser Abschnitt eingefügt werden soll? Dieser Schritt kann nicht mehr rückgängig gemacht werden!");
		if (nachfrage==true){
            raeumeAuf();
            
            $("#einsetzen").after(inhalt.substring(magicString.length,inhalt.length));
            $(".transparent").remove();
            $("#einsetzen").remove();
        }
        } else {
            window.alert("Der Inhalt hat das falsche Format. Es können nur Inhalte aus Tshare eingefügt werden.")
        }
        
    });
    
    $(document).on("click",".einfuegen",function(){
       
            raeumeAuf();
            $(this).parent().next().next().next().next().after(clipboard);
        
        
    });
    
  
    
    function holeMarkierteAbschnitteAlsString(){
        var clipboardIntern="";
        raeumeAuf();
       $(".markieren").each(function(){
           if ($(this).hasClass("aktiv")){
               var tshareElement=$(this).parent().prev();
               var klasse="";
               if (tshareElement.hasClass("markdown")){
                   klasse="markdown adoccss";
               } else if (tshareElement.hasClass("zeichenflaeche")){
                   klasse="zeichenflaeche zeichenflaecheKlick";
               } else if (tshareElement.hasClass("datei")){
                   klasse="datei";
               }
               clipboardIntern+="<div class='tshareElement "+klasse+"'>"+$(this).parent().prev().html()+"</div>"+knopfJS;
           }
       }) ;
        clipboard=clipboardIntern;
        clipboardIntern=magicString+clipboardIntern;
    
        return clipboardIntern;
    }
    
   /* $("#kopieren").click(function(){
    clipboard="";
        raeumeAuf();
       $(".markieren").each(function(){
           if ($(this).hasClass("aktiv")){
               var tshareElement=$(this).parent().prev();
               var klasse="";
               if (tshareElement.hasClass("markdown")){
                   klasse="markdown";
               } else if (tshareElement.hasClass("zeichnung")){
                   klasse="zeichnung";
               } else if (tshareElement.hasClass("datei")){
                   klasse="datei";
               }
               clipboard+="<div class='tshareElement "+klasse+"'>"+$(this).parent().prev().html()+"</div>"+knopfJS;
           }
       }) ;
        clipboard=magicString+clipboard;
    });*/
    
    
    $(document).on("click",".markdownEinfuegen",function(){
		raeumeAuf();
		$(this).next().after("<div class='markdown tshareElement' id='markdown'></div>"+knopfJS); // wo erscheint der neue Abschnitt
        
        bearbeitungAn=true;
        bearbeitungsTyp="markdown";
		Textabschnitt.init("#markdown","#menu");
		
		
		
	
	});
    
    $(document).on("click",".changeSeparator",function(){
        raeumeAuf();
        var status=0;
        var statusAlt=0;
        statusAlt=parseInt($(this).parent().prev(".tshareElement").attr("status"));
        if (statusAlt==undefined||isNaN(statusAlt)){
            statusAlt=0;
        }
        status=(statusAlt+1)%3;
        var ergebnis=$(this).parent().prev(".datei").find("hr");
        ergebnis.each(function(){
            
            
            $(this).attr("class","");
            $(this).addClass("style_"+status);
            
            
        });
        $(this).parent().prev(".tshareElement").removeAttr("status");
        $(this).parent().prev(".tshareElement").attr("status",status);
        //$(this).parent().prev(".tshareElement").removeClass("statusFarbeKnopf_"+statusAlt);
        //$(this).parent().prev(".tshareElement").addClass("statusFarbeKnopf_"+status);
        $(this).removeClass("statusFarbeKnopf_"+statusAlt);
        $(this).addClass("statusFarbeKnopf_"+status);
        
    });
    
    $(document).on("click",".bildEinfuegen",function(){
		raeumeAuf();
		$(this).after("<div id='einsetzen'></div>"); // direkt nach Bild einfügen
		$("body").append("<div class='transparent'></div>");
		$(".transparent").append("<div class='fenster'><input id='bildInput' type='file' required='required' ></input><button id='abbrechen'>Abbrechen</button><div id='parameter'></div></div>");
		//$(".transparent").append("<div class='fenster'><input id='pdfInput' type='file'  required='required' ></input><button id='abbrechen'>Abbrechen</button><div id='parameter'></div></div>");
		
		$("#bildInput").trigger("click");
		
		/*
		
		$(this).after("<div class='zeichnung' id='zeichnung'></div><button class='loeschen'>Darüber liegende Zeichenfläche löschen</button><button class='neueZeichenflaeche' >Neue Zeichenfläche</button><button class='pdf'>PDF einfügen</button>");
		bearbeitungAn=true;
		QreatorBezier.init("#zeichnung",breite,hoehe,"#menu", true); // menu: id der fläche, wo das menü erscheint, true, dass es horizontal ist
		*/
	
	});
	
	
 
    
    this.saveObject=function(){
        var e = window.event.srcElement;

        var objectData=e.previousSibling.getAttribute('data');
        var typ=e.previousSibling.getAttribute('type');
        var name=e.previousSibling.getAttribute('name');
        var index=objectData.indexOf(',');
       
        var byteCharacters = atob(objectData.substring(index+1));
  var byteArrays = [];  
  var sliceSize=512;

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }
        
    var blob = new Blob(byteArrays, {type: typ});
			saveAs(blob, name);
    }
    
	$(document).on("change","#bildInput",function(){
		var fileList = $("#bildInput")[0].files;
	    var file = fileList[0];
	    

	    var fileReader = new FileReader();
	    fileReader.onload = function(e) {
            $("#bildInput").hide();
	    	    $("#abbrechen").hide().after("<div id='ladeInfo'>Bitte warten ...</div>");
            //var inhalt64=window.btoa(unescape(encodeURIComponent(e.target.result)));
            //if (file.type.split("/")[0]=="pdf"){
                var d=new Date();
                var zeitpunkt=d.getDate()+"."+(d.getMonth()+1)+"."+d.getFullYear()+", "+d.getHours()+":"+("0"+d.getMinutes()).substr(-2)+":"+("0"+d.getSeconds()).substr(-2);
                var infoString="|===\n.3+|icon:file-o[5x]|Dateiname|"+file.name.split(' ').join('_')+"\n|Größe in Bytes|"+file.size+"|Einfügezeitpunkt|"+zeitpunkt+"\n|===";
            
                var options = Opal.hash2(['header_footer', 'attributes'], { 'header_footer': false, 'attributes': ['icons=font'] }); 
                var res = Opal.Asciidoctor.$convert(infoString, options);
            
                $("#einsetzen").before("<div class='datei tshareElement'><div style='background-color: #f8f8f7'><object style='display:none' id='dataNeu' data='' name="+file.name.split(' ').join('_')+" type='"+file.type+"'></object><button onclick='saveObject()'>"+file.name.split(' ').join('_')+" herunterladen</button><div class='adoccss'>"+res+"</div></div></div>"+knopfJS);
                $("#dataNeu").attr("data",e.target.result);
                $("#dataNeu").removeAttr("id");
           // } else {
                /*$("#einsetzen").before("<div class='datei tshareElement'>"+file.name+"<button class='downloadFile' data='"+inhalt64+"' datatype='"+file.type+"' filename='"+file.name+"'>Download</button></div>"+knopfJS);*/
            //}
            $(".transparent").remove();
            $("#einsetzen").remove();
        }
	    fileReader.readAsDataURL(file);
        
	});
    
    
    
    $(document).on("click",".downloadFile",function(){
        var text=$(this).attr("data");
       
        var ab=Base64Binary.decodeArrayBuffer(text);
        var blob=new Blob([ab],{type:$(this).attr("datatype")}); 
        saveAs([ab], $(this).attr("filename"));
    });
    
	$(document).on("click",".pdf",function(){
		raeumeAuf();
		$(this).next().next().after("<div id='einsetzen'></div>"); // next=textabschnitt
		$("body").append("<div class='transparent'></div>");
		$(".transparent").append("<div class='fenster'><input id='pdfInput' type='file' accept='application/pdf' required='required' ></input><button id='abbrechen'>Abbrechen</button><div id='parameter'></div></div>");
		//$(".transparent").append("<div class='fenster'><input id='pdfInput' type='file'  required='required' ></input><button id='abbrechen'>Abbrechen</button><div id='parameter'></div></div>");
		
		$("#pdfInput").trigger("click");
		
		/*
		
		$(this).after("<div class='zeichnung' id='zeichnung'></div><button class='loeschen'>Darüber liegende Zeichenfläche löschen</button><button class='neueZeichenflaeche' >Neue Zeichenfläche</button><button class='pdf'>PDF einfügen</button>");
		bearbeitungAn=true;
		QreatorBezier.init("#zeichnung",breite,hoehe,"#menu", true); // menu: id der fläche, wo das menü erscheint, true, dass es horizontal ist
		*/
	
	});
	
	
	$(document).on("change","#pdfInput",function(){
		var fileList = $("#pdfInput")[0].files;
	    var file = fileList[0];
	    

	    var fileReader = new FileReader();
	    fileReader.onload = function(e) {
	    	
	    	if (file.name.endsWith(".pdf")){
	    		$("#pdfInput").hide();
	    	    $("#abbrechen").hide().after("<div id='ladeInfo'>Bitte warten ...</div>");
	    		PDFJS.disableWorker = true;

	    		var currPage = 1; //Pages are 1-based not 0-based
	    		var numPages = 0;
	    		var thePDF = null;
	    		 this.zaehler=0;
	    		 this.seitenZaehler=0;
	    		 this.bildLadeZaehler=0;
	    		    that=this;

	    		//This is where you start
	    		PDFJS.getDocument(e.target.result).then(function(pdf) {

	    		        //Set PDFJS global object (so we can easily access in our page functions
	    		        thePDF = pdf;

	    		        //How many pages it has
	    		        numPages = pdf.numPages;
	    		        for (var i=0;i<numPages;i++){
	    		        	$("#einsetzen").before("<div class='einsetzen' id='einsetzen"+(i+1)+"'></div>");
	    		        }
	    		        $("#einsetzen").remove();
	    		        //Start with first page
	    		        
	    		        pdf.getPage( 1 ).then( handlePages );
	    		});



	    		function handlePages(page)
	    		{
	    			/*
	    			global.window = global;
	    			global.navigator = { userAgent: 'node' };
	    			global.PDFJS = {};
	    			page.getOperatorList().then(function (opList) {
	    			var svgGfx = new PDFJS.SVGGraphics(page.commonObjs, page.objs);
	    	        return svgGfx.getSVG(opList, viewport).then(function (svg) {
	    	          var svgDump = svg.toString();
	    	          var test=0;
	    	        });
	    			});*/
	    			that.seitenZaehler++;
	    			//$("#ladeInfo").html("Hole S."+that.seitenZaehler+" von "+(numPages+1));
	    		    //This gives us the page's dimensions at full scale
	    		    var viewport = page.getViewport( 1 );
	    		    var scale=2*breite/viewport.width;
	    		    viewport = page.getViewport(scale );
	    		    //We'll create a canvas for each page to draw it on
	    		    var canvas = document.createElement( "canvas" );
	    		    canvas.style.display = "block";
	    		    var context = canvas.getContext('2d');
	    		    
	    		    canvas.height = viewport.height;
	    		    canvas.width = viewport.width;

	    		    
	    		    
	    		    //Draw it on the canvas
	    		    var pageRendering=page.render({canvasContext: context, viewport: viewport});
	    		    var completeCallback = pageRendering._internalRenderTask.callback;
		            pageRendering._internalRenderTask.callback = function (error) {
		            	  //Step 2: what you want to do before calling the complete method                  
		            	  completeCallback.call(this, error);
		            	  this.seitennummer=this.pageNumber;
		            	  var that2=this;
                        
                        // nicht mehr transparent machen!!
		            	  //console.log("Fertig");
		            	  var transparentColor = { // weiß transparent machen 
		            			    r : 255,
		            			    g : 255,
		            			    b : 255
		            			};
		            	  var pixels = context.getImageData(0, 0, canvas.width, canvas.height);

		            	    // iterate through pixel data (1 pixels consists of 4 ints in the array)
		            	   for(var i = 0, len = pixels.data.length; i < len; i += 4){
		            	        var r = pixels.data[i];
		            	        var g = pixels.data[i+1];
		            	        var b = pixels.data[i+2];

		            	        // if the pixel matches our transparent color, set alpha to 0
		            	        if(r == transparentColor.r && g == transparentColor.g && b == transparentColor.b){
		            	            pixels.data[i+3] = 0;
		            	        }
		            	    }

		            	    context.putImageData(pixels,0,0);
		            	  aktuellesBild=new Image();
		  	            aktuellesBild.onload=function(){
		  	            	zeichenbreite=canvas.width;
				            zeichenhoehe=canvas.height;
				            //console.log(this.src);
				        	//$(this).next().after("<div class='zeichnung' id='zeichnung'></div><button class='loeschen'>Darüber liegende Zeichenfläche löschen</button><button class='neueZeichenflaeche' >Neue Zeichenfläche</button><button class='pdf'>PDF einfügen</button>");
				    		//bearbeitungAn=true;
				    		//QreatorBezier.init("#zeichnung",breite,hoehe,"#menu", true); // menu: id der fläche, wo das menü erscheint, true, dass es horizontal ist
				            that.zaehler++;
				            QreatorBezier.insertImgAsSVG(this,breite,hoehe,"einsetzen"+that2.seitennummer,knopfJS);
				            console.log("Zähler "+that.zaehler+" Seitennummer: "+ that2.seitennummer);
				            if (that.zaehler==numPages){ // marker entfernene
				            	$(".einsetzen").remove();
				            	$(".transparent").remove();
				            }
				        
				            
		  	            }
		  	          
		  	            aktuellesBild.src=canvas.toDataURL();
		  	            	//QreatorBezier.ladeBild(aktuellesBild,0,0,zeichenbreite,zeichenhoehe,false);
		  		    		
		  	            
		  	            
		  	          
		  	          
		            }
	    		    //Add it to the web page
	    		   

	    		    //Move to next page
	    		    currPage++;
	    		    if ( thePDF !== null && currPage <= numPages )
	    		    {
	    		        thePDF.getPage( currPage ).then( handlePages );
	    		    }
	    		}
	    		
		        
		       

		    
				
					
				
	    	
	    	} else {
	    		
	    	}
	    }
	    fileReader.readAsDataURL(file);
	});
    
    function raeumeAuf(){
        if (bearbeitungAn==true){
            if (bearbeitungsTyp=="zeichenflaeche"){
			 QreatorBezier.showSVG("zeichenflaeche");
			 bearbeitungAn=false;
          /*      var element=$("#zeichnung").html();
                $("#zeichnung").after(element);
			 $("#zeichnung").remove();*/
            
            } else if (bearbeitungsTyp=="markdown"){
                Textabschnitt.zeigeMarkdown("#markdownTable");
                bearbeitungAn=false;
                $("#markdown").addClass("adoccss");
                $("#markdown").removeAttr("id");
                
            }
		 }
       
    }
	
	//QreatorBezier.loadSVG('<svg width="800" height="600" id="svgbild"><g fill="none" stroke-linecap="round" id="global"><g id="layer_0"><path d=" M250,492 c15.8,0 29.2,-14.8 40,-24 c9.3,-7.9 18.2,-16.4 28,-24 c24.3,-18.7 68.3,-47.4 92,-65 c17.7,-13.1 34.4,-27.6 52,-41 c35.3,-26.8 65.7,-45.2 97,-76 c15.5,-15.2 19.9,-21.2 25,-39 c1.6,-5.7 1.6,-10.1 -4,-12 M346,143 c15.1,0 32.2,-1.8 47,1 c14.2,2.7 62.7,19.5 74,24 c30.4,12 61.9,21.5 74,55 c1.6,4.6 16.6,68.6 17,70 c2.1,9.6 2.8,19.6 6,29 c2.5,7.3 15.9,32 22,40 c13.5,17.6 21.7,21.2 46,29 c14.4,4.6 27.9,5.6 40,-5 c8.8,-7.8 8.5,-17.7 10,-28 M570,145 c-8.6,0 -18,0 -26,4 c-27.4,13.7 -34.4,52.9 -40,80 c-5.7,28.2 -2.9,15.9 -6,45 c-0.5,5 -2.3,9.9 -2,15 c0.3,5.1 4.7,9.8 4,15 c-0.4,3 -4.1,4.8 -7,6 c-7.1,2.9 -15.3,1.7 -23,2 c-11.9,0.3 -24,0 -36,0 c-2.3,0 -4.9,1 -7,0 c-2.9,-1.4 -4.7,-4.5 -7,-7 c-4.7,-5.2 -9.2,-10.7 -14,-16 c-13.6,-15.2 -27.5,-30.5 -42,-45" stroke="#000000" stroke-width="2"></path></g></g></svg>');
	$(document).on("click",".zeichenflaecheKlick",function(){
	
		 raeumeAuf();
		 var text=$(this).html();
         $(this).removeClass("zeichenflaecheKlick");
       
		// $(this).removeClass("zeichenflaeche"); // sonst immer auf klick reagieren
		 bearbeitungAn=true;
         bearbeitungsTyp="zeichenflaeche";
		 breite=parseInt($(this).find("svg").attr("width"));
		 hoehe=parseInt($(this).find("svg").attr("height"));
		// console.log("Breite aus svg: "+$(this).find("svg").attr("width"));
			QreatorBezier.init(this,breite,hoehe,"#menu", true); // hier auch anpassen

		// $(this).after("<button class='neueZeichenflaeche' >Neue Zeichenfläche</button>");
		 QreatorBezier.loadSVG(text);
        
        
	

	});
    
    $(document).on("click",".markdownText",function(){
        raeumeAuf();
       var originalText=$(this).find(".originaltext").text();
       // "<div class='markdown' id='markdown'></div>"
       $(this).parent().attr("id","markdown");
        $(this).parent().removeClass("adoccss");
        bearbeitungAn=true;
        bearbeitungsTyp="markdown";
       Textabschnitt.init("#markdown","#menu",originalText);
       
       
    });
	$(document).on("change","#fileInput",function(){
		var fileList = $("#fileInput")[0].files;
	    var file = fileList[0];


	    var fileReader = new FileReader();
	    fileReader.onload = function(e) {
	        var text=e.target.result;

	        var container = document.createElement('div');
	        container.id = 'container';
	        container.innerHTML=text;
	        $("#content").html("<span><button class='einfuegen imageInsertInternal unten'></button><button class='einfuegenClipboard imagePaste unten'></button></span><button class='neueZeichenflaeche imageJournal unten' ></button><button class='pdf imagePDF unten'></button><button class='markdownEinfuegen imageNew unten'></button><button class='bildEinfuegen imageFotoNeu unten'></button>");
	        //console.log($(container).html());
	        $(container).find(".tshareElement").each(function(){
                if ($(this).hasClass("zeichenflaeche")){
	        	$("#content").append("<div class='zeichenflaeche tshareElement zeichenflaecheKlick'>"+$(this).html()+"</div>");
	        	$("#content").append(knopfJS);
                } else if ($(this).hasClass("markdown")){
                    $("#content").append("<div class='markdown tshareElement adoccss'>"+$(this).html()+"</div>");
	        	$("#content").append(knopfJS);
                }
                else if ($(this).hasClass("datei")){
                    $("#content").append("<div class='datei tshareElement'>"+$(this).html()+"</div>");
	        	$("#content").append(knopfJS);
                }
	        	//console.log($(this).html());
	        });
	        /*
	        $(text).filter(".zeichenflaeche").each(function(){
	        	$("#content").append("<div class='zeichnung'><div class='zeichenflaeche'>"+$(this).html()+"</div></div>");
	        	$("#content").append("<button class='loeschen'>Darüber liegende Zeichenfläche löschen</button><button class='neueZeichenflaeche' >Neue Zeichenfläche</button>");
		    
	        });*/
	       /* $(".neueZeichenflaeche").after(text);
	        $(".zeichenflaeche").each(function(){
	        	$(this).after("<button class='loeschen'>Darüber liegende Zeichenfläche löschen</button><button class='neueZeichenflaeche' >Neue Zeichenfläche</button>");
	        });*/
	      
	        $(".transparent").remove(); // fenster löschen
	    };
	    fileReader.onerror = function(e) {
	        console.log(e.target.error.name);
	    };
	    fileReader.onprogress = function(e) {
	        console.log(e.loaded, e.total);
	    };
	    fileReader.readAsText(file);
		
	});
	
	
	
	$(document).on("click","#laden",function(){
		$("body").append("<div class='transparent'></div>");
		$(".transparent").append("<div class='fenster'><input id='fileInput' type='file' accept='text/html' required='required' ></input><button id='abbrechen'>Abbrechen</button><div id='parameter'></div></div>");
		//$(".transparent").append("<div class='fenster'><input id='pdfInput' type='file'  required='required' ></input><button id='abbrechen'>Abbrechen</button><div id='parameter'></div></div>");
		
		$("#fileInput").trigger("click");
	});
	
	
	$(document).on("click","#bild",function(){
		$("body").append("<div class='transparent'></div>");
		$(".transparent").append("<div class='fenster'><input id='imageInput' type='file' accept='image/*' required='required' ></input><button id='abbrechenBild'>Abbrechen</button><div id='parameter'></div></div>");
		$("#imageInput").trigger("click");
	});
	
	$(document).on("click","#abbrechen",function(){
		$(".transparent").remove();
        $("#einsetzen").remove();
	});
	
	$(document).on("click","#abbrechenBild",function(){
		QreatorBezier.loescheBild();
		$(".transparent").remove();
	});
	
	
	$(document).on("mousemove",".fenster .parameter",function(){
		
		var breiteProzent=parseInt($("[typ='breite']").val());
		var hoeheProzent=parseInt($("[typ='hoehe']").val());
		if (isNaN(breiteProzent)){
			breiteProzent=parseInt(zeichenbreite*100/breite*hoeheProzent/100);
		} 
		if (isNaN(hoeheProzent)){
			hoeheProzent=parseInt(zeichenhoehe*100/hoehe*breiteProzent/100);
		}
		var xpos=parseInt($("[typ='x']").val());
		var ypos=parseInt($("[typ='y']").val());
		
		$(".fenster #breite").html(""+breiteProzent);
		$(".fenster #hoehe").html(""+hoeheProzent);
		$(".fenster #xpos").html(""+xpos);
		$(".fenster #ypos").html(""+ypos);
	});
	
$(document).on("change",".fenster .parameter",function(){
		
		var breiteProzent=parseInt($("[typ='breite']").val());
		var hoeheProzent=parseInt($("[typ='hoehe']").val());
		if (isNaN(breiteProzent)){
			breiteProzent=parseInt(zeichenbreite*100/breite*hoeheProzent/100);
		} 
		if (isNaN(hoeheProzent)){
			hoeheProzent=parseInt(zeichenhoehe*100/hoehe*breiteProzent/100);
		}
		var xpos=parseInt($("[typ='x']").val());
		var ypos=parseInt($("[typ='y']").val());
		QreatorBezier.ladeBild(aktuellesBild,parseInt(xpos*breite/100),parseInt(ypos*hoehe/100),parseInt(breiteProzent*breite/100),parseInt(hoeheProzent*hoehe/100),false);
		
		
	});
	
	$(document).on("click","#bildEinfuegen",function(){
		var breiteProzent=parseInt($("[typ='breite']").val());
		var hoeheProzent=parseInt($("[typ='hoehe']").val());
		if (isNaN(breiteProzent)){
			breiteProzent=zeichenbreite*100/breite*hoeheProzent/100;
		} 
		if (isNaN(hoeheProzent)){
			hoeheProzent=zeichenhoehe*100/hoehe*breiteProzent/100;
		}
		var xpos=parseInt($("[typ='x']").val());
		var ypos=parseInt($("[typ='y']").val());
		QreatorBezier.ladeBild(aktuellesBild,parseInt(xpos*breite/100),parseInt(ypos*hoehe/100),parseInt(breiteProzent*breite/100),parseInt(hoeheProzent*hoehe/100),true);
		$(".transparent").remove();
	});
	
	$(document).on("click",".mittig",function(){
		var breiteProzent=parseInt($("[typ='breite']").val());
		var hoeheProzent=parseInt($("[typ='hoehe']").val());
		if (isNaN(breiteProzent)){
			breiteProzent=parseInt(zeichenbreite*100/breite*hoeheProzent/100);
		} 
		if (isNaN(hoeheProzent)){
			hoeheProzent=parseInt(zeichenhoehe*100/hoehe*breiteProzent/100);
		}
		var xpos=parseInt($("[typ='x']").val());
		var ypos=parseInt($("[typ='y']").val());
		
		var wahl=$(this).attr("typ");
		switch (wahl){
		case "xmitte":
			xpos=parseInt(50-breiteProzent/2);
			break;
		case "ymitte":
			ypos=parseInt(50-hoeheProzent/2);
			break;
		case "links":
			xpos=0;
			break;
		case "rechts":
			xpos=100-breiteProzent;
			break;
		case "oben":
			ypos=0;
			break;
		case "unten":
			ypos=100-hoeheProzent;
			break;
			
		}
		$(".fenster #xpos").html(""+xpos);
		$("[typ='x']").val(xpos);
		$(".fenster #ypos").html(""+ypos);
		$("[typ='y']").val(ypos);
		
		QreatorBezier.ladeBild(aktuellesBild,parseInt(xpos*breite/100),parseInt(ypos*hoehe/100),parseInt(breiteProzent*breite/100),parseInt(hoeheProzent*hoehe/100),false);
		
	});
	
	$(document).on("change","#imageInput",function(){
		
		var fileList = $("#imageInput")[0].files;
	    var file = fileList[0];


	    var fileReader = new FileReader();
	    fileReader.onload = function(e) {
	    	
	    	if (file.name.endsWith(".pdf")){
	    		console.log("PDF");
	    		
	    		PDFJS.disableWorker = true;

		        
		        
		        console.log(e.target.result);
		        //
		        // Asynchronous download PDF as an ArrayBuffer
		        //
		        PDFJS.getDocument(e.target.result).then(function getPdfHelloWorld(pdf) {
		          //
		          // Fetch the first page
		          //
		          pdf.getPage(1).then(function getPageHelloWorld(page) {
		            var scale = 2.5;
		            var viewport = page.getViewport(scale);

		            //
		            // Prepare canvas using PDF page dimensions
		            //
		           // $("body").append("<canvas id='the-canvas' width='"+(breite*2)+"' height='"+(hoehe*2)+"'></canvas>");
		           
		            var canvas = document.createElement('canvas'); // unsichtbares canvaselement erstellen
		    		
		    		
		    		
		    		
		            var context = canvas.getContext('2d');
		            canvas.height = viewport.height;
		            canvas.width = viewport.width;
		            
		            

		            //
		            // Render PDF page into canvas context
		            //
		            var pageRendering=page.render({canvasContext: context, viewport: viewport});
		            var completeCallback = pageRendering._internalRenderTask.callback;
		            pageRendering._internalRenderTask.callback = function (error) {
		            	  //Step 2: what you want to do before calling the complete method                  
		            	  completeCallback.call(this, error);
		            	  //Step 3: do some more stuff
		            	  var transparentColor = { // weiß transparent machen 
		            			    r : 255,
		            			    g : 255,
		            			    b : 255
		            			};
		            	  var pixels = context.getImageData(0, 0, canvas.width, canvas.height);

		            	    // iterate through pixel data (1 pixels consists of 4 ints in the array)
		            	    for(var i = 0, len = pixels.data.length; i < len; i += 4){
		            	        var r = pixels.data[i];
		            	        var g = pixels.data[i+1];
		            	        var b = pixels.data[i+2];

		            	        // if the pixel matches our transparent color, set alpha to 0
		            	        if(r == transparentColor.r && g == transparentColor.g && b == transparentColor.b){
		            	            pixels.data[i+3] = 0;
		            	        }
		            	    }

		            	    context.putImageData(pixels,0,0);
		            	  aktuellesBild=new Image();
		  	            aktuellesBild.onload=function(){
		  	            	zeichenbreite=canvas.width;
				            zeichenhoehe=canvas.height;
				            
				            hochkant=true;
							if (this.width>this.height){
								hochkant=false;
							}
							
							if (hochkant==true){
								zeichenhoehe=Math.min(hoehe,this.height);
								if (zeichenhoehe<hoehe){
									zeichenhoehe=hoehe;
								}
								zeichenbreite=this.width*zeichenhoehe/this.height;
								if (zeichenbreite>breite){
									zeichenhoehe=zeichenhoehe*breite/zeichenbreite;
									zeichenbreite=breite;
									hochkant=false;
								}
							} else {
								zeichenbreite=Math.min(breite,this.width);
								if (zeichenbreite<breite){
									zeichenbreite=breite;
								}
								zeichenhoehe=this.height*zeichenbreite/this.width;
								if (zeichenhoehe>hoehe){
									zeichenbreite=zeichenbreite*hoehe/zeichenhoehe;
									zeichenhoehe=hoehe;
									hochkant=true;
								}
							}
		  	            	console.log(aktuellesBild.src);
		  	            	if (hochkant==false){
		  	  				$(".fenster #parameter").html("<br>Breite (in Prozent von Abschnittsbreite): <input typ='breite' class='parameter' type='range' min='0' max='100' value='"+parseInt(zeichenbreite*100/breite)+"'></input><span id='breite'>"+parseInt(zeichenbreite*100/breite)+"</span>%, Höhe:<span id='hoehe'>"+parseInt(zeichenhoehe*100/hoehe)+"</span>%");
		  	  				} else {
		  	  					$(".fenster #parameter").html("<br>Höhe (in Prozent von Abschnittshöhe): <input typ='hoehe' class='parameter' type='range' min='0' max='100' value='"+parseInt(zeichenhoehe*100/hoehe)+"'></input><span id='hoehe'>"+parseInt(zeichenhoehe*100/hoehe)+"</span>%, Breite: <span id='breite'>"+parseInt(zeichenbreite*100/breite)+"</span>%");
		  	  					
		  	  				}
		  	  				$(".fenster #parameter").append("<br>x-Position links oben:  <input typ='x' class='parameter' type='range' min='0' max='100' value='0'></input><span id='xpos'>0</span><button class='mittig' typ='links'>linksbündig</button><button class='mittig' typ='xmitte'>horizontal zentrieren</button><button class='mittig' typ='rechts'>rechtsbündig</button>");
		  	  				$(".fenster #parameter").append("<br>y-Position links oben:  <input typ='y' class='parameter' type='range' min='0' max='100' value='0'></input><span id='ypos'>0</span><button class='mittig' typ='oben'>oben bündig</button><button class='mittig' typ='ymitte'>vertikal zentrieren</button><button class='mittig' typ='unten'>unten bündig</button>");
		  	  				$(".fenster #parameter").append("<br><button id='bildEinfuegen'>Bild einfügen</button>");
		  	  				
		  	            	QreatorBezier.ladeBild(aktuellesBild,0,0,zeichenbreite,zeichenhoehe,false);
		  		    		
		  	            }
		  	            
		  	            aktuellesBild.src=canvas.toDataURL();
		  	          
		            	};
		            
		           
		      
		          });
		        });
		    
				
					
				
	    	
	    	} else {
			aktuellesBild=new Image();
			aktuellesBild.onload=function(){
				//ctx.drawImage(this,0,0);
				//var pngString=canvas.toDataURL();  // bild erst skalieren
				zeichenbreite=0,zeichenhoehe=0;
				hochkant=true;
				if (this.width>this.height){
					hochkant=false;
				}
				
				if (hochkant==true){
					zeichenhoehe=Math.min(hoehe,this.height);
					if (zeichenhoehe<hoehe){
						zeichenhoehe=hoehe;
					}
					zeichenbreite=this.width*zeichenhoehe/this.height;
					if (zeichenbreite>breite){
						zeichenhoehe=zeichenhoehe*breite/zeichenbreite;
						zeichenbreite=breite;
						hochkant=false;
					}
				} else {
					zeichenbreite=Math.min(breite,this.width);
					if (zeichenbreite<breite){
						zeichenbreite=breite;
					}
					zeichenhoehe=this.height*zeichenbreite/this.width;
					if (zeichenhoehe>hoehe){
						zeichenbreite=zeichenbreite*hoehe/zeichenhoehe;
						zeichenhoehe=hoehe;
						hochkant=true;
					}
				}
				
				if (hochkant==false){
				$(".fenster #parameter").html("<br>Breite (in Prozent von Abschnittsbreite): <input typ='breite' class='parameter' type='range' min='0' max='100' value='"+parseInt(zeichenbreite*100/breite)+"'></input><span id='breite'>"+parseInt(zeichenbreite*100/breite)+"</span>%, Höhe:<span id='hoehe'>"+parseInt(zeichenhoehe*100/hoehe)+"</span>%");
				} else {
					$(".fenster #parameter").html("<br>Höhe (in Prozent von Abschnittshöhe): <input typ='hoehe' class='parameter' type='range' min='0' max='100' value='"+parseInt(zeichenhoehe*100/hoehe)+"'></input><span id='hoehe'>"+parseInt(zeichenhoehe*100/hoehe)+"</span>%, Breite: <span id='breite'>"+parseInt(zeichenbreite*100/breite)+"</span>%");
					
				}
				$(".fenster #parameter").append("<br>x-Position links oben:  <input typ='x' class='parameter' type='range' min='0' max='100' value='0'></input><span id='xpos'>0</span><button class='mittig' typ='links'>linksbündig</button><button class='mittig' typ='xmitte'>horizontal zentrieren</button><button class='mittig' typ='rechts'>rechtsbündig</button>");
				$(".fenster #parameter").append("<br>y-Position links oben:  <input typ='y' class='parameter' type='range' min='0' max='100' value='0'></input><span id='ypos'>0</span><button class='mittig' typ='oben'>oben bündig</button><button class='mittig' typ='ymitte'>vertikal zentrieren</button><button class='mittig' typ='unten'>unten bündig</button>");
				$(".fenster #parameter").append("<br><button id='bildEinfuegen'>Bild einfügen</button>");
				QreatorBezier.ladeBild(aktuellesBild,0,0,zeichenbreite,zeichenhoehe,false);
				
				//QreatorBezier.ladeBild(this);
		       //$(".transparent").remove();
			}
			aktuellesBild.src=e.target.result;
			   // ctx.drawImage(img, 0, 0, 400, 300);   
	    	}
			
	      
	    };
	    fileReader.onerror = function(e) {
	        console.log(e.target.error.name);
	    };
	    fileReader.onprogress = function(e) {
	        console.log(e.loaded, e.total);
	    };
	    fileReader.readAsDataURL(file);
		
	});
	
	
	$(document).on("click",".loeschen",function(){
		var nachfrage=confirm("Sind Sie sicher, dass die gewählte Zeichenfläche inklusive Inhalt entfernt werden soll? Dieser Schritt kann nicht rückgängig gemacht werden!");
		if (nachfrage==true){
            raeumeAuf();
		$(this).parent().prev().remove(); //zeichenflaeche
		$(this).parent().next().remove(); //neu-knopf
		$(this).parent().next().remove(); // pdf einfügen
            
            $(this).parent().next().remove(); // Textabschnitt einfügen
            $(this).parent().next().remove(); // Bild einfügen
		$(this).parent().remove(); // knopf selber
		}
	});
	
	

	
	//var url = 'test.pdf';

    //
    // Disable workers to avoid yet another cross-origin issue (workers need the URL of
    // the script to be loaded, and dynamically loading a cross-origin script does
    // not work)
    //
    
	
	
});