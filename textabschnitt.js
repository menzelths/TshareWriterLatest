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
    
    this.recalculate=function(text){
        $("body").append("<div id='tempDiv' style='display:hidden'></div>");
        var ergebnis=parseMarkdown(text,"#tempDiv");
        $("#tempDiv").remove();
        return ergebnis;
    }
    
    function Punkt(x, y) {
		this.x = x;
		this.y = y;
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
         res=res.replace(/\!\!\!(.|\n)*?\!\!\!/g, function myFunction(mathString){ // zeichnen
            
                 mathString=mathString.trim().split(' ').join('');
                 var replaceValue=["NerdTerm12","NerdTerm2"]; // 2 für zeichnen
                 
                 return replaceValue[0]+" "+mathString.substring(3,mathString.length-3)+" "+replaceValue[1];
             
                            
                
             });
         
         
         res=res.replace(/\!\ppp(.|\n)*?\!\ppp/g, function myFunction(x){ // zeichnen
             x=x.replace(/\!\!(.|\n)*?\!\!/g, function myFunction2(mathString){
                 mathString=mathString.trim().split(' ').join('');
                 var replaceValue=["NerdTerm12","NerdTerm2"]; // 2 für zeichnen
                 
                 return replaceValue[0]+" "+mathString.substring(2,mathString.length-2)+" "+replaceValue[1];
             });
                            
               return x;  
             });
         
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
         
         
         
         res=res.replace(/NerdTerm1(.|\n)*?NerdTerm2/g, function myFunction(x){
            if (x.substring(9,x.length-9).indexOf('\n')!=-1){
                
                var matheString=x.substring(10,x.length-9).trim(); // 10, da auch prefix weg kann
                
                
                var ergebnis= matheString.split('\n').map(function(zeile){
                    var rueckgabe=true;
                    zeile=zeile.trim();
                    if (zeile.startsWith("!")){
                        rueckgabe=false;
                        zeile=zeile.substr(1).trim();
                        
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
                        var berechnung=process(matheString,evaluate,decimal,true); // somit werden auch unsichtbare Ausdrücke evaluiert
                         if (rueckgabe==true){
                         return "$$\n"+berechnung+"\n$$";
                         }
                     
                    
                }).join('\n');
                return ergebnis;
            } else {
                
                var matheString=x.substring(9,x.length-9).trim();
                if (matheString.startsWith("0")||matheString.startsWith("1")){
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
                         
                 return prePost[0]+process(matheString,evaluate,decimal,true)+prePost[1];
                } else if (matheString.startsWith("2")){ // zeichnen
                    matheString=matheString.substr(1).trim();
                    var ergebnisRechnung=process(matheString,evaluate,decimal,false);
                    return nerdamer(ergebnisRechnung).evaluate().text();
                }
                
            }
        });
         
         // Zeichnen
         var xaxis=[-5,5];
         var yaxis=[-5,5];
         var ratio=[1,1];
         var grid=[1,1];
         var canvasPixel=[1000,1000];
         
        
         
         res=res.replace(/\!ppp(.|\n)*?\!ppp/g, function myFunction(x){
             var farbe="#000000";
             var zeichenbreite=5;
             var achsenzaehler=0;
             var bildbreite=2000;
             var achsenFarbe="";
             var achsenDicke="";
             
             var schriftGroesseStandard=40;
             $("body").append("<canvas id='plotcanvas' style='display:none' width='"+bildbreite+"px' height='"+bildbreite+"px'></canvas>");
             var canvas=$("#plotcanvas")[0];
         var gc2=$("#plotcanvas")[0].getContext("2d");
         gc2.font=schriftGroesseStandard+"px Sans-Serif";
             gc2.setLineDash([]);
             x.split('\n').map(function myFunction2(mathString){
                var teil=mathString.split(":"); // einträge
                 
                 function holeX(xvariable){
                        return (xvariable-parseFloat(xaxis[0]))/(parseFloat(xaxis[1])-parseFloat(xaxis[0]))*canvasPixel[0];
                    }
                    
                    function holeY(yvariable){
                        return canvasPixel[1]-(yvariable-parseFloat(yaxis[0]))*canvasPixel[1]/(parseFloat(yaxis[1])-parseFloat(yaxis[0]));
                    }
                 
                 
                    
                 function zeichnePfeil(x1,y1,x2,y2, groesse=20, breite=8){
                     gc2.strokeStyle=farbe;
                     gc2.lineCap="round";
                     gc2.lineWidth=""+zeichenbreite;
                     gc2.beginPath();
                     gc2.moveTo(x1,y1);
                     gc2.lineTo(x2,y2);
                     var deltaX=x2-x1;
                     var deltaY=y2-y1;
                     var laenge=Math.sqrt(deltaX*deltaX+deltaY*deltaY);
                     var deltaXN=deltaX/laenge;
                     var deltaYN=deltaY/laenge;
                     gc2.moveTo(x2-groesse*deltaXN+breite*deltaYN,y2-groesse*deltaYN-breite*deltaXN); // auf Pfeil zurück
                     gc2.lineTo(x2,y2);
                     gc2.moveTo(x2-groesse*deltaXN-breite*deltaYN,y2-groesse*deltaYN+breite*deltaXN);
                     gc2.lineTo(x2,y2);
                     gc2.stroke();
                     
                     
                 }
                  
                 function zeichneXAchse(){
                     gc2.strokeStyle = farbe;
					gc2.lineCap = "round";
					gc2.lineWidth = "" + zeichenbreite;
                     var abstand=1;
                    
                    
                    if (xaxis.length>2){
                        abstand=parseFloat(xaxis[2]);
                    }
                     if (abstand>=0){
                     zeichnePfeil(holeX(parseFloat(xaxis[0])),holeY(0),holeX(parseFloat(xaxis[1])),holeY(0));
                     
                     
                    gc2.fillStyle=farbe;
                    if (abstand!=0){
                    for (var i=abstand*parseInt((parseFloat(xaxis[0])-1)/abstand);i<parseFloat(xaxis[1]);i+=abstand){
                        gc2.beginPath();
                        
                        gc2.moveTo(holeX(i),holeY(0)-10);
                        gc2.lineTo(holeX(i),holeY(0)+10);
                        if (i!=0){
                            
                            gc2.fillText(""+i,holeX(i)-5,holeY(0)+55);
                        }
                        gc2.stroke();
                    }
                    }
                     }
                    
                 }
                 
                 function drawEllipseByCenter(ctx, cx, cy, w, h,fill) {
  drawEllipse(ctx, cx - w/2.0, cy - h/2.0, w, h,fill);
}

function drawEllipse(ctx, x, y, w, h,fill) {
  var kappa = .5522848,
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  //ctx.closePath(); // not used correctly, see comments (use to close off open path)
    if (fill==true){
        ctx.fill();
    }
  ctx.stroke();
    
}

                 
                 
                 function zeichneYAchse(){
                     gc2.strokeStyle = farbe;
					gc2.lineCap = "round";
					gc2.lineWidth = "" + zeichenbreite;
                     var abstand=1;
                    
                    if (yaxis.length>2){
                        abstand=parseFloat(yaxis[2]);
                    }
                     
                     if (abstand>=0){
                         zeichnePfeil(holeX(0),holeY(parseFloat(yaxis[0])),holeX(0),holeY(parseFloat(yaxis[1])));
                     
                    gc2.fillStyle=farbe;
                    if (abstand!=0){
                        for (var i=abstand*parseInt((parseFloat(yaxis[0])-1)/abstand);i<parseFloat(yaxis[1]);i+=abstand){
                        gc2.beginPath();
                        
                        gc2.moveTo(holeX(0)+10,holeY(i));
                        gc2.lineTo(holeX(0)-10,holeY(i));
                        if (i!=0){
                            
                            gc2.fillText(""+i,holeX(0)+20,holeY(i)+20);
                        }
                        gc2.stroke();
                    }
                    }
                     }
                 }
                
                if (teil[0].trim().toLowerCase()=="grid"){
                    grid=teil[1].split(',');
                    if (grid.length>1&&achsenzaehler>1){
                        var deltaX=parseFloat(grid[0]);
                        var deltaY=parseFloat(grid[1]);
                        
                        // xrichtung
                        if (deltaX>0){
                        for(var i=deltaX*(parseInt(parseFloat(xaxis[0])/(deltaX)));i<parseFloat(xaxis[1]);i+=deltaX){
                            if (i!=0||(i==0&&yaxis.length==3&&parseFloat(yaxis[2])<0)){ 
                            gc2.strokeStyle = farbe;
                       gc2.lineWidth=zeichenbreite;
                        gc2.beginPath();
                        gc2.moveTo(holeX(i),holeY(parseFloat(yaxis[0])));
                        gc2.lineTo(holeX(i),holeY(parseFloat(yaxis[1])));
                        gc2.stroke();
                            }
                        }
                        }
                        
                        // yrichtung
                        if (deltaY>0){
                        for(var i=deltaY*(parseInt(parseFloat(yaxis[0])/(deltaY)));i<parseFloat(yaxis[1]);i+=deltaY){
                            if (i!=0||(i==0&&xaxis.length==3&&parseFloat(xaxis[2])<0)){ 
                             gc2.strokeStyle = farbe;
                       gc2.lineWidth=zeichenbreite;
                        gc2.beginPath();
                        gc2.moveTo(holeX(parseFloat(xaxis[0])),holeY(i));
                        gc2.lineTo(holeX(parseFloat(xaxis[1])),holeY(i));
                        gc2.stroke();
                        }
                        }
                        }
                    
                        
                        // achsen erneut zeichnen
                        var farbspeicher=farbe;
                        var dickenspeicher=zeichenbreite;
                        farbe=achsenFarbe;
                        zeichenbreite=achsenDicke;
                        zeichneXAchse();
                        zeichneYAchse();
                        // farben zurücksetzen
                        farbe=farbspeicher;
                        zeichenbreite=dickenspeicher;
                    }
                    return "";
                } else if (teil[0].trim()=="fontsize"){
                
                    gc2.font=teil[1].trim()+"px Sans-Serif";
                
                } else if (teil[0].trim()=="arrow"){
                    var rest=teil[1].split(',');
                    if (rest.length==4){
                       gc2.fillStyle = farbe;
                       gc2.lineWidth=zeichenbreite; zeichnePfeil(holeX(parseFloat(rest[0])),holeY(parseFloat(rest[1])),holeX(parseFloat(rest[2])),holeY(parseFloat(rest[3])))
                    }
                    
                }else if (teil[0].trim()=="polygon"){
                    var rest=teil[1].split(',');
                    if (rest.length>0){
                    var fuellen=true;
                    var fuellfarbe="";
                    var laenge=rest.length;
                    if (laenge%2==0){
                        fuellen=false;
                        laenge--;
                    }
                    if (fuellen==true){
                        fuellfarbe=rest[rest.length-1]; // letzter Wert Farbe
                    }
                    gc2.beginPath();
                    gc2.moveTo(holeX(parseFloat(rest[0])),holeY(parseFloat(rest[1])));
                    for (var i=2;i<laenge;i+=2){
                        gc2.lineTo(holeX(parseFloat(rest[i])),holeY(parseFloat(rest[i+1])));
                    }
                    if (fuellen==true){
                        gc2.fillStyle=fuellfarbe;
                        gc2.fill();
                    } 
                        gc2.strokeStyle=farbe;
                        gc2.lineWidth=zeichenbreite;
                        gc2.stroke();
                    
                    }
                }
                    else if (teil[0].trim().toLowerCase()=="pen"){
                         var rest=teil[1].split(',');
                    if (rest.length>0){
                        farbe=rest[0];
                    }
                    if (rest.length>1){
                        zeichenbreite=parseFloat(rest[1]);
                    }
                    if (rest.length>3){
                        gc2.setLineDash([parseInt(rest[2]),parseInt(rest[3])]);
                    }
                    
                    
                } else if (teil[0].trim().toLowerCase()=="xaxis"){
                    xaxis=teil[1].split(',');
                    if (xaxis.length==3){
                    if (parseFloat(xaxis[1])<parseFloat(xaxis[0])){
                        var dummy=xaxis[0];
                        xaxis[0]=xaxis[1];
                        xaxis[1]=dummy;
                        }
                    achsenzaehler++;
                    if (achsenzaehler==2){
                        zeichneXAchse();
                        zeichneYAchse();
                        achsenFarbe=farbe;
                        achsenDicke=zeichenbreite;
                    }
                    }
                    
                    return "";
                } else if (teil[0].trim().toLowerCase()=="yaxis"){
                    yaxis=teil[1].split(',');
                    if (yaxis.length==3){
                    if (parseFloat(yaxis[1])<parseFloat(yaxis[0])){
                        var dummy=yaxis[0];
                        yaxis[0]=yaxis[1];
                        yaxis[1]=dummy;
                        }
                    achsenzaehler++;
                    if (achsenzaehler==2){
                        zeichneXAchse();
                        zeichneYAchse();
                        achsenFarbe=farbe;
                        achsenDicke=zeichenbreite;
                    }
                    }
                    
                    
                    return "";
                } else if (teil[0].trim().toLowerCase()=="ratio"){
                    if (teil.length>1){
                    ratio=teil[1].split(',');
                    canvas.width=bildbreite;
                    canvas.height=bildbreite*parseFloat(ratio[1])/parseFloat(ratio[0]);
                    
                    gc2.clearRect(0,0,canvas.width,canvas.height);
                    canvasPixel=[canvas.width,canvas.height];
                     gc2.font=schriftGroesseStandard+"px Sans-Serif";
             gc2.setLineDash([]);
                    }
                    return "";
                
                } else if (teil[0].trim().toLowerCase()=="line"){
                    var rest=teil[1].split(',');
                    if (rest.length>3){
                        gc2.strokeStyle = farbe;
                       gc2.lineWidth=zeichenbreite;
                        gc2.beginPath();
                        gc2.moveTo(holeX(parseFloat(rest[0])),holeY(parseFloat(rest[1])));
                        gc2.lineTo(holeX(parseFloat(rest[2])),holeY(parseFloat(rest[3])));
                        gc2.stroke();
                    }
                } else if (teil[0].trim().toLowerCase()=="circle"){
                    var rest=teil[1].split(',');
                    if (rest.length>2){
                        gc2.strokeStyle = farbe;
                       gc2.lineWidth=zeichenbreite;
                        var mx=parseFloat(rest[0]);
                        var my=parseFloat(rest[1]);
                        var radius=parseFloat(rest[2]);
                        gc2.beginPath();
                        var fuellen=false;
                        if(rest.length==4){
                            gc2.fillStyle=rest[3];
                            fuellen=true;
                        }
                        drawEllipseByCenter(gc2,holeX(mx),holeY(my),2*(holeX(radius)-holeX(0)),2*(holeY(0)-holeY(radius)),fuellen);
                        
                    }
                } else if (teil[0].trim().toLowerCase()=="fill"){
                    var rest=teil[1].split(',');
                    if (rest.length>3){
                        var startx=parseFloat(rest[2]);
                        var endx=parseFloat(rest[3]);
                        var f1=nerdamer(rest[0].trim()).buildFunction();
                        var f2=nerdamer(rest[1].trim()).buildFunction();
                        for (var i=startx;i<endx;i+=(parseFloat(xaxis[1])-parseFloat(xaxis[0]))/canvasPixel[0]){
                            gc2.beginPath();
                            gc2.lineWidth=1;
                            gc2.strokeStyle=farbe;
                            gc2.moveTo(holeX(i),holeY(f1(i)));
                            gc2.lineTo(holeX(i),holeY(f2(i)));
                            gc2.stroke();
                        }
                    }
                
                } else if (teil[0].trim().toLowerCase()=="point"){
                    var rest=teil[1].split(',');
                    
                    var deltaX=0;
                    var deltaY=0;
                    if (rest.length>2){
                    gc2.beginPath();
					gc2.fillStyle = farbe;
                        if (parseInt(rest[2])>0){
					gc2.fillRect(holeX(parseFloat(rest[0]))-parseInt(rest[2]), holeY(parseFloat(rest[1]))-parseInt(rest[2]),parseInt(rest[2]*2+1), parseInt(rest[2]*2+1));
                        }
                                       }
                    if (rest.length>3){
                        deltaX=2*parseInt(rest[2]);
                        deltaY=parseInt(rest[2]);
                    }
                    if (rest.length>5){
                        deltaX=parseInt(rest[4]);
                        deltaY=parseInt(rest[5]);
                    }
                    if (rest.length>3){
                        
                        gc2.fillText(rest[3], holeX(parseFloat(rest[0]))+deltaX, holeY(parseFloat(rest[1]))+deltaY);
                    }
                
                } else if (teil[0].trim().toLowerCase()=="function"){ //  ab hier interessant
                    
                    var startx=parseFloat(xaxis[0]);
                    var endx=parseFloat(xaxis[1]);
                    var rest=teil[1].split(',');
                    
                    if (rest.length>2){
                        startx=parseFloat(rest[1]);
                        endx=parseFloat(rest[2]);
                    }
                    if (rest.length>0){
                        
                        var daten=[];
                        var f=nerdamer(rest[0].trim()).buildFunction(); //javascriptfunktion erstellen
                        xax0=parseFloat(xaxis[0]);
                        xax1=parseFloat(xaxis[1]);
                        yax0=parseFloat(yaxis[0]);
                        yax1=parseFloat(yaxis[1]);
                        var abschnitt=0;
                        var ok=false;
                        daten.push([]);
                        for (var i=startx;i<endx;i+=(xax1-xax0)/canvasPixel[0]){
                            
                            //daten.push(new Punkt(i,canvasPixel[1]-(f(xwert)-yax0)*canvasPixel[1]/(yax1-yax0)));
                            if (f(i)<=yax1&&f(i)>=yax0){
                                
                            
                            daten[abschnitt].push(new Punkt(holeX(i),holeY(f(i))));
                                ok=true;
                            } else {
                                if (ok==true){
                                    abschnitt++;
                                    daten.push([]);
                                }
                                ok=false;
                            }
                            //daten.push(new Punkt(xwert,f(xwert)));
                        }
                        for (var abschnitt=0;abschnitt<daten.length;abschnitt++){
                        var erg=QreatorBezier.holeBezier(daten[abschnitt], 0.1);
		                for (var i=0;i<erg.length;i++){
                            
			var tmp = erg[i];
            var geaendert=false;
            
                            
                            
                            
			if (tmp.length === 1) { // punkt
				if (geaendert == false) { // nur zeichnen, wenn es danach
											// nicht gleich ersetzt wird
					gc2.beginPath();
					gc2.fillStyle = farbe;
					gc2.fillRect(tmp[0].x, tmp[0].y, 1, 1);
				}
			} else if (tmp.length === 4) {
				if (geaendert == false) {
					gc2.beginPath();
					gc2.moveTo(tmp[0].x, tmp[0].y);
					gc2.strokeStyle = farbe;
					gc2.lineCap = "round";
					gc2.lineWidth = "" + zeichenbreite;

					gc2.bezierCurveTo(tmp[1].x, tmp[1].y, tmp[2].x, tmp[2].y,
							tmp[3].x, tmp[3].y);
					

					gc2.stroke();
				
            }
                        }
                        
                        
                        }
                        }
                    }
                    return "Funktion gefunden";
                }
             });
             
              // canvas als bild speichern
         var bilddaten=$("#plotcanvas")[0].toDataURL();
         
         $("#plotcanvas").remove();
             return "\n\n++++\n<img  style='margin-left:auto; margin-right:auto;display:block' src='"+bilddaten+"' width='600px'  ></img>\n++++\n";
             
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
         var test=$(selector).html();
         return test;
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
    
    function process(text,evaluate,decimalNumber,latex) {
            
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
                    fnBody = nerdamer(functionDeclaration[3]).text();
                //we never checked if this is in proper format for nerdamer so we'll just try and if nerdamer complains we'll let the person know
                try {
                    nerdamer.setFunction(fnName, params, fnBody);
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
                    if (latex==true){
                    return LaTeX.split('\n').join('');
                    } else {
                        return text;
                    }
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
                        nerdamer.setVar(varName, nerdamer(varValue).text());
                        //generate the LaTeX
                        LaTeX = varName+'='+nerdamer(varValue).toTeX();
                        //addToPanel(LaTeX, expression, undefined, varName); 
                        
                        
                        if (latex==true){
                    return LaTeX.split('\n').join('');
                    } else {
                        return text;
                    }
                        
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
                        var evaluated=nerdamer(nerdamer(expression).text() ,scope);
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
                        if (latex==true){
                    return LaTeX.split('\n').join('');
                    } else {
                        return text;
                    }
                        //clear();
                    }
                    catch(e){
                        return text('Something went wrong. Nerdamer could not parse expression: '+e.toString());
                    } 
                }  
            }
        }
    
}


