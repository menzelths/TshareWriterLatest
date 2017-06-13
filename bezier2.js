
var QreatorBezier=new function() {
	var farben,knoepfe,dicken,layer,visibleLayers,layerfolge,c,breite,hoehe,toleranz_steigung,rx,
	ry,rasterVorgabe,rasterzaehler, stiftdicke,farbe,grenzeAnzahl,rechtecke,rechtekce2,betroffeneKurven,
	zeichenbreite,toleranzgrenze,layer,dezimalenSVG,ecken,altx,alty,zeichenmodus,gc,gc2,gc0,gc3,kurven,
	raster,maus,touch,debugging,gedrueckt,berechnung,datenx,dateny,daten,zmaxgesamt,zmingesamt,selectorGlobal,radierdicke, farbwahl,
	menuGlobal;
	
	var farben = [ "#000000", "#FF0000", "#0000FF", "#ffff00", "#008000",
			"#FFA500", "#A52A2A", "#800000", "#808000", "#808080", "#cccccc", "#FFFFFF", "#0000A0", "#ADD8E6", "#800080", "#00FF00", "#00FFFF", "#FF00FF" ];
	var knoepfe = "<div class='auswahl'>";
	for (var i = 0; i < farben.length; i++) {
	
		var text= "<button class='farbe' farbe='" + farben[i]+ "' style='background: " + farben[i] + ";' value='Farbe' nr='"+i+"'><span style='color: "+farben[i]+"'>PP</span></button>";
		knoepfe+=text;
	}
	var dicken = [ 2, 2.5,3,3.5, 4, 6, 8, 10, 12,14,16,18,20,30,40,50 ];
	knoepfe += "</div><div class='auswahl'>";
	for (var i = 0; i < dicken.length; i++) {
		knoepfe += "<button class='dicke' dicke='" + dicken[i] + "'  value='D"
				+ dicken[i] + "' nr='"+i+"'>" + dicken[i] + "</button> ";
	}
	var layers = [ 0, 1, 2, 3, 4,5,6,7,8,9 ];
	var visibleLayers=[1,1,1,1,1,1,1,1,1,1]; // bezogen auf layerfolge
	var layerfolge=[0,1,2,3,4,5,6,7,8,9];
	knoepfe += "</div><div class='auswahl''>";
	for (var i = 0; i < layers.length; i++) {
		knoepfe += "<button class='layer' layer='" + layers[i] + "' >"+ layers[i] + "</button><input type='checkbox' name='layer' id='checkbox_"+i+"' value='"+i+"' class='check' checked='checked'></input>";
				
	}
	knoepfe+="</div>";
	var that=this;
	
	this.init=function (selector,b,h,menuSelector,horizontal){
		breite = b;
		 hoehe = h;
		selectorGlobal=selector;
		menuGlobal=menuSelector;
		$(selector)
		.html("<div id='rahmen' style='position: relative;'> <canvas id='layer1' width='"+breite+"' height='"+hoehe+"' style='z-index: 0;'></canvas> <canvas id='layer2'  width='"+breite+"' height='"+hoehe+"' style='position: absolute; left: 0; top: 0; z-index: 1;'></canvas><canvas id='layer3' width='"+breite+"' height='"+hoehe+"' style='position: absolute; left: 0; top: 0; z-index: 2;'></canvas> </div>");
		$(menuSelector).html(knoepfe+ "<div id='knoepfe'> <input type='button' class='holen knopf' b='Stift' id='stift' value='Stift'/><input type='button' class='holen knopf' b='Radierer' id='radierer' value='Radierer'/><input type='button' class='holen knopf' b='Raster ändern' id='raster' value='Raster' /><input type='button' class='holen knopf' b='Alles löschen' id='loeschen' value='Aktuellen Abschnitt leeren' /><input type='button' class='holen knopf' b='Aktive Ebene löschen' id='loeschenAktiv' value='Aktive Ebene leeren' /></div><div id='ausgabe'></div><div id='info' ></div>");
//$(selector).append("<button id='download'>Download</button>");
//$(selector).append("<textarea id='svgText' rows='20' cols='100'> </textarea><button id='tbutton'>Bild laden</button>");
$(selector)
		.append(
				"<div id='qreator_svgbild'></div>");

	
 gc = $("#layer2")[0].getContext("2d");
gc.strokeStyle = "#ff0000";

	 c = $("#layer3")[0];
	 
	 toleranz_steigung = 0.01;
	 rx = 5; // zum radieren in rechtecke zerlegen
	 ry = 5;
	 rasterVorgabe = [ [ [], [] ,""], [ [ 30 ], [ 30 ],"#aaaaff" ], [ [], [ 60 ] ,"#aaaaff"],
			[ [], [ 60, 74, 88, 102, 116 ],"#000000" ] ];
	 rasterzaehler = 0;
	 stiftdicke = 2.5;
	 farbe = "#000000";
	 grenzeAnzahl = 2; // ab wann werden mehrere rechtecke untersucht?
	 rechtecke = [];
	 rechtecke2 = [];
	 betroffeneKurven = [];
	 zeichenbreite = 2.5;
	 radierdicke=13; // position in dickenliste
	 stiftdicke=1; // position in dickenliste
	 farbwahl=0; // position in farbenliste
	 toleranzgrenze = 1.3;
	 layer = 2;
	 dezimalenSVG = 1;
	 ecken = [];
	 altx = 0, alty = 0;
	 zeichenmodus = 0; // 0 für zeichnen, 1 für radieren
	 gc2 = $("#layer1")[0].getContext("2d");
	// layer 1 transparent machen
	 //gc0 = $("#layer0")[0].getContext("2d");
	 gc3=$("#layer3")[0].getContext("2d");
	 kurven = []; // speichert alle eingegebenen bezierkurven
	 for (var i=0;i<layerfolge.length;i++){
		 kurven[i]=[];
	 }
	
	 raster = false;
	 maus = false;
	 touch = false;
	 debugging = 0;
	 gedrueckt = false;
	 berechnung = false;
	 datenx = [], dateny = [], daten = [];
	 zmaxgesamt = 0, zmingesamt = 0;
	// erst touch events, dann mouse events
	c.ontouchstart = function(event) {
		event.preventDefault();
		daten = [];
		gedrueckt = true;
		touch = true;
		maus = false;
	//	$("#info").html("touchstart");
		touchBewegt(event);
	};
	c.ontouchmove = function(event) {
		event.preventDefault();
		if (touch === true&&gedrueckt==true)
		//	$("#info").html("touchmove mit touch==true");
			touchBewegt(event);
	};
	c.ontouchend = function(event) {
		event.preventDefault();
		if (touch === true) {
			berechnung = true;
			gedrueckt = false;
			touch=false;
			//$("#info").html("touchend mit touch==true");
			touchBewegt(event);
		}
	};
	c.onmousedown = function(event) {
		event.preventDefault();
		daten = [];
		gedrueckt = true;
		maus = true;
		touch = false;
		//$("#info").html("onmousedown");
		mausBewegt(event);
	};
	c.onmousemove = function(event) {
		event.preventDefault();
		if (maus === true) {
			//$("#info").html("onmousemove mit maus=true");
			mausBewegt(event);
		}
	};
	c.onmouseup = function(event) {
		event.preventDefault();
		if (maus === true) {
			berechnung = true;
			gedrueckt = false;
			
			//$("#info").html("onmouseup mit maus=true");
			maus=false;
			mausBewegt(event);
		}
	};
	$("#tbutton").click(function(event){
		event.preventDefault();
		var t=$("#svgText").val();
		that.loadSVG(t);
	});
	$("#download").click(function(event){
		event.preventDefault();
		var text=$("html").html();
		window.open("data:text/csv,"+text);
	});
	$(".farbe").click(function(event) {
		event.preventDefault();
		farbe = $(this).attr("farbe");
		farbwahl=parseInt($(this).attr("nr"));
		//$("#ebene").html("<font color='"+farbe+"'> Ebene "+layer+", Dicke: "+zeichenbreite+"</font>");
		zeichenmodus=0;
		//$("#ausgabe").html("Stift");
		//$(".farbe").removeClass("aktiv");
		//$("#radierer").removeClass("aktiv");
		//$("#stift").addClass("aktiv");
		//$(this).addClass("aktiv");
		zeichenbreite=dicken[stiftdicke];
		
		//zeichenbreite = stiftdicke;
	updateAuswahl();
	});
	
	$(".dicke").click(function(event) {
		event.preventDefault();
		if (zeichenmodus==0){
			stiftdicke=parseInt($(this).attr("nr"));
		} else {
			radierdicke=parseInt($(this).attr("nr"));
		}
		zeichenbreite = parseInt($(this).attr("dicke"));
		
		//$(".dicke").removeClass("aktiv");
		//$(this).addClass("aktiv");
		updateAuswahl();
	});
	$(".layer").click(function(event) {
		event.preventDefault();
		var layerDummy = parseInt($(this).attr("layer"));
		if (visibleLayers[layerDummy]==1){
			layer=layerDummy;
		if (kurven[layer] == null) {
			kurven[layer] = [];
		}
		//$("#ebene").html("<font color='"+farbe+"'> Ebene "+layer+", Dicke: "+zeichenbreite+"</font>");
		//$(".layer").removeClass("aktiv");
		//$(this).addClass("aktiv");
		zeichneEbenen(layerfolge[layer],0,layerfolge.length-1);
		} 
		updateAuswahl();
	});
	$(".check").click(function(event){
		//event.preventDefault(); // sonst probleme mit checkbox deaktivieren vom system
		var wert=0;
		if ($(this).prop("checked")==true){
			wert=1;
			
		} 
		visibleLayers[parseInt($(this).attr("value"))]=wert;
		zeichneEbenen(layerfolge[layer],0,layerfolge.length-1);
		updateAuswahl();
	});
	$("#radierer").click(function(event) {
		event.preventDefault();
		zeichenmodus = 1;
		zeichenbreite=dicken[radierdicke];
		//zeichenbreite = 8;
		//$("#stift").removeClass("aktiv");
		//$(".farbe").removeClass("aktiv");
		//$(this).addClass("aktiv");
		//$("#ausgabe").html("Radierer");
		updateAuswahl();
	});
	$("#stift").click(function() {
		//$("#radierer").removeClass("aktiv");
		//$("#stift").addClass("aktiv");
		zeichenbreite=dicken[stiftdicke];
	
		//zeichenbreite = stiftdicke;
		zeichenmodus=0;
		//$("#ausgabe").html("Stift");
		updateAuswahl();
	});
	$("#raster").click(
			function(event) {
				event.preventDefault();
				rasterzaehler = (rasterzaehler + 1) % 4;
				zeichneRaster(rasterVorgabe[rasterzaehler][0],
						rasterVorgabe[rasterzaehler][1],rasterVorgabe[rasterzaehler][2]);

			});
	
	$("#loeschenAktiv").click(function(event) {
		event.preventDefault();
		var leer = gc2.createImageData(breite, hoehe);
		for (var i = 0; i < leer.length; i += 4) {
			leer[i] = 255;
			leer[i + 1] = 255;
			leer[i + 2] = 255;
			leer[i + 3] = 0;
		}
		gc2.putImageData(leer, 0, 0);
		kurven[layerfolge[layer]]=[];
		zeichneEbenen(layer,0,layer);
	});
	
	$("#loeschen").click(function(event) {event.preventDefault();
		var leer = gc2.createImageData(breite, hoehe);
		for (var i = 0; i < leer.length; i += 4) {
			leer[i] = 255;
			leer[i + 1] = 255;
			leer[i + 2] = 255;
			leer[i + 3] = 0;
		}
		gc2.putImageData(leer, 0, 0);
	
		
		gc3.putImageData(leer, 0, 0);
		for (var i=0;i<layerfolge.length;i++){
			kurven[i] = [];
		}
	});
	$("#knopf").click(
			function(event) {
				event.preventDefault();
				QreatorBezier.showSVG();
			});
	
	function updateAuswahl(){
		if (zeichenmodus==0){ // zeichnen
			$(".dicke").removeClass("aktiv");
			$("[dicke='"+dicken[stiftdicke]+"']").addClass("aktiv");
			$(".layer").removeClass("aktiv");
			$("[layer='"+layerfolge[layer]+"']").addClass("aktiv");
			$(".farbe").removeClass("aktiv");
			$("[farbe='"+farben[farbwahl]+"']").addClass("aktiv");
			$("#radierer").removeClass("aktiv");
			$("#stift").addClass("aktiv");
		} else { //radieren
			$(".dicke").removeClass("aktiv");
			$("[dicke='"+dicken[radierdicke]+"']").addClass("aktiv");
			$(".layer").removeClass("aktiv");
			$("[layer='"+layerfolge[layer]+"']").addClass("aktiv");
			$(".farbe").removeClass("aktiv");
			$("#radierer").addClass("aktiv");
			$("#stift").removeClass("aktiv");
		}
	}
	
	updateAuswahl();
	}
	
	

	this.showSVG=function(zf){
		var svgString="";
		var svgtext = "";
		var zaehler = 0;
		
		$("#qreator_svgbild")
				.html("<svg  width='"+breite+"' height='"+hoehe+"' id='qreator_svgbild2' class='qreator_svg'><g fill='none' stroke-linecap='round' id='global'></g>"); // altes bild löschen
		for (var m = 0; m < layerfolge.length; m++) {
			var k=layerfolge[m]; // an aktuelle reihenfolge anpassen
			if (kurven[k] != null&&kurven[k].length> 0) {
				var display="";
				if (visibleLayers[m]==0){
					display="visibility='hidden'";
				}
				$("#qreator_svgbild2 #global").append("<g id='layer_" + k + "' "+display+"></g>");
				var text = "";
				var letzterPunkt = kurven[k][0][0][3];
				var aktuelleFarbe = '';
				var aktuelleBreite = '';
				var einsetzString = '';
				var einsetzStringAktuell = '';
				var pfadstart = "<path d='";
				for (var i = 0; i < kurven[k].length; i++) {
					var tmp = kurven[k][i][0];
					var neueFarbe = kurven[k][i][4];
					var neueBreite = kurven[k][i][3];

					if (neueFarbe != aktuelleFarbe
							|| neueBreite != aktuelleBreite) {
						einsetzString = " stroke='" + neueFarbe + "'";
						aktuelleFarbe = neueFarbe;
						einsetzString += " stroke-width='" + neueBreite
								+ "'";
						aktuelleBreite = neueBreite;
					}
					//if (neueBreite!=aktuelleBreite){

					//	}
					if (einsetzString.length > 0) { // neues Path-Segment
						if (text.length > 0) {
							svgtext += pfadstart + text + "' "
									+ einsetzStringAktuell + " />";

							letzterPunkt = {
								x : -1,
								y : -1
							}; // letzten punkt zurücksetzen, so dass neuer pfad
							// startet

							text = "";
						}
						einsetzStringAktuell = einsetzString;
						einsetzString = '';
					}
					if (i > 0 && tmp[0].x === letzterPunkt.x
							&& tmp[0].y === letzterPunkt.y) {
						text += " c "
								+ runde(tmp[1].x - tmp[0].x,
										dezimalenSVG)
								+ " "
								+ runde(tmp[1].y - tmp[0].y,
										dezimalenSVG)
								+ " "
								+ runde(tmp[2].x - tmp[0].x,
										dezimalenSVG)
								+ " "
								+ runde(tmp[2].y - tmp[0].y,
										dezimalenSVG)
								+ " "
								+ runde(tmp[3].x - tmp[0].x,
										dezimalenSVG)
								+ " "
								+ runde(tmp[3].y - tmp[0].y,
										dezimalenSVG);

					} else {
						text += " M "
								+ runde(tmp[0].x, dezimalenSVG)
								+ " "
								+ runde(tmp[0].y, dezimalenSVG)
								+ " c "
								+ runde(tmp[1].x - tmp[0].x,
										dezimalenSVG)
								+ " "
								+ runde(tmp[1].y - tmp[0].y,
										dezimalenSVG)
								+ " "
								+ runde(tmp[2].x - tmp[0].x,
										dezimalenSVG)
								+ " "
								+ runde(tmp[2].y - tmp[0].y,
										dezimalenSVG)
								+ " "
								+ runde(tmp[3].x - tmp[0].x,
										dezimalenSVG)
								+ " "
								+ runde(tmp[3].y - tmp[0].y,
										dezimalenSVG);// +"'
						// stroke='blue'
						// fill='none'
						// stroke-width='"+stiftdicke+"'/>";
					}
					letzterPunkt = kurven[k][i][0][3];
					if (text.length > 2000) {
						svgtext += "<path d='" + text + "' "
								+ einsetzStringAktuell + " />";
						aktuelleFarbe = '';
						neueFarbe = '';

						letzterPunkt = {
							x : -1,
							y : -1
						}; // letzten punkt zurücksetzen, so dass neuer pfad
						// startet

						text = "";
						if (svgtext.length > 10000) {
							$("#qreator_svgbild2 #global #layer_" + k).append(svgtext);

							zaehler += svgtext.length;
							svgtext = "";
						}
						aktuelleFarbe = '';
						aktuelleBreite = '';
					}
				}
				if (text.length > 0) {
					svgtext += "<path d='" + text + "' "
							+ einsetzStringAktuell + " />";
				}
				if (svgtext.length > 0) {
					$("#qreator_svgbild2 #global #layer_" + k).append(svgtext);
					zaehler += svgtext.length;
					svgtext = "";
				}
			}
		}
		//$("#info").html("Anzahl der Zeichen: " + zaehler);
		//var w = window.open("", "MsgWindow", "width=" + breite
		//		+ ",height=" + hoehe);
		//var html = $("#bild").html();
		$("#qreator_svgbild #qreator_svgbild2").removeAttr("id");
		$(selectorGlobal).html("<div class='"+zf+"' >"+$("#qreator_svgbild").html()+"</div>");
		$(menuGlobal).html("");
		
	
	}
	
	function zeichneRaster(xbreite, ybreite,rasterfarbe) {
		/*gc0.fillStyle = '#ffffff';

		var leer = gc0.createImageData(breite, hoehe);
		for (var i = 0; i < leer.length; i += 4) {
			leer[i] = 255;
			leer[i + 1] = 255;
			leer[i + 2] = 255;
			leer[i + 3] = 0;
		}*/
		
		kurven[0]=[]; // altes raster löschen
		var a=new Punkt(0,0);
		var b=new Punkt(0,0);
		if (xbreite.length > 0) {

			for (var x = 0; x < breite; x += xbreite[xbreite.length - 1]) {
				for (var i = 0; i < xbreite.length; i++) {
					var a=new Punkt(x+xbreite[i],0);
					var b=new Punkt(x+xbreite[i],hoehe);
		
		
					var gerade =  [
								a,
								Bezier.addiere(a, Bezier.multipliziereMitSkalar(Bezier
										.subtrahiere(b, a), 1.0 / 3.0)),
								Bezier.addiere(a, Bezier.multipliziereMitSkalar(Bezier
										.subtrahiere(b, a), 2.0 / 3.0)), b ] ; 
					kurven[0].push([gerade,Bezier.findeRechtecksHuelle(gerade),0,2,rasterfarbe]);
					
				}
			}
		}
		
		if (ybreite.length > 0) {
		
			for (var y = 0; y < hoehe; y += ybreite[ybreite.length - 1]) {
				for (var i = 0; i < ybreite.length; i++) {
					a=new Punkt(0,y+ybreite[i]);
					b=new Punkt(breite,y+ybreite[i]);
					var gerade = [ 
									a,
									Bezier.addiere(a, Bezier.multipliziereMitSkalar(Bezier
											.subtrahiere(b, a), 1.0 / 3.0)),
									Bezier.addiere(a, Bezier.multipliziereMitSkalar(Bezier
											.subtrahiere(b, a), 2.0 / 3.0)), b ] ; 
						kurven[0].push([gerade,Bezier.findeRechtecksHuelle(gerade),0,2,rasterfarbe]);
				}
			}
		}
		
		zeichneEbenen(layerfolge[layer],0,layerfolge.length-1);
				
		/*
		gc0.putImageData(leer, 0, 0);
		// if (raster===false){
		if (xbreite.length > 0) {
			for (var x = 0; x < breite; x += xbreite[xbreite.length - 1]) {
				for (var i = 0; i < xbreite.length; i++) {
					gc0.beginPath();
					gc0.moveTo(x + xbreite[i], 0);
					gc0.lineTo(x + xbreite[i], hoehe);
					gc0.strokeStyle = "#aaaaff";
					gc0.stroke();
				}
			}
		}
		if (ybreite.length > 0) {
			for (var y = 0; y < hoehe; y += ybreite[ybreite.length - 1]) {
				for (var i = 0; i < ybreite.length; i++) {
					gc0.beginPath();
					gc0.moveTo(0, y + ybreite[i]);
					gc0.lineTo(breite, y + ybreite[i]);
					gc0.strokeStyle = "#aaaaff";
					gc0.stroke();
				}
			}

		}*/
		

	}

	function zeichneZufaellig(n) { // zeichne n zufällige bezierkurven
		for (var j = 0; j < n; j++) {
			var k = [];
			for (var i = 0; i < 4; i++) {
				if (i === 0) {
					x = parseInt(Math.random() * 600 + 100, 10);
					y = parseInt(Math.random() * 400 + 100, 10);
					k.push(new Punkt(x, y));
				} else {
					x = parseInt(Math.random() * 50 - 25, 10);
					y = parseInt(Math.random() * 50 - 25, 10);
					k.push(new Punkt(x + k[0].x, y + k[0].y));
				}

			}

			gc2.beginPath();
			gc2.moveTo(k[0].x, k[0].y);
			gc2.bezierCurveTo(k[1].x, k[1].y, k[2].x, k[2].y, k[3].x, k[3].y);
			gc2.strokeStyle = "#ff0000";
			gc2.stroke();

			kurven[layer].push([ k, Bezier.findeRechtecksHuelle(k), 0 ]);
		}
	}

	function print(nr, s) {
		if (nr <= debugging) {
			$("#ausgabe").append(s + "<br>");
		}
	}
	function printNeu(nr, s) {
		if (nr <= debugging) {
			$("#ausgabe").html(s + "<br>");
		}
	}

	this.loadSVG=function(svg) { // converts svg-input to internal data format
		var datenLoad = [];
		var anzahlLayer=0;
		for (var i=0;i<visibleLayers.length;i++){
			visibleLayers[i]=1;
		}
		$(svg).find("#global").find("g").each(function(){
			var index=parseInt($(this).attr("id").split("_")[1]);
			kurven[index]=[];
			anzahlLayer++;
			if ($(this).attr("visibility")=="hidden"){
				visibleLayers[index]=0;
			}
			$(this).find("path").each(function(){
				
				var farbeLoad=$(this).attr("stroke");
				var breiteLoad=parseInt($(this).attr("stroke-width"));
				var datenLoad=$(this).attr("d");
				var trimLoad=datenLoad.trim();
				var dataChunks=trimLoad.split("M");
				
				
				for (var j=0;j<dataChunks.length;j++){
					if (dataChunks[j]!=""){
						var teile=dataChunks[j].split("c");
						var koordsalt=teile[0].split(" ");
						var koords=[];
						for (var l=0;l<koordsalt.length;l++){
							if (koordsalt[l]!=""){
								koords.push(koordsalt[l]);
							}
						}
						var punkte=[];
						var p=new Punkt(parseFloat(koords[0]),parseFloat(koords[1]));
						
						//punkte[0].x=parseFloat(koords[0]);
						//punkte[0].y=parseFloat(koords[1]);
						punkte.push(p);
						for (var c=1;c<teile.length;c++){
							
						// andere drei koordinaten
						var restalt=teile[c].split(" ");
						var rest=[];
						for (var l=0;l<restalt.length;l++){
							if (restalt[l]!=""){
								rest.push(restalt[l]);
							}
						}
						if (rest.length>=6){
						
							
							for (var r=0;r<6;r+=2){ // 
								//koords=rest[r].split(",");
								
								p=new Punkt(parseFloat(rest[r])+punkte[0].x,parseFloat(rest[r+1])+punkte[0].y);
			punkte.push(p);
								//x.push(parseFloat(koords[0])+x[r]);
								//y.push(parseFloat(koords[1])+y[r]);
								
							}
						}
						// alle koordinaten komplett: jetzt bezier erstellen
						
						kurven[index].push([punkte,Bezier.findeRechtecksHuelle(punkte),0,breiteLoad,farbeLoad]);
						if (punkte.length==4){
							p=new Punkt(punkte[3].x,punkte[3].y);
						
							punkte=[];
								
							punkte.push(p);
						}
						
					}
					}
				}
			});
		});
		//var paths=$(svg).find("path").each(index,el){

		//}
var layers=[];
var layerfolge=[];
if (anzahlLayer<10){
	anzahlLayer=10;
}
		for (var i=0;i<anzahlLayer;i++){
			layers[i]=i;
			layerfolge[i]=i;
			if (visibleLayers[i]==null){
				visibleLayers[i]=1;
			}
		}
		
		for (var i=0;i<visibleLayers.length;i++){ // checkboxen setzen
			$("#checkbox_"+i).prop('checked',visibleLayers[i]);
			
		}
		zeichneEbenen(layerfolge[layer],0,anzahlLayer-1);
	}

	

	function runde(zahl, dezimalen) {
		m = 1;
		for (var i = 0; i < dezimalen; i++) {
			m *= 10;
		}
		return (parseInt(zahl * m, 10) / m);

	}

	function zeichne(x, y) {

		if (daten.length === 0) {
			gc.beginPath();
			gc.moveTo(x, y);
			altx = x;
			alty = y;
			rechtecke = [];
			gc.lineWidth = "" + zeichenbreite;
			gc.strokeStyle = farbe;
			gc.lineCap = "round";
			for (var i = 0; i < rx * ry; i++) {
				rechtecke[i] = 0;
			}
		} else {
			gc.lineTo(x, y);

			if (zeichenmodus === 1) { // radieren
				gc.lineWidth = "" + zeichenbreite;
				gc.strokeStyle = "rgba(255,200,200,1)";
				// rechteck testen
				var x1 = x, x2 = altx;
				if (altx < x) {
					x1 = altx;
					x2 = x;
				}
				var y1 = y, y2 = alty;
				if (alty < y) {
					y1 = alty;
					y2 = y;
				}
				x1 = x1 - zeichenbreite;
				x2 = x1 + zeichenbreite;
				y1 = y1 - zeichenbreite;
				y2 = y2 + zeichenbreite;
				var startrechteckx = parseInt(x1 / (breite * 1.0 / rx), 10);
				var endrechteckx = parseInt(x2 / (breite * 1.0 / rx), 10);
				var startrechtecky = parseInt(y1 / (hoehe * 1.0 / ry), 10);
				var endrechtecky = parseInt(y2 / (hoehe * 1.0 / ry), 10);
				for (var i = startrechteckx; i <= endrechteckx; i++) {
					for (var j = startrechtecky; j <= endrechtecky; j++) {
						rechtecke[j * rx + i] = 1;
					}
				}
				altx = x;
				alty = y;
			}

			gc.stroke();
			gc.beginPath();
			gc.moveTo(x, y);
		}

		daten.push(new Punkt(x, y));

	}

	function touchBewegt(e) {
		if (gedrueckt === true) {
			var x = e.targetTouches[0].pageX - c.offsetLeft
					- $("#rahmen")[0].offsetLeft;

			var y = e.targetTouches[0].pageY - c.offsetTop
					- $("#rahmen")[0].offsetTop;
			zeichne(x, y);

		}
		zeichneOderRadiere();

	}

	function zeichneOderRadiere() {
		var kurvenebene=layerfolge[layer];
		if (berechnung === true) {
			rechtecke2 = [];
			for (var i = 0; i < rx * ry; i++) {
				if (rechtecke[i] === 1) {
					rechtecke2.push(i);
				}
			}
			// alle rechtecke finden, die vom radieren betroffen sind
			ecken = Bezier.findeRechtecksHuelle(daten); // findet den bereich,
			// in dem der stift
			// tätig war
			if (zeichenmodus === 0) {
				zeichneBezier(daten);

				daten = [];
				berechnung = false;
			} else if (zeichenmodus === 1) { //radieren
				if (kurven[kurvenebene]!=null&&kurven[kurvenebene].length>0){
				// erstelle nun die liste aller betroffenen rechtecke
				betroffeneKurven = [];

				if (rechtecke2.length < grenzeAnzahl) { // dann originalrechteck
					// nehmen
					
					for (var i = 0; i < kurven[kurvenebene].length; i++) {
						kurven[kurvenebene][i][2] = 0; // auf standard
						var tmp = kurven[kurvenebene][i][1]; // hole rechteckshülle

						if (rechteckUeberschneidung(ecken, tmp) === true) {
							kurven[kurvenebene][i][2] = 1; // neu zeichnen setzen
							betroffeneKurven.push(i);
						}
					}

				} else {
					for (var i = 0; i < kurven[kurvenebene].length; i++) {// sonst nur die
						// betroffenen
						kurven[kurvenebene][i][2] = 0; // auf standard
						var tmp = kurven[kurvenebene][i][1]; // hole rechteckshülle

						if (rechteckUeberschneidung2(tmp) === true) { // geht
							// nach
							// segmenten
							// vor
							betroffeneKurven.push(i);
							kurven[kurvenebene][i][2] = 1; // neu zeichnen setzen
						}
					}
				}

				// gefundene kurven von oben nach unten durchlaufen und auf
				// treffer überprüfen
				var radierer = gc.getImageData(0, 0, breite, hoehe); // radierbereich
				// wählen
				for (var i = betroffeneKurven.length - 1; i >= 0; i--) { // alle
					// betroffenen
					// kurven
					// durchlaufen
					var tmp = kurven[kurvenebene][betroffeneKurven[i]][0];
					var stiftdicke_aktuell = kurven[kurvenebene][betroffeneKurven[i]][3];
					var farbe_aktuell = kurven[kurvenebene][betroffeneKurven[i]][4];
					var l = schaetzeLaenge(tmp); // länge der kurve grob
					// abschätzen
					var delta = 1.0 / l * 3; // schrittweite für parameter t
					// zum testen der schnittpunkte
					var tsammler = [];
					var zaehler = 0;
					var test = 0;
					for (var t = 0; t < 1 + delta; t += delta) {
						if (t > 1)
							t = 1;
						var pos = Bezier.evaluiere(3, tmp, t);
						var p = (parseInt(pos.y, 10) * breite + parseInt(pos.x,
								10)) * 4;
						if (radierer.data[p + 1] === 200) { // radiererstelle
							tsammler.push(zaehler);
							test++;
						}
						zaehler++;
					}

					// falls ganze kurve gelöscht, rest sparen
					if (zaehler - test < 3) { // falls nur 2 kontrollpunkte
						// übrig, ganze kurve löschen
						kurven[kurvenebene].splice(betroffeneKurven[i], 1);
					} else {

						// alle parameterwerte zusammenführen
						for (var k = tsammler.length - 2; k >= 0; k--) {
							if (tsammler[k + 1] - tsammler[k] === 2) { // einzelne
								// werte
								// zusammenführen
								tsammler.splice(k + 1, 0, tsammler[k] + 1);

							}
						}

						// testweise alle punkte zeichnen lassen

						// jetzt restkurve erstellen und farbig zeichnen lassen
						var start = 0;
						var tk = [];
						var z = 0;
						for (var k = 0; k < tsammler.length; k++) {
							if (tsammler[k] - start > 1) {
								var teilkurve = Bezier.zerlege(tmp, start
										* delta, (tsammler[k] - 1) * delta);
								tk.push(teilkurve);
								start = tsammler[k];

							} else {
								start = tsammler[k];
							}
						}
						if (tsammler.length > 0) {
							if (tsammler[tsammler.length - 1] * delta < 1) {
								var teilkurve = Bezier.teile(tmp,
										tsammler[tsammler.length - 1] * delta,
										1)[1];
								tk.push(teilkurve);
							}
						}

						// alte kurve ersetzen durch alle neuen
						if (tk.length > 0) {
							kurven[kurvenebene].splice(betroffeneKurven[i], 1);
							for (var l = 0; l < tk.length; l++) {
								kurven[kurvenebene].splice(betroffeneKurven[i], 0, [
										tk[l],
										Bezier.findeRechtecksHuelle(tk[l]), 1,
										stiftdicke_aktuell, farbe_aktuell ]);
							}
						}

					}
				}

				daten = [];
				var leer = gc.createImageData(breite, hoehe);
				for (var i = 0; i < leer.length; i += 4) {
					leer[i] = 255;
					leer[i + 1] = 255;
					leer[i + 2] = 255;
					leer[i + 3] = 0;
				}

				gc.putImageData(leer, 0, 0);
				zeichneKurvenNeu();
				berechnung = false;
				zeichneEbenen(layer,0,layer);
			
			} else {
				daten = [];
				var leer = gc.createImageData(breite, hoehe);
				for (var i = 0; i < leer.length; i += 4) {
					leer[i] = 255;
					leer[i + 1] = 255;
					leer[i + 2] = 255;
					leer[i + 3] = 0;
				}

				gc.putImageData(leer, 0, 0);
				berechnung=false;
			}
			}
			//$("#info").html("Anzahl der Kurven: " + kurven[kurvenebene].length);
		}

	}

	function loescheZeichnung() {
		var leer = gc.createImageData(breite, hoehe);
		for (var i = 0; i < leer.length; i += 4) {
			leer[i] = 255;
			leer[i + 1] = 255;
			leer[i + 2] = 255;
			leer[i + 3] = 0;
		}

		if (rechtecke2.length < grenzeAnzahl) { // ecken von dem einen rechteck
			// clippen

			gc.putImageData(leer, 0, 0, ecken[0], ecken[1],
					ecken[2] - ecken[0], ecken[3] - ecken[1]);
		} else { // sonst rechtecke klippen

			var b = breite / rx;
			var h = hoehe / ry;
			for (var i = 0; i < rechtecke2.length; i++) {
				var rechteckx = parseInt(rechtecke2[i] % rx, 10);
				var rechtecky = parseInt(rechtecke2[i] / rx, 10);
				var x1 = rechteckx * b;
				var y1 = rechtecky * h;

				gc.putImageData(leer, x1, y1, 0, 0, b, h);
			}

		}
	}

	function zeichneKurvenNeu() {
		var leer = gc2.createImageData(breite, hoehe);
		
		for (var i = 0; i < leer.length; i += 4) {
			leer[i] = 255;
			leer[i + 1] = 255;
			leer[i + 2] = 255;
			leer[i + 3] = 0;
		}
		gc2.save(); // zum späteren wiederherstellen
		if (rechtecke2.length < grenzeAnzahl) { // ecken von dem einen rechteck
			// clippen
			gc2.beginPath();
			gc2.moveTo(ecken[0], ecken[1]);
			gc2.lineTo(ecken[2], ecken[1]);
			gc2.lineTo(ecken[2], ecken[3]);
			gc2.lineTo(ecken[0], ecken[3]);
			gc2.lineTo(ecken[0], ecken[1]);
			gc2.clip();
			gc2.putImageData(leer, 0, 0, ecken[0], ecken[1], ecken[2]
					- ecken[0], ecken[3] - ecken[1]);
		} else { // sonst rechtecke klippen
			gc2.beginPath();
			var b = breite / rx;
			var h = hoehe / ry;
			for (var i = 0; i < rechtecke2.length; i++) {
				var rechteckx = parseInt(rechtecke2[i] % rx, 10);
				var rechtecky = parseInt(rechtecke2[i] / rx, 10);
				var x1 = rechteckx * b;
				var y1 = rechtecky * h;
				gc2.moveTo(x1, y1);
				gc2.lineTo(x1 + b, y1);
				gc2.lineTo(x1 + b, y1 + h);
				gc2.lineTo(x1, y1 + h);
				gc2.lineTo(x1, y1);
				gc2.putImageData(leer, x1, y1, 0, 0, b, h);
			}
			gc2.clip();

		}

		var kurvenebene=layerfolge[layer];
		// gc2.putImageData(leer,0,0);
		for (var i = 0; i < kurven[kurvenebene].length; i++) {
			// var tmp=kurven[betroffeneKurven[i]][0];
			var tmp1 = kurven[kurvenebene][i];
			if (tmp1[2] == 1) { // nur dann neu zeichnen
				var tmp = tmp1[0];

				gc2.beginPath();
				gc2.moveTo(tmp[0].x, tmp[0].y);
				gc2.bezierCurveTo(tmp[1].x, tmp[1].y, tmp[2].x, tmp[2].y,
						tmp[3].x, tmp[3].y);
				gc2.strokeStyle = kurven[kurvenebene][4];
				gc2.lineWidth = kurven[kurvenebene][3];
				gc2.stroke();
				// kurven[i][2]=0; // status auf normal setzen
			}
		}
		gc2.restore();
	}

	function schaetzeLaenge(punkte) {
		var l = 0;
		var x = punkte[0].x;
		var y = punkte[0].y;
		for (var i = 1; i < punkte.length; i++) {
			l += Math.sqrt((punkte[i].x - x) * (punkte[i].x - x)
					+ (punkte[i].y - y) * (punkte[i].y - y));
		}
		return l;
	}

	function rechteckUeberschneidung2(krv) { // überprüft, ob eine
		// bezierkurve mit mindestens
		// einem betroffenen rechteck
		// kollidiert
		var rg = false;
		var b = breite / rx;
		var h = hoehe / ry;
		for (var i = 0; i < rechtecke2.length; i++) {
			x = parseInt(rechtecke2[i] % ry, 10);
			y = parseInt(rechtecke2[i] / rx, 10);
			if (rechteckUeberschneidung(krv, [ x * b, y * h, x * b + b,
					y * h + h ]) === true) {
				rg = true;
				i = rechtecke2.length;
			}
		}

		return rg;
	}

	function rechteckUeberschneidung(r1, r2) { // überprüft, ob die rechtecke
		// mit den eckpunkten
		// (x1,y1)-(x2,y2) und mit den
		// eckpunkten(x3,y3)-(x4,y4)
		// sich überschneiden, wobei
		// x1<=x2
		return !(r1[0] > r2[2] || r1[2] < r2[0] || r1[1] > r2[3] || r1[3] < r2[1]);
	}

	function mausBewegt(e) {
		if (gedrueckt === true) {
			var x = e.pageX - c.offsetLeft - $("#rahmen")[0].offsetLeft;

			var y = e.pageY - c.offsetTop - $("#rahmen")[0].offsetTop;
			zeichne(x, y);
		}
		zeichneOderRadiere();
	}

	function kleinsterAbstand(a, b, c) {
		if (b.x === c.x) {
			return Math.abs(a.x - b.x);
		} else {
			var rg = 0;
			var BC = new Punkt(c.x - b.x, c.y - b.y);
			var BA = new Punkt(a.x - b.x, a.y - b.y);
			var l = Math.sqrt(BC.x * BC.x + BC.y * BC.y);
			var wo = (BA.x * BC.x + BA.y * BC.y) / l;
			if (wo > l) { // rechts außerhalb
				var p = new Punkt(c.x - a.x, c.y - a.y);
				return Math.sqrt(p.x * p.x + p.y * p.y);
			} else if (wo < 0) { // links außerhalb
				var p = new Punkt(a.x - b.x, a.y - b.y);
				return Math.sqrt(p.x * p.x + p.y * p.y);
			} else {
				var p = new Punkt(b.x + wo * BC.x / l, b.y + wo * BC.y / l);
				var p2 = new Punkt(p.x - a.x, p.y - a.y);
				return Math.sqrt(p2.x * p2.x + p2.y * p2.y);
			}
		}

	}

	function peuker(_liste, _toleranz) {
		var dmax = 0;
		var rg = true;
		for (var i = 1; i < _liste.length - 1; i++) {
			var d = kleinsterAbstand(_liste[i], _liste[0],
					_liste[_liste.length - 1]);
			if (d > dmax) {

				dmax = d;
				if (dmax > _toleranz) {
					rg = false;
					i = _liste.length;
				}
			}

		}
		return rg;
	}

	function holeMinMax(punkte) {
		var rg = [];
		var minx = 0, maxx = 0, miny = 0, maxy = 0;
		minx = punkte[0].x;
		maxx = minx;
		miny = punkte[0].y;
		maxy = miny;
		for (var i = 1; i < punkte.length; i++) {
			var tmp = punkte[i];
			if (tmp.x > maxx) {
				maxx = tmp.x;
			} else if (tmp.x < minx) {
				minx = tmp.x;
			}
			if (tmp.y > maxy) {
				maxy = tmp.y;
			} else if (tmp.y < miny) {
				miny = tmp.y;
			}
		}
		return [ minx, miny, maxx, maxy ];
	}

	function zeichneBezier(daten) {
		if (daten.length === 1) { // nur ein punkt
			var x = daten[0].x;
			var y = daten[0].y;
			daten = [];
			daten.push(new Punkt(x - 1, y - 1));
			daten.push(new Punkt(x + 1, y - 1));
			daten.push(new Punkt(x + 1, y + 1));
			daten.push(new Punkt(x - 1, y + 1));
		}

		// formerkennung (kreis und gerade)
		var geaendert = false;
		var l = Bezier.berechneEntfernung(daten[0], daten[daten.length - 1]);
		if (l < 15) { // vielleicht ein kreis?
			var extreme = holeMinMax(daten);
			var minx = extreme[0];
			var maxx = extreme[2];
			var miny = extreme[1];
			var maxy = extreme[3];
			var verh = (maxx - minx) * 1.0 / (maxy - miny);
			// $("#ausgabe").html("Kreis: "+verh);
			if (verh < 1.5 && verh > 0.8) { // ungefähr ein kreis
				var rx = 0.5 * (minx + maxx);
				var ry = 0.5 * (miny + maxy);
				var radius = 0.25 * ((maxx - minx) + (maxy - miny));
				var mp = new Punkt(rx, ry);
				var kreis = true;
				for (var i = 0; i < daten.length; i++) {
					var d = Bezier.berechneEntfernung(mp, daten[i]);
					if (!(d < radius * 1.3 && d > radius * 0.8)) {
						kreis = false;
						i = daten.length;
					}
				}
				if (kreis === true) { // jetzt ersetzen mit kreisdaten (wird
					// durch bezierkurven angenähert
					var c = 0.551915024494; // magic c für kreis
					erg = [];
					erg.push([ new Punkt(mp.x, mp.y + radius),
							new Punkt(mp.x + c * radius, mp.y + radius),
							new Punkt(mp.x + radius, mp.y + radius * c),
							new Punkt(mp.x + radius, mp.y) ]);
					erg.push([ new Punkt(mp.x + radius, mp.y),
							new Punkt(mp.x + radius, mp.y - c * radius),
							new Punkt(mp.x + c * radius, mp.y - radius),
							new Punkt(mp.x, mp.y - radius) ]);
					erg.push([ new Punkt(mp.x, mp.y - radius),
							new Punkt(mp.x - c * radius, mp.y - radius),
							new Punkt(mp.x - radius, mp.y - radius * c),
							new Punkt(mp.x - radius, mp.y) ]);
					erg.push([ new Punkt(mp.x - radius, mp.y),
							new Punkt(mp.x - radius, mp.y + c * radius),
							new Punkt(mp.x - c * radius, mp.y + radius),
							new Punkt(mp.x, mp.y + radius) ]);

					geaendert = true;
				}
			}
		}

		if (geaendert === false) {
			var toleranz = parseInt(l / 20.0, 10);
			// $("#ausgabe").html(l+" "+toleranz);

			var erg = [];
			if (peuker(daten, toleranz) === true) { // nur zwei punkte -> gerade
				var a = daten[0];
				var b = daten[daten.length - 1];

				// testen ob horizontale oder vertikale linie
				var dx = b.x - a.x;
				var dy = b.y - a.y;
				if (dy !== 0) {
					var steigung = dy * 1.0 / dx;
					if (Math.abs(steigung) < toleranz_steigung) {
						var mw = (a.y + b.y) / 2.0;
						a.y = mw;
						b.y = mw;
					}
				} else if (dx !== 0) {
					var steigung = dx * 1.0 / dy;
					if (Math.abs(steigung) < toleranz_steigung) {
						var mw = (a.x + b.x) / 2.0;
						a.x = mw;
						b.x = mw;
					}
				}
				erg = [ [
						a,
						Bezier.addiere(a, Bezier.multipliziereMitSkalar(Bezier
								.subtrahiere(b, a), 1.0 / 3.0)),
						Bezier.addiere(a, Bezier.multipliziereMitSkalar(Bezier
								.subtrahiere(b, a), 2.0 / 3.0)), b ] ]; // alle
				// werte
				// dazwischen
				// löschen

				geaendert = true;
			}
		}
		if (geaendert === false) {
			Bezier.initialisiere(daten, toleranzgrenze);
			erg = Bezier.approximiere();
		}
		// alte daten löschen

		if (daten.length > 0) {
			// loescheZeichnung();

			var leer = gc.createImageData(breite, hoehe);
			for (var i = 0; i < leer.length; i += 4) {
				leer[i] = 255;
				leer[i + 1] = 255;
				leer[i + 2] = 255;
				leer[i + 3] = 0;
			}
			gc.putImageData(leer, 0, 0);

		}

		
		for (var i = 0; i < erg.length; i++) {
			var tmp = erg[i];
			
			if (tmp.length === 1) { // punkt
				gc2.beginPath();
				gc2.fillStyle = farbe;
				gc2.fillRect(tmp[0].x, tmp[0].y, 1, 1);

			} else if (tmp.length === 4) {

				gc2.beginPath();
				gc2.moveTo(tmp[0].x, tmp[0].y);
				gc2.strokeStyle = farbe;
				gc2.lineCap = "round";
				gc2.lineWidth = "" + zeichenbreite;

				gc2.bezierCurveTo(tmp[1].x, tmp[1].y, tmp[2].x, tmp[2].y,
						tmp[3].x, tmp[3].y);
				print(3, tmp[0].x + "/" + tmp[0].y + "," + tmp[1].x + "/"
						+ tmp[1].y + "," + tmp[2].x + "/" + tmp[2].y + ","
						+ tmp[3].x + "/" + tmp[3].y);

				gc2.stroke();
				kurven[layerfolge[layer]].push([ tmp, Bezier.findeRechtecksHuelle(tmp), 0,
						zeichenbreite, farbe ]); // alle
				// zeichnungen
				// speichern
			}

		}

		// print(1,"Anzahl Punkte: "+daten.length+", Anzahl Bezierkurven:
		// "+erg.length+", zu speichernde Punkte mit Bezier:
		// "+(3*erg.length+1)+" statt "+daten.length);
		if (debugging > 2) {
			for (var i = 0; i < daten.length; i++) {
				var x = daten[i].x;
				var y = daten[i].y;

				gc.fillStyle = "#ff0000";

				gc.fillRect(x - 2, y - 2, 5, 5);
			}
		}
	}
	
	function zeichneEbenen(centralLayer,start,stop){
		var leer = gc.createImageData(breite, hoehe);
		for (var i = 0; i < leer.length; i += 4) {
			leer[i] = 255;
			leer[i + 1] = 255;
			leer[i + 2] = 255;
			leer[i + 3] = 0;
		}
		gc.putImageData(leer, 0, 0);
		if (start <=centralLayer)gc2.putImageData(leer, 0, 0);
		if (stop>centralLayer)gc3.putImageData(leer, 0, 0);
		for (var i=start;i<=stop;i++){
			var zk=gc2;
			if (i>centralLayer){
				zk=gc3;
			}
			var k=layerfolge[i];
			if (visibleLayers[i]==1){ // nur zeichnen, wenn sichtbar
			if (kurven[k]!=null){
				for (var j=0;j<kurven[k].length;j++){
					var tmp=kurven[k][j][0];
					zk.beginPath();
					zk.moveTo(tmp[0].x, tmp[0].y);
					zk.strokeStyle = kurven[k][j][4];
					zk.lineCap = "round";
					zk.lineWidth = "" + kurven[k][j][3];

					zk.bezierCurveTo(tmp[1].x, tmp[1].y, tmp[2].x, tmp[2].y,
							tmp[3].x, tmp[3].y);
					
					zk.stroke();
					
				}
			}
			}
		}
	}

	// ab hier funktionen und klassen, die zur berechnung der bezier-kurve
	// verwendet werden

	function Punkt(x, y) {
		this.x = x;
		this.y = y;
	}

	var segment = {

	};

	var Bezier = {

		initialisiere : function(data, fehler) { // berechnet zu einer
			// punktwolke die am besten
			// passende bezier-kurve
			// erst daten aufbereiten und parametrisierung der kurve erstellen
			this.ergebnis = [];
			this.epsilon = 0.000001;
			this.TOLERANZ = 0.0000001;
			var vorgaenger = null;
			this.fehler = fehler;
			this.punkte = [];
			for (var i = 0; i < data.length; i++) {
				var ptemp = data[i];
				// die punkte sammeln, die verschieden sind, alle andere
				// vernachlässigen
				if (!vorgaenger || ptemp.x != vorgaenger.x
						|| ptemp.y != vorgaenger.y) {
					this.punkte.push(ptemp);
					vorgaenger = ptemp;
				}
			}
			this.fehler = fehler;
		},

		findeRechtecksHuelle : function(points) {
			var minx = points[0].x;
			var maxx = minx;
			var miny = points[0].y;
			var maxy = miny;
			for (var i = 1; i < points.length; i++) {
				if (minx > points[i].x) {
					minx = points[i].x;
				} else if (maxx < points[i].x) {
					maxx = points[i].x;
				}
				if (miny > points[i].y) {
					miny = points[i].y;
				} else if (maxy < points[i].y) {
					maxy = points[i].y;
				}

			}
			return [ minx - zeichenbreite, miny - zeichenbreite,
					maxx + zeichenbreite, maxy + zeichenbreite ];

		},
		findeKonvexeHuelle : function(points) { // liefert die konvexe hülle der
			// bezier-kurve zurück
			// verfahren: wrapping-gift algorithmus
			function berechneEntfernung(p1, p2) {
				var dx = p1.x - p2.x;
				var dy = p1.y - p2.y;
				return dx * dx + dy * dy;
			}
			function left_oriented(p1, p2, candidate) {
				var det = (p2.x - p1.x) * (candidate.y - p1.y)
						- (candidate.x - p1.x) * (p2.y - p1.y);
				if (det > 0)
					return true; // left-oriented
				if (det < 0)
					return false; // right oriented
				// select the farthest point in case of colinearity
				return berechneEntfernung(p1, candidate) > berechneEntfernung(
						p1, p2);
			}
			var N = points.length;
			var hull = [];

			// get leftmost point
			var min = 0;
			for (var i = 1; i != N; i++) {
				if (points[i].y < points[min].y)
					min = i;
			}
			var hull_point = points[min];
			var end_point = null;
			// walk the hull
			do {
				hull.push(hull_point);

				end_point = points[0];
				for (var i = 1; i != N; i++) {
					if ((hull_point.x === end_point.x && hull_point.y === end_point.y)
							|| left_oriented(hull_point, end_point, points[i])) {
						end_point = points[i];
					}
				}
				hull_point = end_point;
			} while (!(end_point.x === hull[0].x && end_point.y === hull[0].y));
			return hull;

		},

		parametrisiereKurve : function(start, ende) { // berechnet über
			// pythagoras den
			// parameter zu den
			// gegebenen punkten
			var u = [ 0 ];
			for (var i = start + 1; i <= ende; i++) {
				u[i - start] = u[i - start - 1]
						+ this.berechneEntfernungIndex(i, i - 1);
				// u.push(this.berechneEntfernungIndex(i,i+1)); // alle
				// pythagoras-werte in u speichern
			}
			var max = u[u.length - 1];
			for (var i2 = 0; i2 < u.length; i2++) {
				u[i2] /= max;
			}
			return u; // gib den normierten parametervektor zurück
		},
		berechneEntfernungIndex : function(p1Nr, p2Nr) { // berechnet den
			// abstand der zu
			// den indizes
			// gehörenden
			// punkten
			var dx = this.punkte[p1Nr].x - this.punkte[p2Nr].x;
			var dy = this.punkte[p1Nr].y - this.punkte[p2Nr].y;
			return Math.sqrt(dx * dx + dy * dy);
		},
		berechneEntfernung : function(p1, p2) {
			var dx = p1.x - p2.x;
			var dy = p1.y - p2.y;
			return Math.sqrt(dx * dx + dy * dy);
		},
		normiere : function(v) { // normiere den vektor
			var l = (Math.sqrt(v.x * v.x + v.y * v.y));
			if (l !== 0) {
				v.x = v.x / l;
				v.y = v.y / l;
			}
			return v;

		},
		multipliziereSkalar : function(p1, p2) { // führe das skalarprodukt
			// für die ortsvektoren p1
			// und p2 durch
			return p1.x * p2.x + p1.y * p2.y;
		},
		multipliziereMitSkalar : function(p, z) { // multipliziere ein skalar
			// z in den Vektor p
			return {
				x : p.x * z,
				y : p.y * z
			};
		},
		addiere : function(p1, p2) { // addiert zwei vektoren
			return {
				x : p1.x + p2.x,
				y : p1.y + p2.y
			};
		},
		subtrahiere : function(p1, p2) { // subtrahiert zwei vektoren
			// voneinander
			return {
				x : p1.x - p2.x,
				y : p1.y - p2.y
			};
		},
		approximiere : function() {
			var punkte = this.punkte, laenge = punkte.length;
			this.ergebnis = laenge > 0 ? [ [ punkte[0] ] ] : [];
			if (laenge > 1) { // kubisch nähern
				print(2, "Anzahl der Punkte: " + laenge);
				this.approximiereKubisch(0, laenge - 1, this.normiere(this
						.subtrahiere(punkte[1], punkte[0])), this.normiere(this
						.subtrahiere(punkte[laenge - 2], punkte[laenge - 1])));
			}
			return this.ergebnis;

		},
		approximiereKubisch : function(start, ende, tan1, tan2) {
			if (ende - start === 1) { // sonderfall: nur zwei punkte in der
				// punktwolke gegeben
				var pt1 = this.punkte[start], pt2 = this.punkte[ende], dist = this
						.berechneEntfernung(pt1, pt2) / 3;
				this.ergebnis.push([
						pt1,
						this.addiere(pt1, this.multipliziereMitSkalar(this
								.normiere(tan1), dist)),
						this.addiere(pt2, this.multipliziereMitSkalar(this
								.normiere(tan2), dist)), pt2 ]);
				return;
			}
			// falls mehr als 2 punkte in der wolke sind:
			var uParametrisierung = this.parametrisiereKurve(start, ende), maxFehler = Math
					.max(this.fehler, this.fehler * this.fehler), split;
			for (var i = 0; i <= 4; i++) {
				var kurve = this.findeBezierNaeherung(start, ende,
						uParametrisierung, tan1, tan2);
				var data = [];
				data.push(kurve);
				// zeichneBezier2(data);
				// finde die maximale abweichung der näherung von den punkten
				var max = this.findeGroesstenFehler(start, ende, kurve,
						uParametrisierung);
				if (max.error < this.fehler) {
					this.ergebnis.push(kurve);
					return;
				}
				split = max.index; // stelle, an der der fehler am größten war

				if (max.error >= maxFehler) {
					print(3, "Maximaler Fehler: " + maxFehler
							+ ", gemessener Fehler: " + max.error);
					break;
				}
				uParametrisierung = this.reparametrisiere(start, ende,
						uParametrisierung, kurve);
				maxFehler = max.error;
			}
			// wenn das programm hier landet, konnte keine gute näherung
			// gefunden werden, also kurve zerlegen und rekursiv berechnung
			// wiederholen
			var V1 = this.subtrahiere(this.punkte[split - 1],
					this.punkte[split]), V2 = this.subtrahiere(
					this.punkte[split], this.punkte[split + 1]), tanCenter = this
					.normiere(this.multipliziereMitSkalar(this.addiere(V1, V2),
							0.5));
			this.approximiereKubisch(start, split, tan1, tanCenter);
			this.approximiereKubisch(split, ende, this.multipliziereMitSkalar(
					tanCenter, -1), tan2);
		},
		findeBezierNaeherung : function(start, ende, param_u, tan1, tan2) { // findet
			// nach
			// dem
			// paper
			// von
			// schneider
			// eine
			// bezierkurve
			// bezüglich
			// der
			// gegebenen
			// parametrisierung
			// param_u
			print(3, "findeBezierNäherung: " + start + " " + ende);
			var epsilon = this.epsilon;
			var pkt1 = this.punkte[start], pkt2 = this.punkte[ende], C = [
					[ 0, 0 ], [ 0, 0 ] ], // bereite das lgs bereits vor
			X = [ 0, 0 ];
			var anzahl = ende - start + 1;
			for (var i = 0; i < anzahl; i++) { // die nachfolgenden zeilen
				// stellen das lgs auf (s.
				// paper)
				var u = param_u[i], t = 1 - u, b = 3 * u * t, // die
				// bernsteinpolynome
				// berechnen
				// (b_0^3 bis
				// b_3^3)
				b0 = t * t * t, b1 = b * t, b2 = b * u, b3 = u * u * u, a1 = this
						.multipliziereMitSkalar(this.normiere(tan1), b1), a2 = this
						.multipliziereMitSkalar(this.normiere(tan2), b2), tmp = this
						.subtrahiere(this.subtrahiere(this.punkte[start + i],
								this.multipliziereMitSkalar(pkt1, b0 + b1)),
								this.multipliziereMitSkalar(pkt2, b2 + b3));
				C[0][0] += this.multipliziereSkalar(a1, a1);
				C[0][1] += this.multipliziereSkalar(a1, a2);
				C[1][0] = C[0][1];
				C[1][1] += this.multipliziereSkalar(a2, a2);
				X[0] += this.multipliziereSkalar(a1, tmp);
				X[1] += this.multipliziereSkalar(a2, tmp);

			}

			// berechnen der determinante
			var detC0C1 = C[0][0] * C[1][1] - C[1][0] * C[0][1], alpha1, alpha2;
			if (Math.abs(detC0C1) > epsilon) { // sonst division durch 0
				var detC0X = C[0][0] * X[1] - C[1][0] * X[0], detXC1 = X[0]
						* C[1][1] - X[1] * C[0][1];
				alpha1 = detXC1 / detC0C1; // löse das LGS mit der cramerschen
				// regel
				alpha2 = detC0X / detC0C1;
			} else { // division durch 0 vermeiden
				var c0 = C[0][0] + C[0][1], c1 = C[1][0] + C[1][1];
				if (Math.abs(c0) > epsilon) {
					alpha1 = alpha2 = X[0] / c0;
				} else if (Math.abs(c1) > epsilon) {
					alpha1 = alpha2 = X[1] / c1;

				} else {
					alpha1 = alpha2 = 0;
				}

			}

			var segLaenge = this.berechneEntfernung(pkt1, pkt2);
			epsilon *= segLaenge;
			if (alpha1 < epsilon || alpha2 < epsilon) {
				alpha1 = alpha2 = segLaenge / 3;

			}
			return [
					pkt1,
					this.addiere(pkt1, this.multipliziereMitSkalar(this
							.normiere(tan1), alpha1)),
					this.addiere(pkt2, this.multipliziereMitSkalar(this
							.normiere(tan2), alpha2)), pkt2 ];

		},

		evaluiere : function(grad, kontrollpunkte, t) { // berechnet den
			// funktionswert der
			// bezierkurve beim
			// parameter t
			var tmp = kontrollpunkte.slice(); // übergebene werte kopieren
			for (var i = 1; i <= grad; i++) {
				for (var j = 0; j <= grad - i; j++) {
					tmp[j] = this.addiere(this.multipliziereMitSkalar(tmp[j],
							1 - t), this.multipliziereMitSkalar(tmp[j + 1], t));
				}
			}
			return tmp[0];
		},
		teile : function(kontrollpunkte, t) { // zerlege kubische bezierkurve
			// in zwei bezierkurven und
			// liefere kontrollpunkte zurück
			var tmp = kontrollpunkte.slice();
			var pkte = [];
			for (var i = 1; i <= 3; i++) {
				for (var j = 0; j <= 3 - i; j++) {
					tmp[j] = this.addiere(this.multipliziereMitSkalar(tmp[j],
							1 - t), this.multipliziereMitSkalar(tmp[j + 1], t));
					pkte.push(tmp[j]);
				}
			}
			return [ [ kontrollpunkte[0], pkte[0], pkte[3], pkte[5] ],
					[ pkte[5], pkte[4], pkte[2], kontrollpunkte[3] ] ];

		},
		zerlege : function(kontrollpunkte, start, ende) { // liefere
			// kontrollpunkte
			// für
			// teilbezierkurve
			// von start bis
			// ende
			var tmp = this.teile(kontrollpunkte, start)[1];
			return this.teile(tmp, (ende - start) / (1.0 - start))[0]; // näherungsweiser
			// ausschnitt
			// der
			// bezierkurve
		},
		findeGroesstenFehler : function(start, ende, kontrollpunkte, u) { // findet die maximale entfernung zwischen kontrollpunkt und kurve
			var index = Math.floor((ende - start + 1) / 2), maxDist = 0;
			for (var i = start + 1; i < ende; i++) {
				var P = this.evaluiere(3, kontrollpunkte, u[i - start]);
				var v = this.subtrahiere(P, this.punkte[i]);
				var dist = v.x * v.x + v.y * v.y;
				if (dist >= maxDist) {
					maxDist = dist;
					index = i;
				}
			}
			return {
				error : maxDist,
				index : index
			};
		},
		reparametrisiere : function(start, ende, u, kontrollpunkte) { // ruft das newton-verfahren für bessere parameter auf
			for (var i = start; i <= ende; i++) {
				u[i - start] = this.findeNullstelle(kontrollpunkte,
						this.punkte[i], u[i - start]);
			}
			return u;
		},
		findeNullstelle : function(kontrollpunkte, punkt, u) {
			var k1 = [], k2 = [];
			// kontollpunkte für Q' erzeugen
			for (var i = 0; i <= 2; i++) {
				k1[i] = this.multipliziereMitSkalar(this.subtrahiere(
						kontrollpunkte[i + 1], kontrollpunkte[i]), 3);
			}
			// kontrollpunkte für Q'' erzeugen
			for (var i = 0; i <= 1; i++) {
				k2[i] = this.multipliziereMitSkalar(this.subtrahiere(k1[i + 1],
						k1[i]), 2);
			}
			// vorbereitung für newton-verfahren
			var pt = this.evaluiere(3, kontrollpunkte, u), pt1 = this
					.evaluiere(2, k1, u), pt2 = this.evaluiere(1, k2, u), diff = this
					.subtrahiere(pt, punkt), df = this.multipliziereSkalar(pt1,
					pt1)
					+ this.multipliziereSkalar(diff, pt2);
			// jetzt f(u)/f'(u) bestimmen
			if (Math.abs(df) < this.TOLERANZ)
				return u;
			return u - this.multipliziereSkalar(diff, pt1) / df;
		}

	};

}


