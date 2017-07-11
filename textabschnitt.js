var Textabschnitt = new function() {
    
    
    
    
    var selectorGlobal,menuGlobal;
    
    this.zeigeMarkdown=function(selector){
        
        $("#markdown").append("<div class='markdownText'><div id='ausgabeMarkdown'></div><div hidden id='originaltext' class='originaltext'></div></div>");
        var text=$("#aktuellerText").val();
        parseMarkdown(text,"#ausgabeMarkdown");
        $("#originaltext").text(text);
        $("#originaltext").removeAttr("id");
        var loeschen=false;
        
        $("#ausgabeMarkdown").removeAttr("id");
        $("#markdownTable").remove();
        $(menuGlobal).html("");
        
        
    }
    
    function ersetzeAuswahl(text,selector){
            var cursorPosStart = $(selector).prop('selectionStart');
            var cursorPosEnd = $(selector).prop('selectionEnd');
            var v = $(selector).val();
            var textBefore = v.substring(0,  cursorPosStart );
            var textAfter  = v.substring( cursorPosEnd, v.length );
            $(selector).val( textBefore+ text +textAfter );
        }
    
    function umgebeAuswahl(davor,danach,selector){
        var cursorPosStart = $(selector).prop('selectionStart');
            var cursorPosEnd = $(selector).prop('selectionEnd');
            var v = $(selector).val();
            var textBefore = v.substring(0,  cursorPosStart );
            var textAfter  = v.substring( cursorPosEnd, v.length );
            var original=v.substring(cursorPosStart, cursorPosEnd);
            $(selector).val( textBefore+ davor+original+danach +textAfter );
    }
    
    this.init=function(selector,menuSelector,startText){
        if (startText==null||startText==undefined){
            startText="";
        }
        selectorGlobal = selector;
		menuGlobal = menuSelector;
		$(selectorGlobal).html("<table id='markdownTable' style='width:100%;'><tr><td valign='top' style='width:50%;'><textarea wrap='soft' style='width:100%;' id='aktuellerText'>"+startText+"</textarea></td><td  style='width:50%; '><div id='htmlResult' class='adoccss'></div></td></tr></table>");
        $(menuGlobal).append("<button id='parseMarkdown' class='imagePreview'></button><input id='livepreview' type='checkbox' checked>Live</input>");
        
         parseMarkdown(startText, "#htmlResult"); // Anfangstext darstellen
        
        var exp=new Expanding($("#aktuellerText")[0]); // passt textarea der Größe nach an
        
        $("#aktuellerText").focus();
    
        $("#aktuellerText").on("keypress",function(e){
            if ($("#livepreview")[0].checked==true){                   
            if (e.keyCode === 13||e.charCode==13||e.keyCode==32||e.charCode==32) {
                                   var text=$("#aktuellerText").val();
                if (text==null||text==undefined){
                    text="";
                }
        parseMarkdown(text, "#htmlResult");
                               }
     
      
            }

                               });
       
    
    
    
    $("#parseMarkdown").on("click",function(){
        var text=$("#aktuellerText").val();
        parseMarkdown(text, "#htmlResult");
      
    });
        
        $("#erstelleTabelle").on("click",function(){
           umgebeAuswahl("<span style='background-color: #ffff00'>","</span>","#aktuellerText"); 
        });
    
    }
    function stringToHex(text){
        var ergebnis="";
        for (var i=0;i<text.length;i++){
            var c = text.charCodeAt(i);
            var d = "00"+c.toString(16);
            ergebnis+=d.substr(d.length-2)
        }
        return ergebnis;
    }
    
    function hexToString(hex){
        var ergebnis = "";
    for (var i = 0; i < hex.length; i += 2)
        ergebnis += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return ergebnis;
    }
    
     function parseMarkdown(text,selector){
         if (text==null||text==undefined){
             text="";
         }
            var res = text.replace(/\$\$\$(.|\n)*?\$\$\$/g, function myFunction(x){
            if (x.substring(3,x.length-3).indexOf('\n')!=-1){
            return "Hex11 "+stringToHex(AMTparseAMtoTeX(x.substring(3,x.length-3)))+"Hex12";
            } else {
                return "Hex22 "+stringToHex(AMTparseAMtoTeX(x.substring(3,x.length-3)))+" Hex23";
            }
        });
        
        res = res.replace(/\$\$(.|\n)*?\$\$/g, function myFunction(x){
            if (x.substring(2,x.length-2).indexOf('\n')!=-1){
            return "Hex11 "+stringToHex(x.substring(2,x.length-2))+" Hex12";
            } else {
                return "Hex22 "+stringToHex(x.substring(2,x.length-2))+" Hex23";
            }
        });
         
         
       
        //$(selector).html(micromarkdown.parse(res));
         //res=Opal.Asciidoctor.$convert(res);
         
         
         var options = Opal.hash2(['header_footer', 'attributes'], { 'header_footer': false, 'attributes': ['icons=font'] }); 
res = Opal.Asciidoctor.$convert(res, options);
         
         res=res.replace(/Hex11(.)*?Hex12/g, function myFunction(x){
             return "\\["+hexToString(x.substring(5,x.length-5).trim())+"\\]";
         });
         
         res=res.replace(/Hex22(.)*?Hex23/g, function myFunction(x){
             return "\\("+hexToString(x.substring(5,x.length-5).trim())+"\\)";
         });
         
         res=res.replace(/\\\$(.|\n)*?\\\$/g, function myFunction(x){ // für stem:
            if (x.substring(2,x.length-2).indexOf('\n')!=-1){
            return "\\[ "+AMTparseAMtoTeX(x.substring(2,x.length-2))+" \\]";
            } else {
                return "\\( "+AMTparseAMtoTeX(x.substring(2,x.length-2))+" \\)";
            }
        });
         
          
         $(selector).html(res);
         $(selector).find("pre code").each(function(){
             Prism.highlightElement($(this)[0]);
         });
         
        
        //AMTparseAMtoTeX(formel)
        renderMathInElement($(selector)[0],{delimiters:[
  {left: "$$", right: "$$", display: true},
  {left: "\\[", right: "\\]", display: true},
  {left: "\\(", right: "\\)", display: false}
]});
        }
    
}


