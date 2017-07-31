// saveAs zum Speichern von Dateien

var saveAs = saveAs || function (view) {
    "use strict";
    if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
        return
    }
    var doc = view.document,
        get_URL = function () {
            return view.URL || view.webkitURL || view
        },
        save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a"),
        can_use_save_link = "download" in save_link,
        click = function (node) {
            var event = new MouseEvent("click");
            node.dispatchEvent(event)
        },
        is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent),
        webkit_req_fs = view.webkitRequestFileSystem,
        req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem,
        throw_outside = function (ex) {
            (view.setImmediate || view.setTimeout)(function () {
                throw ex
            }, 0)
        },
        force_saveable_type = "application/octet-stream",
        fs_min_size = 0,
        arbitrary_revoke_timeout = 500,
        revoke = function (file) {
            var revoker = function () {
                if (typeof file === "string") {
                    get_URL().revokeObjectURL(file)
                } else {
                    file.remove()
                }
            };
            if (view.chrome) {
                revoker()
            } else {
                setTimeout(revoker, arbitrary_revoke_timeout)
            }
        },
        dispatch = function (filesaver, event_types, event) {
            event_types = [].concat(event_types);
            var i = event_types.length;
            while (i--) {
                var listener = filesaver["on" + event_types[i]];
                if (typeof listener === "function") {
                    try {
                        listener.call(filesaver, event || filesaver)
                    } catch (ex) {
                        throw_outside(ex)
                    }
                }
            }
        },
        auto_bom = function (blob) {
            if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                return new Blob(["\ufeff", blob], {
                    type: blob.type
                })
            }
            return blob
        },
        FileSaver = function (blob, name, no_auto_bom) {
            if (!no_auto_bom) {
                blob = auto_bom(blob)
            }
            var filesaver = this,
                type = blob.type,
                blob_changed = false,
                object_url, target_view, dispatch_all = function () {
                    dispatch(filesaver, "writestart progress write writeend".split(" "))
                },
                fs_error = function () {
                    if (target_view && is_safari && typeof FileReader !== "undefined") {
                        var reader = new FileReader;
                        reader.onloadend = function () {
                            var base64Data = reader.result;
                            target_view.location.href = "data:attachment/file" + base64Data.slice(base64Data.search(/[,;]/));
                            filesaver.readyState = filesaver.DONE;
                            dispatch_all()
                        };
                        reader.readAsDataURL(blob);
                        filesaver.readyState = filesaver.INIT;
                        return
                    }
                    if (blob_changed || !object_url) {
                        object_url = get_URL().createObjectURL(blob)
                    }
                    if (target_view) {
                        target_view.location.href = object_url
                    } else {
                        var new_tab = view.open(object_url, "_blank");
                        if (new_tab == undefined && is_safari) {
                            view.location.href = object_url
                        }
                    }
                    filesaver.readyState = filesaver.DONE;
                    dispatch_all();
                    revoke(object_url)
                },
                abortable = function (func) {
                    return function () {
                        if (filesaver.readyState !== filesaver.DONE) {
                            return func.apply(this, arguments)
                        }
                    }
                },
                create_if_not_found = {
                    create: true,
                    exclusive: false
                },
                slice;
            filesaver.readyState = filesaver.INIT;
            if (!name) {
                name = "download"
            }
            if (can_use_save_link) {
                object_url = get_URL().createObjectURL(blob);
                setTimeout(function () {
                    save_link.href = object_url;
                    save_link.download = name;
                    click(save_link);
                    dispatch_all();
                    revoke(object_url);
                    filesaver.readyState = filesaver.DONE
                });
                return
            }
            if (view.chrome && type && type !== force_saveable_type) {
                slice = blob.slice || blob.webkitSlice;
                blob = slice.call(blob, 0, blob.size, force_saveable_type);
                blob_changed = true
            }
            if (webkit_req_fs && name !== "download") {
                name += ".download"
            }
            if (type === force_saveable_type || webkit_req_fs) {
                target_view = view
            }
            if (!req_fs) {
                fs_error();
                return
            }
            fs_min_size += blob.size;
            req_fs(view.TEMPORARY, fs_min_size, abortable(function (fs) {
                fs.root.getDirectory("saved", create_if_not_found, abortable(function (dir) {
                    var save = function () {
                        dir.getFile(name, create_if_not_found, abortable(function (file) {
                            file.createWriter(abortable(function (writer) {
                                writer.onwriteend = function (event) {
                                    target_view.location.href = file.toURL();
                                    filesaver.readyState = filesaver.DONE;
                                    dispatch(filesaver, "writeend", event);
                                    revoke(file)
                                };
                                writer.onerror = function () {
                                    var error = writer.error;
                                    if (error.code !== error.ABORT_ERR) {
                                        fs_error()
                                    }
                                };
                                "writestart progress write abort".split(" ").forEach(function (event) {
                                    writer["on" + event] = filesaver["on" + event]
                                });
                                writer.write(blob);
                                filesaver.abort = function () {
                                    writer.abort();
                                    filesaver.readyState = filesaver.DONE
                                };
                                filesaver.readyState = filesaver.WRITING
                            }), fs_error)
                        }), fs_error)
                    };
                    dir.getFile(name, {
                        create: false
                    }, abortable(function (file) {
                        file.remove();
                        save()
                    }), abortable(function (ex) {
                        if (ex.code === ex.NOT_FOUND_ERR) {
                            save()
                        } else {
                            fs_error()
                        }
                    }))
                }), fs_error)
            }), fs_error)
        },
        FS_proto = FileSaver.prototype,
        saveAs = function (blob, name, no_auto_bom) {
            return new FileSaver(blob, name, no_auto_bom)
        };
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
        return function (blob, name, no_auto_bom) {
            if (!no_auto_bom) {
                blob = auto_bom(blob)
            }
            return navigator.msSaveOrOpenBlob(blob, name || "download")
        }
    }
    FS_proto.abort = function () {
        var filesaver = this;
        filesaver.readyState = filesaver.DONE;
        dispatch(filesaver, "abort")
    };
    FS_proto.readyState = FS_proto.INIT = 0;
    FS_proto.WRITING = 1;
    FS_proto.DONE = 2;
    FS_proto.error = FS_proto.onwritestart = FS_proto.onprogress = FS_proto.onwrite = FS_proto.onabort = FS_proto.onerror = FS_proto.onwriteend = null;
    return saveAs
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content);
if (typeof module !== "undefined" && module.exports) {
    module.exports.saveAs = saveAs
} else if (typeof define !== "undefined" && define !== null && define.amd != null) {
    define([], function () {
        return saveAs
    })
}


$(function () {
    
    
    
    /*
    $(window).on('hashchange', function() {
    var hash=location.hash.substring(1).toUpperCase();

        zeigeHashTags(hash);
});

 $(document).ready(function () {
var hash=location.hash.substring(1).toUpperCase();
if (hash=="") {
hash="tags_@";
}
        zeigeHashTags(hash);
});

function zeigeHashTags(hash){
        var allesSichtbar=false;
        if (hash.toUpperCase().startsWith("TAGS_")){
            hash=hash.split("_")[1];
    if (hash==""){
        allesSichtbar=true;
    }
    $(".tshareElement").each(function(){
        var sb=$(this).attr("sb");
        if (sb==null||sb==""){
            sb="@";
        }
        var treffer=-1;
        for (var i=0;i<hash.length;i++){
            if (sb.includes(hash.charAt(i))){
                treffer=i;
                i=hash.length;
            }
        }
        if (treffer>=0||allesSichtbar==true){ // ist in element enthalten
            $(this).attr("style","display:true;");
            $(this).next().attr("style","display:true");
            $(this).removeClass("versteckt");
            $(this).next().removeClass("versteckt");
        } else {
            $(this).attr("style","display:none;");
            $(this).next().attr("style","display:none");
            $(this).removeClass("versteckt").addClass("versteckt");
            $(this).next().removeClass("versteckt").addClass("versteckt");
        }
    });
        
        }
    }
    */
    
    var hash64="ZnVuY3Rpb24gemVpZ2VIYXNoVGFncyh0KXt2YXIgcz0hMQ0KdC50b1VwcGVyQ2FzZSgpLnN0YXJ0c1dpdGgoIlRBR1NfIikmJih0PXQuc3BsaXQoIl8iKVsxXSwiIj09dCYmKHM9ITApLCQoIi50c2hhcmVFbGVtZW50IikuZWFjaChmdW5jdGlvbigpe3ZhciBlPSQodGhpcykuYXR0cigic2IiKTsobnVsbD09ZXx8IiI9PWUpJiYoZT0iQCIpDQpmb3IodmFyIGE9LTEscj0wO3I8dC5sZW5ndGg7cisrKWUuaW5jbHVkZXModC5jaGFyQXQocikpJiYoYT1yLHI9dC5sZW5ndGgpDQphPj0wfHwxPT1zPygkKHRoaXMpLmF0dHIoInN0eWxlIiwiZGlzcGxheTp0cnVlOyIpLCQodGhpcykubmV4dCgpLmF0dHIoInN0eWxlIiwiZGlzcGxheTp0cnVlIiksJCh0aGlzKS5yZW1vdmVDbGFzcygidmVyc3RlY2t0IiksJCh0aGlzKS5uZXh0KCkucmVtb3ZlQ2xhc3MoInZlcnN0ZWNrdCIpKTooJCh0aGlzKS5hdHRyKCJzdHlsZSIsImRpc3BsYXk6bm9uZTsiKSwkKHRoaXMpLm5leHQoKS5hdHRyKCJzdHlsZSIsImRpc3BsYXk6bm9uZSIpLCQodGhpcykucmVtb3ZlQ2xhc3MoInZlcnN0ZWNrdCIpLmFkZENsYXNzKCJ2ZXJzdGVja3QiKSwkKHRoaXMpLm5leHQoKS5yZW1vdmVDbGFzcygidmVyc3RlY2t0IikuYWRkQ2xhc3MoInZlcnN0ZWNrdCIpKX0pKX0kKHdpbmRvdykub24oImhhc2hjaGFuZ2UiLGZ1bmN0aW9uKCl7dmFyIHQ9bG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkudG9VcHBlckNhc2UoKQ0KemVpZ2VIYXNoVGFncyh0KX0pLCQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCl7dmFyIHQ9bG9jYXRpb24uaGFzaC5zdWJzdHJpbmcoMSkudG9VcHBlckNhc2UoKQ0KIiI9PXQmJih0PSJ0YWdzX0AiKSx6ZWlnZUhhc2hUYWdzKHQpfSkNCg==";
    
    var revealcss64="LyohDQogKiByZXZlYWwuanMNCiAqIGh0dHA6Ly9sYWIuaGFraW0uc2UvcmV2ZWFsLWpzDQogKiBNSVQgbGljZW5zZWQNCiAqDQogKiBDb3B5cmlnaHQgKEMpIDIwMTcgSGFraW0gRWwgSGF0dGFiLCBodHRwOi8vaGFraW0uc2UNCiAqLw0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogUkVTRVQgU1RZTEVTDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KaHRtbCwgYm9keSwgLnJldmVhbCBkaXYsIC5yZXZlYWwgc3BhbiwgLnJldmVhbCBhcHBsZXQsIC5yZXZlYWwgb2JqZWN0LCAucmV2ZWFsIGlmcmFtZSwNCi5yZXZlYWwgaDEsIC5yZXZlYWwgaDIsIC5yZXZlYWwgaDMsIC5yZXZlYWwgaDQsIC5yZXZlYWwgaDUsIC5yZXZlYWwgaDYsIC5yZXZlYWwgcCwgLnJldmVhbCBibG9ja3F1b3RlLCAucmV2ZWFsIHByZSwNCi5yZXZlYWwgYSwgLnJldmVhbCBhYmJyLCAucmV2ZWFsIGFjcm9ueW0sIC5yZXZlYWwgYWRkcmVzcywgLnJldmVhbCBiaWcsIC5yZXZlYWwgY2l0ZSwgLnJldmVhbCBjb2RlLA0KLnJldmVhbCBkZWwsIC5yZXZlYWwgZGZuLCAucmV2ZWFsIGVtLCAucmV2ZWFsIGltZywgLnJldmVhbCBpbnMsIC5yZXZlYWwga2JkLCAucmV2ZWFsIHEsIC5yZXZlYWwgcywgLnJldmVhbCBzYW1wLA0KLnJldmVhbCBzbWFsbCwgLnJldmVhbCBzdHJpa2UsIC5yZXZlYWwgc3Ryb25nLCAucmV2ZWFsIHN1YiwgLnJldmVhbCBzdXAsIC5yZXZlYWwgdHQsIC5yZXZlYWwgdmFyLA0KLnJldmVhbCBiLCAucmV2ZWFsIHUsIC5yZXZlYWwgY2VudGVyLA0KLnJldmVhbCBkbCwgLnJldmVhbCBkdCwgLnJldmVhbCBkZCwgLnJldmVhbCBvbCwgLnJldmVhbCB1bCwgLnJldmVhbCBsaSwNCi5yZXZlYWwgZmllbGRzZXQsIC5yZXZlYWwgZm9ybSwgLnJldmVhbCBsYWJlbCwgLnJldmVhbCBsZWdlbmQsDQoucmV2ZWFsIHRhYmxlLCAucmV2ZWFsIGNhcHRpb24sIC5yZXZlYWwgdGJvZHksIC5yZXZlYWwgdGZvb3QsIC5yZXZlYWwgdGhlYWQsIC5yZXZlYWwgdHIsIC5yZXZlYWwgdGgsIC5yZXZlYWwgdGQsDQoucmV2ZWFsIGFydGljbGUsIC5yZXZlYWwgYXNpZGUsIC5yZXZlYWwgY2FudmFzLCAucmV2ZWFsIGRldGFpbHMsIC5yZXZlYWwgZW1iZWQsDQoucmV2ZWFsIGZpZ3VyZSwgLnJldmVhbCBmaWdjYXB0aW9uLCAucmV2ZWFsIGZvb3RlciwgLnJldmVhbCBoZWFkZXIsIC5yZXZlYWwgaGdyb3VwLA0KLnJldmVhbCBtZW51LCAucmV2ZWFsIG5hdiwgLnJldmVhbCBvdXRwdXQsIC5yZXZlYWwgcnVieSwgLnJldmVhbCBzZWN0aW9uLCAucmV2ZWFsIHN1bW1hcnksDQoucmV2ZWFsIHRpbWUsIC5yZXZlYWwgbWFyaywgLnJldmVhbCBhdWRpbywgLnJldmVhbCB2aWRlbyB7DQogIG1hcmdpbjogMDsNCiAgcGFkZGluZzogMDsNCiAgYm9yZGVyOiAwOw0KICBmb250LXNpemU6IDEwMCU7DQogIGZvbnQ6IGluaGVyaXQ7DQogIHZlcnRpY2FsLWFsaWduOiBiYXNlbGluZTsgfQ0KDQoucmV2ZWFsIGFydGljbGUsIC5yZXZlYWwgYXNpZGUsIC5yZXZlYWwgZGV0YWlscywgLnJldmVhbCBmaWdjYXB0aW9uLCAucmV2ZWFsIGZpZ3VyZSwNCi5yZXZlYWwgZm9vdGVyLCAucmV2ZWFsIGhlYWRlciwgLnJldmVhbCBoZ3JvdXAsIC5yZXZlYWwgbWVudSwgLnJldmVhbCBuYXYsIC5yZXZlYWwgc2VjdGlvbiB7DQogIGRpc3BsYXk6IGJsb2NrOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIEdMT0JBTCBTVFlMRVMNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQpodG1sLA0KYm9keSB7DQogIHdpZHRoOiAxMDAlOw0KICBoZWlnaHQ6IDEwMCU7DQogIG92ZXJmbG93OiBoaWRkZW47IH0NCg0KYm9keSB7DQogIHBvc2l0aW9uOiByZWxhdGl2ZTsNCiAgbGluZS1oZWlnaHQ6IDE7DQogIGJhY2tncm91bmQtY29sb3I6ICNmZmY7DQogIGNvbG9yOiAjMDAwOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIFZJRVcgRlJBR01FTlRTDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50IHsNCiAgb3BhY2l0eTogMDsNCiAgdmlzaWJpbGl0eTogaGlkZGVuOw0KICAtd2Via2l0LXRyYW5zaXRpb246IGFsbCAuMnMgZWFzZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgLjJzIGVhc2U7IH0NCiAgLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LnZpc2libGUgew0KICAgIG9wYWNpdHk6IDE7DQogICAgdmlzaWJpbGl0eTogaW5oZXJpdDsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuZ3JvdyB7DQogIG9wYWNpdHk6IDE7DQogIHZpc2liaWxpdHk6IGluaGVyaXQ7IH0NCiAgLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50Lmdyb3cudmlzaWJsZSB7DQogICAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDEuMyk7DQogICAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDEuMyk7IH0NCg0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LnNocmluayB7DQogIG9wYWNpdHk6IDE7DQogIHZpc2liaWxpdHk6IGluaGVyaXQ7IH0NCiAgLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LnNocmluay52aXNpYmxlIHsNCiAgICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC43KTsNCiAgICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC43KTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuem9vbS1pbiB7DQogIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjEpOw0KICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC4xKTsgfQ0KICAucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuem9vbS1pbi52aXNpYmxlIHsNCiAgICAtd2Via2l0LXRyYW5zZm9ybTogbm9uZTsNCiAgICAgICAgICAgIHRyYW5zZm9ybTogbm9uZTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuZmFkZS1vdXQgew0KICBvcGFjaXR5OiAxOw0KICB2aXNpYmlsaXR5OiBpbmhlcml0OyB9DQogIC5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudC5mYWRlLW91dC52aXNpYmxlIHsNCiAgICBvcGFjaXR5OiAwOw0KICAgIHZpc2liaWxpdHk6IGhpZGRlbjsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuc2VtaS1mYWRlLW91dCB7DQogIG9wYWNpdHk6IDE7DQogIHZpc2liaWxpdHk6IGluaGVyaXQ7IH0NCiAgLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LnNlbWktZmFkZS1vdXQudmlzaWJsZSB7DQogICAgb3BhY2l0eTogMC41Ow0KICAgIHZpc2liaWxpdHk6IGluaGVyaXQ7IH0NCg0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LnN0cmlrZSB7DQogIG9wYWNpdHk6IDE7DQogIHZpc2liaWxpdHk6IGluaGVyaXQ7IH0NCiAgLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LnN0cmlrZS52aXNpYmxlIHsNCiAgICB0ZXh0LWRlY29yYXRpb246IGxpbmUtdGhyb3VnaDsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuZmFkZS11cCB7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgMjAlKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAyMCUpOyB9DQogIC5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudC5mYWRlLXVwLnZpc2libGUgew0KICAgIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgMCk7DQogICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuZmFkZS1kb3duIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtMjAlKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtMjAlKTsgfQ0KICAucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuZmFkZS1kb3duLnZpc2libGUgew0KICAgIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgMCk7DQogICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuZmFkZS1yaWdodCB7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTIwJSwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTIwJSwgMCk7IH0NCiAgLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LmZhZGUtcmlnaHQudmlzaWJsZSB7DQogICAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAwKTsNCiAgICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIDApOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudC5mYWRlLWxlZnQgew0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDIwJSwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMjAlLCAwKTsgfQ0KICAucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuZmFkZS1sZWZ0LnZpc2libGUgew0KICAgIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgMCk7DQogICAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuY3VycmVudC12aXNpYmxlIHsNCiAgb3BhY2l0eTogMDsNCiAgdmlzaWJpbGl0eTogaGlkZGVuOyB9DQogIC5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudC5jdXJyZW50LXZpc2libGUuY3VycmVudC1mcmFnbWVudCB7DQogICAgb3BhY2l0eTogMTsNCiAgICB2aXNpYmlsaXR5OiBpbmhlcml0OyB9DQoNCi5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudC5oaWdobGlnaHQtcmVkLA0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LmhpZ2hsaWdodC1jdXJyZW50LXJlZCwNCi5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudC5oaWdobGlnaHQtZ3JlZW4sDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuaGlnaGxpZ2h0LWN1cnJlbnQtZ3JlZW4sDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuaGlnaGxpZ2h0LWJsdWUsDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuaGlnaGxpZ2h0LWN1cnJlbnQtYmx1ZSB7DQogIG9wYWNpdHk6IDE7DQogIHZpc2liaWxpdHk6IGluaGVyaXQ7IH0NCg0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LmhpZ2hsaWdodC1yZWQudmlzaWJsZSB7DQogIGNvbG9yOiAjZmYyYzJkOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudC5oaWdobGlnaHQtZ3JlZW4udmlzaWJsZSB7DQogIGNvbG9yOiAjMTdmZjJlOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudC5oaWdobGlnaHQtYmx1ZS52aXNpYmxlIHsNCiAgY29sb3I6ICMxYjkxZmY7IH0NCg0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LmhpZ2hsaWdodC1jdXJyZW50LXJlZC5jdXJyZW50LWZyYWdtZW50IHsNCiAgY29sb3I6ICNmZjJjMmQ7IH0NCg0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gLmZyYWdtZW50LmhpZ2hsaWdodC1jdXJyZW50LWdyZWVuLmN1cnJlbnQtZnJhZ21lbnQgew0KICBjb2xvcjogIzE3ZmYyZTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQuaGlnaGxpZ2h0LWN1cnJlbnQtYmx1ZS5jdXJyZW50LWZyYWdtZW50IHsNCiAgY29sb3I6ICMxYjkxZmY7IH0NCg0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogREVGQVVMVCBFTEVNRU5UIFNUWUxFUw0KICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi8NCi8qIEZpeGVzIGlzc3VlIGluIENocm9tZSB3aGVyZSBpdGFsaWMgZm9udHMgZGlkIG5vdCBhcHBlYXIgd2hlbiBwcmludGluZyB0byBQREYgKi8NCi5yZXZlYWw6YWZ0ZXIgew0KICBjb250ZW50OiAnJzsNCiAgZm9udC1zdHlsZTogaXRhbGljOyB9DQoNCi5yZXZlYWwgaWZyYW1lIHsNCiAgei1pbmRleDogMTsgfQ0KDQovKiogUHJldmVudHMgbGF5ZXJpbmcgaXNzdWVzIGluIGNlcnRhaW4gYnJvd3Nlci90cmFuc2l0aW9uIGNvbWJpbmF0aW9ucyAqLw0KLnJldmVhbCBhIHsNCiAgcG9zaXRpb246IHJlbGF0aXZlOyB9DQoNCi5yZXZlYWwgLnN0cmV0Y2ggew0KICBtYXgtd2lkdGg6IG5vbmU7DQogIG1heC1oZWlnaHQ6IG5vbmU7IH0NCg0KLnJldmVhbCBwcmUuc3RyZXRjaCBjb2RlIHsNCiAgaGVpZ2h0OiAxMDAlOw0KICBtYXgtaGVpZ2h0OiAxMDAlOw0KICBib3gtc2l6aW5nOiBib3JkZXItYm94OyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIENPTlRST0xTDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbCAuY29udHJvbHMgew0KICBkaXNwbGF5OiBub25lOw0KICBwb3NpdGlvbjogZml4ZWQ7DQogIHdpZHRoOiAxMTBweDsNCiAgaGVpZ2h0OiAxMTBweDsNCiAgei1pbmRleDogMzA7DQogIHJpZ2h0OiAxMHB4Ow0KICBib3R0b206IDEwcHg7DQogIC13ZWJraXQtdXNlci1zZWxlY3Q6IG5vbmU7IH0NCg0KLnJldmVhbCAuY29udHJvbHMgYnV0dG9uIHsNCiAgcGFkZGluZzogMDsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICBvcGFjaXR5OiAwLjA1Ow0KICB3aWR0aDogMDsNCiAgaGVpZ2h0OiAwOw0KICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsNCiAgYm9yZGVyOiAxMnB4IHNvbGlkIHRyYW5zcGFyZW50Ow0KICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC45OTk5KTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDAuOTk5OSk7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogYWxsIDAuMnMgZWFzZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4ycyBlYXNlOw0KICAtd2Via2l0LWFwcGVhcmFuY2U6IG5vbmU7DQogIC13ZWJraXQtdGFwLWhpZ2hsaWdodC1jb2xvcjogdHJhbnNwYXJlbnQ7IH0NCg0KLnJldmVhbCAuY29udHJvbHMgLmVuYWJsZWQgew0KICBvcGFjaXR5OiAwLjc7DQogIGN1cnNvcjogcG9pbnRlcjsgfQ0KDQoucmV2ZWFsIC5jb250cm9scyAuZW5hYmxlZDphY3RpdmUgew0KICBtYXJnaW4tdG9wOiAxcHg7IH0NCg0KLnJldmVhbCAuY29udHJvbHMgLm5hdmlnYXRlLWxlZnQgew0KICB0b3A6IDQycHg7DQogIGJvcmRlci1yaWdodC13aWR0aDogMjJweDsNCiAgYm9yZGVyLXJpZ2h0LWNvbG9yOiAjMDAwOyB9DQoNCi5yZXZlYWwgLmNvbnRyb2xzIC5uYXZpZ2F0ZS1sZWZ0LmZyYWdtZW50ZWQgew0KICBvcGFjaXR5OiAwLjM7IH0NCg0KLnJldmVhbCAuY29udHJvbHMgLm5hdmlnYXRlLXJpZ2h0IHsNCiAgbGVmdDogNzRweDsNCiAgdG9wOiA0MnB4Ow0KICBib3JkZXItbGVmdC13aWR0aDogMjJweDsNCiAgYm9yZGVyLWxlZnQtY29sb3I6ICMwMDA7IH0NCg0KLnJldmVhbCAuY29udHJvbHMgLm5hdmlnYXRlLXJpZ2h0LmZyYWdtZW50ZWQgew0KICBvcGFjaXR5OiAwLjM7IH0NCg0KLnJldmVhbCAuY29udHJvbHMgLm5hdmlnYXRlLXVwIHsNCiAgbGVmdDogNDJweDsNCiAgYm9yZGVyLWJvdHRvbS13aWR0aDogMjJweDsNCiAgYm9yZGVyLWJvdHRvbS1jb2xvcjogIzAwMDsgfQ0KDQoucmV2ZWFsIC5jb250cm9scyAubmF2aWdhdGUtdXAuZnJhZ21lbnRlZCB7DQogIG9wYWNpdHk6IDAuMzsgfQ0KDQoucmV2ZWFsIC5jb250cm9scyAubmF2aWdhdGUtZG93biB7DQogIGxlZnQ6IDQycHg7DQogIHRvcDogNzRweDsNCiAgYm9yZGVyLXRvcC13aWR0aDogMjJweDsNCiAgYm9yZGVyLXRvcC1jb2xvcjogIzAwMDsgfQ0KDQoucmV2ZWFsIC5jb250cm9scyAubmF2aWdhdGUtZG93bi5mcmFnbWVudGVkIHsNCiAgb3BhY2l0eTogMC4zOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIFBST0dSRVNTIEJBUg0KICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi8NCi5yZXZlYWwgLnByb2dyZXNzIHsNCiAgcG9zaXRpb246IGZpeGVkOw0KICBkaXNwbGF5OiBub25lOw0KICBoZWlnaHQ6IDNweDsNCiAgd2lkdGg6IDEwMCU7DQogIGJvdHRvbTogMDsNCiAgbGVmdDogMDsNCiAgei1pbmRleDogMTA7DQogIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC4yKTsgfQ0KDQoucmV2ZWFsIC5wcm9ncmVzczphZnRlciB7DQogIGNvbnRlbnQ6ICcnOw0KICBkaXNwbGF5OiBibG9jazsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICBoZWlnaHQ6IDIwcHg7DQogIHdpZHRoOiAxMDAlOw0KICB0b3A6IC0yMHB4OyB9DQoNCi5yZXZlYWwgLnByb2dyZXNzIHNwYW4gew0KICBkaXNwbGF5OiBibG9jazsNCiAgaGVpZ2h0OiAxMDAlOw0KICB3aWR0aDogMHB4Ow0KICBiYWNrZ3JvdW5kLWNvbG9yOiAjMDAwOw0KICAtd2Via2l0LXRyYW5zaXRpb246IHdpZHRoIDgwMG1zIGN1YmljLWJlemllcigwLjI2LCAwLjg2LCAwLjQ0LCAwLjk4NSk7DQogICAgICAgICAgdHJhbnNpdGlvbjogd2lkdGggODAwbXMgY3ViaWMtYmV6aWVyKDAuMjYsIDAuODYsIDAuNDQsIDAuOTg1KTsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBTTElERSBOVU1CRVINCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIC5zbGlkZS1udW1iZXIgew0KICBwb3NpdGlvbjogZml4ZWQ7DQogIGRpc3BsYXk6IGJsb2NrOw0KICByaWdodDogOHB4Ow0KICBib3R0b206IDhweDsNCiAgei1pbmRleDogMzE7DQogIGZvbnQtZmFtaWx5OiBIZWx2ZXRpY2EsIHNhbnMtc2VyaWY7DQogIGZvbnQtc2l6ZTogMTJweDsNCiAgbGluZS1oZWlnaHQ6IDE7DQogIGNvbG9yOiAjZmZmOw0KICBiYWNrZ3JvdW5kLWNvbG9yOiByZ2JhKDAsIDAsIDAsIDAuNCk7DQogIHBhZGRpbmc6IDVweDsgfQ0KDQoucmV2ZWFsIC5zbGlkZS1udW1iZXItZGVsaW1pdGVyIHsNCiAgbWFyZ2luOiAwIDNweDsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBTTElERVMNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIHsNCiAgcG9zaXRpb246IHJlbGF0aXZlOw0KICB3aWR0aDogMTAwJTsNCiAgaGVpZ2h0OiAxMDAlOw0KICBvdmVyZmxvdzogaGlkZGVuOw0KICAtbXMtdG91Y2gtYWN0aW9uOiBub25lOw0KICAgICAgdG91Y2gtYWN0aW9uOiBub25lOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyB7DQogIHBvc2l0aW9uOiBhYnNvbHV0ZTsNCiAgd2lkdGg6IDEwMCU7DQogIGhlaWdodDogMTAwJTsNCiAgdG9wOiAwOw0KICByaWdodDogMDsNCiAgYm90dG9tOiAwOw0KICBsZWZ0OiAwOw0KICBtYXJnaW46IGF1dG87DQogIHBvaW50ZXItZXZlbnRzOiBub25lOw0KICBvdmVyZmxvdzogdmlzaWJsZTsNCiAgei1pbmRleDogMTsNCiAgLyp0ZXh0LWFsaWduOiBjZW50ZXI7Ki8NCiAgLXdlYmtpdC1wZXJzcGVjdGl2ZTogNjAwcHg7DQogICAgICAgICAgcGVyc3BlY3RpdmU6IDYwMHB4Ow0KICAtd2Via2l0LXBlcnNwZWN0aXZlLW9yaWdpbjogNTAlIDQwJTsNCiAgICAgICAgICBwZXJzcGVjdGl2ZS1vcmlnaW46IDUwJSA0MCU7IH0NCg0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbiB7DQogIC1tcy1wZXJzcGVjdGl2ZTogNjAwcHg7IH0NCg0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbiwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uIHsNCiAgZGlzcGxheTogbm9uZTsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICB3aWR0aDogMTAwJTsNCiAgcGFkZGluZzogMjBweCAwcHg7DQogIHBvaW50ZXItZXZlbnRzOiBhdXRvOw0KICB6LWluZGV4OiAxMDsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IGZsYXQ7DQogICAgICAgICAgdHJhbnNmb3JtLXN0eWxlOiBmbGF0Ow0KICAtd2Via2l0LXRyYW5zaXRpb246IC13ZWJraXQtdHJhbnNmb3JtLW9yaWdpbiA4MDBtcyBjdWJpYy1iZXppZXIoMC4yNiwgMC44NiwgMC40NCwgMC45ODUpLCAtd2Via2l0LXRyYW5zZm9ybSA4MDBtcyBjdWJpYy1iZXppZXIoMC4yNiwgMC44NiwgMC40NCwgMC45ODUpLCB2aXNpYmlsaXR5IDgwMG1zIGN1YmljLWJlemllcigwLjI2LCAwLjg2LCAwLjQ0LCAwLjk4NSksIG9wYWNpdHkgODAwbXMgY3ViaWMtYmV6aWVyKDAuMjYsIDAuODYsIDAuNDQsIDAuOTg1KTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0tb3JpZ2luIDgwMG1zIGN1YmljLWJlemllcigwLjI2LCAwLjg2LCAwLjQ0LCAwLjk4NSksIHRyYW5zZm9ybSA4MDBtcyBjdWJpYy1iZXppZXIoMC4yNiwgMC44NiwgMC40NCwgMC45ODUpLCB2aXNpYmlsaXR5IDgwMG1zIGN1YmljLWJlemllcigwLjI2LCAwLjg2LCAwLjQ0LCAwLjk4NSksIG9wYWNpdHkgODAwbXMgY3ViaWMtYmV6aWVyKDAuMjYsIDAuODYsIDAuNDQsIDAuOTg1KTsgfQ0KDQovKiBHbG9iYWwgdHJhbnNpdGlvbiBzcGVlZCBzZXR0aW5ncyAqLw0KLnJldmVhbFtkYXRhLXRyYW5zaXRpb24tc3BlZWQ9ImZhc3QiXSAuc2xpZGVzIHNlY3Rpb24gew0KICAtd2Via2l0LXRyYW5zaXRpb24tZHVyYXRpb246IDQwMG1zOw0KICAgICAgICAgIHRyYW5zaXRpb24tZHVyYXRpb246IDQwMG1zOyB9DQoNCi5yZXZlYWxbZGF0YS10cmFuc2l0aW9uLXNwZWVkPSJzbG93Il0gLnNsaWRlcyBzZWN0aW9uIHsNCiAgLXdlYmtpdC10cmFuc2l0aW9uLWR1cmF0aW9uOiAxMjAwbXM7DQogICAgICAgICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogMTIwMG1zOyB9DQoNCi8qIFNsaWRlLXNwZWNpZmljIHRyYW5zaXRpb24gc3BlZWQgb3ZlcnJpZGVzICovDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbltkYXRhLXRyYW5zaXRpb24tc3BlZWQ9ImZhc3QiXSB7DQogIC13ZWJraXQtdHJhbnNpdGlvbi1kdXJhdGlvbjogNDAwbXM7DQogICAgICAgICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogNDAwbXM7IH0NCg0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uLXNwZWVkPSJzbG93Il0gew0KICAtd2Via2l0LXRyYW5zaXRpb24tZHVyYXRpb246IDEyMDBtczsNCiAgICAgICAgICB0cmFuc2l0aW9uLWR1cmF0aW9uOiAxMjAwbXM7IH0NCg0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbi5zdGFjayB7DQogIHBhZGRpbmctdG9wOiAwOw0KICBwYWRkaW5nLWJvdHRvbTogMDsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uLnByZXNlbnQsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbi5wcmVzZW50IHsNCiAgZGlzcGxheTogYmxvY2s7DQogIHotaW5kZXg6IDExOw0KICBvcGFjaXR5OiAxOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb246ZW1wdHksDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbjplbXB0eSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS1iYWNrZ3JvdW5kLWludGVyYWN0aXZlXSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtYmFja2dyb3VuZC1pbnRlcmFjdGl2ZV0gew0KICBwb2ludGVyLWV2ZW50czogbm9uZTsgfQ0KDQoucmV2ZWFsLmNlbnRlciwNCi5yZXZlYWwuY2VudGVyIC5zbGlkZXMsDQoucmV2ZWFsLmNlbnRlciAuc2xpZGVzIHNlY3Rpb24gew0KICBtaW4taGVpZ2h0OiAwICFpbXBvcnRhbnQ7IH0NCg0KLyogRG9uJ3QgYWxsb3cgaW50ZXJhY3Rpb24gd2l0aCBpbnZpc2libGUgc2xpZGVzICovDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uLmZ1dHVyZSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uLmZ1dHVyZSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24ucGFzdCwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uLnBhc3Qgew0KICBwb2ludGVyLWV2ZW50czogbm9uZTsgfQ0KDQoucmV2ZWFsLm92ZXJ2aWV3IC5zbGlkZXMgPiBzZWN0aW9uLA0KLnJldmVhbC5vdmVydmlldyAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb24gew0KICBwb2ludGVyLWV2ZW50czogYXV0bzsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uLnBhc3QsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uLmZ1dHVyZSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uLnBhc3QsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbi5mdXR1cmUgew0KICBvcGFjaXR5OiAwOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIE1peGlucyBmb3IgcmVhZGFiaWxpdHkgb2YgdHJhbnNpdGlvbnMNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBTTElERSBUUkFOU0lUSU9ODQogKiBBbGlhc2VkICdsaW5lYXInIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eQ0KICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi8NCi5yZXZlYWwuc2xpZGUgc2VjdGlvbiB7DQogIC13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eTogaGlkZGVuOw0KICAgICAgICAgIGJhY2tmYWNlLXZpc2liaWxpdHk6IGhpZGRlbjsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbj1zbGlkZV0ucGFzdCwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj1zbGlkZS1vdXRdLnBhc3QsDQoucmV2ZWFsLnNsaWRlIC5zbGlkZXMgPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkucGFzdCB7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTE1MCUsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKC0xNTAlLCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbj1zbGlkZV0uZnV0dXJlLA0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb25+PXNsaWRlLWluXS5mdXR1cmUsDQoucmV2ZWFsLnNsaWRlIC5zbGlkZXMgPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkuZnV0dXJlIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgxNTAlLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgxNTAlLCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb249c2xpZGVdLnBhc3QsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb25+PXNsaWRlLW91dF0ucGFzdCwNCi5yZXZlYWwuc2xpZGUgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkucGFzdCB7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgLTE1MCUpOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIC0xNTAlKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb249c2xpZGVdLmZ1dHVyZSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbn49c2xpZGUtaW5dLmZ1dHVyZSwNCi5yZXZlYWwuc2xpZGUgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkuZnV0dXJlIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAxNTAlKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAxNTAlKTsgfQ0KDQoucmV2ZWFsLmxpbmVhciBzZWN0aW9uIHsNCiAgLXdlYmtpdC1iYWNrZmFjZS12aXNpYmlsaXR5OiBoaWRkZW47DQogICAgICAgICAgYmFja2ZhY2UtdmlzaWJpbGl0eTogaGlkZGVuOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPWxpbmVhcl0ucGFzdCwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj1saW5lYXItb3V0XS5wYXN0LA0KLnJldmVhbC5saW5lYXIgLnNsaWRlcyA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5wYXN0IHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMTUwJSwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTE1MCUsIDApOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPWxpbmVhcl0uZnV0dXJlLA0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb25+PWxpbmVhci1pbl0uZnV0dXJlLA0KLnJldmVhbC5saW5lYXIgLnNsaWRlcyA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5mdXR1cmUgew0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDE1MCUsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDE1MCUsIDApOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbj1saW5lYXJdLnBhc3QsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb25+PWxpbmVhci1vdXRdLnBhc3QsDQoucmV2ZWFsLmxpbmVhciAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5wYXN0IHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtMTUwJSk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgLTE1MCUpOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbj1saW5lYXJdLmZ1dHVyZSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbn49bGluZWFyLWluXS5mdXR1cmUsDQoucmV2ZWFsLmxpbmVhciAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5mdXR1cmUgew0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIDE1MCUpOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIDE1MCUpOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIENPTlZFWCBUUkFOU0lUSU9ODQogKiBBbGlhc2VkICdkZWZhdWx0JyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbltkYXRhLXRyYW5zaXRpb249ZGVmYXVsdF0uc3RhY2ssDQoucmV2ZWFsLmRlZmF1bHQgLnNsaWRlcyBzZWN0aW9uLnN0YWNrIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOw0KICAgICAgICAgIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7IH0NCg0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb249ZGVmYXVsdF0ucGFzdCwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj1kZWZhdWx0LW91dF0ucGFzdCwNCi5yZXZlYWwuZGVmYXVsdCAuc2xpZGVzID4gc2VjdGlvbjpub3QoW2RhdGEtdHJhbnNpdGlvbl0pLnBhc3Qgew0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLTEwMCUsIDAsIDApIHJvdGF0ZVkoLTkwZGVnKSB0cmFuc2xhdGUzZCgtMTAwJSwgMCwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtMTAwJSwgMCwgMCkgcm90YXRlWSgtOTBkZWcpIHRyYW5zbGF0ZTNkKC0xMDAlLCAwLCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbj1kZWZhdWx0XS5mdXR1cmUsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbn49ZGVmYXVsdC1pbl0uZnV0dXJlLA0KLnJldmVhbC5kZWZhdWx0IC5zbGlkZXMgPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkuZnV0dXJlIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApIHJvdGF0ZVkoOTBkZWcpIHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCkgcm90YXRlWSg5MGRlZykgdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCk7IH0NCg0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPWRlZmF1bHRdLnBhc3QsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb25+PWRlZmF1bHQtb3V0XS5wYXN0LA0KLnJldmVhbC5kZWZhdWx0IC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbjpub3QoW2RhdGEtdHJhbnNpdGlvbl0pLnBhc3Qgew0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgLTMwMHB4LCAwKSByb3RhdGVYKDcwZGVnKSB0cmFuc2xhdGUzZCgwLCAtMzAwcHgsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgLTMwMHB4LCAwKSByb3RhdGVYKDcwZGVnKSB0cmFuc2xhdGUzZCgwLCAtMzAwcHgsIDApOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbj1kZWZhdWx0XS5mdXR1cmUsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb25+PWRlZmF1bHQtaW5dLmZ1dHVyZSwNCi5yZXZlYWwuZGVmYXVsdCAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5mdXR1cmUgew0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMzAwcHgsIDApIHJvdGF0ZVgoLTcwZGVnKSB0cmFuc2xhdGUzZCgwLCAzMDBweCwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLCAzMDBweCwgMCkgcm90YXRlWCgtNzBkZWcpIHRyYW5zbGF0ZTNkKDAsIDMwMHB4LCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbltkYXRhLXRyYW5zaXRpb249Y29udmV4XS5zdGFjaywNCi5yZXZlYWwuY29udmV4IC5zbGlkZXMgc2VjdGlvbi5zdGFjayB7DQogIC13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDsNCiAgICAgICAgICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPWNvbnZleF0ucGFzdCwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj1jb252ZXgtb3V0XS5wYXN0LA0KLnJldmVhbC5jb252ZXggLnNsaWRlcyA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5wYXN0IHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKC0xMDAlLCAwLCAwKSByb3RhdGVZKC05MGRlZykgdHJhbnNsYXRlM2QoLTEwMCUsIDAsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLTEwMCUsIDAsIDApIHJvdGF0ZVkoLTkwZGVnKSB0cmFuc2xhdGUzZCgtMTAwJSwgMCwgMCk7IH0NCg0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb249Y29udmV4XS5mdXR1cmUsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbn49Y29udmV4LWluXS5mdXR1cmUsDQoucmV2ZWFsLmNvbnZleCAuc2xpZGVzID4gc2VjdGlvbjpub3QoW2RhdGEtdHJhbnNpdGlvbl0pLmZ1dHVyZSB7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgxMDAlLCAwLCAwKSByb3RhdGVZKDkwZGVnKSB0cmFuc2xhdGUzZCgxMDAlLCAwLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApIHJvdGF0ZVkoOTBkZWcpIHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbj1jb252ZXhdLnBhc3QsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb25+PWNvbnZleC1vdXRdLnBhc3QsDQoucmV2ZWFsLmNvbnZleCAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5wYXN0IHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIC0zMDBweCwgMCkgcm90YXRlWCg3MGRlZykgdHJhbnNsYXRlM2QoMCwgLTMwMHB4LCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIC0zMDBweCwgMCkgcm90YXRlWCg3MGRlZykgdHJhbnNsYXRlM2QoMCwgLTMwMHB4LCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb249Y29udmV4XS5mdXR1cmUsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb25+PWNvbnZleC1pbl0uZnV0dXJlLA0KLnJldmVhbC5jb252ZXggLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkuZnV0dXJlIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIDMwMHB4LCAwKSByb3RhdGVYKC03MGRlZykgdHJhbnNsYXRlM2QoMCwgMzAwcHgsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMzAwcHgsIDApIHJvdGF0ZVgoLTcwZGVnKSB0cmFuc2xhdGUzZCgwLCAzMDBweCwgMCk7IH0NCg0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogQ09OQ0FWRSBUUkFOU0lUSU9ODQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbCAuc2xpZGVzIHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPWNvbmNhdmVdLnN0YWNrLA0KLnJldmVhbC5jb25jYXZlIC5zbGlkZXMgc2VjdGlvbi5zdGFjayB7DQogIC13ZWJraXQtdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDsNCiAgICAgICAgICB0cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPWNvbmNhdmVdLnBhc3QsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbn49Y29uY2F2ZS1vdXRdLnBhc3QsDQoucmV2ZWFsLmNvbmNhdmUgLnNsaWRlcyA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5wYXN0IHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKC0xMDAlLCAwLCAwKSByb3RhdGVZKDkwZGVnKSB0cmFuc2xhdGUzZCgtMTAwJSwgMCwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtMTAwJSwgMCwgMCkgcm90YXRlWSg5MGRlZykgdHJhbnNsYXRlM2QoLTEwMCUsIDAsIDApOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPWNvbmNhdmVdLmZ1dHVyZSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj1jb25jYXZlLWluXS5mdXR1cmUsDQoucmV2ZWFsLmNvbmNhdmUgLnNsaWRlcyA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5mdXR1cmUgew0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCkgcm90YXRlWSgtOTBkZWcpIHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCkgcm90YXRlWSgtOTBkZWcpIHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbj1jb25jYXZlXS5wYXN0LA0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj1jb25jYXZlLW91dF0ucGFzdCwNCi5yZXZlYWwuY29uY2F2ZSAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5wYXN0IHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIC04MCUsIDApIHJvdGF0ZVgoLTcwZGVnKSB0cmFuc2xhdGUzZCgwLCAtODAlLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIC04MCUsIDApIHJvdGF0ZVgoLTcwZGVnKSB0cmFuc2xhdGUzZCgwLCAtODAlLCAwKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb249Y29uY2F2ZV0uZnV0dXJlLA0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj1jb25jYXZlLWluXS5mdXR1cmUsDQoucmV2ZWFsLmNvbmNhdmUgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkuZnV0dXJlIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIDgwJSwgMCkgcm90YXRlWCg3MGRlZykgdHJhbnNsYXRlM2QoMCwgODAlLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIDgwJSwgMCkgcm90YXRlWCg3MGRlZykgdHJhbnNsYXRlM2QoMCwgODAlLCAwKTsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBaT09NIFRSQU5TSVRJT04NCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbltkYXRhLXRyYW5zaXRpb249em9vbV0sDQoucmV2ZWFsLnpvb20gLnNsaWRlcyBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkgew0KICAtd2Via2l0LXRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOiBlYXNlOw0KICAgICAgICAgIHRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOiBlYXNlOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPXpvb21dLnBhc3QsDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbn49em9vbS1vdXRdLnBhc3QsDQoucmV2ZWFsLnpvb20gLnNsaWRlcyA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5wYXN0IHsNCiAgdmlzaWJpbGl0eTogaGlkZGVuOw0KICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMTYpOw0KICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMTYpOyB9DQoNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9uPXpvb21dLmZ1dHVyZSwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj16b29tLWluXS5mdXR1cmUsDQoucmV2ZWFsLnpvb20gLnNsaWRlcyA+IHNlY3Rpb246bm90KFtkYXRhLXRyYW5zaXRpb25dKS5mdXR1cmUgew0KICB2aXNpYmlsaXR5OiBoaWRkZW47DQogIC13ZWJraXQtdHJhbnNmb3JtOiBzY2FsZSgwLjIpOw0KICAgICAgICAgIHRyYW5zZm9ybTogc2NhbGUoMC4yKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb249em9vbV0ucGFzdCwNCi5yZXZlYWwgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uW2RhdGEtdHJhbnNpdGlvbn49em9vbS1vdXRdLnBhc3QsDQoucmV2ZWFsLnpvb20gLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkucGFzdCB7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgLTE1MCUpOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIC0xNTAlKTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbltkYXRhLXRyYW5zaXRpb249em9vbV0uZnV0dXJlLA0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb25bZGF0YS10cmFuc2l0aW9ufj16b29tLWluXS5mdXR1cmUsDQoucmV2ZWFsLnpvb20gLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkuZnV0dXJlIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAxNTAlKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAxNTAlKTsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBDVUJFIFRSQU5TSVRJT04NCiAqDQogKiBXQVJOSU5HOg0KICogdGhpcyBpcyBkZXByZWNhdGVkIGFuZCB3aWxsIGJlIHJlbW92ZWQgaW4gYQ0KICogZnV0dXJlIHZlcnNpb24uDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbC5jdWJlIC5zbGlkZXMgew0KICAtd2Via2l0LXBlcnNwZWN0aXZlOiAxMzAwcHg7DQogICAgICAgICAgcGVyc3BlY3RpdmU6IDEzMDBweDsgfQ0KDQoucmV2ZWFsLmN1YmUgLnNsaWRlcyBzZWN0aW9uIHsNCiAgcGFkZGluZzogMzBweDsNCiAgbWluLWhlaWdodDogNzAwcHg7DQogIC13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eTogaGlkZGVuOw0KICAgICAgICAgIGJhY2tmYWNlLXZpc2liaWxpdHk6IGhpZGRlbjsNCiAgYm94LXNpemluZzogYm9yZGVyLWJveDsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOw0KICAgICAgICAgIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7IH0NCg0KLnJldmVhbC5jZW50ZXIuY3ViZSAuc2xpZGVzIHNlY3Rpb24gew0KICBtaW4taGVpZ2h0OiAwOyB9DQoNCi5yZXZlYWwuY3ViZSAuc2xpZGVzIHNlY3Rpb246bm90KC5zdGFjayk6YmVmb3JlIHsNCiAgY29udGVudDogJyc7DQogIHBvc2l0aW9uOiBhYnNvbHV0ZTsNCiAgZGlzcGxheTogYmxvY2s7DQogIHdpZHRoOiAxMDAlOw0KICBoZWlnaHQ6IDEwMCU7DQogIGxlZnQ6IDA7DQogIHRvcDogMDsNCiAgYmFja2dyb3VuZDogcmdiYSgwLCAwLCAwLCAwLjEpOw0KICBib3JkZXItcmFkaXVzOiA0cHg7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVaKC0yMHB4KTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooLTIwcHgpOyB9DQoNCi5yZXZlYWwuY3ViZSAuc2xpZGVzIHNlY3Rpb246bm90KC5zdGFjayk6YWZ0ZXIgew0KICBjb250ZW50OiAnJzsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICBkaXNwbGF5OiBibG9jazsNCiAgd2lkdGg6IDkwJTsNCiAgaGVpZ2h0OiAzMHB4Ow0KICBsZWZ0OiA1JTsNCiAgYm90dG9tOiAwOw0KICBiYWNrZ3JvdW5kOiBub25lOw0KICB6LWluZGV4OiAxOw0KICBib3JkZXItcmFkaXVzOiA0cHg7DQogIGJveC1zaGFkb3c6IDBweCA5NXB4IDI1cHggcmdiYSgwLCAwLCAwLCAwLjIpOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWigtOTBweCkgcm90YXRlWCg2NWRlZyk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGVaKC05MHB4KSByb3RhdGVYKDY1ZGVnKTsgfQ0KDQoucmV2ZWFsLmN1YmUgLnNsaWRlcyA+IHNlY3Rpb24uc3RhY2sgew0KICBwYWRkaW5nOiAwOw0KICBiYWNrZ3JvdW5kOiBub25lOyB9DQoNCi5yZXZlYWwuY3ViZSAuc2xpZGVzID4gc2VjdGlvbi5wYXN0IHsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiAxMDAlIDAlOw0KICAgICAgICAgIHRyYW5zZm9ybS1vcmlnaW46IDEwMCUgMCU7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtMTAwJSwgMCwgMCkgcm90YXRlWSgtOTBkZWcpOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLTEwMCUsIDAsIDApIHJvdGF0ZVkoLTkwZGVnKTsgfQ0KDQoucmV2ZWFsLmN1YmUgLnNsaWRlcyA+IHNlY3Rpb24uZnV0dXJlIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiAwJSAwJTsNCiAgICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiAwJSAwJTsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApIHJvdGF0ZVkoOTBkZWcpOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCkgcm90YXRlWSg5MGRlZyk7IH0NCg0KLnJldmVhbC5jdWJlIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbi5wYXN0IHsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiAwJSAxMDAlOw0KICAgICAgICAgIHRyYW5zZm9ybS1vcmlnaW46IDAlIDEwMCU7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLCAtMTAwJSwgMCkgcm90YXRlWCg5MGRlZyk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLCAtMTAwJSwgMCkgcm90YXRlWCg5MGRlZyk7IH0NCg0KLnJldmVhbC5jdWJlIC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbi5mdXR1cmUgew0KICAtd2Via2l0LXRyYW5zZm9ybS1vcmlnaW46IDAlIDAlOw0KICAgICAgICAgIHRyYW5zZm9ybS1vcmlnaW46IDAlIDAlOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMTAwJSwgMCkgcm90YXRlWCgtOTBkZWcpOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMTAwJSwgMCkgcm90YXRlWCgtOTBkZWcpOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIFBBR0UgVFJBTlNJVElPTg0KICoNCiAqIFdBUk5JTkc6DQogKiB0aGlzIGlzIGRlcHJlY2F0ZWQgYW5kIHdpbGwgYmUgcmVtb3ZlZCBpbiBhDQogKiBmdXR1cmUgdmVyc2lvbi4NCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsLnBhZ2UgLnNsaWRlcyB7DQogIC13ZWJraXQtcGVyc3BlY3RpdmUtb3JpZ2luOiAwJSA1MCU7DQogICAgICAgICAgcGVyc3BlY3RpdmUtb3JpZ2luOiAwJSA1MCU7DQogIC13ZWJraXQtcGVyc3BlY3RpdmU6IDMwMDBweDsNCiAgICAgICAgICBwZXJzcGVjdGl2ZTogMzAwMHB4OyB9DQoNCi5yZXZlYWwucGFnZSAuc2xpZGVzIHNlY3Rpb24gew0KICBwYWRkaW5nOiAzMHB4Ow0KICBtaW4taGVpZ2h0OiA3MDBweDsNCiAgYm94LXNpemluZzogYm9yZGVyLWJveDsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOw0KICAgICAgICAgIHRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7IH0NCg0KLnJldmVhbC5wYWdlIC5zbGlkZXMgc2VjdGlvbi5wYXN0IHsNCiAgei1pbmRleDogMTI7IH0NCg0KLnJldmVhbC5wYWdlIC5zbGlkZXMgc2VjdGlvbjpub3QoLnN0YWNrKTpiZWZvcmUgew0KICBjb250ZW50OiAnJzsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICBkaXNwbGF5OiBibG9jazsNCiAgd2lkdGg6IDEwMCU7DQogIGhlaWdodDogMTAwJTsNCiAgbGVmdDogMDsNCiAgdG9wOiAwOw0KICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuMSk7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGVaKC0yMHB4KTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVooLTIwcHgpOyB9DQoNCi5yZXZlYWwucGFnZSAuc2xpZGVzIHNlY3Rpb246bm90KC5zdGFjayk6YWZ0ZXIgew0KICBjb250ZW50OiAnJzsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICBkaXNwbGF5OiBibG9jazsNCiAgd2lkdGg6IDkwJTsNCiAgaGVpZ2h0OiAzMHB4Ow0KICBsZWZ0OiA1JTsNCiAgYm90dG9tOiAwOw0KICBiYWNrZ3JvdW5kOiBub25lOw0KICB6LWluZGV4OiAxOw0KICBib3JkZXItcmFkaXVzOiA0cHg7DQogIGJveC1zaGFkb3c6IDBweCA5NXB4IDI1cHggcmdiYSgwLCAwLCAwLCAwLjIpOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlWigtOTBweCkgcm90YXRlWCg2NWRlZyk7IH0NCg0KLnJldmVhbC5wYWdlIC5zbGlkZXMgPiBzZWN0aW9uLnN0YWNrIHsNCiAgcGFkZGluZzogMDsNCiAgYmFja2dyb3VuZDogbm9uZTsgfQ0KDQoucmV2ZWFsLnBhZ2UgLnNsaWRlcyA+IHNlY3Rpb24ucGFzdCB7DQogIC13ZWJraXQtdHJhbnNmb3JtLW9yaWdpbjogMCUgMCU7DQogICAgICAgICAgdHJhbnNmb3JtLW9yaWdpbjogMCUgMCU7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtNDAlLCAwLCAwKSByb3RhdGVZKC04MGRlZyk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtNDAlLCAwLCAwKSByb3RhdGVZKC04MGRlZyk7IH0NCg0KLnJldmVhbC5wYWdlIC5zbGlkZXMgPiBzZWN0aW9uLmZ1dHVyZSB7DQogIC13ZWJraXQtdHJhbnNmb3JtLW9yaWdpbjogMTAwJSAwJTsNCiAgICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiAxMDAlIDAlOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMCwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLCAwLCAwKTsgfQ0KDQoucmV2ZWFsLnBhZ2UgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uLnBhc3Qgew0KICAtd2Via2l0LXRyYW5zZm9ybS1vcmlnaW46IDAlIDAlOw0KICAgICAgICAgIHRyYW5zZm9ybS1vcmlnaW46IDAlIDAlOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgLTQwJSwgMCkgcm90YXRlWCg4MGRlZyk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLCAtNDAlLCAwKSByb3RhdGVYKDgwZGVnKTsgfQ0KDQoucmV2ZWFsLnBhZ2UgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uLmZ1dHVyZSB7DQogIC13ZWJraXQtdHJhbnNmb3JtLW9yaWdpbjogMCUgMTAwJTsNCiAgICAgICAgICB0cmFuc2Zvcm0tb3JpZ2luOiAwJSAxMDAlOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMCwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLCAwLCAwKTsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBGQURFIFRSQU5TSVRJT04NCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbltkYXRhLXRyYW5zaXRpb249ZmFkZV0sDQoucmV2ZWFsLmZhZGUgLnNsaWRlcyBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSksDQoucmV2ZWFsLmZhZGUgLnNsaWRlcyA+IHNlY3Rpb24gPiBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkgew0KICAtd2Via2l0LXRyYW5zZm9ybTogbm9uZTsNCiAgICAgICAgICB0cmFuc2Zvcm06IG5vbmU7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogb3BhY2l0eSAwLjVzOw0KICAgICAgICAgIHRyYW5zaXRpb246IG9wYWNpdHkgMC41czsgfQ0KDQoucmV2ZWFsLmZhZGUub3ZlcnZpZXcgLnNsaWRlcyBzZWN0aW9uLA0KLnJldmVhbC5mYWRlLm92ZXJ2aWV3IC5zbGlkZXMgPiBzZWN0aW9uID4gc2VjdGlvbiB7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogbm9uZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBub25lOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIE5PIFRSQU5TSVRJT04NCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIC5zbGlkZXMgc2VjdGlvbltkYXRhLXRyYW5zaXRpb249bm9uZV0sDQoucmV2ZWFsLm5vbmUgLnNsaWRlcyBzZWN0aW9uOm5vdChbZGF0YS10cmFuc2l0aW9uXSkgew0KICAtd2Via2l0LXRyYW5zZm9ybTogbm9uZTsNCiAgICAgICAgICB0cmFuc2Zvcm06IG5vbmU7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogbm9uZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBub25lOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIFBBVVNFRCBNT0RFDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbCAucGF1c2Utb3ZlcmxheSB7DQogIHBvc2l0aW9uOiBhYnNvbHV0ZTsNCiAgdG9wOiAwOw0KICBsZWZ0OiAwOw0KICB3aWR0aDogMTAwJTsNCiAgaGVpZ2h0OiAxMDAlOw0KICBiYWNrZ3JvdW5kOiBibGFjazsNCiAgdmlzaWJpbGl0eTogaGlkZGVuOw0KICBvcGFjaXR5OiAwOw0KICB6LWluZGV4OiAxMDA7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogYWxsIDFzIGVhc2U7DQogICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDFzIGVhc2U7IH0NCg0KLnJldmVhbC5wYXVzZWQgLnBhdXNlLW92ZXJsYXkgew0KICB2aXNpYmlsaXR5OiB2aXNpYmxlOw0KICBvcGFjaXR5OiAxOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIEZBTExCQUNLDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLm5vLXRyYW5zZm9ybXMgew0KICBvdmVyZmxvdy15OiBhdXRvOyB9DQoNCi5uby10cmFuc2Zvcm1zIC5yZXZlYWwgLnNsaWRlcyB7DQogIHBvc2l0aW9uOiByZWxhdGl2ZTsNCiAgd2lkdGg6IDgwJTsNCiAgaGVpZ2h0OiBhdXRvICFpbXBvcnRhbnQ7DQogIHRvcDogMDsNCiAgbGVmdDogNTAlOw0KICBtYXJnaW46IDA7DQogIHRleHQtYWxpZ246IGNlbnRlcjsgfQ0KDQoubm8tdHJhbnNmb3JtcyAucmV2ZWFsIC5jb250cm9scywNCi5uby10cmFuc2Zvcm1zIC5yZXZlYWwgLnByb2dyZXNzIHsNCiAgZGlzcGxheTogbm9uZSAhaW1wb3J0YW50OyB9DQoNCi5uby10cmFuc2Zvcm1zIC5yZXZlYWwgLnNsaWRlcyBzZWN0aW9uIHsNCiAgZGlzcGxheTogYmxvY2sgIWltcG9ydGFudDsNCiAgb3BhY2l0eTogMSAhaW1wb3J0YW50Ow0KICBwb3NpdGlvbjogcmVsYXRpdmUgIWltcG9ydGFudDsNCiAgaGVpZ2h0OiBhdXRvOw0KICBtaW4taGVpZ2h0OiAwOw0KICB0b3A6IDA7DQogIGxlZnQ6IC01MCU7DQogIG1hcmdpbjogNzBweCAwOw0KICAtd2Via2l0LXRyYW5zZm9ybTogbm9uZTsNCiAgICAgICAgICB0cmFuc2Zvcm06IG5vbmU7IH0NCg0KLm5vLXRyYW5zZm9ybXMgLnJldmVhbCAuc2xpZGVzIHNlY3Rpb24gc2VjdGlvbiB7DQogIGxlZnQ6IDA7IH0NCg0KLnJldmVhbCAubm8tdHJhbnNpdGlvbiwNCi5yZXZlYWwgLm5vLXRyYW5zaXRpb24gKiB7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogbm9uZSAhaW1wb3J0YW50Ow0KICAgICAgICAgIHRyYW5zaXRpb246IG5vbmUgIWltcG9ydGFudDsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBQRVItU0xJREUgQkFDS0dST1VORFMNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIC5iYWNrZ3JvdW5kcyB7DQogIHBvc2l0aW9uOiBhYnNvbHV0ZTsNCiAgd2lkdGg6IDEwMCU7DQogIGhlaWdodDogMTAwJTsNCiAgdG9wOiAwOw0KICBsZWZ0OiAwOw0KICAtd2Via2l0LXBlcnNwZWN0aXZlOiA2MDBweDsNCiAgICAgICAgICBwZXJzcGVjdGl2ZTogNjAwcHg7IH0NCg0KLnJldmVhbCAuc2xpZGUtYmFja2dyb3VuZCB7DQogIGRpc3BsYXk6IG5vbmU7DQogIHBvc2l0aW9uOiBhYnNvbHV0ZTsNCiAgd2lkdGg6IDEwMCU7DQogIGhlaWdodDogMTAwJTsNCiAgb3BhY2l0eTogMDsNCiAgdmlzaWJpbGl0eTogaGlkZGVuOw0KICBvdmVyZmxvdzogaGlkZGVuOw0KICBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDsNCiAgYmFja2dyb3VuZC1wb3NpdGlvbjogNTAlIDUwJTsNCiAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDsNCiAgYmFja2dyb3VuZC1zaXplOiBjb3ZlcjsNCiAgLXdlYmtpdC10cmFuc2l0aW9uOiBhbGwgODAwbXMgY3ViaWMtYmV6aWVyKDAuMjYsIDAuODYsIDAuNDQsIDAuOTg1KTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgODAwbXMgY3ViaWMtYmV6aWVyKDAuMjYsIDAuODYsIDAuNDQsIDAuOTg1KTsgfQ0KDQoucmV2ZWFsIC5zbGlkZS1iYWNrZ3JvdW5kLnN0YWNrIHsNCiAgZGlzcGxheTogYmxvY2s7IH0NCg0KLnJldmVhbCAuc2xpZGUtYmFja2dyb3VuZC5wcmVzZW50IHsNCiAgb3BhY2l0eTogMTsNCiAgdmlzaWJpbGl0eTogdmlzaWJsZTsNCiAgei1pbmRleDogMjsgfQ0KDQoucHJpbnQtcGRmIC5yZXZlYWwgLnNsaWRlLWJhY2tncm91bmQgew0KICBvcGFjaXR5OiAxICFpbXBvcnRhbnQ7DQogIHZpc2liaWxpdHk6IHZpc2libGUgIWltcG9ydGFudDsgfQ0KDQovKiBWaWRlbyBiYWNrZ3JvdW5kcyAqLw0KLnJldmVhbCAuc2xpZGUtYmFja2dyb3VuZCB2aWRlbyB7DQogIHBvc2l0aW9uOiBhYnNvbHV0ZTsNCiAgd2lkdGg6IDEwMCU7DQogIGhlaWdodDogMTAwJTsNCiAgbWF4LXdpZHRoOiBub25lOw0KICBtYXgtaGVpZ2h0OiBub25lOw0KICB0b3A6IDA7DQogIGxlZnQ6IDA7DQogIC1vLW9iamVjdC1maXQ6IGNvdmVyOw0KICAgICBvYmplY3QtZml0OiBjb3ZlcjsgfQ0KDQoucmV2ZWFsIC5zbGlkZS1iYWNrZ3JvdW5kW2RhdGEtYmFja2dyb3VuZC1zaXplPSJjb250YWluIl0gdmlkZW8gew0KICAtby1vYmplY3QtZml0OiBjb250YWluOw0KICAgICBvYmplY3QtZml0OiBjb250YWluOyB9DQoNCi8qIEltbWVkaWF0ZSB0cmFuc2l0aW9uIHN0eWxlICovDQoucmV2ZWFsW2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPW5vbmVdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLA0KLnJldmVhbCA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1ub25lXSB7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogbm9uZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBub25lOyB9DQoNCi8qIFNsaWRlICovDQoucmV2ZWFsW2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPXNsaWRlXSA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCwNCi5yZXZlYWwgPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmRbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249c2xpZGVdIHsNCiAgb3BhY2l0eTogMTsNCiAgLXdlYmtpdC1iYWNrZmFjZS12aXNpYmlsaXR5OiBoaWRkZW47DQogICAgICAgICAgYmFja2ZhY2UtdmlzaWJpbGl0eTogaGlkZGVuOyB9DQoNCi5yZXZlYWxbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249c2xpZGVdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3QsDQoucmV2ZWFsID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3RbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249c2xpZGVdIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgtMTAwJSwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoLTEwMCUsIDApOyB9DQoNCi5yZXZlYWxbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249c2xpZGVdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLmZ1dHVyZSwNCi5yZXZlYWwgPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmQuZnV0dXJlW2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPXNsaWRlXSB7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUoMTAwJSwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMTAwJSwgMCk7IH0NCg0KLnJldmVhbFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1zbGlkZV0gPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmQgPiAuc2xpZGUtYmFja2dyb3VuZC5wYXN0LA0KLnJldmVhbCA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCA+IC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3RbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249c2xpZGVdIHsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZSgwLCAtMTAwJSk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUoMCwgLTEwMCUpOyB9DQoNCi5yZXZlYWxbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249c2xpZGVdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kID4gLnNsaWRlLWJhY2tncm91bmQuZnV0dXJlLA0KLnJldmVhbCA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCA+IC5zbGlkZS1iYWNrZ3JvdW5kLmZ1dHVyZVtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1zbGlkZV0gew0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIDEwMCUpOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlKDAsIDEwMCUpOyB9DQoNCi8qIENvbnZleCAqLw0KLnJldmVhbFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb252ZXhdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3QsDQoucmV2ZWFsID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3RbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249Y29udmV4XSB7DQogIG9wYWNpdHk6IDA7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgtMTAwJSwgMCwgMCkgcm90YXRlWSgtOTBkZWcpIHRyYW5zbGF0ZTNkKC0xMDAlLCAwLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKC0xMDAlLCAwLCAwKSByb3RhdGVZKC05MGRlZykgdHJhbnNsYXRlM2QoLTEwMCUsIDAsIDApOyB9DQoNCi5yZXZlYWxbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249Y29udmV4XSA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZC5mdXR1cmUsDQoucmV2ZWFsID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLmZ1dHVyZVtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb252ZXhdIHsNCiAgb3BhY2l0eTogMDsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApIHJvdGF0ZVkoOTBkZWcpIHRyYW5zbGF0ZTNkKDEwMCUsIDAsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCkgcm90YXRlWSg5MGRlZykgdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCk7IH0NCg0KLnJldmVhbFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb252ZXhdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kID4gLnNsaWRlLWJhY2tncm91bmQucGFzdCwNCi5yZXZlYWwgPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmQgPiAuc2xpZGUtYmFja2dyb3VuZC5wYXN0W2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPWNvbnZleF0gew0KICBvcGFjaXR5OiAwOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgLTEwMCUsIDApIHJvdGF0ZVgoOTBkZWcpIHRyYW5zbGF0ZTNkKDAsIC0xMDAlLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIC0xMDAlLCAwKSByb3RhdGVYKDkwZGVnKSB0cmFuc2xhdGUzZCgwLCAtMTAwJSwgMCk7IH0NCg0KLnJldmVhbFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb252ZXhdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kID4gLnNsaWRlLWJhY2tncm91bmQuZnV0dXJlLA0KLnJldmVhbCA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCA+IC5zbGlkZS1iYWNrZ3JvdW5kLmZ1dHVyZVtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb252ZXhdIHsNCiAgb3BhY2l0eTogMDsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIDEwMCUsIDApIHJvdGF0ZVgoLTkwZGVnKSB0cmFuc2xhdGUzZCgwLCAxMDAlLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIDEwMCUsIDApIHJvdGF0ZVgoLTkwZGVnKSB0cmFuc2xhdGUzZCgwLCAxMDAlLCAwKTsgfQ0KDQovKiBDb25jYXZlICovDQoucmV2ZWFsW2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPWNvbmNhdmVdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3QsDQoucmV2ZWFsID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3RbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249Y29uY2F2ZV0gew0KICBvcGFjaXR5OiAwOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoLTEwMCUsIDAsIDApIHJvdGF0ZVkoOTBkZWcpIHRyYW5zbGF0ZTNkKC0xMDAlLCAwLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKC0xMDAlLCAwLCAwKSByb3RhdGVZKDkwZGVnKSB0cmFuc2xhdGUzZCgtMTAwJSwgMCwgMCk7IH0NCg0KLnJldmVhbFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb25jYXZlXSA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZC5mdXR1cmUsDQoucmV2ZWFsID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLmZ1dHVyZVtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb25jYXZlXSB7DQogIG9wYWNpdHk6IDA7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgxMDAlLCAwLCAwKSByb3RhdGVZKC05MGRlZykgdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgxMDAlLCAwLCAwKSByb3RhdGVZKC05MGRlZykgdHJhbnNsYXRlM2QoMTAwJSwgMCwgMCk7IH0NCg0KLnJldmVhbFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb25jYXZlXSA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCA+IC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3QsDQoucmV2ZWFsID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kID4gLnNsaWRlLWJhY2tncm91bmQucGFzdFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj1jb25jYXZlXSB7DQogIG9wYWNpdHk6IDA7DQogIC13ZWJraXQtdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwLCAtMTAwJSwgMCkgcm90YXRlWCgtOTBkZWcpIHRyYW5zbGF0ZTNkKDAsIC0xMDAlLCAwKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIC0xMDAlLCAwKSByb3RhdGVYKC05MGRlZykgdHJhbnNsYXRlM2QoMCwgLTEwMCUsIDApOyB9DQoNCi5yZXZlYWxbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249Y29uY2F2ZV0gPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmQgPiAuc2xpZGUtYmFja2dyb3VuZC5mdXR1cmUsDQoucmV2ZWFsID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kID4gLnNsaWRlLWJhY2tncm91bmQuZnV0dXJlW2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPWNvbmNhdmVdIHsNCiAgb3BhY2l0eTogMDsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDAsIDEwMCUsIDApIHJvdGF0ZVgoOTBkZWcpIHRyYW5zbGF0ZTNkKDAsIDEwMCUsIDApOw0KICAgICAgICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMCwgMTAwJSwgMCkgcm90YXRlWCg5MGRlZykgdHJhbnNsYXRlM2QoMCwgMTAwJSwgMCk7IH0NCg0KLyogWm9vbSAqLw0KLnJldmVhbFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj16b29tXSA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCwNCi5yZXZlYWwgPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmRbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249em9vbV0gew0KICAtd2Via2l0LXRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOiBlYXNlOw0KICAgICAgICAgIHRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uOiBlYXNlOyB9DQoNCi5yZXZlYWxbZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb249em9vbV0gPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmQucGFzdCwNCi5yZXZlYWwgPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmQucGFzdFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj16b29tXSB7DQogIG9wYWNpdHk6IDA7DQogIHZpc2liaWxpdHk6IGhpZGRlbjsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDE2KTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDE2KTsgfQ0KDQoucmV2ZWFsW2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPXpvb21dID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kLmZ1dHVyZSwNCi5yZXZlYWwgPiAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmQuZnV0dXJlW2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPXpvb21dIHsNCiAgb3BhY2l0eTogMDsNCiAgdmlzaWJpbGl0eTogaGlkZGVuOw0KICAtd2Via2l0LXRyYW5zZm9ybTogc2NhbGUoMC4yKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDAuMik7IH0NCg0KLnJldmVhbFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj16b29tXSA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCA+IC5zbGlkZS1iYWNrZ3JvdW5kLnBhc3QsDQoucmV2ZWFsID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kID4gLnNsaWRlLWJhY2tncm91bmQucGFzdFtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj16b29tXSB7DQogIG9wYWNpdHk6IDA7DQogIHZpc2liaWxpdHk6IGhpZGRlbjsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDE2KTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHNjYWxlKDE2KTsgfQ0KDQoucmV2ZWFsW2RhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uPXpvb21dID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kID4gLnNsaWRlLWJhY2tncm91bmQuZnV0dXJlLA0KLnJldmVhbCA+IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCA+IC5zbGlkZS1iYWNrZ3JvdW5kLmZ1dHVyZVtkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbj16b29tXSB7DQogIG9wYWNpdHk6IDA7DQogIHZpc2liaWxpdHk6IGhpZGRlbjsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMik7DQogICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgwLjIpOyB9DQoNCi8qIEdsb2JhbCB0cmFuc2l0aW9uIHNwZWVkIHNldHRpbmdzICovDQoucmV2ZWFsW2RhdGEtdHJhbnNpdGlvbi1zcGVlZD0iZmFzdCJdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kIHsNCiAgLXdlYmtpdC10cmFuc2l0aW9uLWR1cmF0aW9uOiA0MDBtczsNCiAgICAgICAgICB0cmFuc2l0aW9uLWR1cmF0aW9uOiA0MDBtczsgfQ0KDQoucmV2ZWFsW2RhdGEtdHJhbnNpdGlvbi1zcGVlZD0ic2xvdyJdID4gLmJhY2tncm91bmRzIC5zbGlkZS1iYWNrZ3JvdW5kIHsNCiAgLXdlYmtpdC10cmFuc2l0aW9uLWR1cmF0aW9uOiAxMjAwbXM7DQogICAgICAgICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogMTIwMG1zOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIE9WRVJWSUVXDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbC5vdmVydmlldyB7DQogIC13ZWJraXQtcGVyc3BlY3RpdmUtb3JpZ2luOiA1MCUgNTAlOw0KICAgICAgICAgIHBlcnNwZWN0aXZlLW9yaWdpbjogNTAlIDUwJTsNCiAgLXdlYmtpdC1wZXJzcGVjdGl2ZTogNzAwcHg7DQogICAgICAgICAgcGVyc3BlY3RpdmU6IDcwMHB4OyB9DQogIC5yZXZlYWwub3ZlcnZpZXcgLnNsaWRlcyB7DQogICAgLW1vei10cmFuc2Zvcm0tc3R5bGU6IHByZXNlcnZlLTNkOyB9DQogIC5yZXZlYWwub3ZlcnZpZXcgLnNsaWRlcyBzZWN0aW9uIHsNCiAgICBoZWlnaHQ6IDEwMCU7DQogICAgdG9wOiAwICFpbXBvcnRhbnQ7DQogICAgb3BhY2l0eTogMSAhaW1wb3J0YW50Ow0KICAgIG92ZXJmbG93OiBoaWRkZW47DQogICAgdmlzaWJpbGl0eTogdmlzaWJsZSAhaW1wb3J0YW50Ow0KICAgIGN1cnNvcjogcG9pbnRlcjsNCiAgICBib3gtc2l6aW5nOiBib3JkZXItYm94OyB9DQogIC5yZXZlYWwub3ZlcnZpZXcgLnNsaWRlcyBzZWN0aW9uOmhvdmVyLA0KICAucmV2ZWFsLm92ZXJ2aWV3IC5zbGlkZXMgc2VjdGlvbi5wcmVzZW50IHsNCiAgICBvdXRsaW5lOiAxMHB4IHNvbGlkIHJnYmEoMTUwLCAxNTAsIDE1MCwgMC40KTsNCiAgICBvdXRsaW5lLW9mZnNldDogMTBweDsgfQ0KICAucmV2ZWFsLm92ZXJ2aWV3IC5zbGlkZXMgc2VjdGlvbiAuZnJhZ21lbnQgew0KICAgIG9wYWNpdHk6IDE7DQogICAgLXdlYmtpdC10cmFuc2l0aW9uOiBub25lOw0KICAgICAgICAgICAgdHJhbnNpdGlvbjogbm9uZTsgfQ0KICAucmV2ZWFsLm92ZXJ2aWV3IC5zbGlkZXMgc2VjdGlvbjphZnRlciwNCiAgLnJldmVhbC5vdmVydmlldyAuc2xpZGVzIHNlY3Rpb246YmVmb3JlIHsNCiAgICBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH0NCiAgLnJldmVhbC5vdmVydmlldyAuc2xpZGVzID4gc2VjdGlvbi5zdGFjayB7DQogICAgcGFkZGluZzogMDsNCiAgICB0b3A6IDAgIWltcG9ydGFudDsNCiAgICBiYWNrZ3JvdW5kOiBub25lOw0KICAgIG91dGxpbmU6IG5vbmU7DQogICAgb3ZlcmZsb3c6IHZpc2libGU7IH0NCiAgLnJldmVhbC5vdmVydmlldyAuYmFja2dyb3VuZHMgew0KICAgIC13ZWJraXQtcGVyc3BlY3RpdmU6IGluaGVyaXQ7DQogICAgICAgICAgICBwZXJzcGVjdGl2ZTogaW5oZXJpdDsNCiAgICAtbW96LXRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7IH0NCiAgLnJldmVhbC5vdmVydmlldyAuYmFja2dyb3VuZHMgLnNsaWRlLWJhY2tncm91bmQgew0KICAgIG9wYWNpdHk6IDE7DQogICAgdmlzaWJpbGl0eTogdmlzaWJsZTsNCiAgICBvdXRsaW5lOiAxMHB4IHNvbGlkIHJnYmEoMTUwLCAxNTAsIDE1MCwgMC4xKTsNCiAgICBvdXRsaW5lLW9mZnNldDogMTBweDsgfQ0KICAucmV2ZWFsLm92ZXJ2aWV3IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZC5zdGFjayB7DQogICAgb3ZlcmZsb3c6IHZpc2libGU7IH0NCg0KLnJldmVhbC5vdmVydmlldyAuc2xpZGVzIHNlY3Rpb24sDQoucmV2ZWFsLm92ZXJ2aWV3LWRlYWN0aXZhdGluZyAuc2xpZGVzIHNlY3Rpb24gew0KICAtd2Via2l0LXRyYW5zaXRpb246IG5vbmU7DQogICAgICAgICAgdHJhbnNpdGlvbjogbm9uZTsgfQ0KDQoucmV2ZWFsLm92ZXJ2aWV3IC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCwNCi5yZXZlYWwub3ZlcnZpZXctZGVhY3RpdmF0aW5nIC5iYWNrZ3JvdW5kcyAuc2xpZGUtYmFja2dyb3VuZCB7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogbm9uZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBub25lOyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIFJUTCBTVVBQT1JUDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbC5ydGwgLnNsaWRlcywNCi5yZXZlYWwucnRsIC5zbGlkZXMgaDEsDQoucmV2ZWFsLnJ0bCAuc2xpZGVzIGgyLA0KLnJldmVhbC5ydGwgLnNsaWRlcyBoMywNCi5yZXZlYWwucnRsIC5zbGlkZXMgaDQsDQoucmV2ZWFsLnJ0bCAuc2xpZGVzIGg1LA0KLnJldmVhbC5ydGwgLnNsaWRlcyBoNiB7DQogIGRpcmVjdGlvbjogcnRsOw0KICBmb250LWZhbWlseTogc2Fucy1zZXJpZjsgfQ0KDQoucmV2ZWFsLnJ0bCBwcmUsDQoucmV2ZWFsLnJ0bCBjb2RlIHsNCiAgZGlyZWN0aW9uOiBsdHI7IH0NCg0KLnJldmVhbC5ydGwgb2wsDQoucmV2ZWFsLnJ0bCB1bCB7DQogIHRleHQtYWxpZ246IHJpZ2h0OyB9DQoNCi5yZXZlYWwucnRsIC5wcm9ncmVzcyBzcGFuIHsNCiAgZmxvYXQ6IHJpZ2h0OyB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIFBBUkFMTEFYIEJBQ0tHUk9VTkQNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsLmhhcy1wYXJhbGxheC1iYWNrZ3JvdW5kIC5iYWNrZ3JvdW5kcyB7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogYWxsIDAuOHMgZWFzZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC44cyBlYXNlOyB9DQoNCi8qIEdsb2JhbCB0cmFuc2l0aW9uIHNwZWVkIHNldHRpbmdzICovDQoucmV2ZWFsLmhhcy1wYXJhbGxheC1iYWNrZ3JvdW5kW2RhdGEtdHJhbnNpdGlvbi1zcGVlZD0iZmFzdCJdIC5iYWNrZ3JvdW5kcyB7DQogIC13ZWJraXQtdHJhbnNpdGlvbi1kdXJhdGlvbjogNDAwbXM7DQogICAgICAgICAgdHJhbnNpdGlvbi1kdXJhdGlvbjogNDAwbXM7IH0NCg0KLnJldmVhbC5oYXMtcGFyYWxsYXgtYmFja2dyb3VuZFtkYXRhLXRyYW5zaXRpb24tc3BlZWQ9InNsb3ciXSAuYmFja2dyb3VuZHMgew0KICAtd2Via2l0LXRyYW5zaXRpb24tZHVyYXRpb246IDEyMDBtczsNCiAgICAgICAgICB0cmFuc2l0aW9uLWR1cmF0aW9uOiAxMjAwbXM7IH0NCg0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogTElOSyBQUkVWSUVXIE9WRVJMQVkNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIC5vdmVybGF5IHsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICB0b3A6IDA7DQogIGxlZnQ6IDA7DQogIHdpZHRoOiAxMDAlOw0KICBoZWlnaHQ6IDEwMCU7DQogIHotaW5kZXg6IDEwMDA7DQogIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC45KTsNCiAgb3BhY2l0eTogMDsNCiAgdmlzaWJpbGl0eTogaGlkZGVuOw0KICAtd2Via2l0LXRyYW5zaXRpb246IGFsbCAwLjNzIGVhc2U7DQogICAgICAgICAgdHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZTsgfQ0KDQoucmV2ZWFsIC5vdmVybGF5LnZpc2libGUgew0KICBvcGFjaXR5OiAxOw0KICB2aXNpYmlsaXR5OiB2aXNpYmxlOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkgLnNwaW5uZXIgew0KICBwb3NpdGlvbjogYWJzb2x1dGU7DQogIGRpc3BsYXk6IGJsb2NrOw0KICB0b3A6IDUwJTsNCiAgbGVmdDogNTAlOw0KICB3aWR0aDogMzJweDsNCiAgaGVpZ2h0OiAzMnB4Ow0KICBtYXJnaW46IC0xNnB4IDAgMCAtMTZweDsNCiAgei1pbmRleDogMTA7DQogIGJhY2tncm91bmQtaW1hZ2U6IHVybChkYXRhOmltYWdlL2dpZjtiYXNlNjQsUjBsR09EbGhJQUFnQVBNQUFKbVptZiUyRiUyRiUyRjYlMkJ2cjhuSnliVzF0Y0RBd09qbzZOdmIyNmlvcUtPam83T3pzJTJGTHk4dno4JTJGQUFBQUFBQUFBQUFBQ0glMkZDMDVGVkZORFFWQkZNaTR3QXdFQUFBQWglMkZocERjbVZoZEdWa0lIZHBkR2dnWVdwaGVHeHZZV1F1YVc1bWJ3QWglMkJRUUpDZ0FBQUN3QUFBQUFJQUFnQUFBRTV4RElTV2xocGVyTjUySkxoU1NkUmd3Vm8xSUNRWlJVc2l3SHBUSlQ0aW93TlM4dnlXMmljQ0Y2azhITU1Ca0NFRHNreFRCREFad3VBa2txSWZ4SVF5aEJRQkZ2QVFTRElUTTVWRFc2WE5FNEthZ05oNkJnd2U2MHNtUVVCM2Q0UnoxWkJBcG5GQVNEZDBoaWhoMTJCa0U5a2pBSlZseWNYSWc3Q1FJRkE2U2xuSjg3cGFxYlNLaUtvcXVzbmJNZG1EQzJ0WFFsa1VoemlZdHlXVHhJZnk2QkU4V0p0NVlKdnBKaXZ4TmFHbUxIVDBWbk9nU1lmMGRaWFM3QVBkcEIzMDlSbkhPRzVnRHFYR0xEYUM0NTdEMXpaJTJGViUyRm5tT004MlhpSFJMWUtoS1Axb1ptQURkRUFBQWglMkJRUUpDZ0FBQUN3QUFBQUFJQUFnQUFBRTZoRElTV2xacE9yTnAxbEdOUlNkUnBEVW9sSUd3NVJVWWhoSHVrcUZ1OERzckV5cW5XVGhHdkFtaFZsdGVCdm9qcFREREJVRUlGd01GQlJBbUJrU2dPckJGWm9nQ0FTd0JERVklMkZDWlNnN0dTRTBnU0NqUUJNVkcwMjN4V0Joa2xBbm9FZGhRRWZ5TnFNSWNLamhSc2pFZG5lekIlMkJBNGs4Z1R3SmhGdWlXNGRva1hpbG9VZXBCQXA1cWFLcHA2JTJCSG83YVdXNTR3bDdvYnZFZTBrUnVvcGxDR2Vwd1N4MmpKdnFIRW1HdDZ3aEpwR3BmSkNIbU9vTkhLYUh4NjFXaVNSOTJFNGxiRm9xJTJCQjZRRHR1ZXRjYUJQblc2JTJCTzd3REhwSWlLOVNhVks1R2dWNTQzdHpqZ0djZ2hBZ0FoJTJCUVFKQ2dBQUFDd0FBQUFBSUFBZ0FBQUU3aERJU1NreHBPck41ekZITldSZGhTaVZvVkxIc3BSVU1veVVha3lFZThQVFBDQVRXOUExNEUwVXZ1QUtNTkFaS1lVWkNpQk11QmFrU1FLRzhHMkZ6VVdveDJBVXRBUUZjQktsVlFvTGdRUmVaaFFsQ0lKZXNRWEk1QjBDQm5VTU94TUNlbm9DZlRDRVdCc0pDb2xUTUFObGR4MTVCR3M4QjV3bENaOVBvNk9Ka3dtUnBucWtxbnVTcmF5cWZLbXFwTGFqb2lXNUhKcTdGTDFHcjJtTU1jS1VNSWlKZ0llbXk3eFp0SnNUbXNNNHhIaUt2NUtNQ1hxZnlVQ0pFb25YUE4yckFPSUFtc2ZCM3VQb0FLJTJCJTJCRyUyQnc0OGVkWlBLJTJCTTZoTEpwUWc0ODRlblhJZFFGU1MxdTZVaGtzRU5FUUFBSWZrRUNRb0FBQUFzQUFBQUFDQUFJQUFBQk9jUXlFbXBHS0xxeldjWlJWVVFuWllnMWFCU2gyR1VWRUlRMmFRT0UlMkJHJTJCY0Q0bnRwV2taUWoxSklpWklvZ0RGRnlISTBVeFF3RnVnTVNPRklQSmZ0ZlZBRW9aTEJiY0xFRmhsUWlxR3AxVmQxNDBBVWtsVU4zZUNBNTFDMUVXTXpNQ2V6Q0JCbWt4VklWSEJXZDNISGw5SlFPSUpTZFNuSjBUREtDaEN3VUpqb1dNUGFHcURLYW5uYXNNbzZXbk01NjJSNVlsdVpSd3VyMHdwZ3FaRTdOS1VtJTJCRk5SUEloakJKeEtadGVXdUlCTU40elJNSVZJaGZmY2dvandDRjExN2k0bmxMblk1enRSTHNuT2slMkJhViUyQm9KWTdWN203NlBka1M0dHJLY2RnMFpjMHRUY0trUkFBQUlma0VDUW9BQUFBc0FBQUFBQ0FBSUFBQUJPNFF5RWtwS3FqcXpTY3BSYVZrWFpXUUV4aW13MUJTQ1VFSWxEb2hyZnQ2Y3BLQ2s1eGlkNU1OSlRhQUlrZWtLR1FrV3lLSGt2aEtzUjdBUm1pdGtBWURZUkliVVFSUWpXQndKUnpDaGk5Q1JsQmNZMVVONGcwJTJGVk5CMEFsY3ZjQVlIUnlaUGRFUUZZVjhjY3dSNUhXeEVKMDJZbVJNTG5KMXhDWXAwWTVpZHBRdWhvcG1tQzJLZ29qS2FzVVFEazVCTkF3d01PaDJSdFJxNXVRdVBaS0dJSlFJR3dBd0dmNkkwSlhNcEM4QzdrWFdEQklORk14UzRES01BV1ZXQUdZc0FkTnFXNXVhUnhrU0tKT1pLYVUzdFBPQlo0RHVLMkxBVGdKaGtQSk1nVHdLQ2RGanlQSEVuS3hGQ0RoRUFBQ0g1QkFrS0FBQUFMQUFBQUFBZ0FDQUFBQVR6RU1oSmFWS3A2czJuSWtvbElKMldrQlNocGtWUldxcVFyaExTRXU5TVpKS0s5eTFacnFZSzlXaUNsbXZvVWFGOGdJUVNOZUYxRXI0TU5GbjRTUlNEQVJXcm9BSUVUZzFpVnd1SGpZQjFrWWMxbXdydXdYS0M5Z21zSlhsaUd4YyUyQlhpVUNieTl5ZGgxc09TZE1rcE1UQnBhWEJ6c2Zob2M1bDU4R201eVRvQWFaaGFPVXFqa0RnQ1dOSEFVTEN3T0xhVG16c3dhZEVxZ2dRd2dIdVFzSElvWkNIUU1NUWdRR3ViVkVjeE9QRkFjTURBWVVBODVlV0FSbWZTUlFDZGNNZTB6ZVAxQUF5Z3dMbEp0UE5BQUwxOURBUmRQekJPV1NtMWJySkJpNDVzb1JBV1FBQWtyUUl5a1NoUTl3VmhIQ3dDUUNBQ0g1QkFrS0FBQUFMQUFBQUFBZ0FDQUFBQVRyRU1oSmFWS3A2czJuSWtxRlpGMlZJQldoVXNKYVRva3FVQ29CcSUyQkU3MVNSUWV5cVVUb0xBN1Z4RjBKRHlJUWglMkZNVlZQTXQxRUNabGZjalpKOW1JS29hVGwxTVJJbDVvNENVS1hPd215ckNJbkNLcWNXdHZhZEwyU1loeUFTeU5ESjB1SWlSTURqSTBGZDMwJTJGaUkyVUE1R1NTNVVEajJsNk5vcWdPZ040Z2tzRUJnWUZmMEZEcUtnSG55WjlPWDhIcmdZSGRIcGNIUVVMWEFTMnFLcEVOUmc3ZUFNTEM3a1RCYWl4VVlGa0tBeldBQW5MQzdGTFZ4TFdEQkxLQ3dhS1RVTGdFd2JMQTRoSnRPa1NCTnFJVFQzeEVnZkxwQnR6RSUyRmppdUwwNFJHRUJnd1doU2hSZ1FFeEhCQUFoJTJCUVFKQ2dBQUFDd0FBQUFBSUFBZ0FBQUU3eERJU1dsU3Flck5weUpLaFdSZGxTQVZvVkxDV2s2SktsQXFBYXZoTzlVa1VIc3FsRTZDd08xY1JkQ1E4aUVJZnpGVlR6TGRSQW1aWDNJMlNmWmlDcUdrNWRURVNKZWFPQWxDbHpzSnNxd2lKd2lxbkZyYjJuUzlrbUljZ0VzalF5ZExpSWxIZWhocGVqYUlqemg5ZW9tU2paUiUyQmlwc2xXSVJMQWdNRE9SMkRPcUtvZ1RCOXBDVUpCYWdEQlhSNlhCMEVCa0lJc2FSc0dHTU1BeG9EQmdZSFRLSmlVWUVHREF6SEM5RUFDY1VHa0lnRnpnd1owUXNTQmNYSGlRdk93Z0RkRXdmRnMwc0R6dDRTNkJLNHhZamtET3puMHVuRmVCek9CaWpJbTFEZ21nNVlGUXdzQ01qcDFvSjhMeUlBQUNINUJBa0tBQUFBTEFBQUFBQWdBQ0FBQUFUd0VNaEphVktwNnMybklrcUZaRjJWSUJXaFVzSmFUb2txVUNvQnElMkJFNzFTUlFleXFVVG9MQTdWeEYwSkR5SVFoJTJGTVZWUE10MUVDWmxmY2paSjltSUtvYVRsMU1SSWw1bzRDVUtYT3dteXJDSW5DS3FjV3R2YWRMMlNZaHlBU3lOREowdUlpVWQ2R0dsNk5vaVBPSDE2aVpLTmxINktteVdGT2dnSGhFRXZBd3dNQTBOOUdCc0VDNmFtaG5WY0V3YXZEQWF6R3dJRGFIMWlwYVlMQlVUQ0dnUURBOE5kSHowRnBxZ1RCd3NMcUFiV0FBbklBNEZXS2RNTEdkWUdFZ3JhaWdiVDBPSVRCY2c1UXdQVDR4THJST1pMNkF1UUFQVVM3YnhMcG9XaWRZMEp0eExIS2h3d01KQlRIZ1BLZEVRQUFDSDVCQWtLQUFBQUxBQUFBQUFnQUNBQUFBVHJFTWhKYVZLcDZzMm5Ja3FGWkYyVklCV2hVc0phVG9rcVVDb0JxJTJCRTcxU1JRZXlxVVRvTEE3VnhGMEpEeUlRaCUyRk1WVlBNdDFFQ1psZmNqWko5bUlLb2FUbDFNUklsNW80Q1VLWE93bXlyQ0luQ0txY1d0dmFkTDJTWWh5QVN5TkRKMHVJaVVkNkdBVUxESkNSaVhvMUNwR1hESk9ValklMkJZaXA5RGhUb0pBNFJCTHdNTEN3VkRmUmdiQkFhcXFvWjFYQk1Ic3dzSHR4dEZhSDFpcWFvR05nQUl4UnBiRkFnZlBRU3FwYmdHQnFVRDF3QlhlQ1lwMUFZWjE5SkpPWWdIMUt3QTRVQnZRd1hVQnhQcVZEOUwzc2JwMkJOazJ4dnZGUEpkJTJCTUZDTjZIQUFJS2dOZ2dZMEt0RUJBQWglMkJRUUpDZ0FBQUN3QUFBQUFJQUFnQUFBRTZCRElTV2xTcWVyTnB5SktoV1JkbFNBVm9WTENXazZKS2xBcUFhdmhPOVVrVUhzcWxFNkN3TzFjUmRDUThpRUlmekZWVHpMZFJBbVpYM0kyU2ZZSURNYUFGZFRFU0plYUVEQUlNeFlGcXJPVWFOVzRFNE9iWWNDWGFpQlZFZ1VMZTBOSmF4eHRZa3NqaDJOTGtaSVNnRGdKaEh0aGtwVTRtVzZibFJpWW1aT2xoNEpXa0RxSUx3VUdCbkU2VFlFYkNnZXZyME4xZ0g0QXQ3Z0hpUnBGYUxOcnJxOEhOZ0FKQTcwQVd4UUlIMSUyQnZzWU1EQXpaUVBDOVZDTmtEV1VoR2t1RTVQeEpOd2lVSzRVZkx6T2xENFd2ekFIYW9HOW54UGk1ZCUyQmpZVXFmQWhoeWtPRndKV2lBQUFJZmtFQ1FvQUFBQXNBQUFBQUNBQUlBQUFCUEFReUVscFVxbnF6YWNpU29Wa1hWVU1GYUZTd2xwT0NjTVlsRXJBYXZoT01uTkxObzhLc1pzTVpJdEpFSURJRlNrTEdRb1FUTmhJc0ZlaFJ3dzJDUUxLRjB0WUdLWVNnJTJCeWdzWkl1TnFKa3NLZ2JmZ0lHZXBObzJjSVVCM1YxQjNJdk5pQllOUWFEU1R0ZmhoeDBDd1ZQSTBVSmUwJTJCYm00ZzVWZ2NHb3FPY25qbWpxRFNkbmhnRW9hbWNzWnVYTzFhV1F5OEtBd09BdVRZWUd3aTd3NWglMkJLcjBTSjhNRmlocE5ieCUyQjRFcnE3QllCdXpzZGlIMWpDQXpvU2ZsMHJWaXJOYlJYbEJCbExYJTJCQlAwWEpMQVBHelRrQXVBT3FiMFdUNUFIN09jZENtNUI4VGdSd1NSS0lIUXRhTEN3ZzFSQUFBT3dBQUFBQUFBQUFBQUElM0QlM0QpOw0KICB2aXNpYmlsaXR5OiB2aXNpYmxlOw0KICBvcGFjaXR5OiAwLjY7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkgaGVhZGVyIHsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICBsZWZ0OiAwOw0KICB0b3A6IDA7DQogIHdpZHRoOiAxMDAlOw0KICBoZWlnaHQ6IDQwcHg7DQogIHotaW5kZXg6IDI7DQogIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjMjIyOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkgaGVhZGVyIGEgew0KICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7DQogIHdpZHRoOiA0MHB4Ow0KICBoZWlnaHQ6IDQwcHg7DQogIGxpbmUtaGVpZ2h0OiAzNnB4Ow0KICBwYWRkaW5nOiAwIDEwcHg7DQogIGZsb2F0OiByaWdodDsNCiAgb3BhY2l0eTogMC42Ow0KICBib3gtc2l6aW5nOiBib3JkZXItYm94OyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkgaGVhZGVyIGE6aG92ZXIgew0KICBvcGFjaXR5OiAxOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkgaGVhZGVyIGEgLmljb24gew0KICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7DQogIHdpZHRoOiAyMHB4Ow0KICBoZWlnaHQ6IDIwcHg7DQogIGJhY2tncm91bmQtcG9zaXRpb246IDUwJSA1MCU7DQogIGJhY2tncm91bmQtc2l6ZTogMTAwJTsNCiAgYmFja2dyb3VuZC1yZXBlYXQ6IG5vLXJlcGVhdDsgfQ0KDQoucmV2ZWFsIC5vdmVybGF5IGhlYWRlciBhLmNsb3NlIC5pY29uIHsNCiAgYmFja2dyb3VuZC1pbWFnZTogdXJsKGRhdGE6aW1hZ2UvcG5nO2Jhc2U2NCxpVkJPUncwS0dnb0FBQUFOU1VoRVVnQUFBQ0FBQUFBZ0NBWUFBQUJ6ZW5yMEFBQUJra2xFUVZSWVI4V1g0VkhETUF4RzZ3bm9KckFCWlFQWUJDYUJUV0FEMmcxZ0U1Z2c2T09zWHV4SWxyNDBkODFkZnJTSjlWNGMyVkxLN3NwSHVUSi81d3BNMDdRWHVYYzVYMG9wWDJ0RUpjYWRqSHVWODBsaS9GZ3hUSUVLLzVRQkNJQ0JENnhFaFNNR0hnUVBnQmdMaVlWQUIxZHBTcUtEYXd4VG9oRnc0SlNFQTNjbHpnSUJQQ1VSd0UySnVjQlI3cmhQSkp2NU9wSndEWCtTZkRqZ3gxd0FDUWVKRzFhQ2hQOUsvSU1tZFo4RHRFU1YxV3lQM0J0NE13TTZzajROTXhNWWlxVVdIUXU0S1lBL1NZa0lqT3NtM0JYWVdNS0ZEd1Uya2hqQ1E0RUxKVUo0U21DbFJBck9DbVNYR3VLbWEwZllENUNiekh4RnBDU0dBaGZBVlNTVUdEVWsyQldaYWZmMmc2R0UxNUJzQlE5bndtcElHRGl5SFFkZHdOVE1La2JaYWY5ZmFqWFFjYTFFWDQ0cHVKWlVzblkwT2JHbUlURTNHVkxDYkVoUVVqR1Z0MTQ2ajZvYXNXTis0OVZwaDJ3MXBaNUVhbnNOWnFLQm0xdHhiVTU3aVJSY1o4NlJXTURkV3RCSlVIQkh3b1FQaTFHVitKQ2JudG12b2s3aVRYNC9VcDltZ3lUYy9GSllEVGNuZGdIL0FBNUEvQ0hzeUVrVkFBQUFBRWxGVGtTdVFtQ0MpOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkgaGVhZGVyIGEuZXh0ZXJuYWwgLmljb24gew0KICBiYWNrZ3JvdW5kLWltYWdlOiB1cmwoZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUFDQUFBQUFnQ0FZQUFBQnplbnIwQUFBQWNFbEVRVlJZUisyV1NRb0FJUXdFemY4ZjdYaU9Na1VReFVQbEdrTTNoVm1pUWZRUjlHWW5IMVNzQVFsSTREaUJxa0NNb05iOXkyZTkwSUFFSlBBY2dkem5VOStlbmdNYWVKN0F6aDVZMVU2N2dBaG80RHFCcW1CMWJ1QWYwTUIxQWxWQmVrODNaUGttSk1HYzF3QVIrQUFxb2QvQjk3VFJwUUFBQUFCSlJVNUVya0pnZ2c9PSk7IH0NCg0KLnJldmVhbCAub3ZlcmxheSAudmlld3BvcnQgew0KICBwb3NpdGlvbjogYWJzb2x1dGU7DQogIGRpc3BsYXk6IC13ZWJraXQtYm94Ow0KICBkaXNwbGF5OiAtd2Via2l0LWZsZXg7DQogIGRpc3BsYXk6IC1tcy1mbGV4Ym94Ow0KICBkaXNwbGF5OiBmbGV4Ow0KICB0b3A6IDQwcHg7DQogIHJpZ2h0OiAwOw0KICBib3R0b206IDA7DQogIGxlZnQ6IDA7IH0NCg0KLnJldmVhbCAub3ZlcmxheS5vdmVybGF5LXByZXZpZXcgLnZpZXdwb3J0IGlmcmFtZSB7DQogIHdpZHRoOiAxMDAlOw0KICBoZWlnaHQ6IDEwMCU7DQogIG1heC13aWR0aDogMTAwJTsNCiAgbWF4LWhlaWdodDogMTAwJTsNCiAgYm9yZGVyOiAwOw0KICBvcGFjaXR5OiAwOw0KICB2aXNpYmlsaXR5OiBoaWRkZW47DQogIC13ZWJraXQtdHJhbnNpdGlvbjogYWxsIDAuM3MgZWFzZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgMC4zcyBlYXNlOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkub3ZlcmxheS1wcmV2aWV3LmxvYWRlZCAudmlld3BvcnQgaWZyYW1lIHsNCiAgb3BhY2l0eTogMTsNCiAgdmlzaWJpbGl0eTogdmlzaWJsZTsgfQ0KDQoucmV2ZWFsIC5vdmVybGF5Lm92ZXJsYXktcHJldmlldy5sb2FkZWQgLnZpZXdwb3J0LWlubmVyIHsNCiAgcG9zaXRpb246IGFic29sdXRlOw0KICB6LWluZGV4OiAtMTsNCiAgbGVmdDogMDsNCiAgdG9wOiA0NSU7DQogIHdpZHRoOiAxMDAlOw0KICB0ZXh0LWFsaWduOiBjZW50ZXI7DQogIGxldHRlci1zcGFjaW5nOiBub3JtYWw7IH0NCg0KLnJldmVhbCAub3ZlcmxheS5vdmVybGF5LXByZXZpZXcgLngtZnJhbWUtZXJyb3Igew0KICBvcGFjaXR5OiAwOw0KICAtd2Via2l0LXRyYW5zaXRpb246IG9wYWNpdHkgMC4zcyBlYXNlIDAuM3M7DQogICAgICAgICAgdHJhbnNpdGlvbjogb3BhY2l0eSAwLjNzIGVhc2UgMC4zczsgfQ0KDQoucmV2ZWFsIC5vdmVybGF5Lm92ZXJsYXktcHJldmlldy5sb2FkZWQgLngtZnJhbWUtZXJyb3Igew0KICBvcGFjaXR5OiAxOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkub3ZlcmxheS1wcmV2aWV3LmxvYWRlZCAuc3Bpbm5lciB7DQogIG9wYWNpdHk6IDA7DQogIHZpc2liaWxpdHk6IGhpZGRlbjsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHNjYWxlKDAuMik7DQogICAgICAgICAgdHJhbnNmb3JtOiBzY2FsZSgwLjIpOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkub3ZlcmxheS1oZWxwIC52aWV3cG9ydCB7DQogIG92ZXJmbG93OiBhdXRvOw0KICBjb2xvcjogI2ZmZjsgfQ0KDQoucmV2ZWFsIC5vdmVybGF5Lm92ZXJsYXktaGVscCAudmlld3BvcnQgLnZpZXdwb3J0LWlubmVyIHsNCiAgd2lkdGg6IDYwMHB4Ow0KICBtYXJnaW46IGF1dG87DQogIHBhZGRpbmc6IDIwcHggMjBweCA4MHB4IDIwcHg7DQogIHRleHQtYWxpZ246IGNlbnRlcjsNCiAgbGV0dGVyLXNwYWNpbmc6IG5vcm1hbDsgfQ0KDQoucmV2ZWFsIC5vdmVybGF5Lm92ZXJsYXktaGVscCAudmlld3BvcnQgLnZpZXdwb3J0LWlubmVyIC50aXRsZSB7DQogIGZvbnQtc2l6ZTogMjBweDsgfQ0KDQoucmV2ZWFsIC5vdmVybGF5Lm92ZXJsYXktaGVscCAudmlld3BvcnQgLnZpZXdwb3J0LWlubmVyIHRhYmxlIHsNCiAgYm9yZGVyOiAxcHggc29saWQgI2ZmZjsNCiAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsNCiAgZm9udC1zaXplOiAxNnB4OyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkub3ZlcmxheS1oZWxwIC52aWV3cG9ydCAudmlld3BvcnQtaW5uZXIgdGFibGUgdGgsDQoucmV2ZWFsIC5vdmVybGF5Lm92ZXJsYXktaGVscCAudmlld3BvcnQgLnZpZXdwb3J0LWlubmVyIHRhYmxlIHRkIHsNCiAgd2lkdGg6IDIwMHB4Ow0KICBwYWRkaW5nOiAxNHB4Ow0KICBib3JkZXI6IDFweCBzb2xpZCAjZmZmOw0KICB2ZXJ0aWNhbC1hbGlnbjogbWlkZGxlOyB9DQoNCi5yZXZlYWwgLm92ZXJsYXkub3ZlcmxheS1oZWxwIC52aWV3cG9ydCAudmlld3BvcnQtaW5uZXIgdGFibGUgdGggew0KICBwYWRkaW5nLXRvcDogMjBweDsNCiAgcGFkZGluZy1ib3R0b206IDIwcHg7IH0NCg0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogUExBWUJBQ0sgQ09NUE9ORU5UDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbCAucGxheWJhY2sgew0KICBwb3NpdGlvbjogZml4ZWQ7DQogIGxlZnQ6IDE1cHg7DQogIGJvdHRvbTogMjBweDsNCiAgei1pbmRleDogMzA7DQogIGN1cnNvcjogcG9pbnRlcjsNCiAgLXdlYmtpdC10cmFuc2l0aW9uOiBhbGwgNDAwbXMgZWFzZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgNDAwbXMgZWFzZTsgfQ0KDQoucmV2ZWFsLm92ZXJ2aWV3IC5wbGF5YmFjayB7DQogIG9wYWNpdHk6IDA7DQogIHZpc2liaWxpdHk6IGhpZGRlbjsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBST0xMSU5HIExJTktTDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbCAucm9sbCB7DQogIGRpc3BsYXk6IGlubGluZS1ibG9jazsNCiAgbGluZS1oZWlnaHQ6IDEuMjsNCiAgb3ZlcmZsb3c6IGhpZGRlbjsNCiAgdmVydGljYWwtYWxpZ246IHRvcDsNCiAgLXdlYmtpdC1wZXJzcGVjdGl2ZTogNDAwcHg7DQogICAgICAgICAgcGVyc3BlY3RpdmU6IDQwMHB4Ow0KICAtd2Via2l0LXBlcnNwZWN0aXZlLW9yaWdpbjogNTAlIDUwJTsNCiAgICAgICAgICBwZXJzcGVjdGl2ZS1vcmlnaW46IDUwJSA1MCU7IH0NCg0KLnJldmVhbCAucm9sbDpob3ZlciB7DQogIGJhY2tncm91bmQ6IG5vbmU7DQogIHRleHQtc2hhZG93OiBub25lOyB9DQoNCi5yZXZlYWwgLnJvbGwgc3BhbiB7DQogIGRpc3BsYXk6IGJsb2NrOw0KICBwb3NpdGlvbjogcmVsYXRpdmU7DQogIHBhZGRpbmc6IDAgMnB4Ow0KICBwb2ludGVyLWV2ZW50czogbm9uZTsNCiAgLXdlYmtpdC10cmFuc2l0aW9uOiBhbGwgNDAwbXMgZWFzZTsNCiAgICAgICAgICB0cmFuc2l0aW9uOiBhbGwgNDAwbXMgZWFzZTsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiA1MCUgMCU7DQogICAgICAgICAgdHJhbnNmb3JtLW9yaWdpbjogNTAlIDAlOw0KICAtd2Via2l0LXRyYW5zZm9ybS1zdHlsZTogcHJlc2VydmUtM2Q7DQogICAgICAgICAgdHJhbnNmb3JtLXN0eWxlOiBwcmVzZXJ2ZS0zZDsNCiAgLXdlYmtpdC1iYWNrZmFjZS12aXNpYmlsaXR5OiBoaWRkZW47DQogICAgICAgICAgYmFja2ZhY2UtdmlzaWJpbGl0eTogaGlkZGVuOyB9DQoNCi5yZXZlYWwgLnJvbGw6aG92ZXIgc3BhbiB7DQogIGJhY2tncm91bmQ6IHJnYmEoMCwgMCwgMCwgMC41KTsNCiAgLXdlYmtpdC10cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDBweCwgMHB4LCAtNDVweCkgcm90YXRlWCg5MGRlZyk7DQogICAgICAgICAgdHJhbnNmb3JtOiB0cmFuc2xhdGUzZCgwcHgsIDBweCwgLTQ1cHgpIHJvdGF0ZVgoOTBkZWcpOyB9DQoNCi5yZXZlYWwgLnJvbGwgc3BhbjphZnRlciB7DQogIGNvbnRlbnQ6IGF0dHIoZGF0YS10aXRsZSk7DQogIGRpc3BsYXk6IGJsb2NrOw0KICBwb3NpdGlvbjogYWJzb2x1dGU7DQogIGxlZnQ6IDA7DQogIHRvcDogMDsNCiAgcGFkZGluZzogMCAycHg7DQogIC13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eTogaGlkZGVuOw0KICAgICAgICAgIGJhY2tmYWNlLXZpc2liaWxpdHk6IGhpZGRlbjsNCiAgLXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOiA1MCUgMCU7DQogICAgICAgICAgdHJhbnNmb3JtLW9yaWdpbjogNTAlIDAlOw0KICAtd2Via2l0LXRyYW5zZm9ybTogdHJhbnNsYXRlM2QoMHB4LCAxMTAlLCAwcHgpIHJvdGF0ZVgoLTkwZGVnKTsNCiAgICAgICAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZTNkKDBweCwgMTEwJSwgMHB4KSByb3RhdGVYKC05MGRlZyk7IH0NCg0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogU1BFQUtFUiBOT1RFUw0KICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi8NCi5yZXZlYWwgYXNpZGUubm90ZXMgew0KICBkaXNwbGF5OiBub25lOyB9DQoNCi5yZXZlYWwgLnNwZWFrZXItbm90ZXMgew0KICBkaXNwbGF5OiBub25lOw0KICBwb3NpdGlvbjogYWJzb2x1dGU7DQogIHdpZHRoOiA3MCU7DQogIG1heC1oZWlnaHQ6IDE1JTsNCiAgbGVmdDogMTUlOw0KICBib3R0b206IDI2cHg7DQogIHBhZGRpbmc6IDEwcHg7DQogIHotaW5kZXg6IDE7DQogIGZvbnQtc2l6ZTogMThweDsNCiAgbGluZS1oZWlnaHQ6IDEuNDsNCiAgY29sb3I6ICNmZmY7DQogIGJhY2tncm91bmQtY29sb3I6IHJnYmEoMCwgMCwgMCwgMC41KTsNCiAgb3ZlcmZsb3c6IGF1dG87DQogIGJveC1zaXppbmc6IGJvcmRlci1ib3g7DQogIHRleHQtYWxpZ246IGxlZnQ7DQogIGZvbnQtZmFtaWx5OiBIZWx2ZXRpY2EsIHNhbnMtc2VyaWY7DQogIC13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOiB0b3VjaDsgfQ0KDQoucmV2ZWFsIC5zcGVha2VyLW5vdGVzLnZpc2libGU6bm90KDplbXB0eSkgew0KICBkaXNwbGF5OiBibG9jazsgfQ0KDQpAbWVkaWEgc2NyZWVuIGFuZCAobWF4LXdpZHRoOiAxMDI0cHgpIHsNCiAgLnJldmVhbCAuc3BlYWtlci1ub3RlcyB7DQogICAgZm9udC1zaXplOiAxNHB4OyB9IH0NCg0KQG1lZGlhIHNjcmVlbiBhbmQgKG1heC13aWR0aDogNjAwcHgpIHsNCiAgLnJldmVhbCAuc3BlYWtlci1ub3RlcyB7DQogICAgd2lkdGg6IDkwJTsNCiAgICBsZWZ0OiA1JTsgfSB9DQoNCi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAqIFpPT00gUExVR0lODQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnpvb21lZCAucmV2ZWFsICosDQouem9vbWVkIC5yZXZlYWwgKjpiZWZvcmUsDQouem9vbWVkIC5yZXZlYWwgKjphZnRlciB7DQogIC13ZWJraXQtYmFja2ZhY2UtdmlzaWJpbGl0eTogdmlzaWJsZSAhaW1wb3J0YW50Ow0KICAgICAgICAgIGJhY2tmYWNlLXZpc2liaWxpdHk6IHZpc2libGUgIWltcG9ydGFudDsgfQ0KDQouem9vbWVkIC5yZXZlYWwgLnByb2dyZXNzLA0KLnpvb21lZCAucmV2ZWFsIC5jb250cm9scyB7IA0KICBvcGFjaXR5OiAwOyB9DQoNCi56b29tZWQgLnJldmVhbCAucm9sbCBzcGFuIHsNCiAgYmFja2dyb3VuZDogbm9uZTsgfQ0KDQouem9vbWVkIC5yZXZlYWwgLnJvbGwgc3BhbjphZnRlciB7DQogIHZpc2liaWxpdHk6IGhpZGRlbjsgfQ==";
    
    var serifcss64="LyoqDQogKiBBIHNpbXBsZSB0aGVtZSBmb3IgcmV2ZWFsLmpzIHByZXNlbnRhdGlvbnMsIHNpbWlsYXINCiAqIHRvIHRoZSBkZWZhdWx0IHRoZW1lLiBUaGUgYWNjZW50IGNvbG9yIGlzIGJyb3duLg0KICoNCiAqIFRoaXMgdGhlbWUgaXMgQ29weXJpZ2h0IChDKSAyMDEyLTIwMTMgT3dlbiBWZXJzdGVlZywgaHR0cDovL293ZW52ZXJzdGVlZy5jb20gLSBpdCBpcyBNSVQgbGljZW5zZWQuDQogKi8NCi5yZXZlYWwgYSB7DQogIGxpbmUtaGVpZ2h0OiAxLjNlbTsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBHTE9CQUwgU1RZTEVTDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KYm9keSB7DQogIGJhY2tncm91bmQ6ICNmZmZmZmY7DQogIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7IH0NCg0KLnJldmVhbCB7DQogIGZvbnQtZmFtaWx5OiAiUGFsYXRpbm8gTGlub3R5cGUiLCAiQm9vayBBbnRpcXVhIiwgUGFsYXRpbm8sIEZyZWVTZXJpZiwgc2VyaWY7DQogIGZvbnQtc2l6ZTogNDBweDsNCiAgZm9udC13ZWlnaHQ6IG5vcm1hbDsNCiAgY29sb3I6ICMwMDA7IH0NCg0KLnJldmVhbCBwYXJhZ3JhcGggew0KICAgIGZvbnQtc2l6ZTogNDBweDsNCn0NCg0KOjpzZWxlY3Rpb24gew0KICBjb2xvcjogI2ZmZjsNCiAgYmFja2dyb3VuZDogIzI2MzUxQzsNCiAgdGV4dC1zaGFkb3c6IG5vbmU7IH0NCg0KOjotbW96LXNlbGVjdGlvbiB7DQogIGNvbG9yOiAjZmZmOw0KICBiYWNrZ3JvdW5kOiAjMjYzNTFDOw0KICB0ZXh0LXNoYWRvdzogbm9uZTsgfQ0KDQoucmV2ZWFsIC5zbGlkZXMgPiBzZWN0aW9uLA0KLnJldmVhbCAuc2xpZGVzID4gc2VjdGlvbiA+IHNlY3Rpb24gew0KICBsaW5lLWhlaWdodDogMS4zOw0KICBmb250LXdlaWdodDogaW5oZXJpdDsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBIRUFERVJTDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbCBoMSwNCi5yZXZlYWwgaDIsDQoucmV2ZWFsIGgzLA0KLnJldmVhbCBoNCwNCi5yZXZlYWwgaDUsDQoucmV2ZWFsIGg2IHsNCiAgbWFyZ2luOiAwIDAgMjBweCAwOw0KICBjb2xvcjogIzM4M0QzRDsNCiAgZm9udC1mYW1pbHk6ICJQYWxhdGlubyBMaW5vdHlwZSIsICJCb29rIEFudGlxdWEiLCBQYWxhdGlubywgRnJlZVNlcmlmLCBzZXJpZjsNCiAgZm9udC13ZWlnaHQ6IG5vcm1hbDsNCiAgbGluZS1oZWlnaHQ6IDEuMjsNCiAgbGV0dGVyLXNwYWNpbmc6IG5vcm1hbDsNCiAgdGV4dC10cmFuc2Zvcm06IG5vbmU7DQogIHRleHQtc2hhZG93OiBub25lOw0KICB3b3JkLXdyYXA6IGJyZWFrLXdvcmQ7IH0NCg0KLnJldmVhbCBoMSB7DQogIGZvbnQtc2l6ZTogMy43N2VtOyB9DQoNCi5yZXZlYWwgaDIgew0KICBmb250LXNpemU6IDIuMTFlbTsgfQ0KDQoucmV2ZWFsIGgzIHsNCiAgZm9udC1zaXplOiAxLjU1ZW07IH0NCg0KLnJldmVhbCBoNCB7DQogIGZvbnQtc2l6ZTogMWVtOyB9DQoNCi5yZXZlYWwgaDEgew0KICB0ZXh0LXNoYWRvdzogbm9uZTsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBPVEhFUg0KICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi8NCi5yZXZlYWwgcCB7DQogIG1hcmdpbjogMjBweCAwOw0KICBsaW5lLWhlaWdodDogMS4zOyB9DQoNCi8qIEVuc3VyZSBjZXJ0YWluIGVsZW1lbnRzIGFyZSBuZXZlciBsYXJnZXIgdGhhbiB0aGUgc2xpZGUgaXRzZWxmICovDQoucmV2ZWFsIGltZywNCi5yZXZlYWwgdmlkZW8sDQoucmV2ZWFsIGlmcmFtZSB7DQogIG1heC13aWR0aDogOTUlOw0KICBtYXgtaGVpZ2h0OiA5NSU7IH0NCg0KLnJldmVhbCBzdHJvbmcsDQoucmV2ZWFsIGIgew0KICBmb250LXdlaWdodDogYm9sZDsgfQ0KDQoucmV2ZWFsIGVtIHsNCiAgZm9udC1zdHlsZTogaXRhbGljOyB9DQoNCi5yZXZlYWwgb2wsDQoucmV2ZWFsIGRsLA0KLnJldmVhbCB1bCB7DQogIGRpc3BsYXk6IGlubGluZS1ibG9jazsNCiAgdGV4dC1hbGlnbjogbGVmdDsNCiAgbWFyZ2luOiAwIDAgMCAxZW07IH0NCg0KLnJldmVhbCBvbCB7DQogIGxpc3Qtc3R5bGUtdHlwZTogZGVjaW1hbDsgfQ0KDQoucmV2ZWFsIHVsIHsNCiAgbGlzdC1zdHlsZS10eXBlOiBkaXNjOyB9DQoNCi5yZXZlYWwgdWwgdWwgew0KICBsaXN0LXN0eWxlLXR5cGU6IHNxdWFyZTsgfQ0KDQoucmV2ZWFsIHVsIHVsIHVsIHsNCiAgbGlzdC1zdHlsZS10eXBlOiBjaXJjbGU7IH0NCg0KLnJldmVhbCB1bCB1bCwNCi5yZXZlYWwgdWwgb2wsDQoucmV2ZWFsIG9sIG9sLA0KLnJldmVhbCBvbCB1bCB7DQogIGRpc3BsYXk6IGJsb2NrOw0KICBtYXJnaW4tbGVmdDogNDBweDsgfQ0KDQoucmV2ZWFsIGR0IHsNCiAgZm9udC13ZWlnaHQ6IGJvbGQ7IH0NCg0KLnJldmVhbCBkZCB7DQogIG1hcmdpbi1sZWZ0OiA0MHB4OyB9DQoNCi5yZXZlYWwgcSwNCi5yZXZlYWwgYmxvY2txdW90ZSB7DQogIHF1b3Rlczogbm9uZTsgfQ0KDQoucmV2ZWFsIGJsb2NrcXVvdGUgew0KICBkaXNwbGF5OiBibG9jazsNCiAgcG9zaXRpb246IHJlbGF0aXZlOw0KICB3aWR0aDogNzAlOw0KICBtYXJnaW46IDIwcHggYXV0bzsNCiAgcGFkZGluZzogNXB4Ow0KICBmb250LXN0eWxlOiBpdGFsaWM7DQogIGJhY2tncm91bmQ6IHJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSk7DQogIGJveC1zaGFkb3c6IDBweCAwcHggMnB4IHJnYmEoMCwgMCwgMCwgMC4yKTsgfQ0KDQoucmV2ZWFsIGJsb2NrcXVvdGUgcDpmaXJzdC1jaGlsZCwNCi5yZXZlYWwgYmxvY2txdW90ZSBwOmxhc3QtY2hpbGQgew0KICBkaXNwbGF5OiBpbmxpbmUtYmxvY2s7IH0NCg0KLnJldmVhbCBxIHsNCiAgZm9udC1zdHlsZTogaXRhbGljOyB9DQoNCi5yZXZlYWwgcHJlIHsNCiAgZGlzcGxheTogYmxvY2s7DQogIHBvc2l0aW9uOiByZWxhdGl2ZTsNCiAgd2lkdGg6IDkwJTsNCiAgbWFyZ2luOiAyMHB4IGF1dG87DQogIHRleHQtYWxpZ246IGxlZnQ7DQogIGZvbnQtc2l6ZTogMC41NWVtOw0KICBmb250LWZhbWlseTogbW9ub3NwYWNlOw0KICBsaW5lLWhlaWdodDogMS4yZW07DQogIHdvcmQtd3JhcDogYnJlYWstd29yZDsNCiAgYm94LXNoYWRvdzogMHB4IDBweCA2cHggcmdiYSgwLCAwLCAwLCAwLjMpOyB9DQoNCi5yZXZlYWwgY29kZSB7DQogIGZvbnQtZmFtaWx5OiBtb25vc3BhY2U7IH0NCg0KLnJldmVhbCBwcmUgY29kZSB7DQogIGRpc3BsYXk6IGJsb2NrOw0KICBwYWRkaW5nOiA1cHg7DQogIG92ZXJmbG93OiBhdXRvOw0KICBtYXgtaGVpZ2h0OiA0MDBweDsNCiAgd29yZC13cmFwOiBub3JtYWw7IH0NCg0KLnJldmVhbCB0YWJsZSB7DQogIG1hcmdpbjogYXV0bzsNCiAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTsNCiAgYm9yZGVyLXNwYWNpbmc6IDA7IH0NCg0KLnJldmVhbCB0YWJsZSB0aCB7DQogIGZvbnQtd2VpZ2h0OiBib2xkOyB9DQoNCi5yZXZlYWwgdGFibGUgdGgsDQoucmV2ZWFsIHRhYmxlIHRkIHsNCiAgdGV4dC1hbGlnbjogbGVmdDsNCiAgcGFkZGluZzogMC4yZW0gMC41ZW0gMC4yZW0gMC41ZW07DQogIGJvcmRlci1ib3R0b206IDFweCBzb2xpZDsgfQ0KDQoucmV2ZWFsIHRhYmxlIHRoW2FsaWduPSJjZW50ZXIiXSwNCi5yZXZlYWwgdGFibGUgdGRbYWxpZ249ImNlbnRlciJdIHsNCiAgdGV4dC1hbGlnbjogY2VudGVyOyB9DQoNCi5yZXZlYWwgdGFibGUgdGhbYWxpZ249InJpZ2h0Il0sDQoucmV2ZWFsIHRhYmxlIHRkW2FsaWduPSJyaWdodCJdIHsNCiAgdGV4dC1hbGlnbjogcmlnaHQ7IH0NCg0KLnJldmVhbCB0YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRoLA0KLnJldmVhbCB0YWJsZSB0Ym9keSB0cjpsYXN0LWNoaWxkIHRkIHsNCiAgYm9yZGVyLWJvdHRvbTogbm9uZTsgfQ0KDQoucmV2ZWFsIHN1cCB7DQogIHZlcnRpY2FsLWFsaWduOiBzdXBlcjsgfQ0KDQoucmV2ZWFsIHN1YiB7DQogIHZlcnRpY2FsLWFsaWduOiBzdWI7IH0NCg0KLnJldmVhbCBzbWFsbCB7DQogIGRpc3BsYXk6IGlubGluZS1ibG9jazsNCiAgZm9udC1zaXplOiAwLjZlbTsNCiAgbGluZS1oZWlnaHQ6IDEuMmVtOw0KICB2ZXJ0aWNhbC1hbGlnbjogdG9wOyB9DQoNCi5yZXZlYWwgc21hbGwgKiB7DQogIHZlcnRpY2FsLWFsaWduOiB0b3A7IH0NCg0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogTElOS1MNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIGEgew0KICBjb2xvcjogIzUxNDgzRDsNCiAgdGV4dC1kZWNvcmF0aW9uOiBub25lOw0KICAtd2Via2l0LXRyYW5zaXRpb246IGNvbG9yIC4xNXMgZWFzZTsNCiAgLW1vei10cmFuc2l0aW9uOiBjb2xvciAuMTVzIGVhc2U7DQogIHRyYW5zaXRpb246IGNvbG9yIC4xNXMgZWFzZTsgfQ0KDQoucmV2ZWFsIGE6aG92ZXIgew0KICBjb2xvcjogIzhiN2M2OTsNCiAgdGV4dC1zaGFkb3c6IG5vbmU7DQogIGJvcmRlcjogbm9uZTsgfQ0KDQoucmV2ZWFsIC5yb2xsIHNwYW46YWZ0ZXIgew0KICBjb2xvcjogI2ZmZjsNCiAgYmFja2dyb3VuZDogIzI1MjExYzsgfQ0KDQovKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqDQogKiBJTUFHRVMNCiAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovDQoucmV2ZWFsIHNlY3Rpb24gaW1nIHsNCiAgbWFyZ2luOiAxNXB4IDBweDsNCiAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjEyKTsNCiAgYm9yZGVyOiA0cHggc29saWQgIzAwMDsNCiAgYm94LXNoYWRvdzogMCAwIDEwcHggcmdiYSgwLCAwLCAwLCAwLjE1KTsgfQ0KDQoucmV2ZWFsIHNlY3Rpb24gaW1nLnBsYWluIHsNCiAgYm9yZGVyOiAwOw0KICBib3gtc2hhZG93OiBub25lOyB9DQoNCi5yZXZlYWwgYSBpbWcgew0KICAtd2Via2l0LXRyYW5zaXRpb246IGFsbCAuMTVzIGxpbmVhcjsNCiAgLW1vei10cmFuc2l0aW9uOiBhbGwgLjE1cyBsaW5lYXI7DQogIHRyYW5zaXRpb246IGFsbCAuMTVzIGxpbmVhcjsgfQ0KDQoucmV2ZWFsIGE6aG92ZXIgaW1nIHsNCiAgYmFja2dyb3VuZDogcmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpOw0KICBib3JkZXItY29sb3I6ICM1MTQ4M0Q7DQogIGJveC1zaGFkb3c6IDAgMCAyMHB4IHJnYmEoMCwgMCwgMCwgMC41NSk7IH0NCg0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogTkFWSUdBVElPTiBDT05UUk9MUw0KICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi8NCi5yZXZlYWwgLmNvbnRyb2xzIC5uYXZpZ2F0ZS1sZWZ0LA0KLnJldmVhbCAuY29udHJvbHMgLm5hdmlnYXRlLWxlZnQuZW5hYmxlZCB7DQogIGJvcmRlci1yaWdodC1jb2xvcjogIzUxNDgzRDsgfQ0KDQoucmV2ZWFsIC5jb250cm9scyAubmF2aWdhdGUtcmlnaHQsDQoucmV2ZWFsIC5jb250cm9scyAubmF2aWdhdGUtcmlnaHQuZW5hYmxlZCB7DQogIGJvcmRlci1sZWZ0LWNvbG9yOiAjNTE0ODNEOyB9DQoNCi5yZXZlYWwgLmNvbnRyb2xzIC5uYXZpZ2F0ZS11cCwNCi5yZXZlYWwgLmNvbnRyb2xzIC5uYXZpZ2F0ZS11cC5lbmFibGVkIHsNCiAgYm9yZGVyLWJvdHRvbS1jb2xvcjogIzUxNDgzRDsgfQ0KDQoucmV2ZWFsIC5jb250cm9scyAubmF2aWdhdGUtZG93biwNCi5yZXZlYWwgLmNvbnRyb2xzIC5uYXZpZ2F0ZS1kb3duLmVuYWJsZWQgew0KICBib3JkZXItdG9wLWNvbG9yOiAjNTE0ODNEOyB9DQoNCi5yZXZlYWwgLmNvbnRyb2xzIC5uYXZpZ2F0ZS1sZWZ0LmVuYWJsZWQ6aG92ZXIgew0KICBib3JkZXItcmlnaHQtY29sb3I6ICM4YjdjNjk7IH0NCg0KLnJldmVhbCAuY29udHJvbHMgLm5hdmlnYXRlLXJpZ2h0LmVuYWJsZWQ6aG92ZXIgew0KICBib3JkZXItbGVmdC1jb2xvcjogIzhiN2M2OTsgfQ0KDQoucmV2ZWFsIC5jb250cm9scyAubmF2aWdhdGUtdXAuZW5hYmxlZDpob3ZlciB7DQogIGJvcmRlci1ib3R0b20tY29sb3I6ICM4YjdjNjk7IH0NCg0KLnJldmVhbCAuY29udHJvbHMgLm5hdmlnYXRlLWRvd24uZW5hYmxlZDpob3ZlciB7DQogIGJvcmRlci10b3AtY29sb3I6ICM4YjdjNjk7IH0NCg0KLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKg0KICogUFJPR1JFU1MgQkFSDQogKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqLw0KLnJldmVhbCAucHJvZ3Jlc3Mgew0KICBiYWNrZ3JvdW5kOiByZ2JhKDAsIDAsIDAsIDAuMik7IH0NCg0KLnJldmVhbCAucHJvZ3Jlc3Mgc3BhbiB7DQogIGJhY2tncm91bmQ6ICM1MTQ4M0Q7DQogIC13ZWJraXQtdHJhbnNpdGlvbjogd2lkdGggODAwbXMgY3ViaWMtYmV6aWVyKDAuMjYsIDAuODYsIDAuNDQsIDAuOTg1KTsNCiAgLW1vei10cmFuc2l0aW9uOiB3aWR0aCA4MDBtcyBjdWJpYy1iZXppZXIoMC4yNiwgMC44NiwgMC40NCwgMC45ODUpOw0KICB0cmFuc2l0aW9uOiB3aWR0aCA4MDBtcyBjdWJpYy1iZXppZXIoMC4yNiwgMC44NiwgMC40NCwgMC45ODUpOyB9";
    
    var revealjs64="LyoNCiByZXZlYWwuanMNCiBodHRwOi8vbGFiLmhha2ltLnNlL3JldmVhbC1qcw0KIE1JVCBsaWNlbnNlZA0KDQogQ29weXJpZ2h0IChDKSAyMDE3IEhha2ltIEVsIEhhdHRhYiwgaHR0cDovL2hha2ltLnNlDQoqLw0KdmFyICRqc2NvbXA9JGpzY29tcHx8e307JGpzY29tcC5zY29wZT17fTskanNjb21wLkFTU1VNRV9FUzU9ITE7JGpzY29tcC5BU1NVTUVfTk9fTkFUSVZFX01BUD0hMTskanNjb21wLkFTU1VNRV9OT19OQVRJVkVfU0VUPSExOyRqc2NvbXAuZGVmaW5lUHJvcGVydHk9JGpzY29tcC5BU1NVTUVfRVM1fHwiZnVuY3Rpb24iPT10eXBlb2YgT2JqZWN0LmRlZmluZVByb3BlcnRpZXM/T2JqZWN0LmRlZmluZVByb3BlcnR5OmZ1bmN0aW9uKGwsdCxxKXtsIT1BcnJheS5wcm90b3R5cGUmJmwhPU9iamVjdC5wcm90b3R5cGUmJihsW3RdPXEudmFsdWUpfTskanNjb21wLmdldEdsb2JhbD1mdW5jdGlvbihsKXtyZXR1cm4idW5kZWZpbmVkIiE9dHlwZW9mIHdpbmRvdyYmd2luZG93PT09bD9sOiJ1bmRlZmluZWQiIT10eXBlb2YgZ2xvYmFsJiZudWxsIT1nbG9iYWw/Z2xvYmFsOmx9OyRqc2NvbXAuZ2xvYmFsPSRqc2NvbXAuZ2V0R2xvYmFsKHRoaXMpOw0KJGpzY29tcC5wb2x5ZmlsbD1mdW5jdGlvbihsLHQscSx2KXtpZih0KXtxPSRqc2NvbXAuZ2xvYmFsO2w9bC5zcGxpdCgiLiIpO2Zvcih2PTA7djxsLmxlbmd0aC0xO3YrKyl7dmFyIE89bFt2XTtPIGluIHF8fChxW09dPXt9KTtxPXFbT119bD1sW2wubGVuZ3RoLTFdO3Y9cVtsXTt0PXQodik7dCE9diYmbnVsbCE9dCYmJGpzY29tcC5kZWZpbmVQcm9wZXJ0eShxLGwse2NvbmZpZ3VyYWJsZTohMCx3cml0YWJsZTohMCx2YWx1ZTp0fSl9fTskanNjb21wLnBvbHlmaWxsKCJBcnJheS5wcm90b3R5cGUuZmlsbCIsZnVuY3Rpb24obCl7cmV0dXJuIGw/bDpmdW5jdGlvbihsLHEsdil7dmFyIHQ9dGhpcy5sZW5ndGh8fDA7MD5xJiYocT1NYXRoLm1heCgwLHQrcSkpO2lmKG51bGw9PXZ8fHY+dCl2PXQ7dj1OdW1iZXIodik7MD52JiYodj1NYXRoLm1heCgwLHQrdikpO2ZvcihxPU51bWJlcihxfHwwKTtxPHY7cSsrKXRoaXNbcV09bDtyZXR1cm4gdGhpc319LCJlczYtaW1wbCIsImVzMyIpOw0KKGZ1bmN0aW9uKGwsdCl7ImZ1bmN0aW9uIj09PXR5cGVvZiBkZWZpbmUmJmRlZmluZS5hbWQ/ZGVmaW5lKGZ1bmN0aW9uKCl7bC5SZXZlYWw9dCgpO3JldHVybiBsLlJldmVhbH0pOiJvYmplY3QiPT09dHlwZW9mIGV4cG9ydHM/bW9kdWxlLmV4cG9ydHM9dCgpOmwuUmV2ZWFsPXQoKX0pKHRoaXMsZnVuY3Rpb24oKXt2YXIgbDtmdW5jdGlvbiB0KCl7ZnVuY3Rpb24gYSgpe2MubGVuZ3RoJiZoZWFkLmpzLmFwcGx5KG51bGwsYyk7cSgpfWZ1bmN0aW9uIGIoYil7aGVhZC5yZWFkeShiLnNyYy5tYXRjaCgvKFtcd1xkX1wtXSopXC4/anMkfFteXFxcL10qJC9pKVswXSxmdW5jdGlvbigpeyJmdW5jdGlvbiI9PT10eXBlb2YgYi5jYWxsYmFjayYmYi5jYWxsYmFjay5hcHBseSh0aGlzKTswPT09LS1wJiZhKCl9KX1mb3IodmFyIGU9W10sYz1bXSxwPTAsaD0wLHk9ZC5kZXBlbmRlbmNpZXMubGVuZ3RoO2g8eTtoKyspe3ZhciBmPWQuZGVwZW5kZW5jaWVzW2hdO2lmKCFmLmNvbmRpdGlvbnx8DQpmLmNvbmRpdGlvbigpKWYuYXN5bmM/Yy5wdXNoKGYuc3JjKTplLnB1c2goZi5zcmMpLGIoZil9ZS5sZW5ndGg/KHA9ZS5sZW5ndGgsaGVhZC5qcy5hcHBseShudWxsLGUpKTphKCl9ZnVuY3Rpb24gcSgpe2Muc2xpZGVzLmNsYXNzTGlzdC5hZGQoIm5vLXRyYW5zaXRpb24iKTtjLmJhY2tncm91bmQ9VihjLndyYXBwZXIsImRpdiIsImJhY2tncm91bmRzIixudWxsKTtjLnByb2dyZXNzPVYoYy53cmFwcGVyLCJkaXYiLCJwcm9ncmVzcyIsIjxzcGFuPjwvc3Bhbj4iKTtjLnByb2dyZXNzYmFyPWMucHJvZ3Jlc3MucXVlcnlTZWxlY3Rvcigic3BhbiIpO1YoYy53cmFwcGVyLCJhc2lkZSIsImNvbnRyb2xzIiwnPGJ1dHRvbiBjbGFzcz0ibmF2aWdhdGUtbGVmdCIgYXJpYS1sYWJlbD0icHJldmlvdXMgc2xpZGUiPjwvYnV0dG9uPjxidXR0b24gY2xhc3M9Im5hdmlnYXRlLXJpZ2h0IiBhcmlhLWxhYmVsPSJuZXh0IHNsaWRlIj48L2J1dHRvbj48YnV0dG9uIGNsYXNzPSJuYXZpZ2F0ZS11cCIgYXJpYS1sYWJlbD0iYWJvdmUgc2xpZGUiPjwvYnV0dG9uPjxidXR0b24gY2xhc3M9Im5hdmlnYXRlLWRvd24iIGFyaWEtbGFiZWw9ImJlbG93IHNsaWRlIj48L2J1dHRvbj4nKTsNCmMuc2xpZGVOdW1iZXI9VihjLndyYXBwZXIsImRpdiIsInNsaWRlLW51bWJlciIsIiIpO2Muc3BlYWtlck5vdGVzPVYoYy53cmFwcGVyLCJkaXYiLCJzcGVha2VyLW5vdGVzIixudWxsKTtjLnNwZWFrZXJOb3Rlcy5zZXRBdHRyaWJ1dGUoImRhdGEtcHJldmVudC1zd2lwZSIsIiIpO2Muc3BlYWtlck5vdGVzLnNldEF0dHJpYnV0ZSgidGFiaW5kZXgiLCIwIik7VihjLndyYXBwZXIsImRpdiIsInBhdXNlLW92ZXJsYXkiLG51bGwpO2MuY29udHJvbHM9ZG9jdW1lbnQucXVlcnlTZWxlY3RvcigiLnJldmVhbCAuY29udHJvbHMiKTtjLndyYXBwZXIuc2V0QXR0cmlidXRlKCJyb2xlIiwiYXBwbGljYXRpb24iKTtjLmNvbnRyb2xzTGVmdD1mKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIi5uYXZpZ2F0ZS1sZWZ0IikpO2MuY29udHJvbHNSaWdodD1mKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIi5uYXZpZ2F0ZS1yaWdodCIpKTtjLmNvbnRyb2xzVXA9Zihkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCIubmF2aWdhdGUtdXAiKSk7DQpjLmNvbnRyb2xzRG93bj1mKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoIi5uYXZpZ2F0ZS1kb3duIikpO2MuY29udHJvbHNQcmV2PWYoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgiLm5hdmlnYXRlLXByZXYiKSk7Yy5jb250cm9sc05leHQ9Zihkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCIubmF2aWdhdGUtbmV4dCIpKTtjLnN0YXR1c0Rpdj12KCk7V2IoKTtYYigpO1liKCk7WWEoKTtaYSgpO0FhKCEwKTtzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yy5zbGlkZXMuY2xhc3NMaXN0LnJlbW92ZSgibm8tdHJhbnNpdGlvbiIpOyRhPSEwO2Mud3JhcHBlci5jbGFzc0xpc3QuYWRkKCJyZWFkeSIpO0EoInJlYWR5Iix7aW5kZXhoOm0saW5kZXh2Om4sY3VycmVudFNsaWRlOmd9KX0sMSk7SygpJiYoQmEoKSwiY29tcGxldGUiPT09ZG9jdW1lbnQucmVhZHlTdGF0ZT9hYigpOndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCJsb2FkIixhYikpfWZ1bmN0aW9uIHYoKXt2YXIgYT1kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiYXJpYS1zdGF0dXMtZGl2Iik7DQphfHwoYT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJkaXYiKSxhLnN0eWxlLnBvc2l0aW9uPSJhYnNvbHV0ZSIsYS5zdHlsZS5oZWlnaHQ9IjFweCIsYS5zdHlsZS53aWR0aD0iMXB4IixhLnN0eWxlLm92ZXJmbG93PSJoaWRkZW4iLGEuc3R5bGUuY2xpcD0icmVjdCggMXB4LCAxcHgsIDFweCwgMXB4ICkiLGEuc2V0QXR0cmlidXRlKCJpZCIsImFyaWEtc3RhdHVzLWRpdiIpLGEuc2V0QXR0cmlidXRlKCJhcmlhLWxpdmUiLCJwb2xpdGUiKSxhLnNldEF0dHJpYnV0ZSgiYXJpYS1hdG9taWMiLCJ0cnVlIiksYy53cmFwcGVyLmFwcGVuZENoaWxkKGEpKTtyZXR1cm4gYX1mdW5jdGlvbiBPKGEpe3ZhciBiPSIiO2lmKDM9PT1hLm5vZGVUeXBlKWIrPWEudGV4dENvbnRlbnQ7ZWxzZSBpZigxPT09YS5ub2RlVHlwZSl7dmFyIGU9YS5nZXRBdHRyaWJ1dGUoImFyaWEtaGlkZGVuIiksYz0ibm9uZSI9PT13aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShhKS5kaXNwbGF5OyJ0cnVlIj09PWV8fGN8fGYoYS5jaGlsZE5vZGVzKS5mb3JFYWNoKGZ1bmN0aW9uKGEpe2IrPQ0KTyhhKX0pfXJldHVybiBifWZ1bmN0aW9uIGFiKCl7dmFyIGE9Q2Eod2luZG93LmlubmVyV2lkdGgsd2luZG93LmlubmVySGVpZ2h0KSxiPU1hdGguZmxvb3IoYS53aWR0aCooMStkLm1hcmdpbikpLGU9TWF0aC5mbG9vcihhLmhlaWdodCooMStkLm1hcmdpbikpLHU9YS53aWR0aCxwPWEuaGVpZ2h0O2JiKCJAcGFnZXtzaXplOiIrYisicHggIitlKyJweDsgbWFyZ2luOiAwcHg7fSIpO2JiKCIucmV2ZWFsIHNlY3Rpb24+aW1nLCAucmV2ZWFsIHNlY3Rpb24+dmlkZW8sIC5yZXZlYWwgc2VjdGlvbj5pZnJhbWV7bWF4LXdpZHRoOiAiK3UrInB4OyBtYXgtaGVpZ2h0OiIrcCsicHh9Iik7ZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCJwcmludC1wZGYiKTtkb2N1bWVudC5ib2R5LnN0eWxlLndpZHRoPWIrInB4Ijtkb2N1bWVudC5ib2R5LnN0eWxlLmhlaWdodD1lKyJweCI7Y2IodSxwKTtmKGMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzPnNlY3Rpb24iKSkuZm9yRWFjaChmdW5jdGlvbihhLA0KYil7YS5zZXRBdHRyaWJ1dGUoImRhdGEtaW5kZXgtaCIsYik7YS5jbGFzc0xpc3QuY29udGFpbnMoInN0YWNrIikmJmYoYS5xdWVyeVNlbGVjdG9yQWxsKCJzZWN0aW9uIikpLmZvckVhY2goZnVuY3Rpb24oYSxlKXthLnNldEF0dHJpYnV0ZSgiZGF0YS1pbmRleC1oIixiKTthLnNldEF0dHJpYnV0ZSgiZGF0YS1pbmRleC12IixlKX0pfSk7ZihjLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcyBzZWN0aW9uIikpLmZvckVhY2goZnVuY3Rpb24oYSl7aWYoITE9PT1hLmNsYXNzTGlzdC5jb250YWlucygic3RhY2siKSl7dmFyIGM9KGItdSkvMixoPShlLXApLzIsZj1hLnNjcm9sbEhlaWdodCxnPU1hdGgubWF4KE1hdGguY2VpbChmL2UpLDEpLGc9TWF0aC5taW4oZyxkLnBkZk1heFBhZ2VzUGVyU2xpZGUpO2lmKDE9PT1nJiZkLmNlbnRlcnx8YS5jbGFzc0xpc3QuY29udGFpbnMoImNlbnRlciIpKWg9TWF0aC5tYXgoKGUtZikvMiwwKTtmPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImRpdiIpOw0KZi5jbGFzc05hbWU9InBkZi1wYWdlIjtmLnN0eWxlLmhlaWdodD0oZStkLnBkZlBhZ2VIZWlnaHRPZmZzZXQpKmcrInB4IjthLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGYsYSk7Zi5hcHBlbmRDaGlsZChhKTthLnN0eWxlLmxlZnQ9YysicHgiO2Euc3R5bGUudG9wPWgrInB4IjthLnN0eWxlLndpZHRoPXUrInB4IjthLnNsaWRlQmFja2dyb3VuZEVsZW1lbnQmJmYuaW5zZXJ0QmVmb3JlKGEuc2xpZGVCYWNrZ3JvdW5kRWxlbWVudCxhKTtkLnNob3dOb3RlcyYmKGM9RGEoYSkpJiYoaD0ic3RyaW5nIj09PXR5cGVvZiBkLnNob3dOb3Rlcz9kLnNob3dOb3RlczoiaW5saW5lIixnPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImRpdiIpLGcuY2xhc3NMaXN0LmFkZCgic3BlYWtlci1ub3RlcyIpLGcuY2xhc3NMaXN0LmFkZCgic3BlYWtlci1ub3Rlcy1wZGYiKSxnLnNldEF0dHJpYnV0ZSgiZGF0YS1sYXlvdXQiLGgpLGcuaW5uZXJIVE1MPWMsInNlcGFyYXRlLXBhZ2UiPT09aD9mLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGcsDQpmLm5leHRTaWJsaW5nKTooZy5zdHlsZS5sZWZ0PSI4cHgiLGcuc3R5bGUuYm90dG9tPSI4cHgiLGcuc3R5bGUud2lkdGg9Yi0xNisicHgiLGYuYXBwZW5kQ2hpbGQoZykpKTtkLnNsaWRlTnVtYmVyJiYvYWxsfHByaW50L2kudGVzdChkLnNob3dTbGlkZU51bWJlcikmJihjPXBhcnNlSW50KGEuZ2V0QXR0cmlidXRlKCJkYXRhLWluZGV4LWgiKSwxMCkrMSxhPXBhcnNlSW50KGEuZ2V0QXR0cmlidXRlKCJkYXRhLWluZGV4LXYiKSwxMCkrMSxoPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImRpdiIpLGguY2xhc3NMaXN0LmFkZCgic2xpZGUtbnVtYmVyIiksaC5jbGFzc0xpc3QuYWRkKCJzbGlkZS1udW1iZXItcGRmIiksaC5pbm5lckhUTUw9ZGIoYywiLiIsYSksZi5hcHBlbmRDaGlsZChoKSl9fSk7ZihjLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcyBzZWN0aW9uIC5mcmFnbWVudCIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEpe2EuY2xhc3NMaXN0LmFkZCgidmlzaWJsZSIpfSk7DQpBKCJwZGYtcmVhZHkiKX1mdW5jdGlvbiBYYigpe3NldEludGVydmFsKGZ1bmN0aW9uKCl7aWYoMCE9PWMud3JhcHBlci5zY3JvbGxUb3B8fDAhPT1jLndyYXBwZXIuc2Nyb2xsTGVmdCljLndyYXBwZXIuc2Nyb2xsVG9wPTAsYy53cmFwcGVyLnNjcm9sbExlZnQ9MH0sMUUzKX1mdW5jdGlvbiBWKGEsYixlLGMpe2Zvcih2YXIgZD1hLnF1ZXJ5U2VsZWN0b3JBbGwoIi4iK2UpLHU9MDt1PGQubGVuZ3RoO3UrKyl7dmFyIGY9ZFt1XTtpZihmLnBhcmVudE5vZGU9PT1hKXJldHVybiBmfWI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudChiKTtiLmNsYXNzTGlzdC5hZGQoZSk7InN0cmluZyI9PT10eXBlb2YgYyYmKGIuaW5uZXJIVE1MPWMpO2EuYXBwZW5kQ2hpbGQoYik7cmV0dXJuIGJ9ZnVuY3Rpb24gWmIoKXtLKCk7Yy5iYWNrZ3JvdW5kLmlubmVySFRNTD0iIjtjLmJhY2tncm91bmQuY2xhc3NMaXN0LmFkZCgibm8tdHJhbnNpdGlvbiIpO2YoYy53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIi5zbGlkZXM+c2VjdGlvbiIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEpe3ZhciBiPQ0KZWIoYSxjLmJhY2tncm91bmQpO2YoYS5xdWVyeVNlbGVjdG9yQWxsKCJzZWN0aW9uIikpLmZvckVhY2goZnVuY3Rpb24oYSl7ZWIoYSxiKTtiLmNsYXNzTGlzdC5hZGQoInN0YWNrIil9KX0pO2QucGFyYWxsYXhCYWNrZ3JvdW5kSW1hZ2U/KGMuYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2U9J3VybCgiJytkLnBhcmFsbGF4QmFja2dyb3VuZEltYWdlKyciKScsYy5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRTaXplPWQucGFyYWxsYXhCYWNrZ3JvdW5kU2l6ZSxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yy53cmFwcGVyLmNsYXNzTGlzdC5hZGQoImhhcy1wYXJhbGxheC1iYWNrZ3JvdW5kIil9LDEpKTooYy5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRJbWFnZT0iIixjLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSgiaGFzLXBhcmFsbGF4LWJhY2tncm91bmQiKSl9ZnVuY3Rpb24gZWIoYSxiKXt2YXIgZT1hLmdldEF0dHJpYnV0ZSgiZGF0YS1iYWNrZ3JvdW5kIiksYz1hLmdldEF0dHJpYnV0ZSgiZGF0YS1iYWNrZ3JvdW5kLXNpemUiKSwNCmQ9YS5nZXRBdHRyaWJ1dGUoImRhdGEtYmFja2dyb3VuZC1pbWFnZSIpLGg9YS5nZXRBdHRyaWJ1dGUoImRhdGEtYmFja2dyb3VuZC12aWRlbyIpLGY9YS5nZXRBdHRyaWJ1dGUoImRhdGEtYmFja2dyb3VuZC1pZnJhbWUiKSxnPWEuZ2V0QXR0cmlidXRlKCJkYXRhLWJhY2tncm91bmQtY29sb3IiKSxtPWEuZ2V0QXR0cmlidXRlKCJkYXRhLWJhY2tncm91bmQtcmVwZWF0IiksbD1hLmdldEF0dHJpYnV0ZSgiZGF0YS1iYWNrZ3JvdW5kLXBvc2l0aW9uIiksbj1hLmdldEF0dHJpYnV0ZSgiZGF0YS1iYWNrZ3JvdW5kLXRyYW5zaXRpb24iKSxrPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImRpdiIpO2suY2xhc3NOYW1lPSJzbGlkZS1iYWNrZ3JvdW5kICIrYS5jbGFzc05hbWUucmVwbGFjZSgvcHJlc2VudHxwYXN0fGZ1dHVyZS8sIiIpO2UmJigvXihodHRwfGZpbGV8XC9cLykvZ2kudGVzdChlKXx8L1wuKHN2Z3xwbmd8anBnfGpwZWd8Z2lmfGJtcCkoWz8jXXwkKS9naS50ZXN0KGUpP2Euc2V0QXR0cmlidXRlKCJkYXRhLWJhY2tncm91bmQtaW1hZ2UiLA0KZSk6ay5zdHlsZS5iYWNrZ3JvdW5kPWUpOyhlfHxnfHxkfHxofHxmKSYmay5zZXRBdHRyaWJ1dGUoImRhdGEtYmFja2dyb3VuZC1oYXNoIixlK2MrZCtoK2YrZyttK2wrbik7YyYmKGsuc3R5bGUuYmFja2dyb3VuZFNpemU9Yyk7YyYmay5zZXRBdHRyaWJ1dGUoImRhdGEtYmFja2dyb3VuZC1zaXplIixjKTtnJiYoay5zdHlsZS5iYWNrZ3JvdW5kQ29sb3I9Zyk7bSYmKGsuc3R5bGUuYmFja2dyb3VuZFJlcGVhdD1tKTtsJiYoay5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb249bCk7biYmay5zZXRBdHRyaWJ1dGUoImRhdGEtYmFja2dyb3VuZC10cmFuc2l0aW9uIixuKTtiLmFwcGVuZENoaWxkKGspO2EuY2xhc3NMaXN0LnJlbW92ZSgiaGFzLWRhcmstYmFja2dyb3VuZCIpO2EuY2xhc3NMaXN0LnJlbW92ZSgiaGFzLWxpZ2h0LWJhY2tncm91bmQiKTthLnNsaWRlQmFja2dyb3VuZEVsZW1lbnQ9azsoYj13aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShrKSkmJmIuYmFja2dyb3VuZENvbG9yJiYoZT0NCmZiKGIuYmFja2dyb3VuZENvbG9yKSkmJjAhPT1lLmEmJihiPWIuYmFja2dyb3VuZENvbG9yLCJzdHJpbmciPT09dHlwZW9mIGImJihiPWZiKGIpKSxiPWI/KDI5OSpiLnIrNTg3KmIuZysxMTQqYi5iKS8xRTM6bnVsbCwxMjg+Yj9hLmNsYXNzTGlzdC5hZGQoImhhcy1kYXJrLWJhY2tncm91bmQiKTphLmNsYXNzTGlzdC5hZGQoImhhcy1saWdodC1iYWNrZ3JvdW5kIikpO3JldHVybiBrfWZ1bmN0aW9uIFdiKCl7ZC5wb3N0TWVzc2FnZSYmd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoIm1lc3NhZ2UiLGZ1bmN0aW9uKGEpe2E9YS5kYXRhOyJzdHJpbmciPT09dHlwZW9mIGEmJiJ7Ij09PWEuY2hhckF0KDApJiYifSI9PT1hLmNoYXJBdChhLmxlbmd0aC0xKSYmKGE9SlNPTi5wYXJzZShhKSxhLm1ldGhvZCYmImZ1bmN0aW9uIj09PXR5cGVvZiBEW2EubWV0aG9kXSYmRFthLm1ldGhvZF0uYXBwbHkoRCxhLmFyZ3MpKX0sITEpfWZ1bmN0aW9uIFlhKGEpe3ZhciBiPWMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzIHNlY3Rpb24iKS5sZW5ndGg7DQpjLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZShkLnRyYW5zaXRpb24pOyJvYmplY3QiPT09dHlwZW9mIGEmJmthKGQsYSk7ITE9PT14LnRyYW5zZm9ybXMzZCYmKGQudHJhbnNpdGlvbj0ibGluZWFyIik7Yy53cmFwcGVyLmNsYXNzTGlzdC5hZGQoZC50cmFuc2l0aW9uKTtjLndyYXBwZXIuc2V0QXR0cmlidXRlKCJkYXRhLXRyYW5zaXRpb24tc3BlZWQiLGQudHJhbnNpdGlvblNwZWVkKTtjLndyYXBwZXIuc2V0QXR0cmlidXRlKCJkYXRhLWJhY2tncm91bmQtdHJhbnNpdGlvbiIsZC5iYWNrZ3JvdW5kVHJhbnNpdGlvbik7Yy5jb250cm9scy5zdHlsZS5kaXNwbGF5PWQuY29udHJvbHM/ImJsb2NrIjoibm9uZSI7Yy5wcm9ncmVzcy5zdHlsZS5kaXNwbGF5PWQucHJvZ3Jlc3M/ImJsb2NrIjoibm9uZSI7ZC5zaHVmZmxlJiZnYigpO2QucnRsP2Mud3JhcHBlci5jbGFzc0xpc3QuYWRkKCJydGwiKTpjLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSgicnRsIik7ZC5jZW50ZXI/Yy53cmFwcGVyLmNsYXNzTGlzdC5hZGQoImNlbnRlciIpOg0KYy53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoImNlbnRlciIpOyExPT09ZC5wYXVzZSYmRWEoKTtkLnNob3dOb3Rlcz8oYy5zcGVha2VyTm90ZXMuY2xhc3NMaXN0LmFkZCgidmlzaWJsZSIpLGMuc3BlYWtlck5vdGVzLnNldEF0dHJpYnV0ZSgiZGF0YS1sYXlvdXQiLCJzdHJpbmciPT09dHlwZW9mIGQuc2hvd05vdGVzP2Quc2hvd05vdGVzOiJpbmxpbmUiKSk6Yy5zcGVha2VyTm90ZXMuY2xhc3NMaXN0LnJlbW92ZSgidmlzaWJsZSIpO2QubW91c2VXaGVlbD8oZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigiRE9NTW91c2VTY3JvbGwiLGxhLCExKSxkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCJtb3VzZXdoZWVsIixsYSwhMSkpOihkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCJET01Nb3VzZVNjcm9sbCIsbGEsITEpLGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoIm1vdXNld2hlZWwiLGxhLCExKSk7ZC5yb2xsaW5nTGlua3M/JGIoKTphYygpO2QucHJldmlld0xpbmtzPw0KKGhiKCksaWIoIltkYXRhLXByZXZpZXctbGluaz1mYWxzZV0iKSk6KGliKCksaGIoIltkYXRhLXByZXZpZXctbGlua106bm90KFtkYXRhLXByZXZpZXctbGluaz1mYWxzZV0pIikpO0gmJihILmRlc3Ryb3koKSxIPW51bGwpOzE8YiYmZC5hdXRvU2xpZGUmJmQuYXV0b1NsaWRlU3RvcHBhYmxlJiZ4LmNhbnZhcyYmeC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUmJihIPW5ldyBQKGMud3JhcHBlcixmdW5jdGlvbigpe3JldHVybiBNYXRoLm1pbihNYXRoLm1heCgoRGF0ZS5ub3coKS1qYikvQywwKSwxKX0pLEgub24oImNsaWNrIixiYyksRT0hMSk7ITE9PT1kLmZyYWdtZW50cyYmZihjLnNsaWRlcy5xdWVyeVNlbGVjdG9yQWxsKCIuZnJhZ21lbnQiKSkuZm9yRWFjaChmdW5jdGlvbihhKXthLmNsYXNzTGlzdC5hZGQoInZpc2libGUiKTthLmNsYXNzTGlzdC5yZW1vdmUoImN1cnJlbnQtZnJhZ21lbnQiKX0pO2E9Im5vbmUiO2Quc2xpZGVOdW1iZXImJiFLKCkmJigiYWxsIj09PWQuc2hvd1NsaWRlTnVtYmVyPw0KYT0iYmxvY2siOiJzcGVha2VyIj09PWQuc2hvd1NsaWRlTnVtYmVyJiZGYSgpJiYoYT0iYmxvY2siKSk7Yy5zbGlkZU51bWJlci5zdHlsZS5kaXNwbGF5PWE7a2IoKX1mdW5jdGlvbiBsYigpe0dhPSEwO3dpbmRvdy5hZGRFdmVudExpc3RlbmVyKCJoYXNoY2hhbmdlIixtYiwhMSk7d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoInJlc2l6ZSIsbmIsITEpO2QudG91Y2gmJihjLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcigidG91Y2hzdGFydCIsSGEsITEpLGMud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCJ0b3VjaG1vdmUiLElhLCExKSxjLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcigidG91Y2hlbmQiLEphLCExKSx3aW5kb3cubmF2aWdhdG9yLnBvaW50ZXJFbmFibGVkPyhjLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcigicG9pbnRlcmRvd24iLG1hLCExKSxjLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcigicG9pbnRlcm1vdmUiLG5hLCExKSxjLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcigicG9pbnRlcnVwIiwNCm9hLCExKSk6d2luZG93Lm5hdmlnYXRvci5tc1BvaW50ZXJFbmFibGVkJiYoYy53cmFwcGVyLmFkZEV2ZW50TGlzdGVuZXIoIk1TUG9pbnRlckRvd24iLG1hLCExKSxjLndyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lcigiTVNQb2ludGVyTW92ZSIsbmEsITEpLGMud3JhcHBlci5hZGRFdmVudExpc3RlbmVyKCJNU1BvaW50ZXJVcCIsb2EsITEpKSk7ZC5rZXlib2FyZCYmKGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoImtleWRvd24iLEthLCExKSxkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCJrZXlwcmVzcyIsb2IsITEpKTtkLnByb2dyZXNzJiZjLnByb2dyZXNzJiZjLnByb2dyZXNzLmFkZEV2ZW50TGlzdGVuZXIoImNsaWNrIixwYiwhMSk7aWYoZC5mb2N1c0JvZHlPblBhZ2VWaXNpYmlsaXR5Q2hhbmdlKXt2YXIgYTsiaGlkZGVuImluIGRvY3VtZW50P2E9InZpc2liaWxpdHljaGFuZ2UiOiJtc0hpZGRlbiJpbiBkb2N1bWVudD9hPSJtc3Zpc2liaWxpdHljaGFuZ2UiOiJ3ZWJraXRIaWRkZW4iaW4NCmRvY3VtZW50JiYoYT0id2Via2l0dmlzaWJpbGl0eWNoYW5nZSIpO2EmJmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoYSxjYywhMSl9YT1bInRvdWNoc3RhcnQiLCJjbGljayJdO1EubWF0Y2goL2FuZHJvaWQvZ2kpJiYoYT1bInRvdWNoc3RhcnQiXSk7YS5mb3JFYWNoKGZ1bmN0aW9uKGEpe2MuY29udHJvbHNMZWZ0LmZvckVhY2goZnVuY3Rpb24oYil7Yi5hZGRFdmVudExpc3RlbmVyKGEscWIsITEpfSk7Yy5jb250cm9sc1JpZ2h0LmZvckVhY2goZnVuY3Rpb24oYil7Yi5hZGRFdmVudExpc3RlbmVyKGEscmIsITEpfSk7Yy5jb250cm9sc1VwLmZvckVhY2goZnVuY3Rpb24oYil7Yi5hZGRFdmVudExpc3RlbmVyKGEsc2IsITEpfSk7Yy5jb250cm9sc0Rvd24uZm9yRWFjaChmdW5jdGlvbihiKXtiLmFkZEV2ZW50TGlzdGVuZXIoYSx0YiwhMSl9KTtjLmNvbnRyb2xzUHJldi5mb3JFYWNoKGZ1bmN0aW9uKGIpe2IuYWRkRXZlbnRMaXN0ZW5lcihhLHViLCExKX0pO2MuY29udHJvbHNOZXh0LmZvckVhY2goZnVuY3Rpb24oYil7Yi5hZGRFdmVudExpc3RlbmVyKGEsDQp2YiwhMSl9KX0pfWZ1bmN0aW9uIEJhKCl7R2E9ITE7ZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigia2V5ZG93biIsS2EsITEpO2RvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoImtleXByZXNzIixvYiwhMSk7d2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoImhhc2hjaGFuZ2UiLG1iLCExKTt3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigicmVzaXplIixuYiwhMSk7Yy53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoInRvdWNoc3RhcnQiLEhhLCExKTtjLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigidG91Y2htb3ZlIixJYSwhMSk7Yy53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoInRvdWNoZW5kIixKYSwhMSk7d2luZG93Lm5hdmlnYXRvci5wb2ludGVyRW5hYmxlZD8oYy53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoInBvaW50ZXJkb3duIixtYSwhMSksYy53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoInBvaW50ZXJtb3ZlIixuYSwhMSksYy53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoInBvaW50ZXJ1cCIsDQpvYSwhMSkpOndpbmRvdy5uYXZpZ2F0b3IubXNQb2ludGVyRW5hYmxlZCYmKGMud3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyKCJNU1BvaW50ZXJEb3duIixtYSwhMSksYy53cmFwcGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoIk1TUG9pbnRlck1vdmUiLG5hLCExKSxjLndyYXBwZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigiTVNQb2ludGVyVXAiLG9hLCExKSk7ZC5wcm9ncmVzcyYmYy5wcm9ncmVzcyYmYy5wcm9ncmVzcy5yZW1vdmVFdmVudExpc3RlbmVyKCJjbGljayIscGIsITEpO1sidG91Y2hzdGFydCIsImNsaWNrIl0uZm9yRWFjaChmdW5jdGlvbihhKXtjLmNvbnRyb2xzTGVmdC5mb3JFYWNoKGZ1bmN0aW9uKGIpe2IucmVtb3ZlRXZlbnRMaXN0ZW5lcihhLHFiLCExKX0pO2MuY29udHJvbHNSaWdodC5mb3JFYWNoKGZ1bmN0aW9uKGIpe2IucmVtb3ZlRXZlbnRMaXN0ZW5lcihhLHJiLCExKX0pO2MuY29udHJvbHNVcC5mb3JFYWNoKGZ1bmN0aW9uKGIpe2IucmVtb3ZlRXZlbnRMaXN0ZW5lcihhLA0Kc2IsITEpfSk7Yy5jb250cm9sc0Rvd24uZm9yRWFjaChmdW5jdGlvbihiKXtiLnJlbW92ZUV2ZW50TGlzdGVuZXIoYSx0YiwhMSl9KTtjLmNvbnRyb2xzUHJldi5mb3JFYWNoKGZ1bmN0aW9uKGIpe2IucmVtb3ZlRXZlbnRMaXN0ZW5lcihhLHViLCExKX0pO2MuY29udHJvbHNOZXh0LmZvckVhY2goZnVuY3Rpb24oYil7Yi5yZW1vdmVFdmVudExpc3RlbmVyKGEsdmIsITEpfSl9KX1mdW5jdGlvbiBrYShhLGIpe2Zvcih2YXIgZSBpbiBiKWFbZV09YltlXX1mdW5jdGlvbiBmKGEpe3JldHVybiBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhKX1mdW5jdGlvbiBXKGEpe2lmKCJzdHJpbmciPT09dHlwZW9mIGEpe2lmKCJudWxsIj09PWEpcmV0dXJuIG51bGw7aWYoInRydWUiPT09YSlyZXR1cm4hMDtpZigiZmFsc2UiPT09YSlyZXR1cm4hMTtpZihhLm1hdGNoKC9eW1xkXC5dKyQvKSlyZXR1cm4gcGFyc2VGbG9hdChhKX1yZXR1cm4gYX1mdW5jdGlvbiB3YihhLGIpe3ZhciBlPWEueC1iLng7DQphPWEueS1iLnk7cmV0dXJuIE1hdGguc3FydChlKmUrYSphKX1mdW5jdGlvbiBMKGEsYil7YS5zdHlsZS5XZWJraXRUcmFuc2Zvcm09YjthLnN0eWxlLk1velRyYW5zZm9ybT1iO2Euc3R5bGUubXNUcmFuc2Zvcm09YjthLnN0eWxlLnRyYW5zZm9ybT1ifWZ1bmN0aW9uIGdhKGEpeyJzdHJpbmciPT09dHlwZW9mIGEubGF5b3V0JiYobD1hLmxheW91dCk7InN0cmluZyI9PT10eXBlb2YgYS5vdmVydmlldyYmKExhPWEub3ZlcnZpZXcpO2w/TChjLnNsaWRlcyxsKyIgIitMYSk6TChjLnNsaWRlcyxMYSl9ZnVuY3Rpb24gYmIoYSl7dmFyIGI9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgic3R5bGUiKTtiLnR5cGU9InRleHQvY3NzIjtiLnN0eWxlU2hlZXQ/Yi5zdHlsZVNoZWV0LmNzc1RleHQ9YTpiLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGEpKTtkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgiaGVhZCIpWzBdLmFwcGVuZENoaWxkKGIpfWZ1bmN0aW9uIEIoYSwNCmIpe2ZvcihhPWEucGFyZW50Tm9kZTthOyl7dmFyIGU9YS5tYXRjaGVzfHxhLm1hdGNoZXNTZWxlY3Rvcnx8YS5tc01hdGNoZXNTZWxlY3RvcjtpZihlJiZlLmNhbGwoYSxiKSlyZXR1cm4gYTthPWEucGFyZW50Tm9kZX1yZXR1cm4gbnVsbH1mdW5jdGlvbiBmYihhKXt2YXIgYj1hLm1hdGNoKC9eIyhbMC05YS1mXXszfSkkL2kpO3JldHVybiBiJiZiWzFdPyhiPWJbMV0se3I6MTcqcGFyc2VJbnQoYi5jaGFyQXQoMCksMTYpLGc6MTcqcGFyc2VJbnQoYi5jaGFyQXQoMSksMTYpLGI6MTcqcGFyc2VJbnQoYi5jaGFyQXQoMiksMTYpfSk6KGI9YS5tYXRjaCgvXiMoWzAtOWEtZl17Nn0pJC9pKSkmJmJbMV0/KGI9YlsxXSx7cjpwYXJzZUludChiLnN1YnN0cigwLDIpLDE2KSxnOnBhcnNlSW50KGIuc3Vic3RyKDIsMiksMTYpLGI6cGFyc2VJbnQoYi5zdWJzdHIoNCwyKSwxNil9KTooYj1hLm1hdGNoKC9ecmdiXHMqXChccyooXGQrKVxzKixccyooXGQrKVxzKixccyooXGQrKVxzKlwpJC9pKSk/DQp7cjpwYXJzZUludChiWzFdLDEwKSxnOnBhcnNlSW50KGJbMl0sMTApLGI6cGFyc2VJbnQoYlszXSwxMCl9OihhPWEubWF0Y2goL15yZ2JhXHMqXChccyooXGQrKVxzKixccyooXGQrKVxzKixccyooXGQrKVxzKlwsXHMqKFtcZF0rfFtcZF0qLltcZF0rKVxzKlwpJC9pKSk/e3I6cGFyc2VJbnQoYVsxXSwxMCksZzpwYXJzZUludChhWzJdLDEwKSxiOnBhcnNlSW50KGFbM10sMTApLGE6cGFyc2VGbG9hdChhWzRdKX06bnVsbH1mdW5jdGlvbiBLKCl7cmV0dXJuL3ByaW50LXBkZi9naS50ZXN0KHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpfWZ1bmN0aW9uIHhiKCl7c2V0VGltZW91dChmdW5jdGlvbigpe3dpbmRvdy5zY3JvbGxUbygwLDEpfSwxMCl9ZnVuY3Rpb24gQShhLGIpe3ZhciBlPWRvY3VtZW50LmNyZWF0ZUV2ZW50KCJIVE1MRXZlbnRzIiwxLDIpO2UuaW5pdEV2ZW50KGEsITAsITApO2thKGUsYik7Yy53cmFwcGVyLmRpc3BhdGNoRXZlbnQoZSk7ZC5wb3N0TWVzc2FnZUV2ZW50cyYmDQp3aW5kb3cucGFyZW50IT09d2luZG93LnNlbGYmJndpbmRvdy5wYXJlbnQucG9zdE1lc3NhZ2UoSlNPTi5zdHJpbmdpZnkoe25hbWVzcGFjZToicmV2ZWFsIixldmVudE5hbWU6YSxzdGF0ZTp5YigpfSksIioiKX1mdW5jdGlvbiAkYigpe2lmKHgudHJhbnNmb3JtczNkJiYhKCJtc1BlcnNwZWN0aXZlImluIGRvY3VtZW50LmJvZHkuc3R5bGUpKWZvcih2YXIgYT1jLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcyBzZWN0aW9uIGEiKSxiPTAsZT1hLmxlbmd0aDtiPGU7YisrKXt2YXIgZD1hW2JdO2lmKCEoIWQudGV4dENvbnRlbnR8fGQucXVlcnlTZWxlY3RvcigiKiIpfHxkLmNsYXNzTmFtZSYmZC5jbGFzc0xpc3QuY29udGFpbnMoZCwicm9sbCIpKSl7dmFyIGY9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgic3BhbiIpO2Yuc2V0QXR0cmlidXRlKCJkYXRhLXRpdGxlIixkLnRleHQpO2YuaW5uZXJIVE1MPWQuaW5uZXJIVE1MO2QuY2xhc3NMaXN0LmFkZCgicm9sbCIpO2QuaW5uZXJIVE1MPQ0KIiI7ZC5hcHBlbmRDaGlsZChmKX19fWZ1bmN0aW9uIGFjKCl7Zm9yKHZhciBhPWMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzIHNlY3Rpb24gYS5yb2xsIiksYj0wLGU9YS5sZW5ndGg7YjxlO2IrKyl7dmFyIGQ9YVtiXSxmPWQucXVlcnlTZWxlY3Rvcigic3BhbiIpO2YmJihkLmNsYXNzTGlzdC5yZW1vdmUoInJvbGwiKSxkLmlubmVySFRNTD1mLmlubmVySFRNTCl9fWZ1bmN0aW9uIGhiKGEpe2YoZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChhP2E6ImEiKSkuZm9yRWFjaChmdW5jdGlvbihhKXsvXihodHRwfHd3dykvZ2kudGVzdChhLmdldEF0dHJpYnV0ZSgiaHJlZiIpKSYmYS5hZGRFdmVudExpc3RlbmVyKCJjbGljayIsemIsITEpfSl9ZnVuY3Rpb24gaWIoYSl7Zihkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKGE/YToiYSIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEpey9eKGh0dHB8d3d3KS9naS50ZXN0KGEuZ2V0QXR0cmlidXRlKCJocmVmIikpJiZhLnJlbW92ZUV2ZW50TGlzdGVuZXIoImNsaWNrIiwNCnpiLCExKX0pfWZ1bmN0aW9uIGRjKGEpe00oKTtjLm92ZXJsYXk9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiZGl2Iik7Yy5vdmVybGF5LmNsYXNzTGlzdC5hZGQoIm92ZXJsYXkiKTtjLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCgib3ZlcmxheS1wcmV2aWV3Iik7Yy53cmFwcGVyLmFwcGVuZENoaWxkKGMub3ZlcmxheSk7Yy5vdmVybGF5LmlubmVySFRNTD1bJzxoZWFkZXI+PGEgY2xhc3M9ImNsb3NlIiBocmVmPSIjIj48c3BhbiBjbGFzcz0iaWNvbiI+PC9zcGFuPjwvYT4nLCc8YSBjbGFzcz0iZXh0ZXJuYWwiIGhyZWY9IicrYSsnIiB0YXJnZXQ9Il9ibGFuayI+PHNwYW4gY2xhc3M9Imljb24iPjwvc3Bhbj48L2E+JywnPC9oZWFkZXI+PGRpdiBjbGFzcz0ic3Bpbm5lciI+PC9kaXY+PGRpdiBjbGFzcz0idmlld3BvcnQiPicsJzxpZnJhbWUgc3JjPSInK2ErJyI+PC9pZnJhbWU+JywnPHNtYWxsIGNsYXNzPSJ2aWV3cG9ydC1pbm5lciI+PHNwYW4gY2xhc3M9IngtZnJhbWUtZXJyb3IiPlVuYWJsZSB0byBsb2FkIGlmcmFtZS4gVGhpcyBpcyBsaWtlbHkgZHVlIHRvIHRoZSBzaXRlXCdzIHBvbGljeSAoeC1mcmFtZS1vcHRpb25zKS48L3NwYW4+PC9zbWFsbD48L2Rpdj4nXS5qb2luKCIiKTsNCmMub3ZlcmxheS5xdWVyeVNlbGVjdG9yKCJpZnJhbWUiKS5hZGRFdmVudExpc3RlbmVyKCJsb2FkIixmdW5jdGlvbihhKXtjLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCgibG9hZGVkIil9LCExKTtjLm92ZXJsYXkucXVlcnlTZWxlY3RvcigiLmNsb3NlIikuYWRkRXZlbnRMaXN0ZW5lcigiY2xpY2siLGZ1bmN0aW9uKGEpe00oKTthLnByZXZlbnREZWZhdWx0KCl9LCExKTtjLm92ZXJsYXkucXVlcnlTZWxlY3RvcigiLmV4dGVybmFsIikuYWRkRXZlbnRMaXN0ZW5lcigiY2xpY2siLGZ1bmN0aW9uKGEpe00oKX0sITEpO3NldFRpbWVvdXQoZnVuY3Rpb24oKXtjLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCgidmlzaWJsZSIpfSwxKX1mdW5jdGlvbiBBYihhKXsiYm9vbGVhbiI9PT10eXBlb2YgYT9hP0JiKCk6TSgpOmMub3ZlcmxheT9NKCk6QmIoKX1mdW5jdGlvbiBCYigpe2lmKGQuaGVscCl7TSgpO2Mub3ZlcmxheT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJkaXYiKTtjLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCgib3ZlcmxheSIpOw0KYy5vdmVybGF5LmNsYXNzTGlzdC5hZGQoIm92ZXJsYXktaGVscCIpO2Mud3JhcHBlci5hcHBlbmRDaGlsZChjLm92ZXJsYXkpO3ZhciBhPSc8cCBjbGFzcz0idGl0bGUiPktleWJvYXJkIFNob3J0Y3V0czwvcD48YnIvPjx0YWJsZT48dGg+S0VZPC90aD48dGg+QUNUSU9OPC90aD4nO2Zvcih2YXIgYiBpbiBNYSlhKz0iPHRyPjx0ZD4iK2IrIjwvdGQ+PHRkPiIrTWFbYl0rIjwvdGQ+PC90cj4iO2Mub3ZlcmxheS5pbm5lckhUTUw9Wyc8aGVhZGVyPjxhIGNsYXNzPSJjbG9zZSIgaHJlZj0iIyI+PHNwYW4gY2xhc3M9Imljb24iPjwvc3Bhbj48L2E+PC9oZWFkZXI+PGRpdiBjbGFzcz0idmlld3BvcnQiPicsJzxkaXYgY2xhc3M9InZpZXdwb3J0LWlubmVyIj4nKyhhKyI8L3RhYmxlPiIpKyI8L2Rpdj4iLCI8L2Rpdj4iXS5qb2luKCIiKTtjLm92ZXJsYXkucXVlcnlTZWxlY3RvcigiLmNsb3NlIikuYWRkRXZlbnRMaXN0ZW5lcigiY2xpY2siLGZ1bmN0aW9uKGEpe00oKTthLnByZXZlbnREZWZhdWx0KCl9LA0KITEpO3NldFRpbWVvdXQoZnVuY3Rpb24oKXtjLm92ZXJsYXkuY2xhc3NMaXN0LmFkZCgidmlzaWJsZSIpfSwxKX19ZnVuY3Rpb24gTSgpe2Mub3ZlcmxheSYmKGMub3ZlcmxheS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGMub3ZlcmxheSksYy5vdmVybGF5PW51bGwpfWZ1bmN0aW9uIFIoKXtpZihjLndyYXBwZXImJiFLKCkpe3ZhciBhPUNhKCk7Y2IoZC53aWR0aCxkLmhlaWdodCk7Yy5zbGlkZXMuc3R5bGUud2lkdGg9YS53aWR0aCsicHgiO2Muc2xpZGVzLnN0eWxlLmhlaWdodD1hLmhlaWdodCsicHgiO0Y9TWF0aC5taW4oYS5wcmVzZW50YXRpb25XaWR0aC9hLndpZHRoLGEucHJlc2VudGF0aW9uSGVpZ2h0L2EuaGVpZ2h0KTtGPU1hdGgubWF4KEYsZC5taW5TY2FsZSk7Rj1NYXRoLm1pbihGLGQubWF4U2NhbGUpOzE9PT1GPyhjLnNsaWRlcy5zdHlsZS56b29tPSIiLGMuc2xpZGVzLnN0eWxlLmxlZnQ9IiIsYy5zbGlkZXMuc3R5bGUudG9wPSIiLGMuc2xpZGVzLnN0eWxlLmJvdHRvbT0NCiIiLGMuc2xpZGVzLnN0eWxlLnJpZ2h0PSIiLGdhKHtsYXlvdXQ6IiJ9KSk6MTxGJiZ4Lnpvb20/KGMuc2xpZGVzLnN0eWxlLnpvb209RixjLnNsaWRlcy5zdHlsZS5sZWZ0PSIiLGMuc2xpZGVzLnN0eWxlLnRvcD0iIixjLnNsaWRlcy5zdHlsZS5ib3R0b209IiIsYy5zbGlkZXMuc3R5bGUucmlnaHQ9IiIsZ2Eoe2xheW91dDoiIn0pKTooYy5zbGlkZXMuc3R5bGUuem9vbT0iIixjLnNsaWRlcy5zdHlsZS5sZWZ0PSI1MCUiLGMuc2xpZGVzLnN0eWxlLnRvcD0iNTAlIixjLnNsaWRlcy5zdHlsZS5ib3R0b209ImF1dG8iLGMuc2xpZGVzLnN0eWxlLnJpZ2h0PSJhdXRvIixnYSh7bGF5b3V0OiJ0cmFuc2xhdGUoLTUwJSwgLTUwJSkgc2NhbGUoIitGKyIpIn0pKTtmb3IodmFyIGI9ZihjLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcyBzZWN0aW9uIikpLGU9MCx1PWIubGVuZ3RoO2U8dTtlKyspe3ZhciBwPWJbZV07Im5vbmUiIT09cC5zdHlsZS5kaXNwbGF5JiYoZC5jZW50ZXJ8fA0KcC5jbGFzc0xpc3QuY29udGFpbnMoImNlbnRlciIpP3AuY2xhc3NMaXN0LmNvbnRhaW5zKCJzdGFjayIpP3Auc3R5bGUudG9wPTA6cC5zdHlsZS50b3A9TWF0aC5tYXgoKGEuaGVpZ2h0LXAuc2Nyb2xsSGVpZ2h0KS8yLDApKyJweCI6cC5zdHlsZS50b3A9IiIpfXBhKCk7Q2IoKTtyJiZOYSgpfX1mdW5jdGlvbiBjYihhLGIpe2YoYy5zbGlkZXMucXVlcnlTZWxlY3RvckFsbCgic2VjdGlvbiA+IC5zdHJldGNoIikpLmZvckVhY2goZnVuY3Rpb24oZSl7dmFyIGM9YixjPWN8fDA7aWYoZSl7dmFyIGQ9ZS5zdHlsZS5oZWlnaHQ7ZS5zdHlsZS5oZWlnaHQ9IjBweCI7Yy09ZS5wYXJlbnROb2RlLm9mZnNldEhlaWdodDtlLnN0eWxlLmhlaWdodD1kKyJweCJ9dmFyIGY9YzsvKGltZ3x2aWRlbykvZ2kudGVzdChlLm5vZGVOYW1lKT8oZD1lLm5hdHVyYWxXaWR0aHx8ZS52aWRlb1dpZHRoLGM9ZS5uYXR1cmFsSGVpZ2h0fHxlLnZpZGVvSGVpZ2h0LGY9TWF0aC5taW4oYS9kLGYvYyksZS5zdHlsZS53aWR0aD0NCmQqZisicHgiLGUuc3R5bGUuaGVpZ2h0PWMqZisicHgiKTooZS5zdHlsZS53aWR0aD1hKyJweCIsZS5zdHlsZS5oZWlnaHQ9ZisicHgiKX0pfWZ1bmN0aW9uIENhKGEsYil7YT17d2lkdGg6ZC53aWR0aCxoZWlnaHQ6ZC5oZWlnaHQscHJlc2VudGF0aW9uV2lkdGg6YXx8Yy53cmFwcGVyLm9mZnNldFdpZHRoLHByZXNlbnRhdGlvbkhlaWdodDpifHxjLndyYXBwZXIub2Zmc2V0SGVpZ2h0fTthLnByZXNlbnRhdGlvbldpZHRoLT1hLnByZXNlbnRhdGlvbldpZHRoKmQubWFyZ2luO2EucHJlc2VudGF0aW9uSGVpZ2h0LT1hLnByZXNlbnRhdGlvbkhlaWdodCpkLm1hcmdpbjsic3RyaW5nIj09PXR5cGVvZiBhLndpZHRoJiYvJSQvLnRlc3QoYS53aWR0aCkmJihhLndpZHRoPXBhcnNlSW50KGEud2lkdGgsMTApLzEwMCphLnByZXNlbnRhdGlvbldpZHRoKTsic3RyaW5nIj09PXR5cGVvZiBhLmhlaWdodCYmLyUkLy50ZXN0KGEuaGVpZ2h0KSYmKGEuaGVpZ2h0PXBhcnNlSW50KGEuaGVpZ2h0LA0KMTApLzEwMCphLnByZXNlbnRhdGlvbkhlaWdodCk7cmV0dXJuIGF9ZnVuY3Rpb24gRGIoYSxiKXsib2JqZWN0Ij09PXR5cGVvZiBhJiYiZnVuY3Rpb24iPT09dHlwZW9mIGEuc2V0QXR0cmlidXRlJiZhLnNldEF0dHJpYnV0ZSgiZGF0YS1wcmV2aW91cy1pbmRleHYiLGJ8fDApfWZ1bmN0aW9uIEViKGEpe2lmKCJvYmplY3QiPT09dHlwZW9mIGEmJiJmdW5jdGlvbiI9PT10eXBlb2YgYS5zZXRBdHRyaWJ1dGUmJmEuY2xhc3NMaXN0LmNvbnRhaW5zKCJzdGFjayIpKXt2YXIgYj1hLmhhc0F0dHJpYnV0ZSgiZGF0YS1zdGFydC1pbmRleHYiKT8iZGF0YS1zdGFydC1pbmRleHYiOiJkYXRhLXByZXZpb3VzLWluZGV4diI7cmV0dXJuIHBhcnNlSW50KGEuZ2V0QXR0cmlidXRlKGIpfHwwLDEwKX1yZXR1cm4gMH1mdW5jdGlvbiBPYSgpe2lmKGQub3ZlcnZpZXcmJiFyKXtyPSEwO2Mud3JhcHBlci5jbGFzc0xpc3QuYWRkKCJvdmVydmlldyIpO2Mud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCJvdmVydmlldy1kZWFjdGl2YXRpbmciKTsNCngub3ZlcnZpZXdUcmFuc2l0aW9ucyYmc2V0VGltZW91dChmdW5jdGlvbigpe2Mud3JhcHBlci5jbGFzc0xpc3QuYWRkKCJvdmVydmlldy1hbmltYXRlZCIpfSwxKTtjbGVhclRpbWVvdXQoSSk7ST0tMTtjLnNsaWRlcy5hcHBlbmRDaGlsZChjLmJhY2tncm91bmQpO2YoYy53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIi5zbGlkZXMgc2VjdGlvbiIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEpe2EuY2xhc3NMaXN0LmNvbnRhaW5zKCJzdGFjayIpfHxhLmFkZEV2ZW50TGlzdGVuZXIoImNsaWNrIixGYiwhMCl9KTt2YXIgYT1DYSgpO1g9YS53aWR0aCs3MDtxYT1hLmhlaWdodCs3MDtkLnJ0bCYmKFg9LVgpO1BhKCk7R2IoKTtOYSgpO1IoKTtBKCJvdmVydmlld3Nob3duIix7aW5kZXhoOm0saW5kZXh2Om4sY3VycmVudFNsaWRlOmd9KX19ZnVuY3Rpb24gR2IoKXtmKGMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzPnNlY3Rpb24iKSkuZm9yRWFjaChmdW5jdGlvbihhLGIpe2Euc2V0QXR0cmlidXRlKCJkYXRhLWluZGV4LWgiLA0KYik7TChhLCJ0cmFuc2xhdGUzZCgiK2IqWCsicHgsIDAsIDApIik7YS5jbGFzc0xpc3QuY29udGFpbnMoInN0YWNrIikmJmYoYS5xdWVyeVNlbGVjdG9yQWxsKCJzZWN0aW9uIikpLmZvckVhY2goZnVuY3Rpb24oYSxjKXthLnNldEF0dHJpYnV0ZSgiZGF0YS1pbmRleC1oIixiKTthLnNldEF0dHJpYnV0ZSgiZGF0YS1pbmRleC12IixjKTtMKGEsInRyYW5zbGF0ZTNkKDAsICIrYypxYSsicHgsIDApIil9KX0pO2YoYy5iYWNrZ3JvdW5kLmNoaWxkTm9kZXMpLmZvckVhY2goZnVuY3Rpb24oYSxiKXtMKGEsInRyYW5zbGF0ZTNkKCIrYipYKyJweCwgMCwgMCkiKTtmKGEucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlLWJhY2tncm91bmQiKSkuZm9yRWFjaChmdW5jdGlvbihhLGIpe0woYSwidHJhbnNsYXRlM2QoMCwgIitiKnFhKyJweCwgMCkiKX0pfSl9ZnVuY3Rpb24gTmEoKXt2YXIgYT1NYXRoLm1pbih3aW5kb3cuaW5uZXJXaWR0aCx3aW5kb3cuaW5uZXJIZWlnaHQpO2dhKHtvdmVydmlldzpbInNjYWxlKCIrDQpNYXRoLm1heChhLzUsMTUwKS9hKyIpIiwidHJhbnNsYXRlWCgiKy1tKlgrInB4KSIsInRyYW5zbGF0ZVkoIistbipxYSsicHgpIl0uam9pbigiICIpfSl9ZnVuY3Rpb24gWSgpe2Qub3ZlcnZpZXcmJihyPSExLGMud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCJvdmVydmlldyIpLGMud3JhcHBlci5jbGFzc0xpc3QucmVtb3ZlKCJvdmVydmlldy1hbmltYXRlZCIpLGMud3JhcHBlci5jbGFzc0xpc3QuYWRkKCJvdmVydmlldy1kZWFjdGl2YXRpbmciKSxzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yy53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoIm92ZXJ2aWV3LWRlYWN0aXZhdGluZyIpfSwxKSxjLndyYXBwZXIuYXBwZW5kQ2hpbGQoYy5iYWNrZ3JvdW5kKSxmKGMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzIHNlY3Rpb24iKSkuZm9yRWFjaChmdW5jdGlvbihhKXtMKGEsIiIpO2EucmVtb3ZlRXZlbnRMaXN0ZW5lcigiY2xpY2siLEZiLCEwKX0pLGYoYy5iYWNrZ3JvdW5kLnF1ZXJ5U2VsZWN0b3JBbGwoIi5zbGlkZS1iYWNrZ3JvdW5kIikpLmZvckVhY2goZnVuY3Rpb24oYSl7TChhLA0KIiIpfSksZ2Eoe292ZXJ2aWV3OiIifSksdyhtLG4pLFIoKSxTKCksQSgib3ZlcnZpZXdoaWRkZW4iLHtpbmRleGg6bSxpbmRleHY6bixjdXJyZW50U2xpZGU6Z30pKX1mdW5jdGlvbiBRYShhKXsiYm9vbGVhbiI9PT10eXBlb2YgYT9hP09hKCk6WSgpOnI/WSgpOk9hKCl9ZnVuY3Rpb24gVChhKXtyZXR1cm4oYT1hP2E6ZykmJmEucGFyZW50Tm9kZSYmISFhLnBhcmVudE5vZGUubm9kZU5hbWUubWF0Y2goL3NlY3Rpb24vaSl9ZnVuY3Rpb24gSGIoKXtpZihkLnBhdXNlKXt2YXIgYT1jLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCJwYXVzZWQiKTtjbGVhclRpbWVvdXQoSSk7ST0tMTtjLndyYXBwZXIuY2xhc3NMaXN0LmFkZCgicGF1c2VkIik7ITE9PT1hJiZBKCJwYXVzZWQiKX19ZnVuY3Rpb24gRWEoKXt2YXIgYT1jLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCJwYXVzZWQiKTtjLndyYXBwZXIuY2xhc3NMaXN0LnJlbW92ZSgicGF1c2VkIik7UygpO2EmJkEoInJlc3VtZWQiKX0NCmZ1bmN0aW9uIFJhKGEpeyJib29sZWFuIj09PXR5cGVvZiBhP2E/SGIoKTpFYSgpOlooKT9FYSgpOkhiKCl9ZnVuY3Rpb24gWigpe3JldHVybiBjLndyYXBwZXIuY2xhc3NMaXN0LmNvbnRhaW5zKCJwYXVzZWQiKX1mdW5jdGlvbiBJYihhKXsiYm9vbGVhbiI9PT10eXBlb2YgYT9hP3JhKCk6c2EoKTpFP3JhKCk6c2EoKX1mdW5jdGlvbiB3KGEsYixlLGQpe3o9Zzt2YXIgdT1jLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uIik7aWYoMCE9PXUubGVuZ3RoKXt2b2lkIDAhPT1ifHxyfHwoYj1FYih1W2FdKSk7eiYmei5wYXJlbnROb2RlJiZ6LnBhcmVudE5vZGUuY2xhc3NMaXN0LmNvbnRhaW5zKCJzdGFjayIpJiZEYih6LnBhcmVudE5vZGUsbik7dmFyIGg9Ti5jb25jYXQoKTtOLmxlbmd0aD0wO3ZhciB5PW18fDAsaz1ufHwwO209SmIoIi5zbGlkZXM+c2VjdGlvbiIsdm9pZCAwPT09YT9tOmEpO249SmIoIi5zbGlkZXM+c2VjdGlvbi5wcmVzZW50PnNlY3Rpb24iLA0Kdm9pZCAwPT09Yj9uOmIpO1BhKCk7UigpO2E9MDtiPU4ubGVuZ3RoO2E6Zm9yKDthPGI7YSsrKXtmb3IodmFyIGw9MDtsPGgubGVuZ3RoO2wrKylpZihoW2xdPT09TlthXSl7aC5zcGxpY2UobCwxKTtjb250aW51ZSBhfWRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKE5bYV0pO0EoTlthXSl9Zm9yKDtoLmxlbmd0aDspZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsYXNzTGlzdC5yZW1vdmUoaC5wb3AoKSk7ciYmTmEoKTt1PXVbbV07Zz11LnF1ZXJ5U2VsZWN0b3JBbGwoInNlY3Rpb24iKVtuXXx8dTsidW5kZWZpbmVkIiE9PXR5cGVvZiBlJiZ0YShlKTsoZT1tIT09eXx8biE9PWspP0EoInNsaWRlY2hhbmdlZCIse2luZGV4aDptLGluZGV4djpuLHByZXZpb3VzU2xpZGU6eixjdXJyZW50U2xpZGU6ZyxvcmlnaW46ZH0pOno9bnVsbDt6JiYoei5jbGFzc0xpc3QucmVtb3ZlKCJwcmVzZW50Iiksei5zZXRBdHRyaWJ1dGUoImFyaWEtaGlkZGVuIiwidHJ1ZSIpLGMud3JhcHBlci5xdWVyeVNlbGVjdG9yKCIuc2xpZGVzPnNlY3Rpb246Zmlyc3Qtb2YtdHlwZSIpLmNsYXNzTGlzdC5jb250YWlucygicHJlc2VudCIpJiYNCnNldFRpbWVvdXQoZnVuY3Rpb24oKXt2YXIgYT1mKGMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzPnNlY3Rpb24uc3RhY2siKSksYjtmb3IoYiBpbiBhKWFbYl0mJkRiKGFbYl0sMCl9LDApKTtpZihlfHwheilTYSh6KSx1YShnKTtjLnN0YXR1c0Rpdi50ZXh0Q29udGVudD1PKGcpO1RhKCk7cGEoKTtBYSgpO0NiKCk7S2IoKTtMYigpO1VhKCk7UygpfX1mdW5jdGlvbiBrYigpe0JhKCk7bGIoKTtSKCk7Qz1kLmF1dG9TbGlkZTtTKCk7WmIoKTtVYSgpO2VjKCk7VGEoKTtwYSgpO0tiKCk7UGEoKTtBYSghMCk7TGIoKTtmYygpOyExPT09ZC5hdXRvUGxheU1lZGlhP1NhKGcpOnVhKGcpO3ImJkdiKCl9ZnVuY3Rpb24gWWIoKXtmKGMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzPnNlY3Rpb24iKSkuZm9yRWFjaChmdW5jdGlvbihhKXtmKGEucXVlcnlTZWxlY3RvckFsbCgic2VjdGlvbiIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEsYyl7MDxjJiYoYS5jbGFzc0xpc3QucmVtb3ZlKCJwcmVzZW50IiksDQphLmNsYXNzTGlzdC5yZW1vdmUoInBhc3QiKSxhLmNsYXNzTGlzdC5hZGQoImZ1dHVyZSIpLGEuc2V0QXR0cmlidXRlKCJhcmlhLWhpZGRlbiIsInRydWUiKSl9KX0pfWZ1bmN0aW9uIGVjKCl7ZihjLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uIikpLmZvckVhY2goZnVuY3Rpb24oYSl7dmFyIGI9ZihhLnF1ZXJ5U2VsZWN0b3JBbGwoInNlY3Rpb24iKSk7Yi5mb3JFYWNoKGZ1bmN0aW9uKGEsYil7dmEoYS5xdWVyeVNlbGVjdG9yQWxsKCIuZnJhZ21lbnQiKSl9KTswPT09Yi5sZW5ndGgmJnZhKGEucXVlcnlTZWxlY3RvckFsbCgiLmZyYWdtZW50IikpfSl9ZnVuY3Rpb24gZ2IoKXt2YXIgYT1mKGMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzPnNlY3Rpb24iKSk7YS5mb3JFYWNoKGZ1bmN0aW9uKGIpe2Muc2xpZGVzLmluc2VydEJlZm9yZShiLGFbTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKmEubGVuZ3RoKV0pfSl9ZnVuY3Rpb24gSmIoYSwNCmIpe2E9ZihjLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbChhKSk7dmFyIGU9YS5sZW5ndGgsdT1LKCk7aWYoZSl7ZC5sb29wJiYoYiU9ZSwwPmImJihiPWUrYikpO2I9TWF0aC5tYXgoTWF0aC5taW4oYixlLTEpLDApO2Zvcih2YXIgZz0wO2c8ZTtnKyspe3ZhciBoPWFbZ10seT1kLnJ0bCYmIVQoaCk7aC5jbGFzc0xpc3QucmVtb3ZlKCJwYXN0Iik7aC5jbGFzc0xpc3QucmVtb3ZlKCJwcmVzZW50Iik7aC5jbGFzc0xpc3QucmVtb3ZlKCJmdXR1cmUiKTtoLnNldEF0dHJpYnV0ZSgiaGlkZGVuIiwiIik7aC5zZXRBdHRyaWJ1dGUoImFyaWEtaGlkZGVuIiwidHJ1ZSIpO2gucXVlcnlTZWxlY3Rvcigic2VjdGlvbiIpJiZoLmNsYXNzTGlzdC5hZGQoInN0YWNrIik7aWYodSloLmNsYXNzTGlzdC5hZGQoInByZXNlbnQiKTtlbHNlIGlmKGc8Yil7aWYoaC5jbGFzc0xpc3QuYWRkKHk/ImZ1dHVyZSI6InBhc3QiKSxkLmZyYWdtZW50cylmb3IoaD1mKGgucXVlcnlTZWxlY3RvckFsbCgiLmZyYWdtZW50IikpO2gubGVuZ3RoOyl5PQ0KaC5wb3AoKSx5LmNsYXNzTGlzdC5hZGQoInZpc2libGUiKSx5LmNsYXNzTGlzdC5yZW1vdmUoImN1cnJlbnQtZnJhZ21lbnQiKX1lbHNlIGlmKGc+YiYmKGguY2xhc3NMaXN0LmFkZCh5PyJwYXN0IjoiZnV0dXJlIiksZC5mcmFnbWVudHMpKWZvcihoPWYoaC5xdWVyeVNlbGVjdG9yQWxsKCIuZnJhZ21lbnQudmlzaWJsZSIpKTtoLmxlbmd0aDspeT1oLnBvcCgpLHkuY2xhc3NMaXN0LnJlbW92ZSgidmlzaWJsZSIpLHkuY2xhc3NMaXN0LnJlbW92ZSgiY3VycmVudC1mcmFnbWVudCIpfWFbYl0uY2xhc3NMaXN0LmFkZCgicHJlc2VudCIpO2FbYl0ucmVtb3ZlQXR0cmlidXRlKCJoaWRkZW4iKTthW2JdLnJlbW92ZUF0dHJpYnV0ZSgiYXJpYS1oaWRkZW4iKTsoYT1hW2JdLmdldEF0dHJpYnV0ZSgiZGF0YS1zdGF0ZSIpKSYmKE49Ti5jb25jYXQoYS5zcGxpdCgiICIpKSl9ZWxzZSBiPTA7cmV0dXJuIGJ9ZnVuY3Rpb24gUGEoKXt2YXIgYT1mKGMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzPnNlY3Rpb24iKSksDQpiPWEubGVuZ3RoO2lmKGImJiJ1bmRlZmluZWQiIT09dHlwZW9mIG0pe3ZhciBlPXI/MTA6ZC52aWV3RGlzdGFuY2U7aGEmJihlPXI/NjoyKTtLKCkmJihlPU51bWJlci5NQVhfVkFMVUUpO2Zvcih2YXIgZz0wO2c8YjtnKyspe3ZhciBwPWFbZ107dmFyIGg9ZihwLnF1ZXJ5U2VsZWN0b3JBbGwoInNlY3Rpb24iKSkseT1oLmxlbmd0aDt2YXIgaz1NYXRoLmFicygobXx8MCktZyl8fDA7ZC5sb29wJiYoaz1NYXRoLmFicygoKG18fDApLWcpJShiLWUpKXx8MCk7azxlP01iKHApOk5iKHApO2lmKHkpZm9yKHZhciBsPUViKHApLHE9MDtxPHk7cSsrKXt2YXIgdD1oW3FdO3A9Zz09PShtfHwwKT9NYXRoLmFicygobnx8MCktcSk6TWF0aC5hYnMocS1sKTtrK3A8ZT9NYih0KTpOYih0KX19fX1mdW5jdGlvbiBMYigpe2Quc2hvd05vdGVzJiZjLnNwZWFrZXJOb3RlcyYmZyYmIUsoKSYmKGMuc3BlYWtlck5vdGVzLmlubmVySFRNTD1EYSgpfHwiIil9ZnVuY3Rpb24gcGEoKXtkLnByb2dyZXNzJiYNCmMucHJvZ3Jlc3NiYXImJihjLnByb2dyZXNzYmFyLnN0eWxlLndpZHRoPU9iKCkqYy53cmFwcGVyLm9mZnNldFdpZHRoKyJweCIpfWZ1bmN0aW9uIEtiKCl7aWYoZC5zbGlkZU51bWJlciYmYy5zbGlkZU51bWJlcil7dmFyIGE9W10sYj0iaC52Ijsic3RyaW5nIj09PXR5cGVvZiBkLnNsaWRlTnVtYmVyJiYoYj1kLnNsaWRlTnVtYmVyKTtzd2l0Y2goYil7Y2FzZSAiYyI6YS5wdXNoKHdhKCkrMSk7YnJlYWs7Y2FzZSAiYy90IjphLnB1c2god2EoKSsxLCIvIixWYSgpKTticmVhaztjYXNlICJoL3YiOmEucHVzaChtKzEpO1QoKSYmYS5wdXNoKCIvIixuKzEpO2JyZWFrO2RlZmF1bHQ6YS5wdXNoKG0rMSksVCgpJiZhLnB1c2goIi4iLG4rMSl9Yy5zbGlkZU51bWJlci5pbm5lckhUTUw9ZGIoYVswXSxhWzFdLGFbMl0pfX1mdW5jdGlvbiBkYihhLGIsYyl7cmV0dXJuIm51bWJlciIhPT10eXBlb2YgY3x8aXNOYU4oYyk/JzxzcGFuIGNsYXNzPSJzbGlkZS1udW1iZXItYSI+JythKyI8L3NwYW4+IjoNCic8c3BhbiBjbGFzcz0ic2xpZGUtbnVtYmVyLWEiPicrYSsnPC9zcGFuPjxzcGFuIGNsYXNzPSJzbGlkZS1udW1iZXItZGVsaW1pdGVyIj4nK2IrJzwvc3Bhbj48c3BhbiBjbGFzcz0ic2xpZGUtbnVtYmVyLWIiPicrYysiPC9zcGFuPiJ9ZnVuY3Rpb24gVGEoKXt2YXIgYT1HKCksYj1XYSgpO2MuY29udHJvbHNMZWZ0LmNvbmNhdChjLmNvbnRyb2xzUmlnaHQpLmNvbmNhdChjLmNvbnRyb2xzVXApLmNvbmNhdChjLmNvbnRyb2xzRG93bikuY29uY2F0KGMuY29udHJvbHNQcmV2KS5jb25jYXQoYy5jb250cm9sc05leHQpLmZvckVhY2goZnVuY3Rpb24oYSl7YS5jbGFzc0xpc3QucmVtb3ZlKCJlbmFibGVkIik7YS5jbGFzc0xpc3QucmVtb3ZlKCJmcmFnbWVudGVkIik7YS5zZXRBdHRyaWJ1dGUoImRpc2FibGVkIiwiZGlzYWJsZWQiKX0pO2EubGVmdCYmYy5jb250cm9sc0xlZnQuZm9yRWFjaChmdW5jdGlvbihhKXthLmNsYXNzTGlzdC5hZGQoImVuYWJsZWQiKTthLnJlbW92ZUF0dHJpYnV0ZSgiZGlzYWJsZWQiKX0pOw0KYS5yaWdodCYmYy5jb250cm9sc1JpZ2h0LmZvckVhY2goZnVuY3Rpb24oYSl7YS5jbGFzc0xpc3QuYWRkKCJlbmFibGVkIik7YS5yZW1vdmVBdHRyaWJ1dGUoImRpc2FibGVkIil9KTthLnVwJiZjLmNvbnRyb2xzVXAuZm9yRWFjaChmdW5jdGlvbihhKXthLmNsYXNzTGlzdC5hZGQoImVuYWJsZWQiKTthLnJlbW92ZUF0dHJpYnV0ZSgiZGlzYWJsZWQiKX0pO2EuZG93biYmYy5jb250cm9sc0Rvd24uZm9yRWFjaChmdW5jdGlvbihhKXthLmNsYXNzTGlzdC5hZGQoImVuYWJsZWQiKTthLnJlbW92ZUF0dHJpYnV0ZSgiZGlzYWJsZWQiKX0pOyhhLmxlZnR8fGEudXApJiZjLmNvbnRyb2xzUHJldi5mb3JFYWNoKGZ1bmN0aW9uKGEpe2EuY2xhc3NMaXN0LmFkZCgiZW5hYmxlZCIpO2EucmVtb3ZlQXR0cmlidXRlKCJkaXNhYmxlZCIpfSk7KGEucmlnaHR8fGEuZG93bikmJmMuY29udHJvbHNOZXh0LmZvckVhY2goZnVuY3Rpb24oYSl7YS5jbGFzc0xpc3QuYWRkKCJlbmFibGVkIik7YS5yZW1vdmVBdHRyaWJ1dGUoImRpc2FibGVkIil9KTsNCmcmJihiLnByZXYmJmMuY29udHJvbHNQcmV2LmZvckVhY2goZnVuY3Rpb24oYSl7YS5jbGFzc0xpc3QuYWRkKCJmcmFnbWVudGVkIiwiZW5hYmxlZCIpO2EucmVtb3ZlQXR0cmlidXRlKCJkaXNhYmxlZCIpfSksYi5uZXh0JiZjLmNvbnRyb2xzTmV4dC5mb3JFYWNoKGZ1bmN0aW9uKGEpe2EuY2xhc3NMaXN0LmFkZCgiZnJhZ21lbnRlZCIsImVuYWJsZWQiKTthLnJlbW92ZUF0dHJpYnV0ZSgiZGlzYWJsZWQiKX0pLFQoZyk/KGIucHJldiYmYy5jb250cm9sc1VwLmZvckVhY2goZnVuY3Rpb24oYSl7YS5jbGFzc0xpc3QuYWRkKCJmcmFnbWVudGVkIiwiZW5hYmxlZCIpO2EucmVtb3ZlQXR0cmlidXRlKCJkaXNhYmxlZCIpfSksYi5uZXh0JiZjLmNvbnRyb2xzRG93bi5mb3JFYWNoKGZ1bmN0aW9uKGEpe2EuY2xhc3NMaXN0LmFkZCgiZnJhZ21lbnRlZCIsImVuYWJsZWQiKTthLnJlbW92ZUF0dHJpYnV0ZSgiZGlzYWJsZWQiKX0pKTooYi5wcmV2JiZjLmNvbnRyb2xzTGVmdC5mb3JFYWNoKGZ1bmN0aW9uKGEpe2EuY2xhc3NMaXN0LmFkZCgiZnJhZ21lbnRlZCIsDQoiZW5hYmxlZCIpO2EucmVtb3ZlQXR0cmlidXRlKCJkaXNhYmxlZCIpfSksYi5uZXh0JiZjLmNvbnRyb2xzUmlnaHQuZm9yRWFjaChmdW5jdGlvbihhKXthLmNsYXNzTGlzdC5hZGQoImZyYWdtZW50ZWQiLCJlbmFibGVkIik7YS5yZW1vdmVBdHRyaWJ1dGUoImRpc2FibGVkIil9KSkpfWZ1bmN0aW9uIEFhKGEpe3ZhciBiPW51bGwsZT1kLnJ0bD8iZnV0dXJlIjoicGFzdCIsdT1kLnJ0bD8icGFzdCI6ImZ1dHVyZSI7ZihjLmJhY2tncm91bmQuY2hpbGROb2RlcykuZm9yRWFjaChmdW5jdGlvbihjLGQpe2MuY2xhc3NMaXN0LnJlbW92ZSgicGFzdCIpO2MuY2xhc3NMaXN0LnJlbW92ZSgicHJlc2VudCIpO2MuY2xhc3NMaXN0LnJlbW92ZSgiZnV0dXJlIik7ZDxtP2MuY2xhc3NMaXN0LmFkZChlKTpkPm0/Yy5jbGFzc0xpc3QuYWRkKHUpOihjLmNsYXNzTGlzdC5hZGQoInByZXNlbnQiKSxiPWMpOyhhfHxkPT09bSkmJmYoYy5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGUtYmFja2dyb3VuZCIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEsDQpjKXthLmNsYXNzTGlzdC5yZW1vdmUoInBhc3QiKTthLmNsYXNzTGlzdC5yZW1vdmUoInByZXNlbnQiKTthLmNsYXNzTGlzdC5yZW1vdmUoImZ1dHVyZSIpO2M8bj9hLmNsYXNzTGlzdC5hZGQoInBhc3QiKTpjPm4/YS5jbGFzc0xpc3QuYWRkKCJmdXR1cmUiKTooYS5jbGFzc0xpc3QuYWRkKCJwcmVzZW50IiksZD09PW0mJihiPWEpKX0pfSk7YWEmJlNhKGFhKTtpZihiKXt1YShiKTt2YXIgcD1iLnN0eWxlLmJhY2tncm91bmRJbWFnZXx8IiI7L1wuZ2lmL2kudGVzdChwKSYmKGIuc3R5bGUuYmFja2dyb3VuZEltYWdlPSIiLHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGIpLm9wYWNpdHksYi5zdHlsZS5iYWNrZ3JvdW5kSW1hZ2U9cCk7dmFyIHA9YWE/YWEuZ2V0QXR0cmlidXRlKCJkYXRhLWJhY2tncm91bmQtaGFzaCIpOm51bGwsaD1iLmdldEF0dHJpYnV0ZSgiZGF0YS1iYWNrZ3JvdW5kLWhhc2giKTtoJiZoPT09cCYmYiE9PWFhJiZjLmJhY2tncm91bmQuY2xhc3NMaXN0LmFkZCgibm8tdHJhbnNpdGlvbiIpOw0KYWE9Yn1nJiZbImhhcy1saWdodC1iYWNrZ3JvdW5kIiwiaGFzLWRhcmstYmFja2dyb3VuZCJdLmZvckVhY2goZnVuY3Rpb24oYSl7Zy5jbGFzc0xpc3QuY29udGFpbnMoYSk/Yy53cmFwcGVyLmNsYXNzTGlzdC5hZGQoYSk6Yy53cmFwcGVyLmNsYXNzTGlzdC5yZW1vdmUoYSl9KTtzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7Yy5iYWNrZ3JvdW5kLmNsYXNzTGlzdC5yZW1vdmUoIm5vLXRyYW5zaXRpb24iKX0sMSl9ZnVuY3Rpb24gQ2IoKXtpZihkLnBhcmFsbGF4QmFja2dyb3VuZEltYWdlKXt2YXIgYT1jLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uIiksYj1jLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uLnByZXNlbnQ+c2VjdGlvbiIpLGU9Yy5iYWNrZ3JvdW5kLnN0eWxlLmJhY2tncm91bmRTaXplLnNwbGl0KCIgIik7aWYoMT09PWUubGVuZ3RoKXZhciBmPWU9cGFyc2VJbnQoZVswXSwxMCk7ZWxzZSBmPXBhcnNlSW50KGVbMF0sDQoxMCksZT1wYXJzZUludChlWzFdLDEwKTt2YXIgZz1jLmJhY2tncm91bmQub2Zmc2V0V2lkdGgsYT1hLmxlbmd0aDtmPSgibnVtYmVyIj09PXR5cGVvZiBkLnBhcmFsbGF4QmFja2dyb3VuZEhvcml6b250YWw/ZC5wYXJhbGxheEJhY2tncm91bmRIb3Jpem9udGFsOjE8YT8oZi1nKS8oYS0xKTowKSptKi0xO2E9Yy5iYWNrZ3JvdW5kLm9mZnNldEhlaWdodDtiPWIubGVuZ3RoO2U9Im51bWJlciI9PT10eXBlb2YgZC5wYXJhbGxheEJhY2tncm91bmRWZXJ0aWNhbD9kLnBhcmFsbGF4QmFja2dyb3VuZFZlcnRpY2FsOihlLWEpLyhiLTEpO2MuYmFja2dyb3VuZC5zdHlsZS5iYWNrZ3JvdW5kUG9zaXRpb249ZisicHggIistKDA8Yj9lKm46MCkrInB4In19ZnVuY3Rpb24gTWIoYSl7YS5zdHlsZS5kaXNwbGF5PWQuZGlzcGxheTtmKGEucXVlcnlTZWxlY3RvckFsbCgiaW1nW2RhdGEtc3JjXSwgdmlkZW9bZGF0YS1zcmNdLCBhdWRpb1tkYXRhLXNyY10iKSkuZm9yRWFjaChmdW5jdGlvbihhKXthLnNldEF0dHJpYnV0ZSgic3JjIiwNCmEuZ2V0QXR0cmlidXRlKCJkYXRhLXNyYyIpKTthLnJlbW92ZUF0dHJpYnV0ZSgiZGF0YS1zcmMiKX0pO2YoYS5xdWVyeVNlbGVjdG9yQWxsKCJ2aWRlbywgYXVkaW8iKSkuZm9yRWFjaChmdW5jdGlvbihhKXt2YXIgYj0wO2YoYS5xdWVyeVNlbGVjdG9yQWxsKCJzb3VyY2VbZGF0YS1zcmNdIikpLmZvckVhY2goZnVuY3Rpb24oYSl7YS5zZXRBdHRyaWJ1dGUoInNyYyIsYS5nZXRBdHRyaWJ1dGUoImRhdGEtc3JjIikpO2EucmVtb3ZlQXR0cmlidXRlKCJkYXRhLXNyYyIpO2IrPTF9KTswPGImJmEubG9hZCgpfSk7dmFyIGI9eGEoYSk7aWYoYj1YYShiLmgsYi52KSlpZihiLnN0eWxlLmRpc3BsYXk9ImJsb2NrIiwhMT09PWIuaGFzQXR0cmlidXRlKCJkYXRhLWxvYWRlZCIpKXtiLnNldEF0dHJpYnV0ZSgiZGF0YS1sb2FkZWQiLCJ0cnVlIik7dmFyIGM9YS5nZXRBdHRyaWJ1dGUoImRhdGEtYmFja2dyb3VuZC1pbWFnZSIpLGc9YS5nZXRBdHRyaWJ1dGUoImRhdGEtYmFja2dyb3VuZC12aWRlbyIpLA0KcD1hLmhhc0F0dHJpYnV0ZSgiZGF0YS1iYWNrZ3JvdW5kLXZpZGVvLWxvb3AiKSxoPWEuaGFzQXR0cmlidXRlKCJkYXRhLWJhY2tncm91bmQtdmlkZW8tbXV0ZWQiKTthPWEuZ2V0QXR0cmlidXRlKCJkYXRhLWJhY2tncm91bmQtaWZyYW1lIik7aWYoYyliLnN0eWxlLmJhY2tncm91bmRJbWFnZT0idXJsKCIrYysiKSI7ZWxzZSBpZihnJiYhRmEoKSl7dmFyIGs9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgidmlkZW8iKTtwJiZrLnNldEF0dHJpYnV0ZSgibG9vcCIsIiIpO2gmJihrLm11dGVkPSEwKTtoYSYmKGsubXV0ZWQ9ITAsay5hdXRvcGxheT0hMCxrLnNldEF0dHJpYnV0ZSgicGxheXNpbmxpbmUiLCIiKSk7Zy5zcGxpdCgiLCIpLmZvckVhY2goZnVuY3Rpb24oYSl7ay5pbm5lckhUTUwrPSc8c291cmNlIHNyYz0iJythKyciPid9KTtiLmFwcGVuZENoaWxkKGspfWVsc2UgYSYmKGM9ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiaWZyYW1lIiksYy5zZXRBdHRyaWJ1dGUoImFsbG93ZnVsbHNjcmVlbiIsDQoiIiksYy5zZXRBdHRyaWJ1dGUoIm1vemFsbG93ZnVsbHNjcmVlbiIsIiIpLGMuc2V0QXR0cmlidXRlKCJ3ZWJraXRhbGxvd2Z1bGxzY3JlZW4iLCIiKSwvYXV0b3BsYXk9KDF8dHJ1ZXx5ZXMpL2dpLnRlc3QoYSk/Yy5zZXRBdHRyaWJ1dGUoImRhdGEtc3JjIixhKTpjLnNldEF0dHJpYnV0ZSgic3JjIixhKSxjLnN0eWxlLndpZHRoPSIxMDAlIixjLnN0eWxlLmhlaWdodD0iMTAwJSIsYy5zdHlsZS5tYXhIZWlnaHQ9IjEwMCUiLGMuc3R5bGUubWF4V2lkdGg9IjEwMCUiLGIuYXBwZW5kQ2hpbGQoYykpfX1mdW5jdGlvbiBOYihhKXthLnN0eWxlLmRpc3BsYXk9Im5vbmUiO2E9eGEoYSk7aWYoYT1YYShhLmgsYS52KSlhLnN0eWxlLmRpc3BsYXk9Im5vbmUifWZ1bmN0aW9uIEcoKXt2YXIgYT1jLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uIiksYj1jLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uLnByZXNlbnQ+c2VjdGlvbiIpLGE9DQp7bGVmdDowPG18fGQubG9vcCxyaWdodDptPGEubGVuZ3RoLTF8fGQubG9vcCx1cDowPG4sZG93bjpuPGIubGVuZ3RoLTF9O2QucnRsJiYoYj1hLmxlZnQsYS5sZWZ0PWEucmlnaHQsYS5yaWdodD1iKTtyZXR1cm4gYX1mdW5jdGlvbiBXYSgpe2lmKGcmJmQuZnJhZ21lbnRzKXt2YXIgYT1nLnF1ZXJ5U2VsZWN0b3JBbGwoIi5mcmFnbWVudCIpLGI9Zy5xdWVyeVNlbGVjdG9yQWxsKCIuZnJhZ21lbnQ6bm90KC52aXNpYmxlKSIpO3JldHVybntwcmV2OjA8YS5sZW5ndGgtYi5sZW5ndGgsbmV4dDohIWIubGVuZ3RofX1yZXR1cm57cHJldjohMSxuZXh0OiExfX1mdW5jdGlvbiBmYygpe3ZhciBhPWZ1bmN0aW9uKGEsZSxkKXtmKGMuc2xpZGVzLnF1ZXJ5U2VsZWN0b3JBbGwoImlmcmFtZVsiK2ErJyo9IicrZSsnIl0nKSkuZm9yRWFjaChmdW5jdGlvbihiKXt2YXIgYz1iLmdldEF0dHJpYnV0ZShhKTtjJiYtMT09PWMuaW5kZXhPZihkKSYmYi5zZXRBdHRyaWJ1dGUoYSxjKygvXD8vLnRlc3QoYyk/DQoiJiI6Ij8iKStkKX0pfTthKCJzcmMiLCJ5b3V0dWJlLmNvbS9lbWJlZC8iLCJlbmFibGVqc2FwaT0xIik7YSgiZGF0YS1zcmMiLCJ5b3V0dWJlLmNvbS9lbWJlZC8iLCJlbmFibGVqc2FwaT0xIik7YSgic3JjIiwicGxheWVyLnZpbWVvLmNvbS8iLCJhcGk9MSIpO2EoImRhdGEtc3JjIiwicGxheWVyLnZpbWVvLmNvbS8iLCJhcGk9MSIpfWZ1bmN0aW9uIHVhKGEpe2EmJiFGYSgpJiYoZihhLnF1ZXJ5U2VsZWN0b3JBbGwoJ2ltZ1tzcmMkPSIuZ2lmIl0nKSkuZm9yRWFjaChmdW5jdGlvbihhKXthLnNldEF0dHJpYnV0ZSgic3JjIixhLmdldEF0dHJpYnV0ZSgic3JjIikpfSksZihhLnF1ZXJ5U2VsZWN0b3JBbGwoInZpZGVvLCBhdWRpbyIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEpe2lmKCFCKGEsIi5mcmFnbWVudCIpfHxCKGEsIi5mcmFnbWVudC52aXNpYmxlIikpe3ZhciBiPWQuYXV0b1BsYXlNZWRpYTsiYm9vbGVhbiIhPT10eXBlb2YgYiYmKGI9YS5oYXNBdHRyaWJ1dGUoImRhdGEtYXV0b3BsYXkiKXx8DQohIUIoYSwiLnNsaWRlLWJhY2tncm91bmQiKSk7YiYmImZ1bmN0aW9uIj09PXR5cGVvZiBhLnBsYXkmJigxPGEucmVhZHlTdGF0ZT95YSh7dGFyZ2V0OmF9KTooYS5yZW1vdmVFdmVudExpc3RlbmVyKCJsb2FkZWRkYXRhIix5YSksYS5hZGRFdmVudExpc3RlbmVyKCJsb2FkZWRkYXRhIix5YSkpKX19KSxmKGEucXVlcnlTZWxlY3RvckFsbCgiaWZyYW1lW3NyY10iKSkuZm9yRWFjaChmdW5jdGlvbihhKXtCKGEsIi5mcmFnbWVudCIpJiYhQihhLCIuZnJhZ21lbnQudmlzaWJsZSIpfHx6YSh7dGFyZ2V0OmF9KX0pLGYoYS5xdWVyeVNlbGVjdG9yQWxsKCJpZnJhbWVbZGF0YS1zcmNdIikpLmZvckVhY2goZnVuY3Rpb24oYSl7QihhLCIuZnJhZ21lbnQiKSYmIUIoYSwiLmZyYWdtZW50LnZpc2libGUiKXx8YS5nZXRBdHRyaWJ1dGUoInNyYyIpPT09YS5nZXRBdHRyaWJ1dGUoImRhdGEtc3JjIil8fChhLnJlbW92ZUV2ZW50TGlzdGVuZXIoImxvYWQiLHphKSxhLmFkZEV2ZW50TGlzdGVuZXIoImxvYWQiLA0KemEpLGEuc2V0QXR0cmlidXRlKCJzcmMiLGEuZ2V0QXR0cmlidXRlKCJkYXRhLXNyYyIpKSl9KSl9ZnVuY3Rpb24geWEoYSl7dmFyIGI9ISFCKGEudGFyZ2V0LCJodG1sIiksYz0hIUIoYS50YXJnZXQsIi5wcmVzZW50Iik7YiYmYyYmKGEudGFyZ2V0LmN1cnJlbnRUaW1lPTAsYS50YXJnZXQucGxheSgpKTthLnRhcmdldC5yZW1vdmVFdmVudExpc3RlbmVyKCJsb2FkZWRkYXRhIix5YSl9ZnVuY3Rpb24gemEoYSl7dmFyIGI9YS50YXJnZXQ7aWYoYiYmYi5jb250ZW50V2luZG93KXt2YXIgYz0hIUIoYS50YXJnZXQsImh0bWwiKTthPSEhQihhLnRhcmdldCwiLnByZXNlbnQiKTtjJiZhJiYoYz1kLmF1dG9QbGF5TWVkaWEsImJvb2xlYW4iIT09dHlwZW9mIGMmJihjPWIuaGFzQXR0cmlidXRlKCJkYXRhLWF1dG9wbGF5Iil8fCEhQihiLCIuc2xpZGUtYmFja2dyb3VuZCIpKSwveW91dHViZVwuY29tXC9lbWJlZFwvLy50ZXN0KGIuZ2V0QXR0cmlidXRlKCJzcmMiKSkmJmM/Yi5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCd7ImV2ZW50IjoiY29tbWFuZCIsImZ1bmMiOiJwbGF5VmlkZW8iLCJhcmdzIjoiIn0nLA0KIioiKTovcGxheWVyXC52aW1lb1wuY29tXC8vLnRlc3QoYi5nZXRBdHRyaWJ1dGUoInNyYyIpKSYmYz9iLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoJ3sibWV0aG9kIjoicGxheSJ9JywiKiIpOmIuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSgic2xpZGU6c3RhcnQiLCIqIikpfX1mdW5jdGlvbiBTYShhKXthJiZhLnBhcmVudE5vZGUmJihmKGEucXVlcnlTZWxlY3RvckFsbCgidmlkZW8sIGF1ZGlvIikpLmZvckVhY2goZnVuY3Rpb24oYSl7YS5oYXNBdHRyaWJ1dGUoImRhdGEtaWdub3JlIil8fCJmdW5jdGlvbiIhPT10eXBlb2YgYS5wYXVzZXx8KGEuc2V0QXR0cmlidXRlKCJkYXRhLXBhdXNlZC1ieS1yZXZlYWwiLCIiKSxhLnBhdXNlKCkpfSksZihhLnF1ZXJ5U2VsZWN0b3JBbGwoImlmcmFtZSIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEpe2EuY29udGVudFdpbmRvdyYmYS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKCJzbGlkZTpzdG9wIiwiKiIpO2EucmVtb3ZlRXZlbnRMaXN0ZW5lcigibG9hZCIsDQp6YSl9KSxmKGEucXVlcnlTZWxlY3RvckFsbCgnaWZyYW1lW3NyYyo9InlvdXR1YmUuY29tL2VtYmVkLyJdJykpLmZvckVhY2goZnVuY3Rpb24oYSl7IWEuaGFzQXR0cmlidXRlKCJkYXRhLWlnbm9yZSIpJiZhLmNvbnRlbnRXaW5kb3cmJiJmdW5jdGlvbiI9PT10eXBlb2YgYS5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlJiZhLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UoJ3siZXZlbnQiOiJjb21tYW5kIiwiZnVuYyI6InBhdXNlVmlkZW8iLCJhcmdzIjoiIn0nLCIqIil9KSxmKGEucXVlcnlTZWxlY3RvckFsbCgnaWZyYW1lW3NyYyo9InBsYXllci52aW1lby5jb20vIl0nKSkuZm9yRWFjaChmdW5jdGlvbihhKXshYS5oYXNBdHRyaWJ1dGUoImRhdGEtaWdub3JlIikmJmEuY29udGVudFdpbmRvdyYmImZ1bmN0aW9uIj09PXR5cGVvZiBhLmNvbnRlbnRXaW5kb3cucG9zdE1lc3NhZ2UmJmEuY29udGVudFdpbmRvdy5wb3N0TWVzc2FnZSgneyJtZXRob2QiOiJwYXVzZSJ9JywiKiIpfSksDQpmKGEucXVlcnlTZWxlY3RvckFsbCgiaWZyYW1lW2RhdGEtc3JjXSIpKS5mb3JFYWNoKGZ1bmN0aW9uKGEpe2Euc2V0QXR0cmlidXRlKCJzcmMiLCJhYm91dDpibGFuayIpO2EucmVtb3ZlQXR0cmlidXRlKCJzcmMiKX0pKX1mdW5jdGlvbiB3YSgpe3ZhciBhPWYoYy53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIi5zbGlkZXM+c2VjdGlvbiIpKSxiPTAsZT0wO2E6Zm9yKDtlPGEubGVuZ3RoO2UrKyl7Zm9yKHZhciBkPWFbZV0sZz1mKGQucXVlcnlTZWxlY3RvckFsbCgic2VjdGlvbiIpKSxoPTA7aDxnLmxlbmd0aDtoKyspe2lmKGdbaF0uY2xhc3NMaXN0LmNvbnRhaW5zKCJwcmVzZW50IikpYnJlYWsgYTtiKyt9aWYoZC5jbGFzc0xpc3QuY29udGFpbnMoInByZXNlbnQiKSlicmVhazshMT09PWQuY2xhc3NMaXN0LmNvbnRhaW5zKCJzdGFjayIpJiZiKyt9cmV0dXJuIGJ9ZnVuY3Rpb24gT2IoKXt2YXIgYT1WYSgpLGI9d2EoKTtpZihnKXt2YXIgYz1nLnF1ZXJ5U2VsZWN0b3JBbGwoIi5mcmFnbWVudCIpOw0KaWYoMDxjLmxlbmd0aCl2YXIgZD1nLnF1ZXJ5U2VsZWN0b3JBbGwoIi5mcmFnbWVudC52aXNpYmxlIiksYj1iK2QubGVuZ3RoL2MubGVuZ3RoKi45fXJldHVybiBiLyhhLTEpfWZ1bmN0aW9uIEZhKCl7cmV0dXJuISF3aW5kb3cubG9jYXRpb24uc2VhcmNoLm1hdGNoKC9yZWNlaXZlci9naSl9ZnVuY3Rpb24gWmEoKXt2YXIgYT13aW5kb3cubG9jYXRpb24uaGFzaCxiPWEuc2xpY2UoMikuc3BsaXQoIi8iKSxhPWEucmVwbGFjZSgvI3xcLy9naSwiIik7aWYoaXNOYU4ocGFyc2VJbnQoYlswXSwxMCkpJiZhLmxlbmd0aCl7dmFyIGM7L15bYS16QS1aXVtcdzouLV0qJC8udGVzdChhKSYmKGM9ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYSkpO2M/KGI9RC5nZXRJbmRpY2VzKGMpLHcoYi5oLGIudikpOncobXx8MCxufHwwKX1lbHNlIGM9cGFyc2VJbnQoYlswXSwxMCl8fDAsYj1wYXJzZUludChiWzFdLDEwKXx8MCxjPT09bSYmYj09PW58fHcoYyxiKX1mdW5jdGlvbiBVYShhKXtpZihkLmhpc3RvcnkpaWYoY2xlYXJUaW1lb3V0KFBiKSwNCiJudW1iZXIiPT09dHlwZW9mIGEpUGI9c2V0VGltZW91dChVYSxhKTtlbHNlIGlmKGcpe2E9Ii8iO3ZhciBiPWcuZ2V0QXR0cmlidXRlKCJpZCIpO2ImJihiPWIucmVwbGFjZSgvW15hLXpBLVowLTlcLVxfXDpcLl0vZywiIikpO2lmKCJzdHJpbmciPT09dHlwZW9mIGImJmIubGVuZ3RoKWE9Ii8iK2I7ZWxzZXtpZigwPG18fDA8bilhKz1tOzA8biYmKGErPSIvIituKX13aW5kb3cubG9jYXRpb24uaGFzaD1hfX1mdW5jdGlvbiB4YShhKXt2YXIgYj1tLGU9bjtpZihhKXt2YXIgZD1UKGEpLGI9ZD9hLnBhcmVudE5vZGU6YSxlPWYoYy53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIi5zbGlkZXM+c2VjdGlvbiIpKSxiPU1hdGgubWF4KGUuaW5kZXhPZihiKSwwKSxlPXZvaWQgMDtkJiYoZT1NYXRoLm1heChmKGEucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yQWxsKCJzZWN0aW9uIikpLmluZGV4T2YoYSksMCkpfWlmKCFhJiZnJiYwPGcucXVlcnlTZWxlY3RvckFsbCgiLmZyYWdtZW50IikubGVuZ3RoKXZhciBrPQ0KKGE9Zy5xdWVyeVNlbGVjdG9yKCIuY3VycmVudC1mcmFnbWVudCIpKSYmYS5oYXNBdHRyaWJ1dGUoImRhdGEtZnJhZ21lbnQtaW5kZXgiKT9wYXJzZUludChhLmdldEF0dHJpYnV0ZSgiZGF0YS1mcmFnbWVudC1pbmRleCIpLDEwKTpnLnF1ZXJ5U2VsZWN0b3JBbGwoIi5mcmFnbWVudC52aXNpYmxlIikubGVuZ3RoLTE7cmV0dXJue2g6Yix2OmUsZjprfX1mdW5jdGlvbiBRYigpe3JldHVybiBmKGMud3JhcHBlci5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGVzIHNlY3Rpb246bm90KC5zdGFjaykiKSl9ZnVuY3Rpb24gVmEoKXtyZXR1cm4gUWIoKS5sZW5ndGh9ZnVuY3Rpb24gUmIoYSxiKXt2YXIgZT0oYT1jLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uIilbYV0pJiZhLnF1ZXJ5U2VsZWN0b3JBbGwoInNlY3Rpb24iKTtyZXR1cm4gZSYmZS5sZW5ndGgmJiJudW1iZXIiPT09dHlwZW9mIGI/ZT9lW2JdOnZvaWQgMDphfWZ1bmN0aW9uIFhhKGEsYil7aWYoSygpKXtpZihiPQ0KUmIoYSxiKSlyZXR1cm4gYi5zbGlkZUJhY2tncm91bmRFbGVtZW50fWVsc2V7dmFyIGU9KGE9Yy53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIi5iYWNrZ3JvdW5kcz4uc2xpZGUtYmFja2dyb3VuZCIpW2FdKSYmYS5xdWVyeVNlbGVjdG9yQWxsKCIuc2xpZGUtYmFja2dyb3VuZCIpO3JldHVybiBlJiZlLmxlbmd0aCYmIm51bWJlciI9PT10eXBlb2YgYj9lP2VbYl06dm9pZCAwOmF9fWZ1bmN0aW9uIERhKGEpe2E9YXx8ZztyZXR1cm4gYS5oYXNBdHRyaWJ1dGUoImRhdGEtbm90ZXMiKT9hLmdldEF0dHJpYnV0ZSgiZGF0YS1ub3RlcyIpOihhPWEucXVlcnlTZWxlY3RvcigiYXNpZGUubm90ZXMiKSk/YS5pbm5lckhUTUw6bnVsbH1mdW5jdGlvbiB5Yigpe3ZhciBhPXhhKCk7cmV0dXJue2luZGV4aDphLmgsaW5kZXh2OmEudixpbmRleGY6YS5mLHBhdXNlZDpaKCksb3ZlcnZpZXc6cn19ZnVuY3Rpb24gdmEoYSl7YT1mKGEpO3ZhciBiPVtdLGM9W10sZD1bXTthLmZvckVhY2goZnVuY3Rpb24oYSwNCmQpe2EuaGFzQXR0cmlidXRlKCJkYXRhLWZyYWdtZW50LWluZGV4Iik/KGQ9cGFyc2VJbnQoYS5nZXRBdHRyaWJ1dGUoImRhdGEtZnJhZ21lbnQtaW5kZXgiKSwxMCksYltkXXx8KGJbZF09W10pLGJbZF0ucHVzaChhKSk6Yy5wdXNoKFthXSl9KTt2YXIgYj1iLmNvbmNhdChjKSxnPTA7Yi5mb3JFYWNoKGZ1bmN0aW9uKGEpe2EuZm9yRWFjaChmdW5jdGlvbihhKXtkLnB1c2goYSk7YS5zZXRBdHRyaWJ1dGUoImRhdGEtZnJhZ21lbnQtaW5kZXgiLGcpfSk7ZysrfSk7cmV0dXJuIGR9ZnVuY3Rpb24gdGEoYSxiKXtpZihnJiZkLmZyYWdtZW50cyl7dmFyIGU9dmEoZy5xdWVyeVNlbGVjdG9yQWxsKCIuZnJhZ21lbnQiKSk7aWYoZS5sZW5ndGgpe2lmKCJudW1iZXIiIT09dHlwZW9mIGEpe3ZhciBrPXZhKGcucXVlcnlTZWxlY3RvckFsbCgiLmZyYWdtZW50LnZpc2libGUiKSkucG9wKCk7YT1rP3BhcnNlSW50KGsuZ2V0QXR0cmlidXRlKCJkYXRhLWZyYWdtZW50LWluZGV4Iil8fDAsMTApOg0KLTF9Im51bWJlciI9PT10eXBlb2YgYiYmKGErPWIpO3ZhciBsPVtdLGg9W107ZihlKS5mb3JFYWNoKGZ1bmN0aW9uKGIsZCl7Yi5oYXNBdHRyaWJ1dGUoImRhdGEtZnJhZ21lbnQtaW5kZXgiKSYmKGQ9cGFyc2VJbnQoYi5nZXRBdHRyaWJ1dGUoImRhdGEtZnJhZ21lbnQtaW5kZXgiKSwxMCkpO2Q8PWE/KGIuY2xhc3NMaXN0LmNvbnRhaW5zKCJ2aXNpYmxlIil8fGwucHVzaChiKSxiLmNsYXNzTGlzdC5hZGQoInZpc2libGUiKSxiLmNsYXNzTGlzdC5yZW1vdmUoImN1cnJlbnQtZnJhZ21lbnQiKSxjLnN0YXR1c0Rpdi50ZXh0Q29udGVudD1PKGIpLGQ9PT1hJiYoYi5jbGFzc0xpc3QuYWRkKCJjdXJyZW50LWZyYWdtZW50IiksdWEoYikpKTooYi5jbGFzc0xpc3QuY29udGFpbnMoInZpc2libGUiKSYmaC5wdXNoKGIpLGIuY2xhc3NMaXN0LnJlbW92ZSgidmlzaWJsZSIpLGIuY2xhc3NMaXN0LnJlbW92ZSgiY3VycmVudC1mcmFnbWVudCIpKX0pO2gubGVuZ3RoJiZBKCJmcmFnbWVudGhpZGRlbiIsDQp7ZnJhZ21lbnQ6aFswXSxmcmFnbWVudHM6aH0pO2wubGVuZ3RoJiZBKCJmcmFnbWVudHNob3duIix7ZnJhZ21lbnQ6bFswXSxmcmFnbWVudHM6bH0pO1RhKCk7cGEoKTtyZXR1cm4hKCFsLmxlbmd0aCYmIWgubGVuZ3RoKX19cmV0dXJuITF9ZnVuY3Rpb24gaWEoKXtyZXR1cm4gdGEobnVsbCwxKX1mdW5jdGlvbiBqYSgpe3JldHVybiB0YShudWxsLC0xKX1mdW5jdGlvbiBTKCl7Y2xlYXJUaW1lb3V0KEkpO0k9LTE7aWYoZyl7dmFyIGE9Zy5xdWVyeVNlbGVjdG9yKCIuY3VycmVudC1mcmFnbWVudCIpO2F8fChhPWcucXVlcnlTZWxlY3RvcigiLmZyYWdtZW50IikpO3ZhciBhPWE/YS5nZXRBdHRyaWJ1dGUoImRhdGEtYXV0b3NsaWRlIik6bnVsbCxiPWcucGFyZW50Tm9kZT9nLnBhcmVudE5vZGUuZ2V0QXR0cmlidXRlKCJkYXRhLWF1dG9zbGlkZSIpOm51bGwsYz1nLmdldEF0dHJpYnV0ZSgiZGF0YS1hdXRvc2xpZGUiKTtDPWE/cGFyc2VJbnQoYSwxMCk6Yz9wYXJzZUludChjLDEwKToNCmI/cGFyc2VJbnQoYiwxMCk6ZC5hdXRvU2xpZGU7MD09PWcucXVlcnlTZWxlY3RvckFsbCgiLmZyYWdtZW50IikubGVuZ3RoJiZmKGcucXVlcnlTZWxlY3RvckFsbCgidmlkZW8sIGF1ZGlvIikpLmZvckVhY2goZnVuY3Rpb24oYSl7YS5oYXNBdHRyaWJ1dGUoImRhdGEtYXV0b3BsYXkiKSYmQyYmMUUzKmEuZHVyYXRpb24vYS5wbGF5YmFja1JhdGU+QyYmKEM9MUUzKmEuZHVyYXRpb24vYS5wbGF5YmFja1JhdGUrMUUzKX0pOyFDfHxFfHxaKCl8fHJ8fEQuaXNMYXN0U2xpZGUoKSYmIVdhKCkubmV4dCYmITAhPT1kLmxvb3B8fChJPXNldFRpbWVvdXQoZnVuY3Rpb24oKXsiZnVuY3Rpb24iPT09dHlwZW9mIGQuYXV0b1NsaWRlTWV0aG9kP2QuYXV0b1NsaWRlTWV0aG9kKCk6VSgpO1MoKX0sQyksamI9RGF0ZS5ub3coKSk7SCYmSC5zZXRQbGF5aW5nKC0xIT09SSl9fWZ1bmN0aW9uIHNhKCl7QyYmIUUmJihFPSEwLEEoImF1dG9zbGlkZXBhdXNlZCIpLGNsZWFyVGltZW91dChJKSxIJiZILnNldFBsYXlpbmcoITEpKX0NCmZ1bmN0aW9uIHJhKCl7QyYmRSYmKEU9ITEsQSgiYXV0b3NsaWRlcmVzdW1lZCIpLFMoKSl9ZnVuY3Rpb24gYmEoKXtkLnJ0bD8ocnx8ITE9PT1pYSgpKSYmRygpLmxlZnQmJncobSsxKToocnx8ITE9PT1qYSgpKSYmRygpLmxlZnQmJncobS0xKX1mdW5jdGlvbiBjYSgpe2QucnRsPyhyfHwhMT09PWphKCkpJiZHKCkucmlnaHQmJncobS0xKToocnx8ITE9PT1pYSgpKSYmRygpLnJpZ2h0JiZ3KG0rMSl9ZnVuY3Rpb24gZGEoKXsocnx8ITE9PT1qYSgpKSYmRygpLnVwJiZ3KG0sbi0xKX1mdW5jdGlvbiBlYSgpeyhyfHwhMT09PWlhKCkpJiZHKCkuZG93biYmdyhtLG4rMSl9ZnVuY3Rpb24gZmEoKXtpZighMT09PWphKCkpaWYoRygpLnVwKWRhKCk7ZWxzZXt2YXIgYTtpZihhPWQucnRsP2YoYy53cmFwcGVyLnF1ZXJ5U2VsZWN0b3JBbGwoIi5zbGlkZXM+c2VjdGlvbi5mdXR1cmUiKSkucG9wKCk6ZihjLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uLnBhc3QiKSkucG9wKCkpYT0NCmEucXVlcnlTZWxlY3RvckFsbCgic2VjdGlvbiIpLmxlbmd0aC0xfHx2b2lkIDAsdyhtLTEsYSl9fWZ1bmN0aW9uIFUoKXshMT09PWlhKCkmJihHKCkuZG93bj9lYSgpOmQucnRsP2JhKCk6Y2EoKSl9ZnVuY3Rpb24gU2IoYSl7Zm9yKDthJiYiZnVuY3Rpb24iPT09dHlwZW9mIGEuaGFzQXR0cmlidXRlOyl7aWYoYS5oYXNBdHRyaWJ1dGUoImRhdGEtcHJldmVudC1zd2lwZSIpKXJldHVybiEwO2E9YS5wYXJlbnROb2RlfXJldHVybiExfWZ1bmN0aW9uIEooYSl7ZC5hdXRvU2xpZGVTdG9wcGFibGUmJnNhKCl9ZnVuY3Rpb24gb2IoYSl7YS5zaGlmdEtleSYmNjM9PT1hLmNoYXJDb2RlJiZBYigpfWZ1bmN0aW9uIEthKGEpe2lmKCJmdW5jdGlvbiI9PT10eXBlb2YgZC5rZXlib2FyZENvbmRpdGlvbiYmITE9PT1kLmtleWJvYXJkQ29uZGl0aW9uKCkpcmV0dXJuITA7dmFyIGI9RTtKKGEpO3ZhciBlPWRvY3VtZW50LmFjdGl2ZUVsZW1lbnQmJiJpbmhlcml0IiE9PWRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY29udGVudEVkaXRhYmxlLA0KZj1kb2N1bWVudC5hY3RpdmVFbGVtZW50JiZkb2N1bWVudC5hY3RpdmVFbGVtZW50LnRhZ05hbWUmJi9pbnB1dHx0ZXh0YXJlYS9pLnRlc3QoZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50YWdOYW1lKSxnPWRvY3VtZW50LmFjdGl2ZUVsZW1lbnQmJmRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuY2xhc3NOYW1lJiYvc3BlYWtlci1ub3Rlcy9pLnRlc3QoZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5jbGFzc05hbWUpO2lmKCEoZXx8Znx8Z3x8YS5zaGlmdEtleSYmMzIhPT1hLmtleUNvZGV8fGEuYWx0S2V5fHxhLmN0cmxLZXl8fGEubWV0YUtleSkpe3ZhciBlPVs2Niw4NiwxOTAsMTkxXSxoO2lmKCJvYmplY3QiPT09dHlwZW9mIGQua2V5Ym9hcmQpZm9yKGggaW4gZC5rZXlib2FyZCkidG9nZ2xlUGF1c2UiPT09ZC5rZXlib2FyZFtoXSYmZS5wdXNoKHBhcnNlSW50KGgsMTApKTtpZihaKCkmJi0xPT09ZS5pbmRleE9mKGEua2V5Q29kZSkpcmV0dXJuITE7ZT0hMTtpZigib2JqZWN0Ij09PXR5cGVvZiBkLmtleWJvYXJkKWZvcihoIGluIGQua2V5Ym9hcmQpcGFyc2VJbnQoaCwNCjEwKT09PWEua2V5Q29kZSYmKGU9ZC5rZXlib2FyZFtoXSwiZnVuY3Rpb24iPT09dHlwZW9mIGU/ZS5hcHBseShudWxsLFthXSk6InN0cmluZyI9PT10eXBlb2YgZSYmImZ1bmN0aW9uIj09PXR5cGVvZiBEW2VdJiZEW2VdLmNhbGwoKSxlPSEwKTtpZighMT09PWUpc3dpdGNoKGU9ITAsYS5rZXlDb2RlKXtjYXNlIDgwOmNhc2UgMzM6ZmEoKTticmVhaztjYXNlIDc4OmNhc2UgMzQ6VSgpO2JyZWFrO2Nhc2UgNzI6Y2FzZSAzNzpiYSgpO2JyZWFrO2Nhc2UgNzY6Y2FzZSAzOTpjYSgpO2JyZWFrO2Nhc2UgNzU6Y2FzZSAzODpkYSgpO2JyZWFrO2Nhc2UgNzQ6Y2FzZSA0MDplYSgpO2JyZWFrO2Nhc2UgMzY6dygwKTticmVhaztjYXNlIDM1OncoTnVtYmVyLk1BWF9WQUxVRSk7YnJlYWs7Y2FzZSAzMjpyP1koKTphLnNoaWZ0S2V5P2ZhKCk6VSgpO2JyZWFrO2Nhc2UgMTM6cj9ZKCk6ZT0hMTticmVhaztjYXNlIDU4OmNhc2UgNTk6Y2FzZSA2NjpjYXNlIDg2OmNhc2UgMTkwOmNhc2UgMTkxOlJhKCk7DQpicmVhaztjYXNlIDcwOmI9ZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50OyhoPWIucmVxdWVzdEZ1bGxzY3JlZW58fGIud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW58fGIud2Via2l0UmVxdWVzdEZ1bGxTY3JlZW58fGIubW96UmVxdWVzdEZ1bGxTY3JlZW58fGIubXNSZXF1ZXN0RnVsbHNjcmVlbikmJmguYXBwbHkoYik7YnJlYWs7Y2FzZSA2NTpkLmF1dG9TbGlkZVN0b3BwYWJsZSYmSWIoYik7YnJlYWs7ZGVmYXVsdDplPSExfWU/YS5wcmV2ZW50RGVmYXVsdCYmYS5wcmV2ZW50RGVmYXVsdCgpOjI3IT09YS5rZXlDb2RlJiY3OSE9PWEua2V5Q29kZXx8IXgudHJhbnNmb3JtczNkfHwoYy5vdmVybGF5P00oKTpRYSgpLGEucHJldmVudERlZmF1bHQmJmEucHJldmVudERlZmF1bHQoKSk7UygpfX1mdW5jdGlvbiBIYShhKXtpZihTYihhLnRhcmdldCkpcmV0dXJuITA7ay5zdGFydFg9YS50b3VjaGVzWzBdLmNsaWVudFg7ay5zdGFydFk9YS50b3VjaGVzWzBdLmNsaWVudFk7ay5zdGFydENvdW50PQ0KYS50b3VjaGVzLmxlbmd0aDsyPT09YS50b3VjaGVzLmxlbmd0aCYmZC5vdmVydmlldyYmKGsuc3RhcnRTcGFuPXdiKHt4OmEudG91Y2hlc1sxXS5jbGllbnRYLHk6YS50b3VjaGVzWzFdLmNsaWVudFl9LHt4Omsuc3RhcnRYLHk6ay5zdGFydFl9KSl9ZnVuY3Rpb24gSWEoYSl7aWYoU2IoYS50YXJnZXQpKXJldHVybiEwO2lmKGsuY2FwdHVyZWQpUS5tYXRjaCgvYW5kcm9pZC9naSkmJmEucHJldmVudERlZmF1bHQoKTtlbHNle0ooYSk7dmFyIGI9YS50b3VjaGVzWzBdLmNsaWVudFgsYz1hLnRvdWNoZXNbMF0uY2xpZW50WTsyPT09YS50b3VjaGVzLmxlbmd0aCYmMj09PWsuc3RhcnRDb3VudCYmZC5vdmVydmlldz8oYz13Yih7eDphLnRvdWNoZXNbMV0uY2xpZW50WCx5OmEudG91Y2hlc1sxXS5jbGllbnRZfSx7eDprLnN0YXJ0WCx5Omsuc3RhcnRZfSksTWF0aC5hYnMoay5zdGFydFNwYW4tYyk+ay50aHJlc2hvbGQmJihrLmNhcHR1cmVkPSEwLGM8ay5zdGFydFNwYW4/T2EoKTpZKCkpLA0KYS5wcmV2ZW50RGVmYXVsdCgpKToxPT09YS50b3VjaGVzLmxlbmd0aCYmMiE9PWsuc3RhcnRDb3VudCYmKGItPWsuc3RhcnRYLGMtPWsuc3RhcnRZLGI+ay50aHJlc2hvbGQmJk1hdGguYWJzKGIpPk1hdGguYWJzKGMpPyhrLmNhcHR1cmVkPSEwLGJhKCkpOmI8LWsudGhyZXNob2xkJiZNYXRoLmFicyhiKT5NYXRoLmFicyhjKT8oay5jYXB0dXJlZD0hMCxjYSgpKTpjPmsudGhyZXNob2xkPyhrLmNhcHR1cmVkPSEwLGRhKCkpOmM8LWsudGhyZXNob2xkJiYoay5jYXB0dXJlZD0hMCxlYSgpKSxkLmVtYmVkZGVkPyhrLmNhcHR1cmVkfHxUKGcpKSYmYS5wcmV2ZW50RGVmYXVsdCgpOmEucHJldmVudERlZmF1bHQoKSl9fWZ1bmN0aW9uIEphKGEpe2suY2FwdHVyZWQ9ITF9ZnVuY3Rpb24gbWEoYSl7aWYoYS5wb2ludGVyVHlwZT09PWEuTVNQT0lOVEVSX1RZUEVfVE9VQ0h8fCJ0b3VjaCI9PT1hLnBvaW50ZXJUeXBlKWEudG91Y2hlcz1be2NsaWVudFg6YS5jbGllbnRYLGNsaWVudFk6YS5jbGllbnRZfV0sDQpIYShhKX1mdW5jdGlvbiBuYShhKXtpZihhLnBvaW50ZXJUeXBlPT09YS5NU1BPSU5URVJfVFlQRV9UT1VDSHx8InRvdWNoIj09PWEucG9pbnRlclR5cGUpYS50b3VjaGVzPVt7Y2xpZW50WDphLmNsaWVudFgsY2xpZW50WTphLmNsaWVudFl9XSxJYShhKX1mdW5jdGlvbiBvYShhKXtpZihhLnBvaW50ZXJUeXBlPT09YS5NU1BPSU5URVJfVFlQRV9UT1VDSHx8InRvdWNoIj09PWEucG9pbnRlclR5cGUpYS50b3VjaGVzPVt7Y2xpZW50WDphLmNsaWVudFgsY2xpZW50WTphLmNsaWVudFl9XSxKYShhKX1mdW5jdGlvbiBsYShhKXs2MDA8RGF0ZS5ub3coKS1UYiYmKFRiPURhdGUubm93KCksYT1hLmRldGFpbHx8LWEud2hlZWxEZWx0YSwwPGE/VSgpOjA+YSYmZmEoKSl9ZnVuY3Rpb24gcGIoYSl7SihhKTthLnByZXZlbnREZWZhdWx0KCk7dmFyIGI9ZihjLndyYXBwZXIucXVlcnlTZWxlY3RvckFsbCgiLnNsaWRlcz5zZWN0aW9uIikpLmxlbmd0aDthPU1hdGguZmxvb3IoYS5jbGllbnRYL2Mud3JhcHBlci5vZmZzZXRXaWR0aCoNCmIpO2QucnRsJiYoYT1iLWEpO3coYSl9ZnVuY3Rpb24gcWIoYSl7YS5wcmV2ZW50RGVmYXVsdCgpO0ooKTtiYSgpfWZ1bmN0aW9uIHJiKGEpe2EucHJldmVudERlZmF1bHQoKTtKKCk7Y2EoKX1mdW5jdGlvbiBzYihhKXthLnByZXZlbnREZWZhdWx0KCk7SigpO2RhKCl9ZnVuY3Rpb24gdGIoYSl7YS5wcmV2ZW50RGVmYXVsdCgpO0ooKTtlYSgpfWZ1bmN0aW9uIHViKGEpe2EucHJldmVudERlZmF1bHQoKTtKKCk7ZmEoKX1mdW5jdGlvbiB2YihhKXthLnByZXZlbnREZWZhdWx0KCk7SigpO1UoKX1mdW5jdGlvbiBtYihhKXtaYSgpfWZ1bmN0aW9uIG5iKGEpe1IoKX1mdW5jdGlvbiBjYyhhKXshMT09PShkb2N1bWVudC53ZWJraXRIaWRkZW58fGRvY3VtZW50Lm1zSGlkZGVufHxkb2N1bWVudC5oaWRkZW4pJiZkb2N1bWVudC5hY3RpdmVFbGVtZW50IT09ZG9jdW1lbnQuYm9keSYmKCJmdW5jdGlvbiI9PT10eXBlb2YgZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyJiZkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKSwNCmRvY3VtZW50LmJvZHkuZm9jdXMoKSl9ZnVuY3Rpb24gRmIoYSl7aWYoR2EmJnIpe2EucHJldmVudERlZmF1bHQoKTtmb3IodmFyIGI9YS50YXJnZXQ7YiYmIWIubm9kZU5hbWUubWF0Y2goL3NlY3Rpb24vZ2kpOyliPWIucGFyZW50Tm9kZTtiJiYhYi5jbGFzc0xpc3QuY29udGFpbnMoImRpc2FibGVkIikmJihZKCksYi5ub2RlTmFtZS5tYXRjaCgvc2VjdGlvbi9naSkmJihhPXBhcnNlSW50KGIuZ2V0QXR0cmlidXRlKCJkYXRhLWluZGV4LWgiKSwxMCksYj1wYXJzZUludChiLmdldEF0dHJpYnV0ZSgiZGF0YS1pbmRleC12IiksMTApLHcoYSxiKSkpfX1mdW5jdGlvbiB6YihhKXtpZihhLmN1cnJlbnRUYXJnZXQmJmEuY3VycmVudFRhcmdldC5oYXNBdHRyaWJ1dGUoImhyZWYiKSl7dmFyIGI9YS5jdXJyZW50VGFyZ2V0LmdldEF0dHJpYnV0ZSgiaHJlZiIpO2ImJihkYyhiKSxhLnByZXZlbnREZWZhdWx0KCkpfX1mdW5jdGlvbiBiYyhhKXtELmlzTGFzdFNsaWRlKCkmJiExPT09ZC5sb29wPw0KKHcoMCwwKSxyYSgpKTpFP3JhKCk6c2EoKX1mdW5jdGlvbiBQKGEsYil7dGhpcy5kaWFtZXRlcj0xMDA7dGhpcy5kaWFtZXRlcjI9dGhpcy5kaWFtZXRlci8yO3RoaXMudGhpY2tuZXNzPTY7dGhpcy5wbGF5aW5nPSExO3RoaXMucHJvZ3Jlc3M9MDt0aGlzLnByb2dyZXNzT2Zmc2V0PTE7dGhpcy5jb250YWluZXI9YTt0aGlzLnByb2dyZXNzQ2hlY2s9Yjt0aGlzLmNhbnZhcz1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJjYW52YXMiKTt0aGlzLmNhbnZhcy5jbGFzc05hbWU9InBsYXliYWNrIjt0aGlzLmNhbnZhcy53aWR0aD10aGlzLmRpYW1ldGVyO3RoaXMuY2FudmFzLmhlaWdodD10aGlzLmRpYW1ldGVyO3RoaXMuY2FudmFzLnN0eWxlLndpZHRoPXRoaXMuZGlhbWV0ZXIyKyJweCI7dGhpcy5jYW52YXMuc3R5bGUuaGVpZ2h0PXRoaXMuZGlhbWV0ZXIyKyJweCI7dGhpcy5jb250ZXh0PXRoaXMuY2FudmFzLmdldENvbnRleHQoIjJkIik7dGhpcy5jb250YWluZXIuYXBwZW5kQ2hpbGQodGhpcy5jYW52YXMpOw0KdGhpcy5yZW5kZXIoKX12YXIgRCxRPW5hdmlnYXRvci51c2VyQWdlbnQsZD17d2lkdGg6OTYwLGhlaWdodDo3MDAsbWFyZ2luOi4wNCxtaW5TY2FsZTouMixtYXhTY2FsZToyLGNvbnRyb2xzOiEwLHByb2dyZXNzOiEwLHNsaWRlTnVtYmVyOiExLHNob3dTbGlkZU51bWJlcjoiYWxsIixoaXN0b3J5OiExLGtleWJvYXJkOiEwLGtleWJvYXJkQ29uZGl0aW9uOm51bGwsb3ZlcnZpZXc6ITAsY2VudGVyOiEwLHRvdWNoOiEwLGxvb3A6ITEscnRsOiExLHNodWZmbGU6ITEsZnJhZ21lbnRzOiEwLGVtYmVkZGVkOiExLGhlbHA6ITAscGF1c2U6ITAsc2hvd05vdGVzOiExLGF1dG9QbGF5TWVkaWE6bnVsbCxhdXRvU2xpZGU6MCxhdXRvU2xpZGVTdG9wcGFibGU6ITAsYXV0b1NsaWRlTWV0aG9kOm51bGwsbW91c2VXaGVlbDohMSxyb2xsaW5nTGlua3M6ITEsaGlkZUFkZHJlc3NCYXI6ITAscHJldmlld0xpbmtzOiExLHBvc3RNZXNzYWdlOiEwLHBvc3RNZXNzYWdlRXZlbnRzOiExLGZvY3VzQm9keU9uUGFnZVZpc2liaWxpdHlDaGFuZ2U6ITAsDQp0cmFuc2l0aW9uOiJzbGlkZSIsdHJhbnNpdGlvblNwZWVkOiJkZWZhdWx0IixiYWNrZ3JvdW5kVHJhbnNpdGlvbjoiZmFkZSIscGFyYWxsYXhCYWNrZ3JvdW5kSW1hZ2U6IiIscGFyYWxsYXhCYWNrZ3JvdW5kU2l6ZToiIixwYXJhbGxheEJhY2tncm91bmRIb3Jpem9udGFsOm51bGwscGFyYWxsYXhCYWNrZ3JvdW5kVmVydGljYWw6bnVsbCxwZGZNYXhQYWdlc1BlclNsaWRlOk51bWJlci5QT1NJVElWRV9JTkZJTklUWSxwZGZQYWdlSGVpZ2h0T2Zmc2V0Oi0xLHZpZXdEaXN0YW5jZTozLGRpc3BsYXk6ImJsb2NrIixkZXBlbmRlbmNpZXM6W119LFViPSExLCRhPSExLHI9ITEsWD1udWxsLHFhPW51bGwsbSxuLHosZyxhYSxOPVtdLEY9MTt2YXIgTGE9bD0iIjt2YXIgYz17fSx4PXt9LGhhLFZiLFRiPTAsUGI9MCxHYT0hMSxDPTAsSCxJPTAsamI9LTEsRT0hMSxrPXtzdGFydFg6MCxzdGFydFk6MCxzdGFydFNwYW46MCxzdGFydENvdW50OjAsY2FwdHVyZWQ6ITEsdGhyZXNob2xkOjQwfSwNCk1hPXsiTiAgLCAgU1BBQ0UiOiJOZXh0IHNsaWRlIixQOiJQcmV2aW91cyBzbGlkZSIsIiYjODU5MjsgICwgIEgiOiJOYXZpZ2F0ZSBsZWZ0IiwiJiM4NTk0OyAgLCAgTCI6Ik5hdmlnYXRlIHJpZ2h0IiwiJiM4NTkzOyAgLCAgSyI6Ik5hdmlnYXRlIHVwIiwiJiM4NTk1OyAgLCAgSiI6Ik5hdmlnYXRlIGRvd24iLEhvbWU6IkZpcnN0IHNsaWRlIixFbmQ6Ikxhc3Qgc2xpZGUiLCJCICAsICAuIjoiUGF1c2UiLEY6IkZ1bGxzY3JlZW4iLCJFU0MsIE8iOiJTbGlkZSBvdmVydmlldyJ9O1AucHJvdG90eXBlLnNldFBsYXlpbmc9ZnVuY3Rpb24oYSl7dmFyIGI9dGhpcy5wbGF5aW5nO3RoaXMucGxheWluZz1hOyFiJiZ0aGlzLnBsYXlpbmc/dGhpcy5hbmltYXRlKCk6dGhpcy5yZW5kZXIoKX07UC5wcm90b3R5cGUuYW5pbWF0ZT1mdW5jdGlvbigpe3ZhciBhPXRoaXMucHJvZ3Jlc3M7dGhpcy5wcm9ncmVzcz10aGlzLnByb2dyZXNzQ2hlY2soKTsuODxhJiYuMj50aGlzLnByb2dyZXNzJiYodGhpcy5wcm9ncmVzc09mZnNldD0NCnRoaXMucHJvZ3Jlc3MpO3RoaXMucmVuZGVyKCk7dGhpcy5wbGF5aW5nJiZ4LnJlcXVlc3RBbmltYXRpb25GcmFtZU1ldGhvZC5jYWxsKHdpbmRvdyx0aGlzLmFuaW1hdGUuYmluZCh0aGlzKSl9O1AucHJvdG90eXBlLnJlbmRlcj1mdW5jdGlvbigpe3ZhciBhPXRoaXMucGxheWluZz90aGlzLnByb2dyZXNzOjAsYj10aGlzLmRpYW1ldGVyMi10aGlzLnRoaWNrbmVzcyxjPXRoaXMuZGlhbWV0ZXIyLGQ9dGhpcy5kaWFtZXRlcjI7dGhpcy5wcm9ncmVzc09mZnNldCs9LjEqKDEtdGhpcy5wcm9ncmVzc09mZnNldCk7dmFyIGE9LU1hdGguUEkvMisyKmEqTWF0aC5QSSxmPS1NYXRoLlBJLzIrMip0aGlzLnByb2dyZXNzT2Zmc2V0Kk1hdGguUEk7dGhpcy5jb250ZXh0LnNhdmUoKTt0aGlzLmNvbnRleHQuY2xlYXJSZWN0KDAsMCx0aGlzLmRpYW1ldGVyLHRoaXMuZGlhbWV0ZXIpO3RoaXMuY29udGV4dC5iZWdpblBhdGgoKTt0aGlzLmNvbnRleHQuYXJjKGMsZCxiKzQsMCwyKk1hdGguUEksITEpOw0KdGhpcy5jb250ZXh0LmZpbGxTdHlsZT0icmdiYSggMCwgMCwgMCwgMC40ICkiO3RoaXMuY29udGV4dC5maWxsKCk7dGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpO3RoaXMuY29udGV4dC5hcmMoYyxkLGIsMCwyKk1hdGguUEksITEpO3RoaXMuY29udGV4dC5saW5lV2lkdGg9dGhpcy50aGlja25lc3M7dGhpcy5jb250ZXh0LnN0cm9rZVN0eWxlPSIjNjY2Ijt0aGlzLmNvbnRleHQuc3Ryb2tlKCk7dGhpcy5wbGF5aW5nJiYodGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpLHRoaXMuY29udGV4dC5hcmMoYyxkLGIsZixhLCExKSx0aGlzLmNvbnRleHQubGluZVdpZHRoPXRoaXMudGhpY2tuZXNzLHRoaXMuY29udGV4dC5zdHJva2VTdHlsZT0iI2ZmZiIsdGhpcy5jb250ZXh0LnN0cm9rZSgpKTt0aGlzLmNvbnRleHQudHJhbnNsYXRlKGMtMTQsZC0xNCk7dGhpcy5wbGF5aW5nPyh0aGlzLmNvbnRleHQuZmlsbFN0eWxlPSIjZmZmIix0aGlzLmNvbnRleHQuZmlsbFJlY3QoMCwwLDEwLDI4KSx0aGlzLmNvbnRleHQuZmlsbFJlY3QoMTgsDQowLDEwLDI4KSk6KHRoaXMuY29udGV4dC5iZWdpblBhdGgoKSx0aGlzLmNvbnRleHQudHJhbnNsYXRlKDQsMCksdGhpcy5jb250ZXh0Lm1vdmVUbygwLDApLHRoaXMuY29udGV4dC5saW5lVG8oMjQsMTQpLHRoaXMuY29udGV4dC5saW5lVG8oMCwyOCksdGhpcy5jb250ZXh0LmZpbGxTdHlsZT0iI2ZmZiIsdGhpcy5jb250ZXh0LmZpbGwoKSk7dGhpcy5jb250ZXh0LnJlc3RvcmUoKX07UC5wcm90b3R5cGUub249ZnVuY3Rpb24oYSxiKXt0aGlzLmNhbnZhcy5hZGRFdmVudExpc3RlbmVyKGEsYiwhMSl9O1AucHJvdG90eXBlLm9mZj1mdW5jdGlvbihhLGIpe3RoaXMuY2FudmFzLnJlbW92ZUV2ZW50TGlzdGVuZXIoYSxiLCExKX07UC5wcm90b3R5cGUuZGVzdHJveT1mdW5jdGlvbigpe3RoaXMucGxheWluZz0hMTt0aGlzLmNhbnZhcy5wYXJlbnROb2RlJiZ0aGlzLmNvbnRhaW5lci5yZW1vdmVDaGlsZCh0aGlzLmNhbnZhcyl9O3JldHVybiBEPXtWRVJTSU9OOiIzLjUuMCIsaW5pdGlhbGl6ZTpmdW5jdGlvbihhKXtpZighMCE9PQ0KVWIpe1ViPSEwO2hhPS8oaXBob25lfGlwb2R8aXBhZHxhbmRyb2lkKS9naS50ZXN0KFEpO1ZiPS9jaHJvbWUvaS50ZXN0KFEpJiYhL2VkZ2UvaS50ZXN0KFEpO3ZhciBiPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImRpdiIpO3gudHJhbnNmb3JtczNkPSJXZWJraXRQZXJzcGVjdGl2ZSJpbiBiLnN0eWxlfHwiTW96UGVyc3BlY3RpdmUiaW4gYi5zdHlsZXx8Im1zUGVyc3BlY3RpdmUiaW4gYi5zdHlsZXx8Ik9QZXJzcGVjdGl2ZSJpbiBiLnN0eWxlfHwicGVyc3BlY3RpdmUiaW4gYi5zdHlsZTt4LnRyYW5zZm9ybXMyZD0iV2Via2l0VHJhbnNmb3JtImluIGIuc3R5bGV8fCJNb3pUcmFuc2Zvcm0iaW4gYi5zdHlsZXx8Im1zVHJhbnNmb3JtImluIGIuc3R5bGV8fCJPVHJhbnNmb3JtImluIGIuc3R5bGV8fCJ0cmFuc2Zvcm0iaW4gYi5zdHlsZTt4LnJlcXVlc3RBbmltYXRpb25GcmFtZU1ldGhvZD13aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lfHx3aW5kb3cud2Via2l0UmVxdWVzdEFuaW1hdGlvbkZyYW1lfHwNCndpbmRvdy5tb3pSZXF1ZXN0QW5pbWF0aW9uRnJhbWU7eC5yZXF1ZXN0QW5pbWF0aW9uRnJhbWU9ImZ1bmN0aW9uIj09PXR5cGVvZiB4LnJlcXVlc3RBbmltYXRpb25GcmFtZU1ldGhvZDt4LmNhbnZhcz0hIWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImNhbnZhcyIpLmdldENvbnRleHQ7eC5vdmVydmlld1RyYW5zaXRpb25zPSEvVmVyc2lvblwvW1xkXC5dKy4qU2FmYXJpLy50ZXN0KFEpO3guem9vbT0iem9vbSJpbiBiLnN0eWxlJiYhaGEmJihWYnx8L1ZlcnNpb25cL1tcZFwuXSsuKlNhZmFyaS8udGVzdChRKSk7aWYoeC50cmFuc2Zvcm1zMmR8fHgudHJhbnNmb3JtczNkKWMud3JhcHBlcj1kb2N1bWVudC5xdWVyeVNlbGVjdG9yKCIucmV2ZWFsIiksYy5zbGlkZXM9ZG9jdW1lbnQucXVlcnlTZWxlY3RvcigiLnJldmVhbCAuc2xpZGVzIiksd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoImxvYWQiLFIsITEpLGI9RC5nZXRRdWVyeUhhc2goKSwidW5kZWZpbmVkIiE9PXR5cGVvZiBiLmRlcGVuZGVuY2llcyYmDQpkZWxldGUgYi5kZXBlbmRlbmNpZXMsa2EoZCxhKSxrYShkLGIpLGQuaGlkZUFkZHJlc3NCYXImJmhhJiYod2luZG93LmFkZEV2ZW50TGlzdGVuZXIoImxvYWQiLHhiLCExKSx3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigib3JpZW50YXRpb25jaGFuZ2UiLHhiLCExKSksdCgpO2Vsc2V7ZG9jdW1lbnQuYm9keS5zZXRBdHRyaWJ1dGUoImNsYXNzIiwibm8tdHJhbnNmb3JtcyIpO2E9Zihkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgiaW1nIikpO2I9Zihkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgiaWZyYW1lIikpO2E9YS5jb25jYXQoYik7Zm9yKHZhciBiPTAsZT1hLmxlbmd0aDtiPGU7YisrKXt2YXIgZz1hW2JdO2cuZ2V0QXR0cmlidXRlKCJkYXRhLXNyYyIpJiYoZy5zZXRBdHRyaWJ1dGUoInNyYyIsZy5nZXRBdHRyaWJ1dGUoImRhdGEtc3JjIikpLGcucmVtb3ZlQXR0cmlidXRlKCJkYXRhLXNyYyIpKX19fX0sY29uZmlndXJlOllhLHN5bmM6a2Isc2xpZGU6dyxsZWZ0OmJhLA0KcmlnaHQ6Y2EsdXA6ZGEsZG93bjplYSxwcmV2OmZhLG5leHQ6VSxuYXZpZ2F0ZUZyYWdtZW50OnRhLHByZXZGcmFnbWVudDpqYSxuZXh0RnJhZ21lbnQ6aWEsbmF2aWdhdGVUbzp3LG5hdmlnYXRlTGVmdDpiYSxuYXZpZ2F0ZVJpZ2h0OmNhLG5hdmlnYXRlVXA6ZGEsbmF2aWdhdGVEb3duOmVhLG5hdmlnYXRlUHJldjpmYSxuYXZpZ2F0ZU5leHQ6VSxsYXlvdXQ6UixzaHVmZmxlOmdiLGF2YWlsYWJsZVJvdXRlczpHLGF2YWlsYWJsZUZyYWdtZW50czpXYSx0b2dnbGVIZWxwOkFiLHRvZ2dsZU92ZXJ2aWV3OlFhLHRvZ2dsZVBhdXNlOlJhLHRvZ2dsZUF1dG9TbGlkZTpJYixpc092ZXJ2aWV3OmZ1bmN0aW9uKCl7cmV0dXJuIHJ9LGlzUGF1c2VkOlosaXNBdXRvU2xpZGluZzpmdW5jdGlvbigpe3JldHVybiEoIUN8fEUpfSxhZGRFdmVudExpc3RlbmVyczpsYixyZW1vdmVFdmVudExpc3RlbmVyczpCYSxnZXRTdGF0ZTp5YixzZXRTdGF0ZTpmdW5jdGlvbihhKXtpZigib2JqZWN0Ij09PXR5cGVvZiBhKXt3KFcoYS5pbmRleGgpLA0KVyhhLmluZGV4diksVyhhLmluZGV4ZikpO3ZhciBiPVcoYS5wYXVzZWQpO2E9VyhhLm92ZXJ2aWV3KTsiYm9vbGVhbiI9PT10eXBlb2YgYiYmYiE9PVooKSYmUmEoYik7ImJvb2xlYW4iPT09dHlwZW9mIGEmJmEhPT1yJiZRYShhKX19LGdldFNsaWRlUGFzdENvdW50OndhLGdldFByb2dyZXNzOk9iLGdldEluZGljZXM6eGEsZ2V0U2xpZGVzOlFiLGdldFRvdGFsU2xpZGVzOlZhLGdldFNsaWRlOlJiLGdldFNsaWRlQmFja2dyb3VuZDpYYSxnZXRTbGlkZU5vdGVzOkRhLGdldFByZXZpb3VzU2xpZGU6ZnVuY3Rpb24oKXtyZXR1cm4gen0sZ2V0Q3VycmVudFNsaWRlOmZ1bmN0aW9uKCl7cmV0dXJuIGd9LGdldFNjYWxlOmZ1bmN0aW9uKCl7cmV0dXJuIEZ9LGdldENvbmZpZzpmdW5jdGlvbigpe3JldHVybiBkfSxnZXRRdWVyeUhhc2g6ZnVuY3Rpb24oKXt2YXIgYT17fTtsb2NhdGlvbi5zZWFyY2gucmVwbGFjZSgvW0EtWjAtOV0rPz0oW1x3XC4lLV0qKS9naSxmdW5jdGlvbihiKXthW2Iuc3BsaXQoIj0iKS5zaGlmdCgpXT0NCmIuc3BsaXQoIj0iKS5wb3AoKX0pO2Zvcih2YXIgYiBpbiBhKWFbYl09Vyh1bmVzY2FwZShhW2JdKSk7cmV0dXJuIGF9LGlzRmlyc3RTbGlkZTpmdW5jdGlvbigpe3JldHVybiAwPT09bSYmMD09PW59LGlzTGFzdFNsaWRlOmZ1bmN0aW9uKCl7cmV0dXJuIGc/Zy5uZXh0RWxlbWVudFNpYmxpbmd8fFQoZykmJmcucGFyZW50Tm9kZS5uZXh0RWxlbWVudFNpYmxpbmc/ITE6ITA6ITF9LGlzUmVhZHk6ZnVuY3Rpb24oKXtyZXR1cm4gJGF9LGFkZEV2ZW50TGlzdGVuZXI6ZnVuY3Rpb24oYSxiLGQpeyJhZGRFdmVudExpc3RlbmVyImluIHdpbmRvdyYmKGMud3JhcHBlcnx8ZG9jdW1lbnQucXVlcnlTZWxlY3RvcigiLnJldmVhbCIpKS5hZGRFdmVudExpc3RlbmVyKGEsYixkKX0scmVtb3ZlRXZlbnRMaXN0ZW5lcjpmdW5jdGlvbihhLGIsZCl7ImFkZEV2ZW50TGlzdGVuZXIiaW4gd2luZG93JiYoYy53cmFwcGVyfHxkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCIucmV2ZWFsIikpLnJlbW92ZUV2ZW50TGlzdGVuZXIoYSwNCmIsZCl9LHRyaWdnZXJLZXk6ZnVuY3Rpb24oYSl7S2Eoe2tleUNvZGU6YX0pfSxyZWdpc3RlcktleWJvYXJkU2hvcnRjdXQ6ZnVuY3Rpb24oYSxiKXtNYVthXT1ifX19KTsNCg==";

    var saveAs64 = "dmFyIHNhdmVBcz1zYXZlQXN8fGZ1bmN0aW9uKHZpZXcpeyJ1c2Ugc3RyaWN0IjtpZih0eXBlb2YgbmF2aWdhdG9yIT09InVuZGVmaW5lZCImJi9NU0lFIFsxLTldXC4vLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpe3JldHVybn12YXIgZG9jPXZpZXcuZG9jdW1lbnQsZ2V0X1VSTD1mdW5jdGlvbigpe3JldHVybiB2aWV3LlVSTHx8dmlldy53ZWJraXRVUkx8fHZpZXd9LHNhdmVfbGluaz1kb2MuY3JlYXRlRWxlbWVudE5TKCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hodG1sIiwiYSIpLGNhbl91c2Vfc2F2ZV9saW5rPSJkb3dubG9hZCJpbiBzYXZlX2xpbmssY2xpY2s9ZnVuY3Rpb24obm9kZSl7dmFyIGV2ZW50PW5ldyBNb3VzZUV2ZW50KCJjbGljayIpO25vZGUuZGlzcGF0Y2hFdmVudChldmVudCl9LGlzX3NhZmFyaT0vVmVyc2lvblwvW1xkXC5dKy4qU2FmYXJpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpLHdlYmtpdF9yZXFfZnM9dmlldy53ZWJraXRSZXF1ZXN0RmlsZVN5c3RlbSxyZXFfZnM9dmlldy5yZXF1ZXN0RmlsZVN5c3RlbXx8d2Via2l0X3JlcV9mc3x8dmlldy5tb3pSZXF1ZXN0RmlsZVN5c3RlbSx0aHJvd19vdXRzaWRlPWZ1bmN0aW9uKGV4KXsodmlldy5zZXRJbW1lZGlhdGV8fHZpZXcuc2V0VGltZW91dCkoZnVuY3Rpb24oKXt0aHJvdyBleH0sMCl9LGZvcmNlX3NhdmVhYmxlX3R5cGU9ImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbSIsZnNfbWluX3NpemU9MCxhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQ9NTAwLHJldm9rZT1mdW5jdGlvbihmaWxlKXt2YXIgcmV2b2tlcj1mdW5jdGlvbigpe2lmKHR5cGVvZiBmaWxlPT09InN0cmluZyIpe2dldF9VUkwoKS5yZXZva2VPYmplY3RVUkwoZmlsZSl9ZWxzZXtmaWxlLnJlbW92ZSgpfX07aWYodmlldy5jaHJvbWUpe3Jldm9rZXIoKX1lbHNle3NldFRpbWVvdXQocmV2b2tlcixhcmJpdHJhcnlfcmV2b2tlX3RpbWVvdXQpfX0sZGlzcGF0Y2g9ZnVuY3Rpb24oZmlsZXNhdmVyLGV2ZW50X3R5cGVzLGV2ZW50KXtldmVudF90eXBlcz1bXS5jb25jYXQoZXZlbnRfdHlwZXMpO3ZhciBpPWV2ZW50X3R5cGVzLmxlbmd0aDt3aGlsZShpLS0pe3ZhciBsaXN0ZW5lcj1maWxlc2F2ZXJbIm9uIitldmVudF90eXBlc1tpXV07aWYodHlwZW9mIGxpc3RlbmVyPT09ImZ1bmN0aW9uIil7dHJ5e2xpc3RlbmVyLmNhbGwoZmlsZXNhdmVyLGV2ZW50fHxmaWxlc2F2ZXIpfWNhdGNoKGV4KXt0aHJvd19vdXRzaWRlKGV4KX19fX0sYXV0b19ib209ZnVuY3Rpb24oYmxvYil7aWYoL15ccyooPzp0ZXh0XC9cUyp8YXBwbGljYXRpb25cL3htbHxcUypcL1xTKlwreG1sKVxzKjsuKmNoYXJzZXRccyo9XHMqdXRmLTgvaS50ZXN0KGJsb2IudHlwZSkpe3JldHVybiBuZXcgQmxvYihbIlx1ZmVmZiIsYmxvYl0se3R5cGU6YmxvYi50eXBlfSl9cmV0dXJuIGJsb2J9LEZpbGVTYXZlcj1mdW5jdGlvbihibG9iLG5hbWUsbm9fYXV0b19ib20pe2lmKCFub19hdXRvX2JvbSl7YmxvYj1hdXRvX2JvbShibG9iKX12YXIgZmlsZXNhdmVyPXRoaXMsdHlwZT1ibG9iLnR5cGUsYmxvYl9jaGFuZ2VkPWZhbHNlLG9iamVjdF91cmwsdGFyZ2V0X3ZpZXcsZGlzcGF0Y2hfYWxsPWZ1bmN0aW9uKCl7ZGlzcGF0Y2goZmlsZXNhdmVyLCJ3cml0ZXN0YXJ0IHByb2dyZXNzIHdyaXRlIHdyaXRlZW5kIi5zcGxpdCgiICIpKX0sZnNfZXJyb3I9ZnVuY3Rpb24oKXtpZih0YXJnZXRfdmlldyYmaXNfc2FmYXJpJiZ0eXBlb2YgRmlsZVJlYWRlciE9PSJ1bmRlZmluZWQiKXt2YXIgcmVhZGVyPW5ldyBGaWxlUmVhZGVyO3JlYWRlci5vbmxvYWRlbmQ9ZnVuY3Rpb24oKXt2YXIgYmFzZTY0RGF0YT1yZWFkZXIucmVzdWx0O3RhcmdldF92aWV3LmxvY2F0aW9uLmhyZWY9ImRhdGE6YXR0YWNobWVudC9maWxlIitiYXNlNjREYXRhLnNsaWNlKGJhc2U2NERhdGEuc2VhcmNoKC9bLDtdLykpO2ZpbGVzYXZlci5yZWFkeVN0YXRlPWZpbGVzYXZlci5ET05FO2Rpc3BhdGNoX2FsbCgpfTtyZWFkZXIucmVhZEFzRGF0YVVSTChibG9iKTtmaWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuSU5JVDtyZXR1cm59aWYoYmxvYl9jaGFuZ2VkfHwhb2JqZWN0X3VybCl7b2JqZWN0X3VybD1nZXRfVVJMKCkuY3JlYXRlT2JqZWN0VVJMKGJsb2IpfWlmKHRhcmdldF92aWV3KXt0YXJnZXRfdmlldy5sb2NhdGlvbi5ocmVmPW9iamVjdF91cmx9ZWxzZXt2YXIgbmV3X3RhYj12aWV3Lm9wZW4ob2JqZWN0X3VybCwiX2JsYW5rIik7aWYobmV3X3RhYj09dW5kZWZpbmVkJiZpc19zYWZhcmkpe3ZpZXcubG9jYXRpb24uaHJlZj1vYmplY3RfdXJsfX1maWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuRE9ORTtkaXNwYXRjaF9hbGwoKTtyZXZva2Uob2JqZWN0X3VybCl9LGFib3J0YWJsZT1mdW5jdGlvbihmdW5jKXtyZXR1cm4gZnVuY3Rpb24oKXtpZihmaWxlc2F2ZXIucmVhZHlTdGF0ZSE9PWZpbGVzYXZlci5ET05FKXtyZXR1cm4gZnVuYy5hcHBseSh0aGlzLGFyZ3VtZW50cyl9fX0sY3JlYXRlX2lmX25vdF9mb3VuZD17Y3JlYXRlOnRydWUsZXhjbHVzaXZlOmZhbHNlfSxzbGljZTtmaWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuSU5JVDtpZighbmFtZSl7bmFtZT0iZG93bmxvYWQifWlmKGNhbl91c2Vfc2F2ZV9saW5rKXtvYmplY3RfdXJsPWdldF9VUkwoKS5jcmVhdGVPYmplY3RVUkwoYmxvYik7c2V0VGltZW91dChmdW5jdGlvbigpe3NhdmVfbGluay5ocmVmPW9iamVjdF91cmw7c2F2ZV9saW5rLmRvd25sb2FkPW5hbWU7Y2xpY2soc2F2ZV9saW5rKTtkaXNwYXRjaF9hbGwoKTtyZXZva2Uob2JqZWN0X3VybCk7ZmlsZXNhdmVyLnJlYWR5U3RhdGU9ZmlsZXNhdmVyLkRPTkV9KTtyZXR1cm59aWYodmlldy5jaHJvbWUmJnR5cGUmJnR5cGUhPT1mb3JjZV9zYXZlYWJsZV90eXBlKXtzbGljZT1ibG9iLnNsaWNlfHxibG9iLndlYmtpdFNsaWNlO2Jsb2I9c2xpY2UuY2FsbChibG9iLDAsYmxvYi5zaXplLGZvcmNlX3NhdmVhYmxlX3R5cGUpO2Jsb2JfY2hhbmdlZD10cnVlfWlmKHdlYmtpdF9yZXFfZnMmJm5hbWUhPT0iZG93bmxvYWQiKXtuYW1lKz0iLmRvd25sb2FkIn1pZih0eXBlPT09Zm9yY2Vfc2F2ZWFibGVfdHlwZXx8d2Via2l0X3JlcV9mcyl7dGFyZ2V0X3ZpZXc9dmlld31pZighcmVxX2ZzKXtmc19lcnJvcigpO3JldHVybn1mc19taW5fc2l6ZSs9YmxvYi5zaXplO3JlcV9mcyh2aWV3LlRFTVBPUkFSWSxmc19taW5fc2l6ZSxhYm9ydGFibGUoZnVuY3Rpb24oZnMpe2ZzLnJvb3QuZ2V0RGlyZWN0b3J5KCJzYXZlZCIsY3JlYXRlX2lmX25vdF9mb3VuZCxhYm9ydGFibGUoZnVuY3Rpb24oZGlyKXt2YXIgc2F2ZT1mdW5jdGlvbigpe2Rpci5nZXRGaWxlKG5hbWUsY3JlYXRlX2lmX25vdF9mb3VuZCxhYm9ydGFibGUoZnVuY3Rpb24oZmlsZSl7ZmlsZS5jcmVhdGVXcml0ZXIoYWJvcnRhYmxlKGZ1bmN0aW9uKHdyaXRlcil7d3JpdGVyLm9ud3JpdGVlbmQ9ZnVuY3Rpb24oZXZlbnQpe3RhcmdldF92aWV3LmxvY2F0aW9uLmhyZWY9ZmlsZS50b1VSTCgpO2ZpbGVzYXZlci5yZWFkeVN0YXRlPWZpbGVzYXZlci5ET05FO2Rpc3BhdGNoKGZpbGVzYXZlciwid3JpdGVlbmQiLGV2ZW50KTtyZXZva2UoZmlsZSl9O3dyaXRlci5vbmVycm9yPWZ1bmN0aW9uKCl7dmFyIGVycm9yPXdyaXRlci5lcnJvcjtpZihlcnJvci5jb2RlIT09ZXJyb3IuQUJPUlRfRVJSKXtmc19lcnJvcigpfX07IndyaXRlc3RhcnQgcHJvZ3Jlc3Mgd3JpdGUgYWJvcnQiLnNwbGl0KCIgIikuZm9yRWFjaChmdW5jdGlvbihldmVudCl7d3JpdGVyWyJvbiIrZXZlbnRdPWZpbGVzYXZlclsib24iK2V2ZW50XX0pO3dyaXRlci53cml0ZShibG9iKTtmaWxlc2F2ZXIuYWJvcnQ9ZnVuY3Rpb24oKXt3cml0ZXIuYWJvcnQoKTtmaWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuRE9ORX07ZmlsZXNhdmVyLnJlYWR5U3RhdGU9ZmlsZXNhdmVyLldSSVRJTkd9KSxmc19lcnJvcil9KSxmc19lcnJvcil9O2Rpci5nZXRGaWxlKG5hbWUse2NyZWF0ZTpmYWxzZX0sYWJvcnRhYmxlKGZ1bmN0aW9uKGZpbGUpe2ZpbGUucmVtb3ZlKCk7c2F2ZSgpfSksYWJvcnRhYmxlKGZ1bmN0aW9uKGV4KXtpZihleC5jb2RlPT09ZXguTk9UX0ZPVU5EX0VSUil7c2F2ZSgpfWVsc2V7ZnNfZXJyb3IoKX19KSl9KSxmc19lcnJvcil9KSxmc19lcnJvcil9LEZTX3Byb3RvPUZpbGVTYXZlci5wcm90b3R5cGUsc2F2ZUFzPWZ1bmN0aW9uKGJsb2IsbmFtZSxub19hdXRvX2JvbSl7cmV0dXJuIG5ldyBGaWxlU2F2ZXIoYmxvYixuYW1lLG5vX2F1dG9fYm9tKX07aWYodHlwZW9mIG5hdmlnYXRvciE9PSJ1bmRlZmluZWQiJiZuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYil7cmV0dXJuIGZ1bmN0aW9uKGJsb2IsbmFtZSxub19hdXRvX2JvbSl7aWYoIW5vX2F1dG9fYm9tKXtibG9iPWF1dG9fYm9tKGJsb2IpfXJldHVybiBuYXZpZ2F0b3IubXNTYXZlT3JPcGVuQmxvYihibG9iLG5hbWV8fCJkb3dubG9hZCIpfX1GU19wcm90by5hYm9ydD1mdW5jdGlvbigpe3ZhciBmaWxlc2F2ZXI9dGhpcztmaWxlc2F2ZXIucmVhZHlTdGF0ZT1maWxlc2F2ZXIuRE9ORTtkaXNwYXRjaChmaWxlc2F2ZXIsImFib3J0Iil9O0ZTX3Byb3RvLnJlYWR5U3RhdGU9RlNfcHJvdG8uSU5JVD0wO0ZTX3Byb3RvLldSSVRJTkc9MTtGU19wcm90by5ET05FPTI7RlNfcHJvdG8uZXJyb3I9RlNfcHJvdG8ub253cml0ZXN0YXJ0PUZTX3Byb3RvLm9ucHJvZ3Jlc3M9RlNfcHJvdG8ub253cml0ZT1GU19wcm90by5vbmFib3J0PUZTX3Byb3RvLm9uZXJyb3I9RlNfcHJvdG8ub253cml0ZWVuZD1udWxsO3JldHVybiBzYXZlQXN9KHR5cGVvZiBzZWxmIT09InVuZGVmaW5lZCImJnNlbGZ8fHR5cGVvZiB3aW5kb3chPT0idW5kZWZpbmVkIiYmd2luZG93fHx0aGlzLmNvbnRlbnQpO2lmKHR5cGVvZiBtb2R1bGUhPT0idW5kZWZpbmVkIiYmbW9kdWxlLmV4cG9ydHMpe21vZHVsZS5leHBvcnRzLnNhdmVBcz1zYXZlQXN9ZWxzZSBpZih0eXBlb2YgZGVmaW5lIT09InVuZGVmaW5lZCImJmRlZmluZSE9PW51bGwmJmRlZmluZS5hbWQhPW51bGwpe2RlZmluZShbXSxmdW5jdGlvbigpe3JldHVybiBzYXZlQXN9KX0NCg==";

    var saveObject64 = "ICAgIHRoaXMuc2F2ZU9iamVjdD1mdW5jdGlvbigpew0KICAgICAgICB2YXIgZSA9IHdpbmRvdy5ldmVudC5zcmNFbGVtZW50Ow0KDQogICAgICAgIHZhciBvYmplY3REYXRhPWUucHJldmlvdXNTaWJsaW5nLmdldEF0dHJpYnV0ZSgnZGF0YScpOw0KICAgICAgICB2YXIgdHlwPWUucHJldmlvdXNTaWJsaW5nLmdldEF0dHJpYnV0ZSgndHlwZScpOw0KICAgICAgICB2YXIgbmFtZT1lLnByZXZpb3VzU2libGluZy5nZXRBdHRyaWJ1dGUoJ25hbWUnKTsNCiAgICAgICAgdmFyIGluZGV4PW9iamVjdERhdGEuaW5kZXhPZignLCcpOw0KICAgICAgIA0KICAgICAgICB2YXIgYnl0ZUNoYXJhY3RlcnMgPSBhdG9iKG9iamVjdERhdGEuc3Vic3RyaW5nKGluZGV4KzEpKTsNCiAgdmFyIGJ5dGVBcnJheXMgPSBbXTsgIA0KICB2YXIgc2xpY2VTaXplPTUxMjsNCg0KICBmb3IgKHZhciBvZmZzZXQgPSAwOyBvZmZzZXQgPCBieXRlQ2hhcmFjdGVycy5sZW5ndGg7IG9mZnNldCArPSBzbGljZVNpemUpIHsNCiAgICB2YXIgc2xpY2UgPSBieXRlQ2hhcmFjdGVycy5zbGljZShvZmZzZXQsIG9mZnNldCArIHNsaWNlU2l6ZSk7DQoNCiAgICB2YXIgYnl0ZU51bWJlcnMgPSBuZXcgQXJyYXkoc2xpY2UubGVuZ3RoKTsNCiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNsaWNlLmxlbmd0aDsgaSsrKSB7DQogICAgICBieXRlTnVtYmVyc1tpXSA9IHNsaWNlLmNoYXJDb2RlQXQoaSk7DQogICAgfQ0KDQogICAgdmFyIGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KGJ5dGVOdW1iZXJzKTsNCg0KICAgIGJ5dGVBcnJheXMucHVzaChieXRlQXJyYXkpOw0KICB9DQogICAgICAgIA0KICAgIHZhciBibG9iID0gbmV3IEJsb2IoYnl0ZUFycmF5cywge3R5cGU6IHR5cH0pOw0KCQkJc2F2ZUFzKGJsb2IsIG5hbWUpOw0KICAgIH0=";
    top();
    var druckansicht = false;
    var sichtbarkeiten = [1, 0, 1, 1, 1, 1, 1, 1, 1, 1];
    var magicString = "JEIF?EJFM?jmEHl§/87h78§FHLhl§F";
    var breite = 998,
        hoehe = 701; //701
    var breiteStandard = 998,
        hoeheStandard = 701;
    bearbeitungAn = false;
    var bearbeitungsTyp = "";
    var aktuellerDateiname = "";
    var aktuellesBild = "";
    var zeichenbreite = 0,
        zeichenhoehe = 0,
        hochkant = false;
    var clipboard = "";
    var bereich = false; // ob gerade bereich in der Auswahl ist
    var auswahlebenen = "<select class='auswahlebene'>";

    var knoepfe = "";



    $(document).on("click", ".wahl", function () {
        raeumeAuf();
        if ($(this).hasClass("komplett")) {
            // alle gewählt, also abwählen
            uncheck2($(this).attr("wahl"));
            $(this).removeClass("komplett");
        } else {
            check2($(this).attr("wahl"));
            $(this).removeClass("komplett");
            $(this).addClass("komplett");
        }
        updateWahl();
    });
    
    $(document).on("click","#ebenenzuweisung",function(){
         $("body").append("<div class='transparent'></div>");
        var ebenenKnoepfe=erstelleEbenenKnoepfe("");
        $(".transparent").append("<div class='fenster'>"+ebenenKnoepfe+"<br><button id='ebeneAlle'>Alle wählen</button><button id='ebeneKeine'>Alle abwählen</button><button id='ebeneInvertiere'>Auswahl invertieren</button><br><button id='ebeneZuweisungPlus'>Tags hinzufügen</button><button id='ebeneZuweisungMinus'>Tags abziehen</button><button id='ebeneZuweisungGleich'>Tags übernehmen</button></br><button id='ebeneAbbrechen'>Abbrechen</button></div>");
    });
    
    $(document).on("click","#ebeneZuweisungPlus",function(){
        aendereTags("plus");
        updateWahl();
        $(".transparent").remove();
    });
    
    $(document).on("click","#ebeneZuweisungMinus",function(){
        aendereTags("minus");
        updateWahl();
        $(".transparent").remove();
    });
    
    $(document).on("click","#ebeneZuweisungGleich",function(){
        aendereTags("gleich");
        updateWahl();
        $(".transparent").remove();
    });
    
    function aendereTags(modus){
         var aktivString="";
        for (var i=0;i<27;i++){
            if ($("#bs_"+i).hasClass("aktiv")){
                aktivString+=String.fromCharCode(64+i);
            }
        }
        $(".markieren").each(function(){
           if ($(this).hasClass("aktiv")){
               $(this).parent().find(".ebenenAnzeige").each(function(){
                   var aktivStringAlt=$(this).attr("aktiv");
                  if (modus=="plus"){
                      for (var i=0;i<aktivString.length;i++){
                          if (! aktivStringAlt.includes(aktivString.charAt(i))){
                              aktivStringAlt+=aktivString.charAt(i);
                          }
                      }
                  } else if (modus=="minus"){
                      var aktivStringNeu="";
                      for (var i=0;i<aktivStringAlt.length;i++){
                          if (! aktivString.includes(aktivStringAlt.charAt(i))){
                              aktivStringNeu+=aktivStringAlt.charAt(i);
                          }
                      }
                      aktivStringAlt=aktivStringNeu;
                  } else if (modus=="gleich"){
                      aktivStringAlt=aktivString;
                  }
                   $(this).attr("aktiv",aktivStringAlt);
                   
                   var neuesBild=zeichneEbenenUebersicht(aktivStringAlt); // ebenenuebersicht neu erstellen
                   $(this).parent().prev(".tshareElement").attr("sb",aktivStringAlt); // auch in tshare ändern
        $(this).wrap("<span id='ersetzung'></span>");
        $("#ersetzung").html(neuesBild);
        $("#ersetzung .ebenenAnzeige").unwrap(); // neues Bild einfügen
        $(".transparent").remove();
               });
           } 
        });
    }
    
    function check2(index){
     
        $(".ebenenAnzeige").each(function () {
            if (! $(this).parent().hasClass("versteckt")) {
                if ($(this).attr("aktiv").toUpperCase().includes(String.fromCharCode(64+parseInt(index)))){
                
                $(this).parent().find(".markieren").removeClass("aktiv").addClass("aktiv");
                }
            }
        });
    }
    
    function uncheck2(index){
        $(".ebenenAnzeige").each(function () {
            if (! $(this).parent().hasClass("versteckt")) {
                if ($(this).attr("aktiv").toUpperCase().includes(String.fromCharCode(64+parseInt(index)))){
                
                $(this).parent().find(".markieren").removeClass("aktiv");
                }
            }
        });
    }
/*
    function check(index) {
        var zaehler = 0;
        $(".sichtbarkeit").each(function () {
            if ($(this).val() == String.fromCharCode(65+parseInt(index))&& ! $(this).parent().hasClass("versteckt")) {
                zaehler++;
                $(this).parent().find(".markieren").removeClass("aktiv").addClass("aktiv");

            }
        });
        if (zaehler > 0) {
            return true;
        } else {
            return false;
        }
    }

    function uncheck(index) {

        $(".sichtbarkeit").each(function () {
            if ($(this).val() == String.fromCharCode(65+parseInt(index))&& ! $(this).parent().hasClass("versteckt")) {

                $(this).parent().find(".markieren").removeClass("aktiv");

            }
        });
    }*/
    
    function checkAll2(){
        var aktivZaehler=new Array(27);
        var insgesamt=new Array(27);
        for (var i=0;i<27;i++){
            aktivZaehler[i]=0;
            insgesamt[i]=0;
        }
       
        $(".ebenenAnzeige").each(function(){
            if (! $(this).parent().hasClass("versteckt")){
                var bs=$(this).attr("aktiv").toUpperCase();
                
                for (var i=0;i<bs.length;i++){
                    insgesamt[bs.charCodeAt(i)-64]++;
                    
                }
                if ($(this).parent().find(".markieren").hasClass("aktiv")) {
                    for (var i=0;i<bs.length;i++){
                    aktivZaehler[bs.charCodeAt(i)-64]++;
                    
                }
                    }
            }
        });
        return [aktivZaehler,insgesamt];
    }

    /*function checkAll(index) {
        var rg = true;
        var zaehler = 0;
        $(".sichtbarkeit").each(function () {
            if ($(this).val() == String.fromCharCode(65+parseInt(index))&& ! $(this).parent().hasClass("versteckt")) {
                zaehler++;
                if (!$(this).parent().find(".markieren").hasClass("aktiv")) {
                    if (rg == true) {
                        rg = false;
                    }
                }
            }
        });
        if (zaehler > 0 && rg == true) {
            return 2; // komplett
        } else if (zaehler>0&&rg==false){
            return 1; // teilweise
        } else {
            return 0; // kein einziger gewählt
        }
    }*/

    var knoepfe = "<select class='sichtbarkeit'>";
    for (var i = 0; i < 27; i++) {
        if (i == 0) {
            knoepfe += "<option selected sichtbarkeit='" + i + "'>" + String.fromCharCode(64+i) + "</option> ";
        } else {
            knoepfe += "<option sichtbarkeit='" + i + "'>" + String.fromCharCode(64+i) + "</option> ";

        }
    }
    knoepfe += "</select>";
    
    var knoepfe2="<select class='folientyp'>";
    knoepfe2+="<option selected folientyp='0'>=</option>"; // element kommt mit auf folie
    knoepfe2+="<option folientyp='1'>+</option>"; // neue folie
    knoepfe2+="<option folientyp='2'>++</option>"; // neue folie Untertyp
     knoepfe2+="<option folientyp='3'>/</option>"; // neues Fragment
    knoepfe2+="</select>";
    
    $(document).on("change", ".folientyp", function (event) { // im Element speichern
        event.preventDefault();

        var wahlFolientyp=$(this).val();
        $(this).parent().prev(".tshareElement").attr("ft",wahlFolientyp);
    });
    
    $(document).on("change", ".auswahlebene", function (event) {
        event.preventDefault();

        var index = parseInt($(this).prop("selectedIndex"));
        if (index > 0) { // es wurde wirklich etwas gewählt
            $(".markieren").each(function () {
                if ($(this).hasClass("aktiv")) {
                    $(this).parent().find(".sichtbarkeit").val("" + String.fromCharCode(64+index));
                }
            });

        }
        $(this).val("-");
        updateWahl();
    });

    function zeigeHashTags(hash){
        var allesSichtbar=false;
        if (hash.toUpperCase().startsWith("TAGS_")){
            hash=hash.split("_")[1];
    if (hash==""){
        allesSichtbar=true;
    }
    $(".tshareElement").each(function(){
        var sb=$(this).attr("sb");
        if (sb==null||sb==""){
            sb="@";
        }
        var treffer=-1;
        for (var i=0;i<hash.length;i++){
            if (sb.includes(hash.charAt(i))){
                treffer=i;
                i=hash.length;
            }
        }
        if (treffer>=0||allesSichtbar==true){ // ist in element enthalten
            $(this).attr("style","display:true;");
            $(this).next().attr("style","display:true");
            $(this).removeClass("versteckt");
            $(this).next().removeClass("versteckt");
            $(this).next().find(".markieren").removeClass("versteckt");
        } else {
            $(this).attr("style","display:none;");
            $(this).next().attr("style","display:none");
            $(this).removeClass("versteckt").addClass("versteckt");
            $(this).next().removeClass("versteckt").addClass("versteckt");
            $(this).next().find(".markieren").removeClass("versteckt").addClass("versteckt");
        }
    });
        updateWahl();
        $("#hideShow").removeClass("komplett").addClass("komplett");
        }
    }
    
    $(window).on('hashchange', function() {
    var hash=location.hash.substring(1).toUpperCase();
        zeigeHashTags(hash);
    }
                 
        //history.pushState({"or":hash});
        //location.hash="";
    
);
    
    $(document).on("change", ".sichtbarkeit", function (event) {
        event.preventDefault();
        var index = parseInt($(this).prop("selectedIndex"));
        $(this).parent().prev().attr("sichtbarkeit", index);
        updateSichtbarkeit();
        updateWahl();
    });

    function updateSichtbarkeit() {
        $(".tshareElement").each(function () {
            var sichtbarkeitsebene = parseInt($(this).attr("sichtbarkeit"));
            if (sichtbarkeiten[sichtbarkeitsebene] == 0) {
                $(this).attr("visibility", "hidden");
            } else {
                $(this).removeAttr("visibility");
            }
        });
    }
    //knoepfe=""; // sichtbarkeit später einbauen

    var bildURL=zeichneEbenenUebersicht("@");
    
    var dropdown="<span class='dropdown'><button onclick='myFunction()' class='dropbtn'>Dropdown</button><div id='myDropdown' class='dropdown-content'><a href='#'>Link 1</a><a href='#'>Link 2</a><a href='#'>Link 3</a></div></span>"
    
    var knopfJS = "<span class='menuBar'><button class='loeschen imageTonne oben'></button><button class='markieren imageSelect oben' lastClick='0'></button><button class='kopiereAbschnitt imageCopy oben'></button>" + knoepfe2+bildURL+"<button class='einfuegen imageInsertInternal unten'></button><button class='einfuegenClipboard imagePaste unten'></button><button class='neueZeichenflaeche imageJournal unten' ></button><button class='pdf imagePDF unten'></button><button class='markdownEinfuegen imageNew unten'></button><button class='bildEinfuegen imageOpen unten'></button></span>";
        var knopfJS2 = "<span class='menuBar'><button class='loeschen imageTonne oben'></button><button class='markieren imageSelect oben' lastClick='0'></button><button class='kopiereAbschnitt imageCopy oben'></button>" + knoepfe2 + "<button class='imagePen editPart oben'></button>"+bildURL+"<button class='einfuegen imageInsertInternal unten'></button><button class='einfuegenClipboard imagePaste unten'></button><button class='neueZeichenflaeche imageJournal unten' ></button><button class='pdf imagePDF unten'></button><button class='markdownEinfuegen imageNew unten'></button><button class='bildEinfuegen imageOpen unten'></button></span>";

    //$("body").html("<button id='druckansicht'>Druckansicht</button><button id='speichern'>Speichern</button><br><button class='neueZeichenflaeche' >Neue Zeichenfläche</button>");
    //QreatorBezier.init("#zeichnen");


    function updateWahl() {
        
        var rg=checkAll2();
        var aktivZaehler=rg[0];
        var insgesamt=rg[1];
        
        
        
        for (var i = 0; i < 27; i++) {
        
            if (insgesamt[i]>0&&aktivZaehler[i]==insgesamt[i]) {
                $("[wahl='" + i + "']").removeClass("komplett").addClass("komplett");
                $("[wahl='" + i + "']").attr("style","display:true");
            } else if (insgesamt[i]>0&&aktivZaehler[i]<insgesamt[i]){
                $("[wahl='" + i + "']").removeClass("komplett");
                $("[wahl='" + i + "']").attr("style","display:true");
                
            } else if (insgesamt[i]==0){
                $("[wahl='" + i + "']").removeClass("komplett");
                $("[wahl='" + i + "']").attr("style","display:none");
            }
        }
    }

    function left() {
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

    function right() {
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

    function top() {
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

    function bottom() {
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
    
    $(document).on("click","#hideShow",function(){
        raeumeAuf();
        if ($(this).hasClass("komplett")){
            $(".tshareElement").each(function(){
               $(this).attr("style","display:true"); 
                $(this).removeClass("versteckt");
            });
            $(".menuBar").each(function(){
               $(this).attr("style","display:true"); 
                $(this).removeClass("versteckt");
                $(this).find(".markieren").removeClass("versteckt");
            });
            $(this).removeClass("komplett");
            location.hash="";
        } else { // alle durchgehen, die unmarkiert sind
            $(".markieren").each(function(){
                if (!$(this).hasClass("aktiv")){
                    $(this).parent().prev(".tshareElement").attr("style","display:none");
                    $(this).parent().attr("style","display:none");
                    $(this).parent().removeClass("versteckt").addClass("versteckt");
                    $(this).removeClass("versteckt").addClass("versteckt"); $(this).parent().prev(".tshareElement").removeClass("versteckt").addClass("versteckt");
                }
                
            });
            $(this).addClass("komplett");
        }
        updateWahl();
    });

    $(document).ready(function () {
        new Clipboard('#kopieren', {
            text: function (trigger) {
                return holeMarkierteAbschnitteAlsString();
            }
        });
        
        
        
        
        
        new Clipboard('.kopiereAbschnitt', {
            text: function (trigger) {

                raeumeAuf();
                var clipboardIntern = "";
                var klasse = "";
                var tshareElement = $(trigger).parent().prev();
                if (tshareElement.hasClass("markdown")) {
                    klasse = "markdown adoccss";
                     clipboardIntern = "<div class='tshareElement " + klasse + "'>" + $(trigger).parent().prev().html() + "</div>" + knopfJS2;
                } else if (tshareElement.hasClass("zeichenflaeche")) {
                    klasse = "zeichenflaeche zeichenflaecheKlick";
                     clipboardIntern = "<div class='tshareElement " + klasse + "'>" + $(trigger).parent().prev().html() + "</div>" + knopfJS;
                } else if (tshareElement.hasClass("datei")) {
                    klasse = "datei";
                     clipboardIntern = "<div class='tshareElement " + klasse + "'>" + $(trigger).parent().prev().html() + "</div>" + knopfJS;
                }
                
                clipboard = clipboardIntern;
                return magicString + clipboardIntern;
            }
        });



        knoepfe = "";

        for (var i = 0; i < 27; i++) {
            knoepfe += "<button class='wahl allgemein knopfStandard' wahl='" + i + "' >" +
                String.fromCharCode(64+i) +
                "</button>"
            //+<input type='checkbox' name='layer' id='checkbox_"
            //+ i + "' value='" + i
            //+ "' class='check' checked='checked'>
            //"</input>";

        }
        $("#ebenenwahl").html(knoepfe);


        // noch alle ebenenknoepfe setzen, falls datei sich selbst öffnet
        
        $(".tshareElement").each(function(){
           var ft=$(this).attr("ft");
            if (ft==null||ft==""){
                ft="=";
            } 
            $(this).next().find(".folientyp").val(ft);
        });
        
       /* for (var i = 0; i < 27; i++) {
            if (i == 0) {
                auswahlebenen += "<option selected auswahl='-'>-</option> ";
            } else {
                auswahlebenen += "<option auswahl='" + (i - 1) + "'>" + String.fromCharCode(64+i) + "</option> ";

            }
        }
        auswahlebenen += "</select>";

        $("#ebenenzuweisung").html(auswahlebenen);*/
        /*
        var hash=location.hash.substring(1).toUpperCase();
        zeigeHashTags(hash);*/ // nur in gespeicherter Datei
        updateWahl();
        //$("#menuCommon").append(auswahlebenen).append(knoepfe);

    });

    



    window.addEventListener("beforeunload", function (e) {
        var confirmationMessage = "Eventuelle Änderungen am Dokument könnten verloren gehen!";

        e.returnValue = confirmationMessage; // Gecko, Trident, Chrome 34+
        return confirmationMessage; // Gecko, WebKit, Chrome <34
    });

    document.addEventListener('paste', handlePaste, false);

    //$(document).bind("paste", function(e){
    //var evt=e.originalEvent;
    function handlePaste(evt) {
        if ($("#rahmen").length == 1 && $(".transparent").length == 0) {
            var fileList = evt.clipboardData.items; // Note that window.DataTransfer.files is not applicable.

            if (!fileList) {
                console.log("fileList is null.");
                return;
            }

            for (var i = 0; i < fileList.length; i++) {
                var file = fileList[i];
                if (file.type.startsWith("image/")) {
                    var datei = file.getAsFile();
                    var fileReader = new FileReader();
                    fileReader.onload = function (e) {


                        aktuellesBild = new Image();
                        aktuellesBild.onload = function () {
                            //ctx.drawImage(this,0,0);
                            //var pngString=canvas.toDataURL();  // bild erst skalieren
                            zeichenbreite = 0, zeichenhoehe = 0;
                            hochkant = true;
                            if (this.width > this.height) {
                                hochkant = false;
                            }

                            if (hochkant == true) {
                                zeichenhoehe = Math.min(hoehe, this.height);
                                if (zeichenhoehe < hoehe) {
                                    zeichenhoehe = hoehe;
                                }
                                zeichenbreite = this.width * zeichenhoehe / this.height;
                                if (zeichenbreite > breite) {
                                    zeichenhoehe = zeichenhoehe * breite / zeichenbreite;
                                    zeichenbreite = breite;
                                    hochkant = false;
                                }
                            } else {
                                zeichenbreite = Math.min(breite, this.width);
                                if (zeichenbreite < breite) {
                                    zeichenbreite = breite;
                                }
                                zeichenhoehe = this.height * zeichenbreite / this.width;
                                if (zeichenhoehe > hoehe) {
                                    zeichenbreite = zeichenbreite * hoehe / zeichenhoehe;
                                    zeichenhoehe = hoehe;
                                    hochkant = true;
                                }
                            }

                            $("body").append("<div class='transparent'></div>");
                            $(".transparent").append("<div class='fenster'><div id='parameter'></div><button id='abbrechenBild'>Abbrechen</button></div>");

                            if (hochkant == false) {
                                $(".fenster #parameter").html("<br>Breite (in Prozent von Abschnittsbreite): <input typ='breite' class='parameter' type='range' min='0' max='100' value='" + parseInt(zeichenbreite * 100 / breite) + "'></input><span id='breite'>" + parseInt(zeichenbreite * 100 / breite) + "</span>%, Höhe:<span id='hoehe'>" + parseInt(zeichenhoehe * 100 / hoehe) + "</span>%");
                            } else {
                                $(".fenster #parameter").html("<br>Höhe (in Prozent von Abschnittshöhe): <input typ='hoehe' class='parameter' type='range' min='0' max='100' value='" + parseInt(zeichenhoehe * 100 / hoehe) + "'></input><span id='hoehe'>" + parseInt(zeichenhoehe * 100 / hoehe) + "</span>%, Breite: <span id='breite'>" + parseInt(zeichenbreite * 100 / breite) + "</span>%");

                            }
                            $(".fenster #parameter").append("<br>x-Position links oben:  <input typ='x' class='parameter' type='range' min='0' max='100' value='0'></input><span id='xpos'>0</span><button class='mittig' typ='links'>linksbündig</button><button class='mittig' typ='xmitte'>horizontal zentrieren</button><button class='mittig' typ='rechts'>rechtsbündig</button>");
                            $(".fenster #parameter").append("<br>y-Position links oben:  <input typ='y' class='parameter' type='range' min='0' max='100' value='0'></input><span id='ypos'>0</span><button class='mittig' typ='oben'>oben bündig</button><button class='mittig' typ='ymitte'>vertikal zentrieren</button><button class='mittig' typ='unten'>unten bündig</button>");
                            $(".fenster #parameter").append("<br><button id='bildEinfuegen'>Bild einfügen</button>");
                            QreatorBezier.ladeBild(aktuellesBild, 0, 0, zeichenbreite, zeichenhoehe, false);

                            //QreatorBezier.ladeBild(this);
                            //$(".transparent").remove();
                        }
                        aktuellesBild.src = e.target.result;
                        // ctx.drawImage(img, 0, 0, 400, 300);   



                    };
                    fileReader.onerror = function (e) {
                        console.log(e.target.error.name);
                    };
                    fileReader.onprogress = function (e) {
                        console.log(e.loaded, e.total);
                    };
                    fileReader.readAsDataURL(datei);

                }


            } // for
        }
    } // handlePaste
    //);

    function holeZeitstempel() {
        var jetzt = new Date();
        var monat = jetzt.getMonth() + 1;
        var monatsstring = "";
        if (monat < 10) {
            monatsstring = "0";
        }
        monatsstring += monat;

        var tag = jetzt.getDate();
        var tagesstring = "";
        if (tag < 10) {
            tagesstring = "0";
        }
        tagesstring += tag;

        var stundenstring = "";
        var stunde = jetzt.getHours();
        if (stunde < 10) {
            stundenstring = "0";
        }
        stundenstring += stunde;

        var minutenstring = "";
        var minute = jetzt.getMinutes();
        if (minute < 10) {
            minutenstring = "0";
        }
        minutenstring += minute;

        var sekundenstring = "";
        var sekunde = jetzt.getSeconds();
        if (sekunde < 10) {
            sekundenstring = "0";
        }
        sekundenstring += sekunde;
        return "" + (1900 + jetzt.getYear()) + monatsstring + tagesstring + "_" + stundenstring + minutenstring + sekundenstring;
    }

    $("#speichern").click(function () {
        raeumeAuf();

        $("body").append("<div class='transparent'></div>");
        var platzhalter = aktuellerDateiname;
        if (aktuellerDateiname == "") {
            platzhalter = "Notiz";
        }
        $(".transparent").append("<div class='fenster'>Speichern der aktuellen Datei (Zeitstempel und Endung werden angehängt)<br>Dateiname: <input type='text' id='dateiname' value='" + platzhalter + "'></input><input type='checkbox' id='checkEditor'>Editor in Datei einbetten</input><br><button id='speichereDatei'>Speichern</button><button id='abbrechen'>Abbrechen</button></div>");


    });
    
    $("#slideshow").click(function () {
        raeumeAuf();

        $("body").append("<div class='transparent'></div>");
        var platzhalter = aktuellerDateiname;
        if (aktuellerDateiname == "") {
            platzhalter = "Slideshow";
        }
        $(".transparent").append("<div class='fenster'>Speichern / Zeigen der aktuellen Slideshow (Zeitstempel und Endung werden beim Speichern angehängt)<br>Dateiname: <input type='text' id='dateiname' value='" + platzhalter + "'></input><br><button id='speichereSlideshow'>Speichern</button><button id='zeigeSlideshow'>Zeigen</button><button id='abbrechen'>Abbrechen</button></div>");


    });

    $("#menuansicht").click(function () {
        $("body").append("<div class='transparent'></div>");
        $(".transparent").append("<div class='fenster'>Position des Menüs wählen:<br><button class='menu-position' position='left'>Menü links</button><button class='menu-position' position='top'>Menü oben</button><button class='menu-position' position='bottom'>Menü unten</button><button class='menu-position' position='right'>Menü rechts</button><br><button id='abbrechen'>Abbrechen</button></div>");
        $(".fenster").append('<p>Info:<br><div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a>, <a href="http://www.flaticon.com/authors/yannick" title="Yannick">Yannick</a>, <a href="http://www.flaticon.com/authors/picol" title="Picol">Picol</a>, <a href="http://www.flaticon.com/authors/situ-herrera" title="Situ Herrera">Situ Herrera</a>, <a href="https://www.flaticon.com/authors/google" title="Google">Google</a>, <a href="http://www.flaticon.com/authors/freepik">freepik</a>, <a href="http://www.flaticon.com/authors/egor-rumyantsev" title="Egor Rumyantsev">Egor Rumyantsev</a>, <a href="http://fontawesome.io/" title="Dave Gandy">Dave Gandy</a>, <a href="https://www.flaticon.com/authors/appzgear" title="Appzgear">Appzgear</a>, <div>Icons made by <a href="https://www.flaticon.com/authors/dave-gandy" title="Dave Gandy">Dave Gandy</a> from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a> licensed by <a href="http://creativecommons.org/licenses/by/3.0/" title="Creative Commons BY 3.0">CC BY 3.0</a></div>');


    });
    
    function zeichneEbenenUebersicht(buchstaben){
        var c = document.createElement('canvas');
        buchstaben=buchstaben.toUpperCase();
        var gctxt=c.getContext("2d");
        c.height=35;
        c.width=106;
        gctxt.font ="10px Sans-Serif";
        gctxt.fillStyle="#ffff00";
        //gctxt.fillRect(0,0,106,35);
        gctxt.fillStyle="#000000";
        for (var i=0;i<27;i++){
            if (buchstaben.includes(String.fromCharCode(64+i))){
                gctxt.fillStyle="#ffffaa";
                gctxt.fillRect((i%9)*12,12*parseInt(i/9),12,12);
                gctxt.fillStyle="#000000";
            } else {
                gctxt.fillStyle="#aaaaaa";
            }
            
                gctxt.fillText(String.fromCharCode(64+i),2+(i%9)*12,10+12*parseInt(i/9));
            
        }
        var aktivString="";
        for (var i=0;i<buchstaben.length;i++){
            if (!aktivString.includes(buchstaben.charAt(i))){
                aktivString+=buchstaben.charAt(i);
            }
        }
        return "<span class='ebenenAnzeige' aktiv='"+aktivString+"'><img src='" + c.toDataURL() + "'   ></img></span>";
    }
    
    function erstelleEbenenKnoepfe(buchstaben){
        var ebenenKnoepfe="<div>";
        for (var i=0;i<27;i++){
            var aktivString="";
            if (buchstaben.includes(String.fromCharCode(64+i))){
                aktivString="aktiv";
            }
            ebenenKnoepfe+="<button id='bs_"+i+"' class='ebenenknopf "+aktivString+"'>"+String.fromCharCode(64+i)+"</button>";
            if ((i+1)%9==0){
                ebenenKnoepfe+="<br>";
            }
        }
        ebenenKnoepfe+="</div>";
        
        return ebenenKnoepfe;
    }
    
    $(document).on("click",".ebenenknopf",function(){
        $(this).toggleClass("aktiv");
    });
    
    $(document).on("click","#ebeneOK",function(){
        var aktivString="";
        for (var i=0;i<27;i++){
            if ($("#bs_"+i).hasClass("aktiv")){
                aktivString+=String.fromCharCode(64+i);
            }
        }
        var neuesBild=zeichneEbenenUebersicht(aktivString); // ebenenuebersicht neu erstellen
        $("#ebenenAenderung").parent().prev(".tshareElement").attr("sb",aktivString);
        $("#ebenenAenderung").wrap("<span id='ersetzung'></span>");
        $("#ersetzung").html(neuesBild);
        $("#ersetzung .ebenenAnzeige").unwrap(); // neues Bild einfügen
        $(".transparent").remove();
        updateWahl();
    });
    
    $(document).on("click","#ebeneAbbrechen",function(){
        $("#ebenenAenderung").removeAttr("id");
        $(".transparent").remove();
    });
    
    $(document).on("click","#ebeneAlle",function(){
        for (var i=0;i<27;i++){
            $("#bs_"+i).removeClass("aktiv").addClass("aktiv");
        }
    });
    
        $(document).on("click","#ebeneKeine",function(){
        for (var i=0;i<27;i++){
            $("#bs_"+i).removeClass("aktiv");
        }
    });
    
         $(document).on("click","#ebeneInvertiere",function(){
        for (var i=0;i<27;i++){
            $("#bs_"+i).toggleClass("aktiv");
        }
    });
    
    
    $(document).on("click",".ebenenAnzeige",function(){
        $(this).attr("id","ebenenAenderung");
        $("body").append("<div class='transparent'></div>");
        var ebenenKnoepfe=erstelleEbenenKnoepfe($(this).attr("aktiv"));
        $(".transparent").append("<div class='fenster'>"+ebenenKnoepfe+"<br><button id='ebeneAlle'>Alle wählen</button><button id='ebeneKeine'>Alle abwählen</button><button id='ebeneInvertiere'>Auswahl invertieren</button><br><button id='ebeneOK'>OK</button><button id='ebeneAbbrechen'>Abbrechen</button></div>");
    });

    function sammelSchriften(speicherAlles) {
        var gesamtText = "";
        var tags = [".katex .delimsizing.size1", ".katex .delimsizing.size2", ".katex .delimsizing.size3", ".katex .delimsizing.size4", ".katex .delimsizing.mult .delim-size1 > span", ".katex .delimsizing.mult .delim-size4 > span", ".katex .op-symbol.small-op", ".katex .op-symbol.large-op", ".katex .mathit", ".katex .mathbf", ".katex .amsrm", ".katex .mathbb", ".katex .mathcal", ".katex .mathfrak", ".katex .mathtt", ".katex .mathscr", ".katex .mathsf", ".katex .mainit"];
        var schriften = ["KaTeX_Size1", "KaTeX_Size2", "KaTeX_Size3", "KaTeX_Size4", "KaTeX_Size1", "KaTeX_Size4", "KaTeX_Size1", "KaTeX_Size2", "KaTeX_Main", "KaTeX_Main", "KaTeX_Math", "KaTeX_Main", "KaTeX_AMS", "KaTeX_AMS", "KaTeX_Caligraphic", "KaTeX_Fraktur", "KaTeX_Typewriter", "KaTeX_Script", "KaTeX_SansSerif", "KaTeX_Main"]


        for (var i = 0; i < tags.length; i++) {
            var tagzaehler = 0;
            $(tags[i]).each(function () {
                var speichern = false;
                $(this).parents(".tshareElement").next().find(".markieren").each(function () {
                    speichern = $(this).hasClass("aktiv");
                });
                if (speichern == true || speicherAlles == true) {
                    tagzaehler++;
                }
            });
            //console.log("Tag "+tags[i]+": "+tagzaehler+", Font: "+schriften[i]);
            tags[i] = tagzaehler;
        }
        var schriftenMenge = new Set();
        for (var i = 0; i < tags.length; i++) {
            if (tags[i] > 0) {
                schriftenMenge.add(schriften[i]);
            }
        }
        if (schriftenMenge.size > 0) {
            schriftenMenge.add("KaTeX_Main");
            schriftenMenge.add("KaTeX_Math");
        }
        var arraySchriften = Array.from(schriftenMenge);
        console.log("Schriften: ");
        var schriftenText = "";
        var cssKatex = $("#katexStyle").text().split("/* KateX_Fonts END */");
        var schriften = cssKatex[0].split("/**/");
        for (var i = 0; i < arraySchriften.length; i++) {
            var item = arraySchriften[i];
            for (var j = 0; j < schriften.length; j++) {
                if (schriften[j].indexOf(item) != -1) {
                    schriftenText += schriften[j].trim();
                }
            }
        }

        gesamtText = schriftenText + cssKatex[1];
        /*if (schriftenMenge.size>0){
            gesamtText+=cssKatex[1];
        }*/
        return gesamtText;
    }

    $(document).on("click", ".editPart", function () {
        var p = $(this).parent().prev();
        if (p.hasClass("markdown")) {
            raeumeAuf();
            var originalText = p.find(".originaltext").text();
            // "<div class='markdown' id='markdown'></div>"
            p.attr("id", "markdown");
            p.removeClass("adoccss");
            bearbeitungAn = true;
            bearbeitungsTyp = "markdown";
            Textabschnitt.init("#markdown", "#menu", originalText);
        } else if (p.hasClass("zeichenflaeche")) {
            raeumeAuf();
            var text = p.html();
            p.removeClass("zeichenflaecheKlick");

            // $(this).removeClass("zeichenflaeche"); // sonst immer auf klick reagieren
            bearbeitungAn = true;
            bearbeitungsTyp = "zeichenflaeche";
            var zeichenbreite = parseInt(p.find("svg").attr("width"));
            var zeichenhoehe = parseInt(p.find("svg").attr("height"));
            // console.log("Breite aus svg: "+$(this).find("svg").attr("width"));
            QreatorBezier.init(p, zeichenbreite, zeichenhoehe, "#menu", true); // hier auch anpassen

            // $(this).after("<button class='neueZeichenflaeche' >Neue Zeichenfläche</button>");
            QreatorBezier.loadSVG(text);
        }
    });

    $(document).on("click", "#speichereDatei", function () {
        var dateiname = $("#dateiname").val();
        var editorSpeichern = $("#checkEditor").prop("checked");
        if (dateiname != null) {
            if (dateiname == "") {
                dateiname = "Notiz";
            }

            // var js="<script>function nextLayer(evt){var a =evt.firstChild;var zaehler=0;for (var i=0;i<10;i++){var element=a.getElementById('layer_'+i);if (element!=null&&element.getAttribute('visibility')=='hidden'){element.setAttribute('visibility','visible');  break;}zaehler++;}if (zaehler==10){for (var i=0;i<10;i++){var element=a.getElementById('layer_'+i);if (element!=null) {element.setAttribute('visibility','hidden');  } } for (var i=0;i<10;i++){ var element=a.getElementById('layer_'+i);if (element!=null&&element.getAttribute('visibility')=='hidden'){ element.setAttribute('visibility','visible');break; }}}}</script>";

            var js = "PHNjcmlwdD5mdW5jdGlvbiBuZXh0TGF5ZXIoZXZ0KXt2YXIgYSA9ZXZ0LmZpcnN0Q2hpbGQ7dmFyIHphZWhsZXI9MDtmb3IgKHZhciBpPTA7aTwxMDtpKyspe3ZhciBlbGVtZW50PWEuZ2V0RWxlbWVudEJ5SWQoJ2xheWVyXycraSk7aWYgKGVsZW1lbnQhPW51bGwmJmVsZW1lbnQuZ2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5Jyk9PSdoaWRkZW4nKXtlbGVtZW50LnNldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScsJ3Zpc2libGUnKTsgIGJyZWFrO316YWVobGVyKys7fWlmICh6YWVobGVyPT0xMCl7Zm9yICh2YXIgaT0wO2k8MTA7aSsrKXt2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsKSB7ZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3Zpc2liaWxpdHknLCdoaWRkZW4nKTsgIH0gfSBmb3IgKHZhciBpPTA7aTwxMDtpKyspeyB2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsJiZlbGVtZW50LmdldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScpPT0naGlkZGVuJyl7IGVsZW1lbnQuc2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5JywndmlzaWJsZScpO2JyZWFrOyB9fX19PC9zY3JpcHQ+";


            aktuellerDateiname = dateiname;
            var anhang = holeZeitstempel();
            $(".transparent").remove();
            if (editorSpeichern == true) {
                var blob = new Blob(["<!DOCTYPE html>" + $("html").html() + "</html>"], {
                    type: "text/html;charset=utf-8"
                });
                saveAs(blob, dateiname + "_Editor_" + anhang + ".html");
            } else {
                var code = "";
                var textElementZaehler = 0;
                var dateiElementZaehler = 0;

                // zähle markierte Elemente

                var elementZaehler = 0;
                var markiertZaehler = 0;
                var speicherAlles = false;
                $(".tshareElement").each(function () {
                    elementZaehler++;
                    $(this).next().find(".markieren").each(function () {
                        if ($(this).hasClass("aktiv")) {
                            markiertZaehler++;
                        }
                    });
                });
                if (elementZaehler > 0 && markiertZaehler == 0) {
                    speicherAlles = true;
                }

                $(".tshareElement").each(function () {
                    //code+=$(this).html()+"\n";
                    var speichern = false;

                    // Beginn Sichtbarkeit speichern
                    var sichtbarkeitsebene = "sb='" + $(this).next().find(".ebenenAnzeige").attr("aktiv") + "'";
                    
                    var folientyp = " ft='" + $(this).next().find(".folientyp :selected").text() + "' ";
                    // Ende Sichtbarkeit speichern

                    $(this).next().find(".markieren").each(function () {
                        speichern = $(this).hasClass("aktiv");
                    });
                    if (speicherAlles == true) {
                        speichern = true; // falls alles gespeichert wird, entsprechend markieren
                    }
                    if (speichern == true) {
                        if ($(this).hasClass("zeichenflaeche")) {
                            code += "<div " + sichtbarkeitsebene + folientyp+" class='zeichenflaeche tshareElement' onClick='nextLayer(this)' >" + $(this).html() + "</div>\n";
                        } else if ($(this).hasClass("markdown")) {
                            code += "<div " + sichtbarkeitsebene +folientyp+ " class='markdown tshareElement adoccss'>" + $(this).html() + "</div>\n";
                            textElementZaehler++;
                        } else if ($(this).hasClass("datei")) {
                            dateiElementZaehler++;
                            code += "<div " + sichtbarkeitsebene +folientyp+ " class='datei tshareElement'>" + $(this).html() + "</div>\n";
                        } else if ($(this).hasClass("toc")) {
                            code += "<div " + sichtbarkeitsebene + folientyp+" class='toc tshareElement adoccss'>" + $(this).html() + "</div>\n";
                            textElementZaehler++;
                        }
                    }

                });
                var gesamtText = "";
                var asciidoctorText = "";
                if (textElementZaehler > 0) {
                    gesamtText = sammelSchriften(speicherAlles);
                    asciidoctorText = $("#asciidoctorstyle").text();


                } else if (dateiElementZaehler > 0) {
                    asciidoctorText = $("#asciidoctorstyle").text();
                }
                var header = "<meta name='description' content='Journal for HTML' ><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
                var blob = new Blob(["<!DOCTYPE html><head>" + header + window.atob(js) + "<script>" + window.atob(saveAs64) + "\n" + window.atob(saveObject64) +$("#jqueryminified").text()+ window.atob(hash64)+"</script><style>" + gesamtText + asciidoctorText + "</style></head><body>" + code + "</body></html>"], {
                    type: "text/html;charset=utf-8"
                });
                saveAs(blob, dateiname + "_" + anhang + ".html");
            }

        }

        //window.open("data:text/csv,<!DOCTYPE html><html>"+$("html").html()+"</html>");
        //var blob = new Blob(["<!DOCTYPE html><html>"+$("html").html()+"</html>"], {type: "text/html;charset=utf-8"});
        //saveAs(blob, "hello world.html");
    });
    
    $(document).on("click","#zeigeSlideshow",function(){
        slideShow(false);
    });
    
    $(document).on("click","#speichereSlideshow",function(){
        slideShow(true);
    });
    
    function slideShow(speichern){
         var dateiname = $("#dateiname").val();
        
        if (dateiname != null) {
            if (dateiname == "") {
                dateiname = "Slideshow";
            }
        }

            // var js="<script>function nextLayer(evt){var a =evt.firstChild;var zaehler=0;for (var i=0;i<10;i++){var element=a.getElementById('layer_'+i);if (element!=null&&element.getAttribute('visibility')=='hidden'){element.setAttribute('visibility','visible');  break;}zaehler++;}if (zaehler==10){for (var i=0;i<10;i++){var element=a.getElementById('layer_'+i);if (element!=null) {element.setAttribute('visibility','hidden');  } } for (var i=0;i<10;i++){ var element=a.getElementById('layer_'+i);if (element!=null&&element.getAttribute('visibility')=='hidden'){ element.setAttribute('visibility','visible');break; }}}}</script>";

            var js = "PHNjcmlwdD5mdW5jdGlvbiBuZXh0TGF5ZXIoZXZ0KXt2YXIgYSA9ZXZ0LmZpcnN0Q2hpbGQ7dmFyIHphZWhsZXI9MDtmb3IgKHZhciBpPTA7aTwxMDtpKyspe3ZhciBlbGVtZW50PWEuZ2V0RWxlbWVudEJ5SWQoJ2xheWVyXycraSk7aWYgKGVsZW1lbnQhPW51bGwmJmVsZW1lbnQuZ2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5Jyk9PSdoaWRkZW4nKXtlbGVtZW50LnNldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScsJ3Zpc2libGUnKTsgIGJyZWFrO316YWVobGVyKys7fWlmICh6YWVobGVyPT0xMCl7Zm9yICh2YXIgaT0wO2k8MTA7aSsrKXt2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsKSB7ZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3Zpc2liaWxpdHknLCdoaWRkZW4nKTsgIH0gfSBmb3IgKHZhciBpPTA7aTwxMDtpKyspeyB2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsJiZlbGVtZW50LmdldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScpPT0naGlkZGVuJyl7IGVsZW1lbnQuc2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5JywndmlzaWJsZScpO2JyZWFrOyB9fX19PC9zY3JpcHQ+";


            //aktuellerDateiname = dateiname;
            var anhang = holeZeitstempel();
            dateiname=dateiname+"_"+anhang+".html";
            $(".transparent").remove();
        var code = "";
        var precode="";
        var postcode="";
        var textElementZaehler = 0;
        var dateiElementZaehler = 0;

        // zähle markierte Elemente

        var elementZaehler = 0;
        var markiertZaehler = 0;
        var speicherAlles = false;
        var baumebene=0; // 0 keine section, 1 section erste stufe, 2 section zweiter stufe
        $(".tshareElement").each(function () {
            elementZaehler++;
            $(this).next().find(".markieren").each(function () {
                if ($(this).hasClass("aktiv")) {
                    markiertZaehler++;
                }
            });
        });
        if (elementZaehler > 0 && markiertZaehler == 0) {
            speicherAlles = true;
        }

        $(".tshareElement").each(function () {
            //code+=$(this).html()+"\n";
            var speichern = false;

            // Beginn Sichtbarkeit speichern
            var sichtbarkeitsebene = "sb='" + $(this).next().find(".ebenenAnzeige").attr("aktiv") + "'";
            // Ende Sichtbarkeit speichern
            
            var folientyp = " ft='" + $(this).next().find(".folientyp :selected").text() + "' ";

            $(this).next().find(".markieren").each(function () {
                speichern = $(this).hasClass("aktiv");
            });
            
            var slidetype="=";
            $(this).next().find(".folientyp").each(function () {
                slidetype = $(this).val();
            });
            
            if (slidetype=="="){
                precode="";
                postcode="";
            } else if (slidetype=="+"){
                if (baumebene==0){
                precode="<section>";
                
                } else if (baumebene==1){
                    precode="</section><section>";
                    
                } else if (baumebene==2){
                    precode="</section></section><section>";
                    
                }
                postcode="";
                baumebene=1;
            }else if (slidetype=="++"){
                if (baumebene==0){
                    precode="<section><section>";
                    
                } else if (baumebene==1){
                    precode="</section><section><section>";
                    
                } else if (baumebene==2){
                    precode="</section><section>";
                }
                baumebene=2;
                postcode="";
            } else if (slidetype=="/"){
                precode="<span class='fragment'>";
                postcode="</span>";
            }
            
            
            
            if (speicherAlles == true) {
                speichern = true; // falls alles gespeichert wird, entsprechend markieren
            }
            if (speichern == true) {
                if ($(this).hasClass("zeichenflaeche")) {
                    code += precode+"<div " + sichtbarkeitsebene + folientyp+" class='zeichenflaeche tshareElement' onClick='nextLayer(this)' >" + $(this).html() + "</div>\n"+postcode;
                } else if ($(this).hasClass("markdown")) {
                    code += precode+"<div " + sichtbarkeitsebene + folientyp+" class='markdown tshareElement adoccss'>" + $(this).html() + "</div>\n"+postcode;
                    textElementZaehler++;
                } else if ($(this).hasClass("datei")) {
                    dateiElementZaehler++;
                    code += precode+"<div " + sichtbarkeitsebene + folientyp+" class='datei tshareElement'>" + $(this).html() + "</div>\n"+postcode;
                } else if ($(this).hasClass("toc")) {
                    code += precode+"<div " + sichtbarkeitsebene + folientyp+" class='toc tshareElement adoccss'>" + $(this).html() + "</div>\n"+postcode;
                    textElementZaehler++;
                }
            }

        });
        if (baumebene==1){
            code+="</section>";
        } else if (baumebene==2){
            code+="</section></section>";
        }
        var gesamtText = "";
        var asciidoctorText = "";
        if (textElementZaehler > 0) {
            gesamtText = sammelSchriften(speicherAlles);
            asciidoctorText = $("#asciidoctorstyle").text();


        } else if (dateiElementZaehler > 0) {
            asciidoctorText = $("#asciidoctorstyle").text();
        }
        var header = "<meta name='description' content='Journal for HTML' ><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
        if (speichern==false){
            var w = window.open();
        w.document.open();
        w.document.write("<!DOCTYPE html><head>" + header + window.atob(js) + "<script>" + window.atob(saveAs64) + "\n" + window.atob(saveObject64) + "</script><style>" + gesamtText + asciidoctorText + window.atob(revealcss64)+window.atob(serifcss64) +"</style></head><body><div class='reveal'><div class='slides'>" + code + "</div></div><script>"+window.atob(revealjs64)+"</script><script>Reveal.initialize();</script></body></html>");
        } else {
        //w.document.close();
        //window.open("data:text/html,<!DOCTYPE html><html>"+code+"</html>");
        var blob = new Blob(["<!DOCTYPE html><head>" + header + window.atob(js) + "<script>" + window.atob(saveAs64) + "\n" + window.atob(saveObject64) + "</script><style>" + gesamtText + asciidoctorText + window.atob(revealcss64)+window.atob(serifcss64)+ "</style></head><body><div class='reveal'><div class='slides'>" + code + "</div></div><script>"+window.atob(revealjs64)+"</script><script>Reveal.initialize();</script></body></html>"], {
                    type: "text/html;charset=utf-8"
                });
                saveAs(blob, dateiname);
        }
    }
    
    
    
    
    $("#druckansicht").click(function () {

        raeumeAuf();
        //$(".loeschen").hide();
        //$(".neueZeichenflaeche").hide();
        //druckansicht=true;

        // neu: alle svg-teile sammeln und dann in neuem fenster darstellen

        var js = "PHNjcmlwdD5mdW5jdGlvbiBuZXh0TGF5ZXIoZXZ0KXt2YXIgYSA9ZXZ0LmZpcnN0Q2hpbGQ7dmFyIHphZWhsZXI9MDtmb3IgKHZhciBpPTA7aTwxMDtpKyspe3ZhciBlbGVtZW50PWEuZ2V0RWxlbWVudEJ5SWQoJ2xheWVyXycraSk7aWYgKGVsZW1lbnQhPW51bGwmJmVsZW1lbnQuZ2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5Jyk9PSdoaWRkZW4nKXtlbGVtZW50LnNldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScsJ3Zpc2libGUnKTsgIGJyZWFrO316YWVobGVyKys7fWlmICh6YWVobGVyPT0xMCl7Zm9yICh2YXIgaT0wO2k8MTA7aSsrKXt2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsKSB7ZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3Zpc2liaWxpdHknLCdoaWRkZW4nKTsgIH0gfSBmb3IgKHZhciBpPTA7aTwxMDtpKyspeyB2YXIgZWxlbWVudD1hLmdldEVsZW1lbnRCeUlkKCdsYXllcl8nK2kpO2lmIChlbGVtZW50IT1udWxsJiZlbGVtZW50LmdldEF0dHJpYnV0ZSgndmlzaWJpbGl0eScpPT0naGlkZGVuJyl7IGVsZW1lbnQuc2V0QXR0cmlidXRlKCd2aXNpYmlsaXR5JywndmlzaWJsZScpO2JyZWFrOyB9fX19PC9zY3JpcHQ+";

        var code = "";
        var textElementZaehler = 0;
        var dateiElementZaehler = 0;

        // zähle markierte Elemente

        var elementZaehler = 0;
        var markiertZaehler = 0;
        var speicherAlles = false;
        $(".tshareElement").each(function () {
            elementZaehler++;
            $(this).next().find(".markieren").each(function () {
                if ($(this).hasClass("aktiv")) {
                    markiertZaehler++;
                }
            });
        });
        if (elementZaehler > 0 && markiertZaehler == 0) {
            speicherAlles = true;
        }

        $(".tshareElement").each(function () {
            //code+=$(this).html()+"\n";
            var speichern = false;

            // Beginn Sichtbarkeit speichern
            var sichtbarkeitsebene = "sb='" + $(this).next().find(".ebenenAnzeige").attr("aktiv") + "'";
            // Ende Sichtbarkeit speichern
             var folientyp = " ft='" + $(this).next().find(".folientyp :selected").text() + "' ";


            $(this).next().find(".markieren").each(function () {
                speichern = $(this).hasClass("aktiv");
            });
            if (speicherAlles == true) {
                speichern = true; // falls alles gespeichert wird, entsprechend markieren
            }
            if (speichern == true) {
                if ($(this).hasClass("zeichenflaeche")) {
                    code += "<div " + sichtbarkeitsebene + folientyp+" class='zeichenflaeche tshareElement' onClick='nextLayer(this)' >" + $(this).html() + "</div>\n";
                } else if ($(this).hasClass("markdown")) {
                    code += "<div " + sichtbarkeitsebene + folientyp+" class='markdown tshareElement adoccss'>" + $(this).html() + "</div>\n";
                    textElementZaehler++;
                } else if ($(this).hasClass("datei")) {
                    dateiElementZaehler++;
                    code += "<div " + sichtbarkeitsebene + folientyp+" class='datei tshareElement'>" + $(this).html() + "</div>\n";
                } else if ($(this).hasClass("toc")) {
                    code += "<div " + sichtbarkeitsebene + folientyp+" class='toc tshareElement adoccss'>" + $(this).html() + "</div>\n";
                    textElementZaehler++;
                }
            }

        });
        var gesamtText = "";
        var asciidoctorText = "";
        if (textElementZaehler > 0) {
            gesamtText = sammelSchriften(speicherAlles);
            asciidoctorText = $("#asciidoctorstyle").text();


        } else if (dateiElementZaehler > 0) {
            asciidoctorText = $("#asciidoctorstyle").text();
        }
        var header = "<meta name='description' content='Journal for HTML' ><meta charset='utf-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'>";
        var w = window.open();
        w.document.open();
        w.document.write("<!DOCTYPE html><head>" + header + window.atob(js) + "<script>" + window.atob(saveAs64) + "\n" + window.atob(saveObject64) +$("#jqueryminified").text()+ window.atob(hash64)+"</script><style>" + gesamtText + asciidoctorText + "</style></head><body>" + code + "</body></html>");
        //w.document.close();
        //window.open("data:text/html,<!DOCTYPE html><html>"+code+"</html>");




    });




    $(document).on("click", ".menu-position", function () {
        var orientation = $(this).attr("position");
        $(".transparent").remove();
        switch (orientation) {
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

    $(document).on("click", "#recalculate", function () {
        raeumeAuf();
        nerdamer.flush();
        nerdamer.clearVars();
        var ueberschriften = [];

        $("body").append("<div class='transparent'></div>");
        $(".transparent").append("<div class='fenster'>Bitte warten ...</div>");

        var elementZaehler = 0;
        var markiertZaehler = 0;
        var speicherAlles = false;

        $(".tshareElement").each(function () {
            
            elementZaehler++;
            $(this).next().find(".markieren").each(function () {
                if ($(this).hasClass("aktiv")) {
                    markiertZaehler++;
                }
            });
        });
        if (elementZaehler > 0 && markiertZaehler == 0) {
            speicherAlles = true;
        }

        $(".markdownText").each(function () { // alle textelemente durchgehen
            var originaltext = $(this).children(":first").next().text();
            if (speicherAlles == true || $(this).parent(".tshareElement").next().find(".markieren").hasClass("aktiv")) {
                $(this).children(":first").attr("id", "recalculationDiv");
                var bearbeitet = Textabschnitt.recalculate(originaltext, "#recalculationDiv");
                if (bearbeitet != null && bearbeitet.length > 0) {
                    for (var i = 0; i < bearbeitet.length; i++) {
                        ueberschriften.push(bearbeitet[i]);
                    }
                }
                $(this).children(":first").removeAttr("id");
            }
        });
        //console.log("Überschriften: " + ueberschriften);

        // alte überschrift löschen
        var text = "\n== Inhaltsverzeichnis\n\n";
        for (var i = 0; i < ueberschriften.length; i++) {
            text += "[none]\n";
            for (var j = 0; j < ueberschriften[i][0] - 1; j++) {
                text += "*";
            }
            text += " <<" + ueberschriften[i][1] + "," + ueberschriften[i][2] + ">>\n";
        }
        text += "\n\n---";
        var options = Opal.hash2(['header_footer', 'attributes'], {
            'header_footer': false,
            'attributes': ['icons=font']
        });
        var html = Opal.Asciidoctor.$convert(text, options);

        $("#toc").remove();
        $("#tocBar").remove();
        $("#firstMenu").after("<div class='tshareElement toc adoccss' id='toc'><div><div class='adoccss'>" + html + "</div></div></div>" + knopfJS);
        $(".menuBar").first().attr("id", "tocBar");

        $(".transparent").remove();
        updateWahl();


    });

    $(document).on("click", ".neueZeichenflaeche", function () {
        raeumeAuf();
        $(this).parent().after("<div class='zeichenflaeche' id='zeichnung'></div>" + knopfJS); // wo erscheint der neue Abschnitt
        bearbeitungAn = true;
        bearbeitungsTyp = "zeichenflaeche";
        breite = breiteStandard;
        hoehe = hoeheStandard;
        QreatorBezier.init("#zeichnung", breiteStandard, hoeheStandard, "#menu", true); // menu: id der fläche, wo das menü erscheint, true, dass es horizontal ist
        updateWahl();

    });

    $(document).on("click", ".markieren", function () {
        raeumeAuf();
        var d = new Date();
        var n = d.getTime();
        var letzterKlick = $(this).attr("lastClick");
        $(this).attr("lastClick", n);
        if (letzterKlick == "" || letzterKlick == null) {
            letzterKlick = "" + n;
        }
        var letzterKlickLong = parseInt(letzterKlick);
        if (n - letzterKlickLong < 1000 && bereich == false) { //weniger als eine Sekunde
            $(this).removeClass("aktiv");
            $(this).addClass("bereich");
            bereich = true;
        } else if ($(this).hasClass("bereich") && bereich == true) {
            bereich = false;
            $(this).removeClass("bereich");
            $(this).removeClass("aktiv");
        } else if (bereich == true && !$(this).hasClass("bereich")) { // bereich testen
            var zaehlerStartBereich = -1;
            var zaehlerEndeBereich = -1;
            $(this).addClass("endeBereich");
            var self = $(this);
            var zaehler = 0;
            $(".markieren").not(".versteckt").each(function () {
                if ($(this).hasClass("endeBereich")) {
                    zaehlerEndeBereich = zaehler;
                    $(this).removeClass("endeBereich");
                } else if ($(this).hasClass("bereich")) {
                    zaehlerStartBereich = zaehler;
                }
                zaehler++;
            });

            zaehler = 0;
            if (zaehlerStartBereich < zaehlerEndeBereich) { // positiv markieren

                $(".markieren").not(".versteckt").each(function () {
                    if (zaehler >= zaehlerStartBereich && zaehler <= zaehlerEndeBereich) {
                        $(this).removeClass("bereich");
                        $(this).removeClass("aktiv");
                        $(this).addClass("aktiv");
                        bereich = false;
                    }
                    zaehler++;
                });
            } else if (zaehlerStartBereich > zaehlerEndeBereich) {
                $(".markieren").not(".versteckt").each(function () {
                    if (zaehler >= zaehlerEndeBereich && zaehler <= zaehlerStartBereich) {
                        $(this).removeClass("bereich");
                        $(this).removeClass("aktiv");
                        bereich = false;
                    }
                    zaehler++;
                });
            }
        } else {
            $(this).toggleClass("aktiv");
        }

        updateWahl();
    });

    $("#markiereAlle").click(function () {
        raeumeAuf();
        bereich = false;
        // elemente zaehlen
        var zaehlerElemente = 0;
        $(".tshareElement").not(".versteckt").each(function () {
            zaehlerElemente++;
        });
        var zaehlerMarkiert = 0;
        $(".markieren").not(".versteckt").each(function () {
            if ($(this).hasClass("aktiv")) {
                zaehlerMarkiert++;
            }
        });
        var d = new Date();
        var n = d.getTime();
        if (zaehlerMarkiert < zaehlerElemente) {
            $(".markieren").not(".versteckt").each(function () {
                $(this).removeClass("aktiv").addClass("aktiv").removeClass("bereich");


                $(this).attr("lastClick", n);

            });
            updateWahl();
        } else {
            $(".markieren").not(".versteckt").each(function () {
                $(this).removeClass("aktiv").removeClass("bereich");

            });
            // alle knöpfe in oberer leiste
            $(".wahl").each(function () {
                $(this).removeClass("komplett");
            });
        }
    });

    $("#auswahlLoeschen").click(function () {
        var nachfrage = confirm("Sind Sie sicher, dass die gewählten Abschnitte inklusive aller Inhalte entfernt werden soll? Dieser Schritt kann nicht rückgängig gemacht werden!");
        if (nachfrage == true) {
            raeumeAuf();
            $(".markieren").each(function () {
                if ($(this).hasClass("aktiv")) {
                    $(this).parent().prev().remove();
                    $(this).parent().remove();
                    /*    $(this).parent().prev().remove(); //zeichenflaeche
                        $(this).parent().next().remove(); //neu-knopf
                        $(this).parent().next().remove(); // pdf einfügen

                        $(this).parent().next().remove(); // Textabschnitt einfügen
                        $(this).parent().next().remove(); // Bild einfügen
                        $(this).parent().remove(); // knopf selber*/
                }
            });
        }

    });

    $(document).on("click", ".einfuegenClipboard", function () {
        //$(this).parent().next().next().next().next().after("<div id='einsetzen'></div>");
        $(this).parent().after("<div id='einsetzen'></div>");
        $("body").append("<div class='transparent'></div>");
        $(".transparent").append("<div class='fenster'><p>Bitte fügen Sie den Inhalt des Clipboards in das Textfeld ein (z. B. per Strg+V) und drücken Sie dann den Knopf \"Einfügen\"</p><textarea id='clipboardExtern' required='required' ></textArea><button id='clipboardExternEinfuegen'>Einfügen in Dokument</button><button id='abbrechen'>Abbrechen</button></div>");
        $("#clipboardExtern").focus();
    });

    $(document).on("click", "#clipboardExternEinfuegen", function () {
        var inhalt = $("#clipboardExtern").val();
        if (inhalt.startsWith(magicString)) {
            var nachfrage = confirm("Sind Sie sicher, dass dieser Abschnitt eingefügt werden soll? Dieser Schritt kann nicht mehr rückgängig gemacht werden!");
            if (nachfrage == true) {
                raeumeAuf();

                $("#einsetzen").after(inhalt.substring(magicString.length, inhalt.length));
                $(".transparent").remove();
                $("#einsetzen").remove();
                // auswahl überprüfen
                updateWahl();
            }
        } else {
            window.alert("Der Inhalt hat das falsche Format. Es können nur Inhalte aus Tshare eingefügt werden.")
        }

    });

    $(document).on("click", ".einfuegen", function () {

        raeumeAuf();
        //$(this).parent().next().next().next().next().after(clipboard);
        $(this).parent().after(clipboard);
        // auswahl überprüfen
        updateWahl();

    });



    function holeMarkierteAbschnitteAlsString() {
        var clipboardIntern = "";
        raeumeAuf();
        $(".markieren").each(function () {
            if ($(this).hasClass("aktiv")) {
                var tshareElement = $(this).parent().prev();
                var klasse = "";
                if (tshareElement.hasClass("markdown")) {
                    klasse = "markdown adoccss";
                } else if (tshareElement.hasClass("zeichenflaeche")) {
                    klasse = "zeichenflaeche zeichenflaecheKlick";
                } else if (tshareElement.hasClass("datei")) {
                    klasse = "datei";
                }
                clipboardIntern += "<div class='tshareElement " + klasse + "'>" + $(this).parent().prev().html() + "</div>" + knopfJS;
            }
        });
        clipboard = clipboardIntern;
        clipboardIntern = magicString + clipboardIntern;

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


    $(document).on("click", ".markdownEinfuegen", function () {
        raeumeAuf();
        $(this).parent().after("<div class='markdown tshareElement' id='markdown'></div>" + knopfJS2); // wo erscheint der neue Abschnitt

        bearbeitungAn = true;
        bearbeitungsTyp = "markdown";
        Textabschnitt.init("#markdown", "#menu");
        updateWahl();



    });

    $(document).on("click", ".changeSeparator", function () {
        raeumeAuf();
        var status = 0;
        var statusAlt = 0;
        statusAlt = parseInt($(this).parent().prev(".tshareElement").attr("status"));
        if (statusAlt == undefined || isNaN(statusAlt)) {
            statusAlt = 0;
        }
        status = (statusAlt + 1) % 3;
        var ergebnis = $(this).parent().prev(".datei").find("hr");
        ergebnis.each(function () {


            $(this).attr("class", "");
            $(this).addClass("style_" + status);


        });
        $(this).parent().prev(".tshareElement").removeAttr("status");
        $(this).parent().prev(".tshareElement").attr("status", status);
        //$(this).parent().prev(".tshareElement").removeClass("statusFarbeKnopf_"+statusAlt);
        //$(this).parent().prev(".tshareElement").addClass("statusFarbeKnopf_"+status);
        $(this).removeClass("statusFarbeKnopf_" + statusAlt);
        $(this).addClass("statusFarbeKnopf_" + status);

    });

    $(document).on("click", ".bildEinfuegen", function () {
        raeumeAuf();
        $(this).parent().after("<div id='einsetzen'></div>"); // direkt nach Bild einfügen
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




    this.saveObject = function () {
        var e = window.event.srcElement;

        var objectData = e.previousSibling.getAttribute('data');
        var typ = e.previousSibling.getAttribute('type');
        var name = e.previousSibling.getAttribute('name');
        var index = objectData.indexOf(',');

        var byteCharacters = atob(objectData.substring(index + 1));
        var byteArrays = [];
        var sliceSize = 512;

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

        var blob = new Blob(byteArrays, {
            type: typ
        });
        saveAs(blob, name);
    }

    $(document).on("change", "#bildInput", function () {
        var fileList = $("#bildInput")[0].files;
        var file = fileList[0];


        var fileReader = new FileReader();
        fileReader.onload = function (e) {
            $("#bildInput").hide();
            $("#abbrechen").hide().after("<div id='ladeInfo'>Bitte warten ...</div>");
            //var inhalt64=window.btoa(unescape(encodeURIComponent(e.target.result)));
            //if (file.type.split("/")[0]=="pdf"){
            var d = new Date();
            var zeitpunkt = d.getDate() + "." + (d.getMonth() + 1) + "." + d.getFullYear() + ", " + d.getHours() + ":" + ("0" + d.getMinutes()).substr(-2) + ":" + ("0" + d.getSeconds()).substr(-2);
            var infoString = "|===\n.3+|icon:file-o[5x]|Dateiname|" + file.name.split(' ').join('_') + "\n|Größe in Bytes|" + file.size + "|Einfügezeitpunkt|" + zeitpunkt + "\n|===";

            var options = Opal.hash2(['header_footer', 'attributes'], {
                'header_footer': false,
                'attributes': ['icons=font']
            });
            var res = Opal.Asciidoctor.$convert(infoString, options);

            $("#einsetzen").before("<div class='datei tshareElement'><div style='background-color: #f8f8f7'><object style='display:none' id='dataNeu' data='' name=" + file.name.split(' ').join('_') + " type='" + file.type + "'></object><button onclick='saveObject()'>" + file.name.split(' ').join('_') + " herunterladen</button><div class='adoccss'>" + res + "</div></div></div>" + knopfJS);
            $("#dataNeu").attr("data", e.target.result);
            $("#dataNeu").removeAttr("id");
            // } else {
            /*$("#einsetzen").before("<div class='datei tshareElement'>"+file.name+"<button class='downloadFile' data='"+inhalt64+"' datatype='"+file.type+"' filename='"+file.name+"'>Download</button></div>"+knopfJS);*/
            //}
            $(".transparent").remove();
            $("#einsetzen").remove();
        }
        fileReader.readAsDataURL(file);
        updateWahl();

    });



    $(document).on("click", ".downloadFile", function () {
        var text = $(this).attr("data");

        var ab = Base64Binary.decodeArrayBuffer(text);
        var blob = new Blob([ab], {
            type: $(this).attr("datatype")
        });
        saveAs([ab], $(this).attr("filename"));
    });

    $(document).on("click", ".pdf", function () {
        raeumeAuf();
        $(this).parent().after("<div id='einsetzen'></div>"); // next=textabschnitt
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


    $(document).on("change", "#pdfInput", function () {
        var fileList = $("#pdfInput")[0].files;
        var file = fileList[0];


        var fileReader = new FileReader();
        fileReader.onload = function (e) {

            if (file.name.endsWith(".pdf")) {
                $("#pdfInput").hide();
                $("#abbrechen").hide().after("<div id='ladeInfo'>Bitte warten ...</div>");
                PDFJS.disableWorker = true;

                var currPage = 1; //Pages are 1-based not 0-based
                var numPages = 0;
                var thePDF = null;
                this.zaehler = 0;
                this.seitenZaehler = 0;
                this.bildLadeZaehler = 0;
                that = this;

                //This is where you start
                PDFJS.getDocument(e.target.result).then(function (pdf) {

                    //Set PDFJS global object (so we can easily access in our page functions
                    thePDF = pdf;

                    //How many pages it has
                    numPages = pdf.numPages;
                    for (var i = 0; i < numPages; i++) {
                        $("#einsetzen").before("<div class='einsetzen' id='einsetzen" + (i + 1) + "'></div>");
                    }
                    $("#einsetzen").remove();
                    //Start with first page

                    pdf.getPage(1).then(handlePages);
                });



                function handlePages(page) {
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
                    var viewport = page.getViewport(1);
                    var scale = 2 * breite / viewport.width;
                    viewport = page.getViewport(scale);
                    //We'll create a canvas for each page to draw it on
                    var canvas = document.createElement("canvas");
                    canvas.style.display = "block";
                    var context = canvas.getContext('2d');

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;



                    //Draw it on the canvas
                    var pageRendering = page.render({
                        canvasContext: context,
                        viewport: viewport
                    });
                    var completeCallback = pageRendering._internalRenderTask.callback;
                    pageRendering._internalRenderTask.callback = function (error) {
                        //Step 2: what you want to do before calling the complete method                  
                        completeCallback.call(this, error);
                        this.seitennummer = this.pageNumber;
                        var that2 = this;

                        // nicht mehr transparent machen!!
                        //console.log("Fertig");
                        var transparentColor = { // weiß transparent machen 
                            r: 255,
                            g: 255,
                            b: 255
                        };
                        var pixels = context.getImageData(0, 0, canvas.width, canvas.height);

                        // iterate through pixel data (1 pixels consists of 4 ints in the array)
                        for (var i = 0, len = pixels.data.length; i < len; i += 4) {
                            var r = pixels.data[i];
                            var g = pixels.data[i + 1];
                            var b = pixels.data[i + 2];

                            // if the pixel matches our transparent color, set alpha to 0
                            if (r == transparentColor.r && g == transparentColor.g && b == transparentColor.b) {
                                pixels.data[i + 3] = 0;
                            }
                        }

                        context.putImageData(pixels, 0, 0);
                        aktuellesBild = new Image();
                        aktuellesBild.onload = function () {
                            zeichenbreite = canvas.width;
                            zeichenhoehe = canvas.height;
                            //console.log(this.src);
                            //$(this).next().after("<div class='zeichnung' id='zeichnung'></div><button class='loeschen'>Darüber liegende Zeichenfläche löschen</button><button class='neueZeichenflaeche' >Neue Zeichenfläche</button><button class='pdf'>PDF einfügen</button>");
                            //bearbeitungAn=true;
                            //QreatorBezier.init("#zeichnung",breite,hoehe,"#menu", true); // menu: id der fläche, wo das menü erscheint, true, dass es horizontal ist
                            that.zaehler++;
                            QreatorBezier.insertImgAsSVG(this, breite, hoehe, "einsetzen" + that2.seitennummer, knopfJS);
                            console.log("Zähler " + that.zaehler + " Seitennummer: " + that2.seitennummer);
                            if (that.zaehler == numPages) { // marker entfernene
                                $(".einsetzen").remove();
                                $(".transparent").remove();
                            }


                        }

                        aktuellesBild.src = canvas.toDataURL();
                        //QreatorBezier.ladeBild(aktuellesBild,0,0,zeichenbreite,zeichenhoehe,false);





                    }
                    //Add it to the web page


                    //Move to next page
                    currPage++;
                    if (thePDF !== null && currPage <= numPages) {
                        thePDF.getPage(currPage).then(handlePages);
                    }
                }









            } else {

            }
        }
        fileReader.readAsDataURL(file);
        updateWahl();
    });

    function raeumeAuf() {
        if (bearbeitungAn == true) {
            if (bearbeitungsTyp == "zeichenflaeche") {
                QreatorBezier.showSVG("zeichenflaeche");
                bearbeitungAn = false;
                /*      var element=$("#zeichnung").html();
                $("#zeichnung").after(element);
			 $("#zeichnung").remove();*/

            } else if (bearbeitungsTyp == "markdown") {
                Textabschnitt.zeigeMarkdown("#markdownTable");
                bearbeitungAn = false;
                $("#markdown").addClass("adoccss");
                
                $("#markdown").removeAttr("id");

                // alle Texte auf den neuesten Stand bringen (wegen Mathematik)


            }
        }

        // nach allen aktionen prüfen, ob werte noch stimmen

    }

    //QreatorBezier.loadSVG('<svg width="800" height="600" id="svgbild"><g fill="none" stroke-linecap="round" id="global"><g id="layer_0"><path d=" M250,492 c15.8,0 29.2,-14.8 40,-24 c9.3,-7.9 18.2,-16.4 28,-24 c24.3,-18.7 68.3,-47.4 92,-65 c17.7,-13.1 34.4,-27.6 52,-41 c35.3,-26.8 65.7,-45.2 97,-76 c15.5,-15.2 19.9,-21.2 25,-39 c1.6,-5.7 1.6,-10.1 -4,-12 M346,143 c15.1,0 32.2,-1.8 47,1 c14.2,2.7 62.7,19.5 74,24 c30.4,12 61.9,21.5 74,55 c1.6,4.6 16.6,68.6 17,70 c2.1,9.6 2.8,19.6 6,29 c2.5,7.3 15.9,32 22,40 c13.5,17.6 21.7,21.2 46,29 c14.4,4.6 27.9,5.6 40,-5 c8.8,-7.8 8.5,-17.7 10,-28 M570,145 c-8.6,0 -18,0 -26,4 c-27.4,13.7 -34.4,52.9 -40,80 c-5.7,28.2 -2.9,15.9 -6,45 c-0.5,5 -2.3,9.9 -2,15 c0.3,5.1 4.7,9.8 4,15 c-0.4,3 -4.1,4.8 -7,6 c-7.1,2.9 -15.3,1.7 -23,2 c-11.9,0.3 -24,0 -36,0 c-2.3,0 -4.9,1 -7,0 c-2.9,-1.4 -4.7,-4.5 -7,-7 c-4.7,-5.2 -9.2,-10.7 -14,-16 c-13.6,-15.2 -27.5,-30.5 -42,-45" stroke="#000000" stroke-width="2"></path></g></g></svg>');
    $(document).on("click", ".zeichenflaecheKlick", function () {

        raeumeAuf();
        var text = $(this).html();
        $(this).removeClass("zeichenflaecheKlick");

        // $(this).removeClass("zeichenflaeche"); // sonst immer auf klick reagieren
        bearbeitungAn = true;
        bearbeitungsTyp = "zeichenflaeche";
        var zeichenbreite = parseInt($(this).find("svg").attr("width"));
        var zeichenhoehe = parseInt($(this).find("svg").attr("height"));
        // console.log("Breite aus svg: "+$(this).find("svg").attr("width"));
        QreatorBezier.init(this, zeichenbreite, zeichenhoehe, "#menu", true); // hier auch anpassen

        // $(this).after("<button class='neueZeichenflaeche' >Neue Zeichenfläche</button>");
        QreatorBezier.loadSVG(text);




    });

    $(document).on("click", ".markdownText", function () {
        raeumeAuf();
        var originalText = $(this).find(".originaltext").text();
        // "<div class='markdown' id='markdown'></div>"
        $(this).parent().attr("id", "markdown");
        $(this).parent().removeClass("adoccss");
        bearbeitungAn = true;
        bearbeitungsTyp = "markdown";
        Textabschnitt.init("#markdown", "#menu", originalText);


    });



    $(document).on("change", "#fileInput", function () {
        var fileList = $("#fileInput")[0].files;
        var file = fileList[0];


        var fileReader = new FileReader();
        fileReader.onload = function (e) {
            var text = e.target.result;

            var container = document.createElement('div');
            container.id = 'container';
            container.innerHTML = text;
            $("#content").html("<span id='firstMenu'><button class='einfuegen imageInsertInternal unten'></button><button class='einfuegenClipboard imagePaste unten'></button><button class='neueZeichenflaeche imageJournal unten' ></button><button class='pdf imagePDF unten'></button><button class='markdownEinfuegen imageNew unten'></button><button class='bildEinfuegen imageFotoNeu unten'></button></span>");
            //console.log($(container).html());
            $(container).find(".tshareElement").each(function () {
                var sb = $(this).attr("sb"); // sichtbarkeit abfragen
                if (sb == null || sb == "") {
                    sb = "@";
                }
                var ft=$(this).attr("ft");
                if (ft==null||ft==""){
                    ft="=";
                }
                var tags = $(this).attr("tags"); // für die Zukunft
                if (tags == null) {
                    tags = "";
                }
                if ($(this).hasClass("zeichenflaeche")) {
                    $("#content").append("<div class='zeichenflaeche tshareElement zeichenflaecheKlick'>" + $(this).html() + "</div>");
                    $("#content").append(knopfJS);
                } else if ($(this).hasClass("markdown")) {
                    $("#content").append("<div class='markdown tshareElement adoccss'>" + $(this).html() + "</div>");
                    $("#content").append(knopfJS2);
                } else if ($(this).hasClass("datei")) {
                    $("#content").append("<div class='datei tshareElement'>" + $(this).html() + "</div>");
                    $("#content").append(knopfJS);

                } else if ($(this).hasClass("toc")) {
                    $("#content").append("<div id='toc' class='toc tshareElement'>" + $(this).html() + "</div>");
                    $("#content").append(knopfJS);
                    $(".menuBar").last().attr("id", "tocBar");

                }
                $(".ebenenAnzeige").last().attr("aktiv",sb); // aktive sichtbarkeit setzen
                $(".folientyp").last().val(ft);
                var neuesBild=zeichneEbenenUebersicht(sb); // ebenenuebersicht neu erstellen
        $(".ebenenAnzeige").last().wrap("<span id='ersetzung'></span>");
        $("#ersetzung").html(neuesBild);
        $("#ersetzung .ebenenAnzeige").unwrap(); // neues Bild einfügen
        
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
            updateWahl();
        };
        fileReader.onerror = function (e) {
            console.log(e.target.error.name);
        };
        fileReader.onprogress = function (e) {
            console.log(e.loaded, e.total);
        };
        fileReader.readAsText(file);

    });



    $(document).on("click", "#laden", function () {
        $("body").append("<div class='transparent'></div>");
        $(".transparent").append("<div class='fenster'><input id='fileInput' type='file' accept='text/html' required='required' ></input><button id='abbrechen'>Abbrechen</button><div id='parameter'></div></div>");
        //$(".transparent").append("<div class='fenster'><input id='pdfInput' type='file'  required='required' ></input><button id='abbrechen'>Abbrechen</button><div id='parameter'></div></div>");

        $("#fileInput").trigger("click");
    });


    $(document).on("click", "#bild", function () {
        $("body").append("<div class='transparent'></div>");
        $(".transparent").append("<div class='fenster'><input id='imageInput' type='file' accept='image/*' required='required' ></input><button id='abbrechenBild'>Abbrechen</button><div id='parameter'></div></div>");
        $("#imageInput").trigger("click");
    });

    $(document).on("click", "#abbrechen", function () {
        $(".transparent").remove();
        $("#einsetzen").remove();
    });

    $(document).on("click", "#abbrechenBild", function () {
        QreatorBezier.loescheBild();
        $(".transparent").remove();
    });


    $(document).on("mousemove", ".fenster .parameter", function () {

        var breiteProzent = parseInt($("[typ='breite']").val());
        var hoeheProzent = parseInt($("[typ='hoehe']").val());
        if (isNaN(breiteProzent)) {
            breiteProzent = parseInt(zeichenbreite * 100 / breite * hoeheProzent / 100);
        }
        if (isNaN(hoeheProzent)) {
            hoeheProzent = parseInt(zeichenhoehe * 100 / hoehe * breiteProzent / 100);
        }
        var xpos = parseInt($("[typ='x']").val());
        var ypos = parseInt($("[typ='y']").val());

        $(".fenster #breite").html("" + breiteProzent);
        $(".fenster #hoehe").html("" + hoeheProzent);
        $(".fenster #xpos").html("" + xpos);
        $(".fenster #ypos").html("" + ypos);
    });

    $(document).on("change", ".fenster .parameter", function () {

        var breiteProzent = parseInt($("[typ='breite']").val());
        var hoeheProzent = parseInt($("[typ='hoehe']").val());
        if (isNaN(breiteProzent)) {
            breiteProzent = parseInt(zeichenbreite * 100 / breite * hoeheProzent / 100);
        }
        if (isNaN(hoeheProzent)) {
            hoeheProzent = parseInt(zeichenhoehe * 100 / hoehe * breiteProzent / 100);
        }
        var xpos = parseInt($("[typ='x']").val());
        var ypos = parseInt($("[typ='y']").val());
        QreatorBezier.ladeBild(aktuellesBild, parseInt(xpos * breite / 100), parseInt(ypos * hoehe / 100), parseInt(breiteProzent * breite / 100), parseInt(hoeheProzent * hoehe / 100), false);


    });

    $(document).on("click", "#bildEinfuegen", function () {
        var breiteProzent = parseInt($("[typ='breite']").val());
        var hoeheProzent = parseInt($("[typ='hoehe']").val());
        if (isNaN(breiteProzent)) {
            breiteProzent = zeichenbreite * 100 / breite * hoeheProzent / 100;
        }
        if (isNaN(hoeheProzent)) {
            hoeheProzent = zeichenhoehe * 100 / hoehe * breiteProzent / 100;
        }
        var xpos = parseInt($("[typ='x']").val());
        var ypos = parseInt($("[typ='y']").val());
        QreatorBezier.ladeBild(aktuellesBild, parseInt(xpos * breite / 100), parseInt(ypos * hoehe / 100), parseInt(breiteProzent * breite / 100), parseInt(hoeheProzent * hoehe / 100), true);
        $(".transparent").remove();
    });

    $(document).on("click", ".mittig", function () {
        var breiteProzent = parseInt($("[typ='breite']").val());
        var hoeheProzent = parseInt($("[typ='hoehe']").val());
        if (isNaN(breiteProzent)) {
            breiteProzent = parseInt(zeichenbreite * 100 / breite * hoeheProzent / 100);
        }
        if (isNaN(hoeheProzent)) {
            hoeheProzent = parseInt(zeichenhoehe * 100 / hoehe * breiteProzent / 100);
        }
        var xpos = parseInt($("[typ='x']").val());
        var ypos = parseInt($("[typ='y']").val());

        var wahl = $(this).attr("typ");
        switch (wahl) {
            case "xmitte":
                xpos = parseInt(50 - breiteProzent / 2);
                break;
            case "ymitte":
                ypos = parseInt(50 - hoeheProzent / 2);
                break;
            case "links":
                xpos = 0;
                break;
            case "rechts":
                xpos = 100 - breiteProzent;
                break;
            case "oben":
                ypos = 0;
                break;
            case "unten":
                ypos = 100 - hoeheProzent;
                break;

        }
        $(".fenster #xpos").html("" + xpos);
        $("[typ='x']").val(xpos);
        $(".fenster #ypos").html("" + ypos);
        $("[typ='y']").val(ypos);

        QreatorBezier.ladeBild(aktuellesBild, parseInt(xpos * breite / 100), parseInt(ypos * hoehe / 100), parseInt(breiteProzent * breite / 100), parseInt(hoeheProzent * hoehe / 100), false);

    });

    $(document).on("change", "#imageInput", function () {

        var fileList = $("#imageInput")[0].files;
        var file = fileList[0];


        var fileReader = new FileReader();
        fileReader.onload = function (e) {

            if (file.name.endsWith(".pdf")) {
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
                        var pageRendering = page.render({
                            canvasContext: context,
                            viewport: viewport
                        });
                        var completeCallback = pageRendering._internalRenderTask.callback;
                        pageRendering._internalRenderTask.callback = function (error) {
                            //Step 2: what you want to do before calling the complete method                  
                            completeCallback.call(this, error);
                            //Step 3: do some more stuff
                            var transparentColor = { // weiß transparent machen 
                                r: 255,
                                g: 255,
                                b: 255
                            };
                            var pixels = context.getImageData(0, 0, canvas.width, canvas.height);

                            // iterate through pixel data (1 pixels consists of 4 ints in the array)
                            for (var i = 0, len = pixels.data.length; i < len; i += 4) {
                                var r = pixels.data[i];
                                var g = pixels.data[i + 1];
                                var b = pixels.data[i + 2];

                                // if the pixel matches our transparent color, set alpha to 0
                                if (r == transparentColor.r && g == transparentColor.g && b == transparentColor.b) {
                                    pixels.data[i + 3] = 0;
                                }
                            }

                            context.putImageData(pixels, 0, 0);
                            aktuellesBild = new Image();
                            aktuellesBild.onload = function () {
                                zeichenbreite = canvas.width;
                                zeichenhoehe = canvas.height;

                                hochkant = true;
                                if (this.width > this.height) {
                                    hochkant = false;
                                }

                                if (hochkant == true) {
                                    zeichenhoehe = Math.min(hoehe, this.height);
                                    if (zeichenhoehe < hoehe) {
                                        zeichenhoehe = hoehe;
                                    }
                                    zeichenbreite = this.width * zeichenhoehe / this.height;
                                    if (zeichenbreite > breite) {
                                        zeichenhoehe = zeichenhoehe * breite / zeichenbreite;
                                        zeichenbreite = breite;
                                        hochkant = false;
                                    }
                                } else {
                                    zeichenbreite = Math.min(breite, this.width);
                                    if (zeichenbreite < breite) {
                                        zeichenbreite = breite;
                                    }
                                    zeichenhoehe = this.height * zeichenbreite / this.width;
                                    if (zeichenhoehe > hoehe) {
                                        zeichenbreite = zeichenbreite * hoehe / zeichenhoehe;
                                        zeichenhoehe = hoehe;
                                        hochkant = true;
                                    }
                                }
                                console.log(aktuellesBild.src);
                                if (hochkant == false) {
                                    $(".fenster #parameter").html("<br>Breite (in Prozent von Abschnittsbreite): <input typ='breite' class='parameter' type='range' min='0' max='100' value='" + parseInt(zeichenbreite * 100 / breite) + "'></input><span id='breite'>" + parseInt(zeichenbreite * 100 / breite) + "</span>%, Höhe:<span id='hoehe'>" + parseInt(zeichenhoehe * 100 / hoehe) + "</span>%");
                                } else {
                                    $(".fenster #parameter").html("<br>Höhe (in Prozent von Abschnittshöhe): <input typ='hoehe' class='parameter' type='range' min='0' max='100' value='" + parseInt(zeichenhoehe * 100 / hoehe) + "'></input><span id='hoehe'>" + parseInt(zeichenhoehe * 100 / hoehe) + "</span>%, Breite: <span id='breite'>" + parseInt(zeichenbreite * 100 / breite) + "</span>%");

                                }
                                $(".fenster #parameter").append("<br>x-Position links oben:  <input typ='x' class='parameter' type='range' min='0' max='100' value='0'></input><span id='xpos'>0</span><button class='mittig' typ='links'>linksbündig</button><button class='mittig' typ='xmitte'>horizontal zentrieren</button><button class='mittig' typ='rechts'>rechtsbündig</button>");
                                $(".fenster #parameter").append("<br>y-Position links oben:  <input typ='y' class='parameter' type='range' min='0' max='100' value='0'></input><span id='ypos'>0</span><button class='mittig' typ='oben'>oben bündig</button><button class='mittig' typ='ymitte'>vertikal zentrieren</button><button class='mittig' typ='unten'>unten bündig</button>");
                                $(".fenster #parameter").append("<br><button id='bildEinfuegen'>Bild einfügen</button>");

                                QreatorBezier.ladeBild(aktuellesBild, 0, 0, zeichenbreite, zeichenhoehe, false);

                            }

                            aktuellesBild.src = canvas.toDataURL();

                        };



                    });
                });





            } else {
                aktuellesBild = new Image();
                aktuellesBild.onload = function () {
                    //ctx.drawImage(this,0,0);
                    //var pngString=canvas.toDataURL();  // bild erst skalieren
                    zeichenbreite = 0, zeichenhoehe = 0;
                    hochkant = true;
                    if (this.width > this.height) {
                        hochkant = false;
                    }

                    if (hochkant == true) {
                        zeichenhoehe = Math.min(hoehe, this.height);
                        if (zeichenhoehe < hoehe) {
                            zeichenhoehe = hoehe;
                        }
                        zeichenbreite = this.width * zeichenhoehe / this.height;
                        if (zeichenbreite > breite) {
                            zeichenhoehe = zeichenhoehe * breite / zeichenbreite;
                            zeichenbreite = breite;
                            hochkant = false;
                        }
                    } else {
                        zeichenbreite = Math.min(breite, this.width);
                        if (zeichenbreite < breite) {
                            zeichenbreite = breite;
                        }
                        zeichenhoehe = this.height * zeichenbreite / this.width;
                        if (zeichenhoehe > hoehe) {
                            zeichenbreite = zeichenbreite * hoehe / zeichenhoehe;
                            zeichenhoehe = hoehe;
                            hochkant = true;
                        }
                    }

                    if (hochkant == false) {
                        $(".fenster #parameter").html("<br>Breite (in Prozent von Abschnittsbreite): <input typ='breite' class='parameter' type='range' min='0' max='100' value='" + parseInt(zeichenbreite * 100 / breite) + "'></input><span id='breite'>" + parseInt(zeichenbreite * 100 / breite) + "</span>%, Höhe:<span id='hoehe'>" + parseInt(zeichenhoehe * 100 / hoehe) + "</span>%");
                    } else {
                        $(".fenster #parameter").html("<br>Höhe (in Prozent von Abschnittshöhe): <input typ='hoehe' class='parameter' type='range' min='0' max='100' value='" + parseInt(zeichenhoehe * 100 / hoehe) + "'></input><span id='hoehe'>" + parseInt(zeichenhoehe * 100 / hoehe) + "</span>%, Breite: <span id='breite'>" + parseInt(zeichenbreite * 100 / breite) + "</span>%");

                    }
                    $(".fenster #parameter").append("<br>x-Position links oben:  <input typ='x' class='parameter' type='range' min='0' max='100' value='0'></input><span id='xpos'>0</span><button class='mittig' typ='links'>linksbündig</button><button class='mittig' typ='xmitte'>horizontal zentrieren</button><button class='mittig' typ='rechts'>rechtsbündig</button>");
                    $(".fenster #parameter").append("<br>y-Position links oben:  <input typ='y' class='parameter' type='range' min='0' max='100' value='0'></input><span id='ypos'>0</span><button class='mittig' typ='oben'>oben bündig</button><button class='mittig' typ='ymitte'>vertikal zentrieren</button><button class='mittig' typ='unten'>unten bündig</button>");
                    $(".fenster #parameter").append("<br><button id='bildEinfuegen'>Bild einfügen</button>");
                    QreatorBezier.ladeBild(aktuellesBild, 0, 0, zeichenbreite, zeichenhoehe, false);

                    //QreatorBezier.ladeBild(this);
                    //$(".transparent").remove();
                }
                aktuellesBild.src = e.target.result;
                // ctx.drawImage(img, 0, 0, 400, 300);   
            }


        };
        fileReader.onerror = function (e) {
            console.log(e.target.error.name);
        };
        fileReader.onprogress = function (e) {
            console.log(e.loaded, e.total);
        };
        fileReader.readAsDataURL(file);

    });


    $(document).on("click", ".loeschen", function () {
        var nachfrage = confirm("Sind Sie sicher, dass die gewählte Zeichenfläche inklusive Inhalt entfernt werden soll? Dieser Schritt kann nicht rückgängig gemacht werden!");
        if (nachfrage == true) {
            raeumeAuf();
            $(this).parent().prev().remove();
            $(this).parent().remove();
            /*
            $(this).parent().prev().remove(); //zeichenflaeche
            $(this).parent().next().remove(); //neu-knopf
            $(this).parent().next().remove(); // pdf einfügen

            $(this).parent().next().remove(); // Textabschnitt einfügen
            $(this).parent().next().remove(); // Bild einfügen
            $(this).parent().remove(); // knopf selber
            */

            // checkboxen prüfen
            updateWahl();
        }
    });




    //var url = 'test.pdf';

    //
    // Disable workers to avoid yet another cross-origin issue (workers need the URL of
    // the script to be loaded, and dynamically loading a cross-origin script does
    // not work)
    //



});