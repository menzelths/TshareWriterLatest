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
         
            // asciimath überprüfen, dort auch keine nerdamer funktionen
            var res = text.replace(/\$\$\$(.|\n)*?\$\$\$/g, function myFunction(x){
            if (x.substring(3,x.length-3).indexOf('\n')!=-1){
            return "Hex11 "+stringToHex(AMTparseAMtoTeX(x.substring(3,x.length-3)))+"Hex12";
            } else {
                return "Hex22 "+stringToHex(AMTparseAMtoTeX(x.substring(3,x.length-3)))+" Hex23";
            }
        });
         
         
         //nerdamer.flush();
         //nerdamer.clearVars();
         
         // jetzt alle nerdamer funktionen suchen und entsprechend ersetzen
         res = res.replace(/\$\$(.|\n)*?\$\$/g, function myFunction(x){
             x=x.replace(/\!\!(.|\n)*?\!\!/g, function myFunction2(mathString){
                 mathString=mathString.trim().split(' ').join('');
                 var replaceValue=["NerdTerm11","NerdTerm2"]; // 1 für intern
                 var test=mathString.substring(2,mathString.length-2);
                 return replaceValue[0]+" "+mathString.substring(2,mathString.length-2)+" "+replaceValue[1];
             });
                            
               return x;            
        });
         
         res=res.replace(/\!\!(.|\n)*?\!\!/g, function myFunction(mathString){
             mathString=mathString.trim().split(' ').join('');
                 var replaceValue=["NerdTerm10","NerdTerm2"]; // 0 für extern
                 return replaceValue[0]+" "+mathString.substring(2,mathString.length-2)+" "+replaceValue[1];
             });
         
          res=res.replace(/\!\!\!(.|\n)*?\!\!\!/g, function myFunction(x){
              var matheString=x.substring(3,x.length-3).trim();
                var evaluate=false;
                var decimal=false;
                if (matheString.startsWith("#")){
                        matheString=matheString.substring(1).trim();;
                        evaluate=true;
                     } 
                if (matheString.endsWith("#")){
                    matheString=matheString.substr(0,matheString.length-1).trim();
                    decimal=true;
                }
                 var test=  process(matheString,evaluate,decimal);
                 return process(matheString,evaluate,decimal);
          });
         
         res=res.replace(/NerdTerm1(.|\n)*?NerdTerm2/g, function myFunction(x){
            if (x.substring(9,x.length-9).indexOf('\n')!=-1){
                
                var matheString=x.substring(10,x.length-9).trim(); // 10, da auch prefix weg kann
                
                
                var ergebnis= matheString.split('\n').map(function(zeile){
                    var rueckgabe=true;
                    if (zeile.startsWith("!")){
                        rueckgabe=false;
                        zeile=zeile.substr(1);
                        
                    } 
                    
                        var evaluate=false;
                        var decimal=false;
                        var matheString=zeile;
                        if (matheString.startsWith("#")){
                        matheString=matheString.substring(1).trim();;
                        evaluate=true;
                     } 
                if (matheString.endsWith("#")){
                    matheString=matheString.substr(0,matheString.length-1).trim();
                    decimal=true;
                }
                        var berechnung=process(matheString,evaluate,decimal); // somit werden auch unsichtbare Ausdrücke evaluiert
                         if (rueckgabe==true){
                         return "$$\n"+berechnung+"\n$$";
                         }
                     
                    
                }).join('\n');
                return ergebnis;
            } else {
                
                var matheString=x.substring(9,x.length-9).trim();
                var prePost=["",""];
                if (matheString.startsWith("0")){ //
                    prePost=["$$ "," $$"];
                }
                matheString=matheString.substr(1).trim(); // Steuerungszeichen ignorieren
                var evaluate=false;
                var decimal=false;
                if (matheString.startsWith("#")){
                        matheString=matheString.substr(1).trim();;
                        evaluate=true;
                     } 
                if (matheString.endsWith("#")){
                    matheString=matheString.substring(0,matheString.length-1).trim();
                    decimal=true;
                }
                         
                 return prePost[0]+process(matheString,evaluate,decimal)+prePost[1];
                     
                
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
    
    
    // nerdamer
    // von http://nerdamer.com/js/demo.js
    
    function extractExpression(str) {
            var l = str.length,
                openBrackets = 0;
            for(var i=0; i<l; i++) {
                var ch = str.charAt(i);
                if(ch === '(' || ch === '[') openBrackets++; //record and open brackets
                if(ch === ')' || ch === ']') openBrackets--; //close the bracket
                if(ch === ',' && !openBrackets) return [str.substr(0, i), str.substr(i+1, l)];
            }
            return [str, ''];
        };
    
    function prepareExpression(str) {
            //the string will come in the form x+x, x=y, y=z
            var extracted = extractExpression(str.split(' ').join('')),
                expression = extracted[0],
                scope = {};
            extracted[1].split(',').map(function(x) {
                var parts = x.split('='),
                   varname = parts[0],
                   value = parts[1];
                if(nerdamer.validVarName(varname) && typeof value !== 'undefined')
                    scope[varname] = parts[1];
            });
            return [expression, scope];
        }
    
    function process(text,evaluate,decimalNumber) {
            var x=nerdamer('f(x)=x^2');
            var y=nerdamer('h(x)=diff(f(x),x)');
            var z=nerdamer('h(2)').toString();
            var expressionAndScope = prepareExpression(text),
                expression = expressionAndScope[0],
                scope = expressionAndScope[1],
                //alternative regex: ^([a-z_][a-z\d\_]*)\(([a-z_,])\):=([\+\-\*\/a-z\d*_,\^!\(\)]+)
                functionRegex = /^([a-z_][a-z\d\_]*)\(([a-z_,\s]*)\):=(.+)$/gi, //does not validate the expression
                functionDeclaration = functionRegex.exec(expression),
                LaTeX;
            
            //it might be a function declaration. If it is the scope object gets ignored
            if(functionDeclaration) { 
                //Remember: The match comes back as [str, fnName, params, fnBody]
                //the function name should be the first group of the match
                var fnName = functionDeclaration[1],
                    //the parameters are the second group according to this regex but comes with commas 
                    //hence the splitting by ,
                    params = functionDeclaration[2].split(','),
                    //the third group is just the body and now we have all three parts nerdamer needs to create the function
                    fnBody = functionDeclaration[3];
                //we never checked if this is in proper format for nerdamer so we'll just try and if nerdamer complains we'll let the person know
                try {
                    nerdamer.setFunction(fnName, params, nerdamer(fnBody).text());
                    LaTeX =  fnName+ //parse the function name with nerdamer so we can get back some nice LaTeX
                            '('+ //do the same for the parameters
                                params.map(function(x) {
                                    return nerdamer(x).toTeX();
                                }).join(',')+
                            ')='+
                            nerdamer(fnBody).toTeX();

                    if(Object.keys(scope).length > 0) {
                       // notify('A variable object was provided but is ignored for function declaration.');
                    }
                    //add the LaTeX to the panel
                    //addToPanel(LaTeX, expression);   
                    return LaTeX.split('\n').join('');
                    //clear();
                }
                catch(e) { 
                    return text('Error: Could not set function: '+e.toString());
                }
            }
            else {
                var variableDeclaration = /^([a-z_][a-z\d\_]*):(.+)$/gi.exec(expression);
                if(variableDeclaration) {
                    try {
                        var varName = variableDeclaration[1],
                            varValue = variableDeclaration[2];
                        //set the value
                        nerdamer.setVar(varName, varValue);
                        //generate the LaTeX
                        LaTeX = varName+'='+nerdamer(varValue).toTeX();
                        //addToPanel(LaTeX, expression, undefined, varName); 
                        var test=LaTeX.split('\n').join('');
                        return LaTeX.split('\n').join('');
                        
                        //clear();
                    }
                    catch(e){
                        return text('Something went wrong. Nerdamer could not parse expression: '+e.toString());
                    } 
                }
                else {
                    try {
                        //wrap the expression in expand if expand is checked
                        //var evaluated = nerdamer(expandIsChecked() ? 'expand('+expression+')' : expression, scope),
                        var evaluated=nerdamer(expression,scope);
                            //check if the user wants decimals
                            //decimal = toDecimal() ? 'decimal' : undefined,
                            //the output is for the reload button
                            output = evaluated.toString(); 
                        //call evaluate if the evaluate box is checked
                        if(evaluate==true) {
                            evaluated = evaluated.evaluate();
                        }
                        decimal=undefined;
                        if (decimalNumber==true){
                            decimal='decimal';
                        }
                        LaTeX = evaluated.toTeX(decimal);
                        //add the LaTeX to the panel
                        //addToPanel(LaTeX, expression, output);  
                        return LaTeX.split('\n').join('');
                        //clear();
                    }
                    catch(e){
                        return text('Something went wrong. Nerdamer could not parse expression: '+e.toString());
                    } 
                }  
            }
        }
    
}


