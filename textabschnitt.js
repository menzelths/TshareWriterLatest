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
    
    this.init=function(selector,menuSelector,startText=""){
        selectorGlobal = selector;
		menuGlobal = menuSelector;
		$(selectorGlobal).html("<table id='markdownTable' style='width:100%;'><tr><td valign='top' style='width:50%;'><textarea style='width:100%;' id='aktuellerText'>"+startText+"</textarea></td><td valign='top' style='width:50%; '><div id='htmlResult'></div></td></tr></table>");
        $(menuGlobal).append("<button id='parseMarkdown'>Markdown erstellen</button><input id='livepreview' type='checkbox'>Live-Preview</input><button id='erstelleTabelle'>Tabelle erstellen</button>");
        
         parseMarkdown(startText, "#htmlResult"); // Anfangstext darstellen
        
        var exp=new Expanding($("#aktuellerText")[0]); // passt textarea der Größe nach an
        
        $("#aktuellerText").on("keypress",function(e){
            if ($("#livepreview")[0].checked==true){                   
            if (e.keyCode === 13||e.charCode==13||e.keyCode==32||e.charCode==32) {
                                   var text=$("#aktuellerText").val();
        parseMarkdown(text, "#htmlResult");
                               }
     
      
            }

                               });
       
    
    
    
    $("#parseMarkdown").on("click",function(){
        var text=$("#aktuellerText").val();
        parseMarkdown(text, "#htmlResult");
      
    });
        
        $("#erstelleTabelle").on("click",function(){
           ersetzeAuswahl("|Hallo|Hi\n|---|---\n|Wert 1|Wert2\n","#aktuellerText"); 
        });
    }
    
     function parseMarkdown(text,selector){
            var res = text.replace(/\$\$\$(.|\n)*?\$\$\$/g, function myFunction(x){
            if (x.substring(3,x.length-3).indexOf('\n')!=-1){
            return "\\[ "+AMTparseAMtoTeX(x.substring(3,x.length-3))+" \\]";
            } else {
                return "\\( "+AMTparseAMtoTeX(x.substring(3,x.length-3))+" \\)";
            }
        });
        
        res = res.replace(/\$\$(.|\n)*?\$\$/g, function myFunction(x){
            if (x.substring(2,x.length-2).indexOf('\n')!=-1){
            return "\\[ "+x.substring(2,x.length-2)+" \\]";
            } else {
                return "\\( "+x.substring(2,x.length-2)+" \\)";
            }
        });
       
        $(selector).html(micromarkdown.parse(res));
        
        //AMTparseAMtoTeX(formel)
        renderMathInElement($(selector)[0],{delimiters:[
  {left: "$$", right: "$$", display: true},
  {left: "\\[", right: "\\]", display: true},
  {left: "\\(", right: "\\)", display: false}
]});
        }
    
}


