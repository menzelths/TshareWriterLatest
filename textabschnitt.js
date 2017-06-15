var Textabschnitt = new function() {
    
    
    
    
    var selectorGlobal,menuGlobal;
    
    this.init=function(selector,menuSelector){
        selectorGlobal = selector;
		menuGlobal = menuSelector;
		$(selectorGlobal).html("<table><tr><td><textarea id='aktuellerText'>Test</textarea></td><td id='htmlResult'>Zelle 2</td></tr></table>");
        $(menuGlobal).append("<button id='parseMarkdown'>Markdown erstellen</button>");
    
    
    $("#parseMarkdown").on("click",function(){
        var text=$("#aktuellerText").val();
        
        var res = text.replace(/\!\$\$(.|\n)*?\$\$\!/g, function myFunction(x){
            return "\\[ "+AMTparseAMtoTeX(x.substring(3,x.length-3))+" \\]";
        });
        
        res = res.replace(/\!\$(.|\n)*?\$\!/g, function myFunction(x){
            return "\\( "+AMTparseAMtoTeX(x.substring(3,x.length-3))+" \\)";
        });
        
        
        
        
        
        //$("#aktuellerText")[0].insertAtCaret("HALLLOOO");
        $("#htmlResult").html(micromarkdown.parse(res));
        
        //AMTparseAMtoTeX(formel)
        renderMathInElement($("#htmlResult")[0],{delimiters:[
  {left: "$$", right: "$$", display: true},
  {left: "\\[", right: "\\]", display: true},
  {left: "\\(", right: "\\)", display: false}
]});
        
    });
    }
    
    function replaceAll(str, find, replace) {
  return str.replace(new RegExp(find, 'g'), replace);
}
}

