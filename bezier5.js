(function() {
	'use strict';

	// to suit your point format, run search/replace for '.x' and '.y';
	// for 3D version, see 3d branch (configurability would draw significant
	// performance overhead)

	// square distance between 2 points
	function getSqDist(p1, p2) {

		var dx = p1.x - p2.x, dy = p1.y - p2.y;

		return dx * dx + dy * dy;
	}

	// square distance from a point to a segment
	function getSqSegDist(p, p1, p2) {

		var x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;

		if (dx !== 0 || dy !== 0) {

			var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);

			if (t > 1) {
				x = p2.x;
				y = p2.y;

			} else if (t > 0) {
				x += dx * t;
				y += dy * t;
			}
		}

		dx = p.x - x;
		dy = p.y - y;

		return dx * dx + dy * dy;
	}
	// rest of the code doesn't care about point format

	// basic distance-based simplification
	function simplifyRadialDist(points, sqTolerance) {

		var prevPoint = points[0], newPoints = [ prevPoint ], point;

		for (var i = 1, len = points.length; i < len; i++) {
			point = points[i];

			if (getSqDist(point, prevPoint) > sqTolerance) {
				newPoints.push(point);
				prevPoint = point;
			}
		}

		if (prevPoint !== point)
			newPoints.push(point);

		return newPoints;
	}

	function simplifyDPStep(points, first, last, sqTolerance, simplified) {
		var maxSqDist = sqTolerance, index;

		for (var i = first + 1; i < last; i++) {
			var sqDist = getSqSegDist(points[i], points[first], points[last]);

			if (sqDist > maxSqDist) {
				index = i;
				maxSqDist = sqDist;
			}
		}

		if (maxSqDist > sqTolerance) {
			if (index - first > 1)
				simplifyDPStep(points, first, index, sqTolerance, simplified);
			simplified.push(points[index]);
			if (last - index > 1)
				simplifyDPStep(points, index, last, sqTolerance, simplified);
		}
	}

	// simplification using Ramer-Douglas-Peucker algorithm
	function simplifyDouglasPeucker(points, sqTolerance) {
		var last = points.length - 1;

		var simplified = [ points[0] ];
		simplifyDPStep(points, 0, last, sqTolerance, simplified);
		simplified.push(points[last]);

		return simplified;
	}

	// both algorithms combined for awesome performance
	function simplify(points, tolerance, highestQuality) {

		if (points.length <= 2)
			return points;

		var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

		points = highestQuality ? points : simplifyRadialDist(points,
				sqTolerance);
		points = simplifyDouglasPeucker(points, sqTolerance);

		return points;
	}

	// export as AMD module / Node module / browser or worker variable
	if (typeof define === 'function' && define.amd)
		define(function() {
			return simplify;
		});
	else if (typeof module !== 'undefined')
		module.exports = simplify;
	else if (typeof self !== 'undefined')
		self.simplify = simplify;
	else
		window.simplify = simplify;

})();

var QreatorBezier = new function() {
	var farben, knoepfe, dicken, layer, visibleLayers, layerfolge, c, breite, hoehe, toleranz_steigung, rx, ry, rasterVorgabe, rasterzaehler, stiftdicke, farbe, grenzeAnzahl, rechtecke, rechtekce2, betroffeneKurven, zeichenbreite, toleranzgrenze, layer, dezimalenSVG, ecken, altx, alty, zeichenmodus, gc, gc2, gc0, gc3, kurven, raster, maus,pen, touch, debugging, gedrueckt, berechnung, datenx, dateny, daten, zmaxgesamt, zmingesamt, selectorGlobal, radierdicke, farbwahl, menuGlobal, order, changes, changesPosition, orderPosition, unchanged;

	var farben = [ "#00ff00", "#FF0000", "#0000FF", "#008000",
			"#FFA500", "#EB4DFF", "#808000", "#808080",  "#ADD8E6", "#62FFFF", "#00FF00", "#00FFFF",
			"#FF00FF" ];
	var knoepfe = "";
	for (var i = 0; i < farben.length; i++) {

		var text = "<button class='farbe' farbe='" + farben[i]
				+ "' style='background: " + farben[i] + ";' value='Farbe' nr='"
				+ i + "'><span style='color: " + farben[i]
				+ "'>P</span></button>";
	//	knoepfe += text;
	}
	knoepfe+="<input id='farben'  type='color' value='#000000' list='color' /><datalist id='color'><option>#000000</option><option>#ff0000</option><option>#0000ff</option><option>#00ff00</option><option>#ffff00</option><option>#008000</option><option>#a52a2a</option><option>#ffa500</option><option>#999999</option><option>#00ffff</option></datalist>";
	
	var dicken = [ 1,2,3, 4,5, 6, 8, 10, 12, 20, 30, 40, 50 ];
	//knoepfe += "</div><div class='auswahl'>";
	/*for (var i = 0; i < dicken.length; i++) {
		knoepfe += "<button class='dicke' dicke='" + dicken[i] + "'  value='D"
				+ dicken[i] + "' nr='" + i + "'>" + dicken[i] + "</button> ";
	}*/
	knoepfe+="<span vertical-align='center'><select id='dicken'>";
	for (var i = 0; i < dicken.length; i++) {
		if (i==1) {
			knoepfe += "<option selected dicke='" + dicken[i] + "'>" + dicken[i] + "</option> ";
		} else {
			knoepfe += "<option dicke='" + dicken[i] + "'>" + dicken[i] + "</option> ";
		
		}
	}
	knoepfe+="</select>";
	var ebenenBunt=0;
	var layers = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
	var visibleLayers = [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]; // bezogen auf
	// layerfolge
	var layerfolge = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
	//knoepfe += "<span>";
	for (var i = 0; i < layers.length; i++) {
		knoepfe += "<button class='layer' layer='" + layers[i] + "' >"
				+ layers[i]
				+ "</button>"
				//+<input type='checkbox' name='layer' id='checkbox_"
				//+ i + "' value='" + i
				//+ "' class='check' checked='checked'>
				//"</input>";

	}
	//knoepfe += "</span>";
	var that = this;

	this.init = function(selector, b, h, menuSelector, horizontal,stiftReset) {
		visibleLayers = [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ]; // alle layer einschalten
		
		breite = b;
		hoehe = h;
		selectorGlobal = selector;
		menuGlobal = menuSelector;
		$(selector)
				.html(
						"<div id='rahmen' style='position: relative;'> <canvas id='layer1' width='"
								+ breite
								+ "' height='"
								+ hoehe
								+ "' style='z-index: 0;'></canvas> <canvas id='layer2'  width='"
								+ breite
								+ "' height='"
								+ hoehe
								+ "' style='position: absolute; left: 0; top: 0; z-index: 1;'></canvas><canvas id='layer3' width='"
								+ breite
								+ "' height='"
								+ hoehe
								+ "' style='position: absolute; left: 0; top: 0; z-index: 2;'></canvas> </div>");
		$(menuSelector)
				.html( " <button class='imageUndo holen knopf'  id='zurueck'  /><button class='imageRedo holen knopf'  id='vor'  /><button class='imageRaster holen knopf' b='Raster ändern' id='raster'  /><button  class='bild imageDelete holen knopf' b='Aktive Ebene löschen' id='loeschenAktiv' alt='aktive Ebene leeren' /><button id='bild' class='imageFotoNeu' alt='neuesFoto'></button><button class='imageFotoLoeschen holen knopf' b='Aktive Ebene löschen' id='loescheBilder'  /><button class='imagePen holen knopf' b='Stift' id='stift' /><button class='imageRubber holen knopf' b='Radierer' id='radierer' /><button id='ebenenBunt' class='imageLayer'></button><button id='ebenenAnAus' class='imageLayerOnOff'></button>"+knoepfe+"<div id='ausgabe'></div><div id='info' >");
		// $(selector).append("<button id='download'>Download</button>");
		// $(selector).append("<textarea id='svgText' rows='20' cols='100'>
		// </textarea><button id='tbutton'>Bild laden</button>");
		$(selector).append("<div id='qreator_svgbild'></div>");

		gc = $("#layer2")[0].getContext("2d");
		gc.strokeStyle = "#ff0000";

		c = $("#layer3")[0];

		changesPosition = 0; // gibt die position des ersten elements an, das
		// nicht
		// mehr betroffen ist
		orderPosition = []; // speichert für jede ebene die aktuelle position in
		// der
		// liste + 1 (zum löschen wichtig)
		toleranz_steigung = 0.03;
		rx = 5; // zum radieren in rechtecke zerlegen
		ry = 5;
		rasterVorgabe = [ [ [], [], "" ], [ [ 25 ], [ 25 ], "#aaaaff" ],
				[ [], [ 50 ], "#aaaaff" ],
				[ [], [ 60, 74, 88, 102, 116 ], "#000000" ] ];
		rasterzaehler = 0;
		stiftdicke = 2;
		farbe = "#000000";
		grenzeAnzahl = 2; // ab wann werden mehrere rechtecke untersucht?
		rechtecke = [];
		rechtecke2 = [];
		betroffeneKurven = [];
		
		
		radierdicke = 10; // position in dickenliste
		stiftdicke = 1; // position in dickenliste
		zeichenbreite = 2; // aktuelle zeichendicke
		farbwahl = 0; // position in farbenliste
		zeichenmodus = 0; // 0 für zeichnen, 1 für radieren
		layer = 2; // aktuelle ebene
		ebenenBunt=0;
		
		toleranzgrenze = 1.0;
		
		dezimalenSVG = 1;
		ecken = [];
		altx = 0, alty = 0;
		
		gc2 = $("#layer1")[0].getContext("2d");
		// layer 1 transparent machen
		// gc0 = $("#layer0")[0].getContext("2d");
		gc3 = $("#layer3")[0].getContext("2d");
		kurven = []; // speichert alle eingegebenen bezierkurven
		bilder=[]; // speichert die bilder einer ebene
		order = []; // speichert die zeichenreihenfolge in einer ebene: positiv
		// wird
		// gezeichnet, negativ nicht, liste startet bei 1 für ebene 0
		// (wegen vz)
		changes = []; // speichert alle aenderungen (außer raster): [Ebene,
		// Typ (0
		// = von bis hinzu, 1 = von bis abziehen, 2 = von zu
		// einzeln, 3 ebene löschen), daten ...]
		for (var i = 0; i < layerfolge.length; i++) {
			kurven[i] = [];
			bilder[i]=[];
			order[i] = [];
			orderPosition[i] = 0;
		}

		raster = false;
		unchanged = true; // wenn seit dem letzten aufruf nicht gezeichnet
		// wurde,
		// dann true
		maus = false;
		touch = false;
		debugging = 0;
		gedrueckt = false;
		berechnung = false;
		datenx = [], dateny = [], daten = [];
		zmaxgesamt = 0, zmingesamt = 0;
		// erst touch events, dann mouse events
		/*c.ontouchstart = function(event) {
			event.preventDefault();
			daten = [];
			gedrueckt = true;
            berechnung=false;
			touch = true;
			maus = false;
			// $("#info").html("touchstart");
			touchBewegt(event);
		};
		c.ontouchmove = function(event) {
			event.preventDefault();
			if (touch === true && gedrueckt == true)
				// $("#info").html("touchmove mit touch==true");
				touchBewegt(event);
		};
		c.ontouchend = function(event) {
			event.preventDefault();
			if (touch === true) {
				berechnung = true;
				gedrueckt = false;
				touch = false;
				// $("#info").html("touchend mit touch==true");
				touchBewegt(event);
			}
		};
		c.onmousedown = function(event) {
			event.preventDefault();
			daten = [];
			gedrueckt = true;
            berechnung=false;
			maus = true;
			touch = false;
			// $("#info").html("onmousedown");
			mausBewegt(event);
		};
		c.onmousemove = function(event) {
			event.preventDefault();
			if (maus === true) {
				// $("#info").html("onmousemove mit maus=true");
				mausBewegt(event);
			}
		};
		c.onmouseup = function(event) {
			event.preventDefault();
			if (maus === true) {
				berechnung = true;
				gedrueckt = false;

				// $("#info").html("onmouseup mit maus=true");
				maus = false;
				mausBewegt(event);
			}
		};*/
        
        if (window.PointerEvent) {
        c.addEventListener("pointerdown", function(event){if (event.pointerType=="pen"||event.pointerType=="mouse") startZeichnung(event);});
        c.addEventListener("pointermove", function(event){if (event.pointerType=="pen"||event.pointerType=="mouse") bewegeZeichnung(event);});
        c.addEventListener("pointerup", function(event){if (event.pointerType=="pen"||event.pointerType=="mouse") endeZeichnung(event);});
       
    } else {
        // provide fallback for user agents that do not support Pointer Events
        c.addEventListener("mousedown", startZeichnung);
        c.addEventListener("mousemove", bewegeZeichnung);
        c.addEventListener("mouseup", endeZeichnung);
        c.addEventListener("touchstart", touchStart);
        c.addEventListener("touchmove", touchMove);
        c.addEventListener("touchend", touchEnd);
        
    }
        
        
        function touchStart(event) {
			event.preventDefault();
			daten = [];
			gedrueckt = true;
            berechnung=false;
			touch = true;
			maus = false;
            pen=false;
			// $("#info").html("touchstart");
			touchBewegt(event);
		};
		function touchMove(event) {
			event.preventDefault();
			if (touch === true && gedrueckt == true)
				// $("#info").html("touchmove mit touch==true");
				touchBewegt(event);
		};
		function touchEnd(event) {
			event.preventDefault();
			if (touch === true) {
				berechnung = true;
				gedrueckt = false;
				touch = false;
                pen=false;
                maus=false;
				// $("#info").html("touchend mit touch==true");
				touchBewegt(event);
			}
		};
        function startZeichnung(event) {
            //if (event.pointerType=="pen"||event.pointerType=="mouse"){
			event.preventDefault();
            
			daten = [];
			gedrueckt = true;
            berechnung=false;
			maus = false;
			touch = false;
            pen=false;
            if (event.pointerType=="pen"){
                pen=true;
            } else if (event.pointerType=="mouse"){
                maus=true;
            }
			// $("#info").html("onmousedown");
			mausBewegt(event);
          //  }
		};
		function bewegeZeichnung (event) {
            //if (event.pointerType=="pen"){
			event.preventDefault();
			if (maus === true || pen===true) {
				// $("#info").html("onmousemove mit maus=true");
				mausBewegt(event);
			}
           // }
		};
		function endeZeichnung(event) {
          //  if (event.pointerType=="pen"){
			event.preventDefault();
			if (maus === true||pen===true) {
				berechnung = true;
				gedrueckt = false;

				// $("#info").html("onmouseup mit maus=true");
				maus = false;
                touch=false;
                pen=false;
				mausBewegt(event);
			}
           // }
		};
		
		$("#ebenenBunt").click(function(){
			ebenenBunt=(ebenenBunt+1)%2;
			
			$(".layer").each(function(i){
				if (ebenenBunt==1&&visibleLayers[i]==1){
				$(this).attr("style","background-color: "+farben[i]+";");
				$("#ebenenBunt").addClass("aktiv");
				} else {
					$(this).removeAttr("style");
					$("#ebenenBunt").removeClass("aktiv");
				}
			});
			 
			zeichneEbenen(layer,0,layerfolge.length-1,true);
			updateAuswahl();
		});
        $("#ebenenAnAus").click(function(){
           var zaehler=0;
           for (var i=0;i<layerfolge.length;i++){
               if (visibleLayers[i]==1){
                   zaehler++;
               }
           } 
            if (zaehler>=0&&zaehler<10){
                for (var i=0;i<layerfolge.length;i++){
               visibleLayers[i]=1;
                }
           } else {
               for (var i=0;i<layerfolge.length;i++){
               visibleLayers[i]=0;
           }
           }
                zeichneEbenen(layer,0,layerfolge.length-1,true);
			updateAuswahl();
            
        });
		$("#zurueck")
				.click(
						function(event) {
							if (changesPosition > 0) {
								changesPosition--;
								if (changesPosition >= 0) {
									unchanged = true; // damit erkannt wird,
									// dass seit dem letzten
									// aufruf
									// nichts gezeichnet wurde
									var aenderung = changes[changesPosition];
									for (var j = 0; j < aenderung.length; j++) {
										if (aenderung[j].length == 3) { // bereich
											var ebene = aenderung[j][0];

											// bereich
											var start = aenderung[j][1]; // beginn
											// der
											// transformation
											var ende = aenderung[j][2]; // ende
											// der
											// transformation
											for (var i = 0; i < order[ebene].length; i++) {
												if (Math.abs(order[ebene][i]) >= Math
														.abs(start)
														&& Math
																.abs(order[ebene][i]) <= Math
																.abs(ende)) { // nicht
													// vergessen:
													// vergessen:
													// order
													// speichert
													// um 1
													// erhöhte
													// werte
													order[ebene][i] = -order[ebene][i];
													// orderPosition[ebene][i]--;
												}
											}

										} else if (aenderung[j].length == 2) { // einzelner
																				// wert
											var ebene = aenderung[j][0];
											var wert = aenderung[j][1];
											for (var i = 0; i < order[ebene].length; i++) {
												if (Math.abs(order[ebene][i]) == Math
														.abs(wert)) {
													order[ebene][i] = -order[ebene][i];
													i = order[ebene].length;
													// orderPosition[ebene][i]--;
												}
											}
										}
									}
								}
								zeichneEbenen(layer, 0, layerfolge.length-1,true);
							}
						});
		$("#vor")
				.click(
						function(event) {
							if (unchanged == true
									&& changesPosition < changes.length) {

								unchanged = true; // damit erkannt wird, dass
								// seit dem letzten aufruf
								// nichts gezeichnet wurde
								var aenderung = changes[changesPosition];
								for (var j = 0; j < aenderung.length; j++) {
									if (aenderung[j].length == 3) {
										var ebene = aenderung[j][0];

										// bereich
										var start = aenderung[j][1]; // beginn
										// der
										// transformation
										var ende = aenderung[j][2]; // ende der
										// transformation
										for (var i = 0; i < order[ebene].length; i++) {
											if (Math.abs(order[ebene][i]) >= Math
													.abs(start)
													&& Math
															.abs(order[ebene][i]) <= Math
															.abs(ende)) { // nicht
												// vergessen:
												// order
												// speichert
												// um 1
												// erhöhte
												// werte
												order[ebene][i] = -order[ebene][i];
												// orderPosition[ebene][i]++;
											}
										}

									} else if (aenderung[j].length == 2) { // einzelner
																			// wert
										var ebene = aenderung[j][0];
										var wert = aenderung[j][1];

										for (var i = 0; i < order[ebene].length; i++) {
											if (Math.abs(order[ebene][i]) == Math
													.abs(wert)) {
												order[ebene][i] = -order[ebene][i];
												i = order[ebene].length;
												// orderPosition[ebene][i]++;
											}
										}

									}
								}

								changesPosition++;
								zeichneEbenen(layer, 0, layerfolge.length-1,true);
							}
						});
		$("#tbutton").click(function(event) {
			event.preventDefault();
			var t = $("#svgText").val();
			that.loadSVG(t);
		});
		$("#download").click(function(event) {
			event.preventDefault();
			var text = $("html").html();
			window.open("data:text/csv," + text);
		});
		$("#farben").change(function(event) {
			event.preventDefault();
			farbe = $(this).val();;
			//farbwahl = parseInt($(this).attr("nr"));
			// $("#ebene").html("<font color='"+farbe+"'> Ebene "+layer+",
			// Dicke:
			// "+zeichenbreite+"</font>");
			zeichenmodus = 0;
			// $("#ausgabe").html("Stift");
			// $(".farbe").removeClass("aktiv");
			// $("#radierer").removeClass("aktiv");
			// $("#stift").addClass("aktiv");
			// $(this).addClass("aktiv");
			zeichenbreite = dicken[stiftdicke];
			//$("#farben").css("background-color","'"+farbe+"'");
			// zeichenbreite = stiftdicke;
            $("#stift").focus();
			updateAuswahl();
			
			
		});

		$("#dicken").change(function(event) {
			event.preventDefault();
			var index=parseInt($(this).prop("selectedIndex"));
			
			if (zeichenmodus == 0) {
				stiftdicke = index;
			} else {
				radierdicke = index;
			}
			zeichenbreite = dicken[index];

			// $(".dicke").removeClass("aktiv");
			// $(this).addClass("aktiv");
			updateAuswahl();
            
		});
		$(".layer").click(function(event) {
			event.preventDefault();
			var layerDummy = parseInt($(this).attr("layer"));
			if (visibleLayers[layerDummy] == 1) {
				if (layer==layerDummy){
					visibleLayers[layerDummy]=0;
					
				} else {
				layer = layerDummy;
				if (kurven[layer] == null) {
					kurven[layer] = [];
				}
				// $("#ebene").html("<font color='"+farbe+"'> Ebene "+layer+",
				// Dicke:
				// "+zeichenbreite+"</font>");
				// $(".layer").removeClass("aktiv");
				// $(this).addClass("aktiv");
				//zeichneEbenen(layerfolge[layer], 0, layerfolge.length - 1,true);
				}
			} else {
				visibleLayers[layerDummy]=1;
				layer=layerDummy;
				if (kurven[layer] == null) {
					kurven[layer] = [];
				}
			}
			zeichneEbenen(layerfolge[layer], 0, layerfolge.length - 1,true);
			updateAuswahl();
		});
		$(".check").click(function(event) {
			// event.preventDefault(); // sonst probleme mit checkbox
			// deaktivieren
			// vom system
			var wert = 0;
			if ($(this).prop("checked") == true) {
				wert = 1;

			}
			visibleLayers[parseInt($(this).attr("value"))] = wert;
			zeichneEbenen(layerfolge[layer], 0, layerfolge.length - 1,true);
			updateAuswahl();
		});
		$("#radierer").click(function(event) {
			event.preventDefault();
			zeichenmodus = 1;
			zeichenbreite = dicken[radierdicke];

			updateAuswahl();
		});
		$("#stift").click(function() {

			zeichenbreite = dicken[stiftdicke];

			zeichenmodus = 0;

			updateAuswahl();
		});
		$("#raster").click(
				function(event) {
					event.preventDefault();
					rasterzaehler = (rasterzaehler + 1) % 4;
					zeichneRaster(rasterVorgabe[rasterzaehler][0],
							rasterVorgabe[rasterzaehler][1],
							rasterVorgabe[rasterzaehler][2]);

				});

		$("#loeschenAktiv")
				.click(
						function(event) {
							event.preventDefault();
							var leer = gc2.createImageData(breite, hoehe);
							for (var i = 0; i < leer.length; i += 4) {
								leer[i] = 255;
								leer[i + 1] = 255;
								leer[i + 2] = 255;
								leer[i + 3] = 0;
							}
							gc2.putImageData(leer, 0, 0);
							// kurven[layerfolge[layer]] = [];
							var aenderungen = [];
							for (var i = 0; i < order[layerfolge[layer]].length; i++) {
								if (order[layerfolge[layer]][i] > 0) {
									order[layerfolge[layer]][i] = -order[layerfolge[layer]][i];
									aenderungen.push([ layerfolge[layer],
											order[layerfolge[layer]][i] ]);
								}
							}
							changes[changesPosition] = aenderungen;
							changesPosition++;
							adjustChanges(); // alles darüber löschen, das
												// löschen auch eine änderung
												// ist
							zeichneEbenen(layer, 0, layer,true);
						});

		$("#loescheBilder").click(function(){
			var abfrage=confirm("Sind Sie sicher, dass alle Bilder in der aktiven Ebene gelöscht werden sollen? Dieser Schritt kann nicht rückgängig gemacht werden.");
			if (abfrage==true){
			bilder[layerfolge[layer]]=[];
			zeichneEbenen(layer,0,layer,true);
			}
		});
		
		$("#loeschen").click(function(event) {
			event.preventDefault();
			var leer = gc2.createImageData(breite, hoehe);
			for (var i = 0; i < leer.length; i += 4) {
				leer[i] = 255;
				leer[i + 1] = 255;
				leer[i + 2] = 255;
				leer[i + 3] = 0;
			}
			gc2.putImageData(leer, 0, 0);

			gc3.putImageData(leer, 0, 0);
			for (var i = 0; i < layerfolge.length; i++) {
				kurven[layerfolge[i]] = [];
				order[layerfolge[i]] = [];
			}
			changes = [];
		});
		$("#knopf").click(function(event) {
			event.preventDefault();
			QreatorBezier.showSVG();
		});

		

		updateAuswahl();
	}
	
	this.loescheBild=function(){ // lösche dargestelltes bild
		for (var i=0;i<layerfolge.length;i++){
			if (bilder[i].length>0 && bilder[i][bilder[i].length-1].behalten===false){
				bilder[i].pop();
			}
		}
		zeichneEbenen(layer,0,layer,true);
	}
	
	this.ladeBild=function(bild,xpos,ypos,breiteBild,hoeheBild,behalteBild){ // lädt bild in das aktive canvas
var canvas = document.createElement('canvas'); // unsichtbares canvaselement erstellen
		/*var zeichenbreite=0,zeichenhoehe=0;
		var hochkant=true;
		if (bild.width>bild.height){
			hochkant=false;
		}
		
		if (hochkant==true){
			zeichenhoehe=Math.min(hoehe,bild.height);
			zeichenbreite=bild.width*zeichenhoehe/bild.height;
			if (zeichenbreite>breite){
				zeichenhoehe=zeichenhoehe*breite/zeichenbreite;
				zeichenbreite=breite;
			}
		} else {
			zeichenbreite=Math.min(breite,bild.width);
			zeichenhoehe=bild.height*zeichenbreite/bild.width;
			if (zeichenhoehe>hoehe){
				zeichenbreite=zeichenbreite*hoehe/zeichenhoehe;
				zeichenhoehe=hoehe;
			}
		}*/
		
		canvas.width = breiteBild;
		canvas.height = hoeheBild;
		var ctx = canvas.getContext('2d');
		
		    ctx.drawImage(bild, 0, 0, breiteBild, hoeheBild);   
		    var pngString=canvas.toDataURL();  // bild erst skalieren
		    // für pdfs 
		    //var pngString=bild.src;
		var b={img:null,ebene:layer,nr:bilder[layerfolge[layer]].length,data:pngString,breite:breiteBild,hoehe:hoeheBild,x:xpos,y:ypos,behalten: behalteBild}; // werte für bild festlegen
		// für pdfs
		//var b={img:null,ebene:layer,nr:bilder[layerfolge[layer]].length,data:pngString,breite:998,hoehe:1400,x:xpos,y:ypos,behalten: behalteBild}; // werte für bild festlegen
		
		// alle bilder durchsuchen
		for (var i=0;i<layerfolge.length;i++){
			if (bilder[i].length>0 && bilder[i][bilder[i].length-1].behalten===false){
				bilder[i].pop();
			}
		}
		
		bilder[layerfolge[layer]].push(b);
		zeichneEbenen(layer,0,layer,true);
		
	}
	
	
	function updateAuswahl() {
		if (zeichenmodus == 0) { // zeichnen
			//$(".dicke").removeClass("aktiv");
			//$("[dicke='" + dicken[stiftdicke] + "']").addClass("aktiv");
			$(".layer").removeClass("aktivBunt");
			$('#dicken option').prop('selected', false).filter("[dicke='"+zeichenbreite+"']").prop('selected', true);
			$(".layer").each(function(){$(this).removeClass("sichtbar");});
			$(".layer").each(function(){$(this).removeClass("unsichtbar");});
			$(".layer").removeClass("aktivLayer");
			for (var i=0;i<layerfolge.length;i++){
				if (visibleLayers[i]==1){
					$("[layer='" + layerfolge[i] + "']").addClass("sichtbar");
				} else {
					$("[layer='" + layerfolge[i] + "']").addClass("unsichtbar");
				}
			}
			$(".layer").removeAttr("style");
			$(".layer").each(function(i){
				if (ebenenBunt==1&&visibleLayers[i]==1){
				$(this).attr("style","background-color: "+farben[i]+";");
				if (i==layer){
					$(this).addClass("aktivBunt");
				}
				}
			});
			if (visibleLayers[layer]==1){ // nur wenn layer existiert
			$("[layer='" + layerfolge[layer] + "']").addClass("aktivLayer");
			}
			//$(".farbe").removeClass("aktiv");
			//$("[farbe='" + farben[farbwahl] + "']").addClass("aktiv");
			$("#radierer").removeClass("aktiv");
			$("#stift").addClass("aktiv");
		} else { // radieren
			//$(".dicke").removeClass("aktiv");
			//$("[dicke='" + dicken[radierdicke] + "']").addClass("aktiv");
			$(".layer").removeClass("aktivBunt");
			$('#dicken option').prop('selected', false).filter("[dicke='"+zeichenbreite+"']").prop('selected', true);
			$(".layer").each(function(){$(this).removeClass("sichtbar");});
			$(".layer").each(function(){$(this).removeClass("unsichtbar");});
			for (var i=0;i<layerfolge.length;i++){
				if (visibleLayers[i]==1){
					$("[layer='" + layerfolge[i] + "']").addClass("sichtbar");
				} else {
					$("[layer='" + layerfolge[i] + "']").addClass("unsichtbar");
				}
			}
			$(".layer").removeAttr("style");
			$(".layer").each(function(i){
				if (ebenenBunt==1&&visibleLayers[i]==1){
				$(this).attr("style","background-color: "+farben[i]+";");
				if (i==layer){
					$(this).addClass("aktivBunt");
				}
				}
			});
			$(".layer").removeClass("aktivLayer");
			if (visibleLayers[layer]==1){ // nur wenn layer existiert
				$("[layer='" + layerfolge[layer] + "']").addClass("aktivLayer");
				}
			//$(".farbe").removeClass("aktiv");
			$("#radierer").addClass("aktiv");
			$("#stift").removeClass("aktiv");
		}
		
		var canvas = document.createElement('canvas'); // unsichtbares canvaselement erstellen
		
		var zb=zeichenbreite*window.devicePixelRatio; // zoom von fenster berücksichtigen
		
		canvas.width = zb+3;
		canvas.height = zb+3;
		var ctx = canvas.getContext('2d');
		ctx.beginPath();
		var radius=parseInt(zb/2);
		if (radius==0){
			radius=1;
		}
		ctx.arc(radius+1,radius+1,radius,0,2*Math.PI);
		
		if (zeichenmodus==0){
		ctx.fillStyle=farbe;
		ctx.strokeStyle=farbe;
		} else { //radiermodus
			ctx.strokeStyle = "rgba(255,200,200,1)";
			ctx.fillStyle = "rgba(255,200,200,1)";
		}
		ctx.stroke();
		ctx.fill();
		
		//ctx.fillRect(0,0,zeichenbreite,zeichenbreite);
		var pngString=canvas.toDataURL();
		var cursorString="url("+pngString+")"+(radius-2)+" "+(radius-2)+",auto";
		$("#layer3").css('cursor',cursorString);
	}
	
	
	this.insertImgAsSVG=function(bild,breite,hoehe,einsetzenId,folgeText){
		$("#content").append("<div id='qreator_svgbild'></div>");
		$("#qreator_svgbild")
		.html(
				"<svg  width='100%' height='100%' viewBox='0 0 "+breite+" "+ (breite/bild.width*bild.height)+"' hoehegesetzt='"+(breite/bild.width*bild.height)+"' breitegesetzt='"+breite+"' heightoriginal='"+(breite/bild.width*bild.height)+"' id='qreator_svgbild2' class='qreator_svg'><g fill='none' stroke-linecap='round' id='global'></g>"); // altes
		

        
        
	
		$("#qreator_svgbild2 #global").append(
				"<g id='layer_2'></g>");
		
				
			// wichtig für den richtigen namespace (sonst nur img statt image)
			$("#qreator_svgbild2 #global #layer_2").append(document.createElementNS("http://www.w3.org/2000/svg", "image"));
			
        $("#qreator_svgbild2 #global #layer_2 image").last().attr("bildnr","0").attr("x","0").attr("y","0").attr("width",""+breite).attr("height",""+(breite/bild.width*bild.height)).attr("xlink:href",""+bild.src).attr("hoeheoriginal",""+(breite/bild.width*bild.height));
			
        
			
			$("#"+einsetzenId).before(
					"<div class='zeichenflaeche tshareElement zeichenflaecheKlick' >" + $("#qreator_svgbild").html()
							+ "</div>"+folgeText);
			$("#qreator_svgbild2").removeAttr("id");
			$("#qreator_svgbild").html("");
			$("#qreator_svgbild").remove();
			/*
			$(selectorGlobal).find("."+zf).unwrap();
			$(menuGlobal).html("");*/
			}
	



	this.showSVG = function(zf) {
		var svgString = "";
		var svgtext = "";
		var zaehler = 0;
        var maxhoehe=0;

		$("#qreator_svgbild")
				.html(
						"<svg  width='"
								+ breite // anpassen an aktuelle breite
								+ "' height='"
								+ hoehe // anpassen an aktuelle hoehe
								+ "' id='qreator_svgbild2' class='qreator_svg'><g fill='none' stroke-linecap='round' id='global'></g>"); // altes
		// bild
		// löschen
		for (var m = 0; m < layerfolge.length; m++) {
			var k = layerfolge[m]; // an aktuelle reihenfolge anpassen
			var bilderstring="";
			// erst bilder zeichnen
			
			
			
			if ((kurven[k] != null && kurven[k].length > 0)||(bilder[k]!=null && bilder[k].length>0)) {
				var display = "";
				var bildEingesetzt=false;
				if (visibleLayers[m] == 0) {
					display = "visibility='hidden'";
				}
				$("#qreator_svgbild2 #global").append(
						"<g id='layer_" + k + "' " + display + "></g>");
				if (bilder[k]!=null){
					for (var j=0;j<bilder[k].length;j++){
						var bild=bilder[k][j];
						
					// wichtig für den richtigen namespace (sonst nur img statt image)
					$("#qreator_svgbild2 #global #layer_" + k).append(document.createElementNS("http://www.w3.org/2000/svg", "image"));
					$("#qreator_svgbild2 #global #layer_" + k+" image").last().attr("bildnr",j).attr("x",""+bild.x).attr("y",""+bild.y).attr("width",""+bild.breite).attr("height",""+bild.hoehe).attr("xlink:href",""+bild.data);
                        if (bild.y+bild.hoehe>maxhoehe) {
                            maxhoehe=bild.y+bild.hoehe;
                        }
					}
				}
				if (kurven[k] != null && kurven[k].length > 0){
				var text = "";
				var letzterPunkt = kurven[k][0][0][3];
				var aktuelleFarbe = '';
				var aktuelleBreite = '';
				var einsetzString = '';
				var einsetzStringAktuell = '';
				var pfadstart = "<path d='";
				
				for (var ord = 0; ord < order[k].length; ord++) {
					var z = order[k][ord];
					if (z > 0) {
						i = z - 1;
						var tmp = kurven[k][i][0];
						var neueFarbe = kurven[k][i][4];
						var neueBreite = kurven[k][i][3];
                        var kurvenHoehe=kurven[k][i][1][3];
                        if (kurvenHoehe>maxhoehe&&k>0){
                            maxhoehe=kurvenHoehe;
                        }

						if (neueFarbe != aktuelleFarbe
								|| neueBreite != aktuelleBreite) {
							einsetzString = " stroke='" + neueFarbe + "'";
							aktuelleFarbe = neueFarbe;
							einsetzString += " stroke-width='" + neueBreite
									+ "'";
							aktuelleBreite = neueBreite;
						}
						// if (neueBreite!=aktuelleBreite){

						// }
						if (einsetzString.length > 0) { // neues Path-Segment
							if (text.length > 0) {
								svgtext += pfadstart + text + "' "
										+ einsetzStringAktuell + " />";

								letzterPunkt = {
									x : -1,
									y : -1
								}; // letzten punkt zurücksetzen, so dass neuer
								// pfad
								// startet

								text = "";
							}
							einsetzStringAktuell = einsetzString;
							einsetzString = '';
						}
						if (i > 0 && tmp[0].x === letzterPunkt.x
								&& tmp[0].y === letzterPunkt.y) {
							text += " c "
									+ runde(tmp[1].x - tmp[0].x, dezimalenSVG)
									+ " "
									+ runde(tmp[1].y - tmp[0].y, dezimalenSVG)
									+ " "
									+ runde(tmp[2].x - tmp[0].x, dezimalenSVG)
									+ " "
									+ runde(tmp[2].y - tmp[0].y, dezimalenSVG)
									+ " "
									+ runde(tmp[3].x - tmp[0].x, dezimalenSVG)
									+ " "
									+ runde(tmp[3].y - tmp[0].y, dezimalenSVG);

						} else {
							text += " M " + runde(tmp[0].x, dezimalenSVG) + " "
									+ runde(tmp[0].y, dezimalenSVG) + " c "
									+ runde(tmp[1].x - tmp[0].x, dezimalenSVG)
									+ " "
									+ runde(tmp[1].y - tmp[0].y, dezimalenSVG)
									+ " "
									+ runde(tmp[2].x - tmp[0].x, dezimalenSVG)
									+ " "
									+ runde(tmp[2].y - tmp[0].y, dezimalenSVG)
									+ " "
									+ runde(tmp[3].x - tmp[0].x, dezimalenSVG)
									+ " "
									+ runde(tmp[3].y - tmp[0].y, dezimalenSVG);// +"'
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
							}; // letzten punkt zurücksetzen, so dass neuer
								// pfad
							// startet

							text = "";
							if (svgtext.length > 10000) {
								$("#qreator_svgbild2 #global #layer_" + k)
										.append(svgtext);
								bilderstring="";
								zaehler += svgtext.length;
								svgtext = "";
							}
							aktuelleFarbe = '';
							aktuelleBreite = ''; 
						}
					}
				}
                

				if (text.length > 0) {
					svgtext += "<path d='" + text + "' " + einsetzStringAktuell
							+ " />";
				}
				if (svgtext.length > 0 ) {
					
					
					$("#qreator_svgbild2 #global #layer_" + k).append(svgtext);
					zaehler += svgtext.length;
					svgtext = "";
				}
				}
			}
		}
        
        $("#qreator_svgbild svg").attr("height","100%").attr("width","100%").attr("heightoriginal",hoehe).attr("hoehegesetzt",maxhoehe).attr("breitegesetzt",breite).attr("viewBox","0 0 "+breite+"  "+maxhoehe);
       
		// $("#info").html("Anzahl der Zeichen: " + zaehler);
		// var w = window.open("", "MsgWindow", "width=" + breite
		// + ",height=" + hoehe);
		// var html = $("#bild").html();
		$("#qreator_svgbild #qreator_svgbild2").removeAttr("id");
		var test=$("#qreator_svgbild").html();
		$(selectorGlobal).html(
				"<div class='" + zf + " tshareElement zeichenflaecheKlick' >" + $("#qreator_svgbild").html()
						+ "</div>");
		$(selectorGlobal).find("."+zf).unwrap();
		$(menuGlobal).html("");

	}
	

	function zeichneRaster(xbreite, ybreite, rasterfarbe) {

		var ebene = 0;
		kurven[ebene] = []; // altes raster löschen
		order[ebene] = [];
		orderPosition[ebene] = 0;

		var a = new Punkt(0, 0);
		var b = new Punkt(0, 0);

		if (xbreite.length > 0) {

			for (var x = 0; x < breite; x += xbreite[xbreite.length - 1]) {
				for (var i = 0; i < xbreite.length; i++) {
					var a = new Punkt(x + xbreite[i], 0);
					var b = new Punkt(x + xbreite[i], hoehe);

					var gerade = [
							a,
							Bezier.addiere(a, Bezier.multipliziereMitSkalar(
									Bezier.subtrahiere(b, a), 1.0 / 3.0)),
							Bezier.addiere(a, Bezier.multipliziereMitSkalar(
									Bezier.subtrahiere(b, a), 2.0 / 3.0)), b ];
					kurven[ebene].push([ gerade,
							Bezier.findeRechtecksHuelle(gerade), 0, 2,
							rasterfarbe ]);
					order[ebene].push(kurven[ebene].length);
					// orderPosition[ebene]++;

				}
			}
		}

		if (ybreite.length > 0) {

			for (var y = 0; y < hoehe; y += ybreite[ybreite.length - 1]) {
				for (var i = 0; i < ybreite.length; i++) {
					a = new Punkt(0, y + ybreite[i]);
					b = new Punkt(breite, y + ybreite[i]);
					var gerade = [
							a,
							Bezier.addiere(a, Bezier.multipliziereMitSkalar(
									Bezier.subtrahiere(b, a), 1.0 / 3.0)),
							Bezier.addiere(a, Bezier.multipliziereMitSkalar(
									Bezier.subtrahiere(b, a), 2.0 / 3.0)), b ];
					kurven[ebene].push([ gerade,
							Bezier.findeRechtecksHuelle(gerade), 0, 2,
							rasterfarbe ]);
					order[ebene].push(kurven[ebene].length);
					// orderPosition[ebene]++;

				}
			}
		}

		zeichneEbenen(layerfolge[layer], ebene, layerfolge[layer],true);

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

	this.loadSVG = function(svg) { // converts svg-input to internal data
		// format
		var datenLoad = [];
		var anzahlLayer = 0;
		for (var i = 0; i < visibleLayers.length; i++) {
			visibleLayers[i] = 1;
		}
		console.log("Breite: "+$(svg).attr("width")+", Höhe: "+$(svg).attr("height")+", Originalhöhe: "+$(svg).attr("heightoriginal"));
        var originalHoehe=$(svg).attr("heightoriginal");
        if (originalHoehe!=undefined){
            $("#rahmen canvas").attr("height",parseInt(originalHoehe)); // Höhe an alte Originalhöhe anpassen
            hoehe=parseInt(originalHoehe);
        }
        var breiteGesetzt=$(svg).attr("breitegesetzt");
        if (breiteGesetzt!=undefined){
            $("#rahmen canvas").attr("width",parseInt(breiteGesetzt)); // Höhe an alte Originalhöhe anpassen
            breite=parseInt(breiteGesetzt);
        }
      
		$(svg)
				.find("#global")
				.find("g")
				.each(
						function() {
							var index = parseInt($(this).attr("id").split("_")[1]);
							kurven[index] = [];
							bilder[index]=[];
							anzahlLayer++;
							if ($(this).attr("visibility") == "hidden") {
								visibleLayers[index] = 0;
							}
							
							// bilder finden
							$(this).find("image").each(function(){
								var bild={data:$(this).attr("xlink:href"),x:parseInt($(this).attr("x")),y:parseInt($(this).attr("y")),breite:parseInt($(this).attr("width")),hoehe:parseInt($(this).attr("height")),ebene:index,nr:bilder[index].length};
								bilder[index].push(bild);
								/*var data=$(this).attr("data");
								var x=parseInt($(this).attr("x"));
								var y=parseInt($(this).attr("y"));
								var b=parseInt($(this).attr("width"));
								var h=parseInt($(this).attr("hoehe"));*/
								
							});
							
							
							// bezierkurven finden
							$(this)
									.find("path")
									.each(
											function() {

												var farbeLoad = $(this).attr(
														"stroke");
												var breiteLoad = parseInt($(
														this).attr(
														"stroke-width"));
												var datenLoad = $(this).attr(
														"d");
												var trimLoad = datenLoad.trim();
												var dataChunks = trimLoad
														.split("M");

												for (var j = 0; j < dataChunks.length; j++) {
													if (dataChunks[j] != "") {
														var teile = dataChunks[j]
																.split("c");
														var koordsalt = teile[0]
																.split(" ");
														var koords = [];
														for (var l = 0; l < koordsalt.length; l++) {
															if (koordsalt[l] != "") {
																koords
																		.push(koordsalt[l]);
															}
														}
														var punkte = [];
														var p = new Punkt(
																parseFloat(koords[0]),
																parseFloat(koords[1]));

														// punkte[0].x=parseFloat(koords[0]);
														// punkte[0].y=parseFloat(koords[1]);
														punkte.push(p);
														for (var c = 1; c < teile.length; c++) {

															// andere drei
															// koordinaten
															var restalt = teile[c]
																	.split(" ");
															var rest = [];
															for (var l = 0; l < restalt.length; l++) {
																if (restalt[l] != "") {
																	rest
																			.push(restalt[l]);
																}
															}
															if (rest.length >= 6) {

																for (var r = 0; r < 6; r += 2) { // 
																	// koords=rest[r].split(",");

																	p = new Punkt(
																			parseFloat(rest[r])
																					+ punkte[0].x,
																			parseFloat(rest[r + 1])
																					+ punkte[0].y);
																	punkte
																			.push(p);
																	// x.push(parseFloat(koords[0])+x[r]);
																	// y.push(parseFloat(koords[1])+y[r]);

																}
															}
															// alle koordinaten
															// komplett: jetzt
															// bezier erstellen

															kurven[index]
																	.push([
																			punkte,
																			Bezier
																					.findeRechtecksHuelle(punkte),
																			0,
																			breiteLoad,
																			farbeLoad ]);
															// order[index][orderPosition[index]]
															// =
															// kurven[index].length;
															// // reihenfolge
															order[index]
																	.push(kurven[index].length);
															// speichern
															// orderPosition[index]++;

															if (punkte.length == 4) {
																p = new Punkt(
																		punkte[3].x,
																		punkte[3].y);

																punkte = [];

																punkte.push(p);
															}

														}
													}
												}
											});
							if (kurven[index].length > 0) {
								// changes[changesPosition]=[index,0,0,kurven[index].length-1];
								// // alle ebenen speichern
								// changesPosition++;
							}
						});
		// var paths=$(svg).find("path").each(index,el){

		// }
		var layers = [];
		var layerfolge = [];
		if (anzahlLayer < 10) {
			anzahlLayer = 10;
		}
		for (var i = 0; i < anzahlLayer; i++) {
			layers[i] = i;
			layerfolge[i] = i;
			if (visibleLayers[i] == null) {
				visibleLayers[i] = 1;
			}
		}

		for (var i = 0; i < visibleLayers.length; i++) { // checkboxen setzen
			//$("#checkbox_" + i).prop('checked', visibleLayers[i]);
			
		}
		zeichneEbenen(layerfolge[layer], 0, anzahlLayer - 1,true);
		updateAuswahl();
        
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
		if (visibleLayers[layer]==1){
		if (gedrueckt === true) {
			var x = e.targetTouches[0].pageX - c.offsetLeft
					- $("#rahmen")[0].offsetLeft;

			var y = e.targetTouches[0].pageY - c.offsetTop
					- $("#rahmen")[0].offsetTop;
			zeichne(x, y);

		}
            if (berechnung===true){
		zeichneOderRadiere();
            }
		}
	}

	function zeichneOderRadiere() {
		// var kurvenebene=layerfolge[layer];
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
			} else if (zeichenmodus === 1) { // radieren
				var betroffeneEbenen = [];
				for (var i = 0; i < layerfolge.length; i++) {
					betroffeneEbenen[i] = 0;
					if (i == layerfolge[layer]) {
						betroffeneEbenen[i] = 1; // so, dass radierer auch
						// auf
						// mehreren ebenen funktioniert
					}
				}
				var aenderungen = [];
				for (var kurvenebene = 0; kurvenebene < betroffeneEbenen.length; kurvenebene++) {
					if (betroffeneEbenen[kurvenebene] > 0) {
						if (kurven[kurvenebene] != null
								&& kurven[kurvenebene].length > 0) {
							// erstelle nun die liste aller betroffenen
							// rechtecke
							betroffeneKurven = [];

							if (rechtecke2.length < grenzeAnzahl) { // dann
								// originalrechteck
								// nehmen

								for (var i = 0; i < order[kurvenebene].length; i++) {
									// kurven[kurvenebene][i][2] = 0; // auf
									// standard
									if (order[kurvenebene][i] > 0) {
										var tmp = kurven[kurvenebene][order[kurvenebene][i] - 1][1]; // hole
										// rechteckshülle

										if (rechteckUeberschneidung(ecken, tmp) === true) {
											// kurven[kurvenebene][i][2] = 1; //
											// neu zeichnen
											// setzen
											betroffeneKurven.push(i); // gespeichert
											// wird
											// die
											// position in
											// order-liste
										}
									}
								}
							} else {
								for (var i = 0; i < order[kurvenebene].length; i++) {// sonst
									// nur
									// die
									// betroffenen
									if (order[kurvenebene][i] > 0) {
										// kurven[kurvenebene][i][2] = 0; // auf
										// standard
										var tmp = kurven[kurvenebene][order[kurvenebene][i] - 1][1]; // hole
										// rechteckshülle

										if (rechteckUeberschneidung2(tmp) === true) { // geht
											// nach
											// segmenten
											// vor
											betroffeneKurven.push(i); // wieder
											// ist
											// die
											// position in der
											// orderliste
											// gespeichert
											// kurven[kurvenebene][i][2] = 1; //
											// neu zeichnen
											// setzen
										}
									}
								}
							}

							// gefundene kurven von oben nach unten durchlaufen
							// und auf
							// treffer überprüfen
							var radierer = gc.getImageData(0, 0, breite, hoehe); // radierbereich
							// wählen
							for (var i = betroffeneKurven.length - 1; i >= 0; i--) { // alle
								// betroffenen
								// kurven
								// durchlaufen
								var tmp = kurven[kurvenebene][order[kurvenebene][betroffeneKurven[i]] - 1][0];
								var stiftdicke_aktuell = kurven[kurvenebene][order[kurvenebene][betroffeneKurven[i]] - 1][3];
								var farbe_aktuell = kurven[kurvenebene][order[kurvenebene][betroffeneKurven[i]] - 1][4];

								/* ===== */
								var l = schaetzeLaenge(tmp); // länge der
								// kurve grob
								// abschätzen
								var delta = 1.0 / l * 3; // schrittweite für
								// parameter t
								// zum testen der schnittpunkte
								var tsammler = [];
								var zaehler = 0;
								var test = 0;
								for (var t = 0; t < 1 + delta; t += delta) {
									if (t > 1)
										t = 1;
									var pos = Bezier.evaluiere(3, tmp, t);
									var p = (parseInt(pos.y, 10) * breite + parseInt(
											pos.x, 10)) * 4;
									if (radierer.data[p + 1] === 200) { // radiererstelle
										tsammler.push(zaehler);
										test++;
									}
									zaehler++;
								}

								// falls ganze kurve gelöscht, rest sparen
								if (zaehler - test < 3) { // falls nur 2
									// kontrollpunkte
									// übrig, ganze kurve löschen
									// kurven[kurvenebene].splice(betroffeneKurven[i],
									// 1);
									aenderungen
											.push([
													kurvenebene,
													-(order[kurvenebene][betroffeneKurven[i]]) ]); // löschung
									// registrieren
									order[kurvenebene][betroffeneKurven[i]] = -order[kurvenebene][betroffeneKurven[i]]; // kurve
									// hier
									// löschen
									unchanged = false;

								} else {
									unchanged = false;
									// alle parameterwerte zusammenführen
									for (var k = tsammler.length - 2; k >= 0; k--) {
										if (tsammler[k + 1] - tsammler[k] === 2) { // einzelne
											// werte
											// zusammenführen
											tsammler.splice(k + 1, 0,
													tsammler[k] + 1);

										}
									}

									// testweise alle punkte zeichnen lassen

									// jetzt restkurve erstellen und farbig
									// zeichnen lassen
									var start = 0;
									var tk = [];
									var z = 0;
									for (var k = 0; k < tsammler.length; k++) {
										if (tsammler[k] - start > 1) {
											var teilkurve = Bezier.zerlege(tmp,
													start * delta,
													(tsammler[k] - 1) * delta);
											tk.push(teilkurve);
											start = tsammler[k];

										} else {
											start = tsammler[k];
										}
									}
									if (tsammler.length > 0) {
										if (tsammler[tsammler.length - 1]
												* delta < 1) {
											var teilkurve = Bezier
													.teile(
															tmp,
															tsammler[tsammler.length - 1]
																	* delta, 1)[1];
											tk.push(teilkurve);
										}
									}

									// alte kurve ersetzen durch alle neuen
									if (tk.length > 0) {
										// kurven[kurvenebene].splice(betroffeneKurven[i],
										// 1);
										aenderungen
												.push([
														kurvenebene,
														-order[kurvenebene][betroffeneKurven[i]] ]); // löschung
										// registrieren
										order[kurvenebene][betroffeneKurven[i]] = -order[kurvenebene][betroffeneKurven[i]]; // kurve
										// hier
										// löschen
										var start = kurven[kurvenebene].length;
										for (var l = 0; l < tk.length; l++) {
											kurven[kurvenebene]
													.push([
															tk[l],
															Bezier
																	.findeRechtecksHuelle(tk[l]),
															1,
															stiftdicke_aktuell,
															farbe_aktuell ]);

											/*
											 * kurven[kurvenebene] .splice(
											 * betroffeneKurven[i], 0, [ tk[l],
											 * Bezier
											 * .findeRechtecksHuelle(tk[l]), 1,
											 * stiftdicke_aktuell, farbe_aktuell
											 * ]);
											 */
											// teilabschnitt
											// dazulegen
											order[kurvenebene].splice(
													betroffeneKurven[i], 0,
													kurven[kurvenebene].length);
											// orderPosition[kurvenebene]++;
										}
										aenderungen.push([ kurvenebene,
												start + 1,
												kurven[kurvenebene].length ]);
									}

								}
							}

							changes[changesPosition] = aenderungen;
							changesPosition++;
							if (unchanged == false) {
								adjustChanges();
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
							// zeichneKurvenNeu();
							berechnung = false;
							zeichneEbenen(layer, 0, layer,true);

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
							berechnung = false;

						}

					}
				}
			}
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

		var kurvenebene = layerfolge[layer];
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
		if (visibleLayers[layer]==1){
		if (gedrueckt === true) {
			var x = e.pageX - c.offsetLeft - $("#rahmen")[0].offsetLeft;

			var y = e.pageY - c.offsetTop - $("#rahmen")[0].offsetTop;
			zeichne(x, y);
		}
		if (berechnung===true) {
            zeichneOderRadiere();
		}
	}
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
		var extreme = holeMinMax(daten);
		var toleranz2 = parseInt(Math.max(extreme[2] - extreme[0], extreme[3]
				- extreme[1]) / 5.0, 10);

		var l = Bezier.berechneEntfernung(daten[0], daten[daten.length - 1]);
		if (l < toleranz2) { // vielleicht ein kreis?

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
			} else { // auf polygon überprüfen
				var toleranz = parseInt(Math.max(extreme[2] - extreme[0],
						extreme[3] - extreme[1]) / 20.0, 10);
				if (toleranz>20){
					toleranz=20;
				}
				var daten2 = [];
				for (var i = 0; i < daten.length; i++) {
					daten2.push(new Punkt(daten[i].x, daten[i].y));
				}
				var huelle = window.simplify(daten2, toleranz, true);

				// jetzt einzelne gerade prüfen, dazu erst die daten finden, die
				// auf der konv. hülle liegen
				/*
				 * var huelle=[]; for (var i=0;i<huelle2.length;i++){
				 * huelle.push(new Punkt(huelle2[i].x,huelle2[i].y)); }
				 */

				// in geraden verwandeln und speichern
				erg = [];
				if (huelle.length > 3 && huelle.length < 6) { // dreieck oder
																// viereck
					huelle[huelle.length - 1] = huelle[0]; // schließen

					// viereck noch auf rechteck parallel zu koordinatenlinien
					// überprüfen
					if (huelle.length == 5) {
						for (var i = 0; i < huelle.length - 1; i++) {
							a = huelle[i];
							b = huelle[i + 1];
							var dx = b.x - a.x;
							var dy = b.y - a.y;
							if (dy !== 0) {
								var steigung = dy * 1.0 / dx;
								if (Math.abs(steigung) < 0.3) {

									if (i == 3) {
										huelle[i + 1].y = huelle[0].y;
										huelle[i].y = huelle[i + 1].y;
									} else {
										var mw = (a.y + b.y) / 2.0;
										// huelle[i].y = mw;
										huelle[i + 1].y = huelle[i].y;
									}
								}
							}
							if (dx !== 0) {
								var steigung = dx * 1.0 / dy;
								if (Math.abs(steigung) < 0.3) {

									if (i == 3) { // letzter punkt
										huelle[i + 1].x = huelle[0].x;
										huelle[i].x = huelle[i + 1].x;
									} else {
										var mw = (a.x + b.x) / 2.0;
										// huelle[i].x = mw;
										huelle[i + 1].x = huelle[i].x;
									}
								}
							}
						}

					}

					for (var i = 0; i < huelle.length - 1; i++) {
						a = new Punkt(huelle[i].x, huelle[i].y);
						b = new Punkt(huelle[i + 1].x, huelle[i + 1].y);
						erg
								.push([
										a,
										Bezier.addiere(a, Bezier
												.multipliziereMitSkalar(Bezier
														.subtrahiere(b, a),
														1.0 / 3.0)),
										Bezier.addiere(a, Bezier
												.multipliziereMitSkalar(Bezier
														.subtrahiere(b, a),
														2.0 / 3.0)), b ]);
					}

					geaendert = true;
				}
			}
		}

		if (geaendert === false) {
			var toleranz = parseInt(l / 20.0, 10);
			// $("#ausgabe").html(l+" "+toleranz);

			erg = [];
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
				}
				if (dx !== 0) {
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
		// if (geaendert === false) {
		Bezier.initialisiere(daten, toleranzgrenze);
		var erg2 = Bezier.approximiere();
		// }
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

		var start = kurven[layerfolge[layer]].length;
		for (var i = 0; i < erg2.length; i++) {
			var tmp = erg2[i];

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
					print(3, tmp[0].x + "/" + tmp[0].y + "," + tmp[1].x + "/"
							+ tmp[1].y + "," + tmp[2].x + "/" + tmp[2].y + ","
							+ tmp[3].x + "/" + tmp[3].y);

					gc2.stroke();
				}
				kurven[layerfolge[layer]].push([ tmp,
						Bezier.findeRechtecksHuelle(tmp), 0, zeichenbreite,
						farbe ]); // alle

				// order[layerfolge[layer]][orderPosition[layerfolge[layer]]] =
				// kurven[layerfolge[layer]].length;
				order[layerfolge[layer]].push(kurven[layerfolge[layer]].length);
				// orderPosition[layerfolge[layer]]++;
				unchanged = false;

				// zeichnungen
				// speichern
			}

		}

		if (unchanged == false) {
			adjustChanges();
		}
		changes[changesPosition] = [ [ layerfolge[layer], start + 1,
				kurven[layerfolge[layer]].length ] ];
		changesPosition++;
		var start2 = kurven[layerfolge[layer]].length;
		if (geaendert == true) { // ersetzen der kurven mit neuen werten
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
					kurven[layerfolge[layer]].push([ tmp,
							Bezier.findeRechtecksHuelle(tmp), 0, zeichenbreite,
							farbe ]); // alle

					// order[layerfolge[layer]][orderPosition[layerfolge[layer]]]
					// = kurven[layerfolge[layer]].length;
					order[layerfolge[layer]]
							.push(kurven[layerfolge[layer]].length);
					// orderPosition[layerfolge[layer]]++;
					unchanged = false;

					// zeichnungen
					// speichern
				}

			}
			for (var i = 0; i < order[layerfolge[layer]].length; i++) {
				if (Math.abs(order[layerfolge[layer]][i]) >= Math
						.abs(start + 1)
						&& Math.abs(order[layerfolge[layer]][i]) <= Math
								.abs(start2)) { // nicht
					// vergessen:
					// vergessen:
					// order
					// speichert
					// um 1
					// erhöhte
					// werte
					order[layerfolge[layer]][i] = -order[layerfolge[layer]][i];
					// orderPosition[ebene][i]--;
				}
			}
			changes[changesPosition] = [
					[ layerfolge[layer], start + 1, start2 ],
					[ layerfolge[layer], start2 + 1,
							kurven[layerfolge[layer]].length ] ];
			changesPosition++;

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

	function peukerNormal(_liste, _toleranz) {
		var dmax = 0;
		var rg = true;
		var ergebnisListe = [];
		var index = 0;
		for (var i = 1; i < _liste.length - 1; i++) {
			var d = kleinsterAbstand(_liste[i], _liste[0],
					_liste[_liste.length - 1]);
			if (d > dmax) {
				index = i;
				dmax = d;
			}
		}

		if (dmax > _toleranz) {
			var rekursiv1 = peukerNormal(_liste.slice(0, index + 1), _toleranz);
			var rekursiv2 = peukerNormal(_liste.slice(index, _liste.length),
					_toleranz);
			ergebnisListe = rekursiv1.concat(rekursiv2);
		} else {
			ergebnisListe = _liste.slice(0, _liste.length);
			// ditching this point

		}
		return ergebnisListe;

	}

	function adjustChanges() { // lösche alle änderungen oberhalb der
								// momentanen position in der history
		for (var i = changesPosition; i < changes.length; i++) {
			changes.splice(i, 1);
		}
	}

	function zeichneEbenen(centralLayer, start, stop,bildLayer) {
		var bildzaehler=0;
		var gesamtzahl=0;
		for (var i=0;i<layerfolge.length;i++){ // alle bilder zählen
			for (var j=0;j<bilder[i].length;j++){
				if (visibleLayers[i] == 1&&bilder[i][j].img==null) {
					gesamtzahl++;
				}
			}
		}
		var leer = gc.createImageData(breite, hoehe);
		for (var i = 0; i < leer.length; i += 4) {
			leer[i] = 255;
			leer[i + 1] = 255;
			leer[i + 2] = 255;
			leer[i + 3] = 0;
		}
		gc.putImageData(leer, 0, 0);
		if (start <= centralLayer)
			gc2.putImageData(leer, 0, 0);
		if (stop > centralLayer)
			gc3.putImageData(leer, 0, 0);
		for (var i = start; i <= stop; i++) {
			var zk = gc2;
			if (i > centralLayer) {
				zk = gc3;
			}
			var k = layerfolge[i];
			if (visibleLayers[k] == 1) { // nur zeichnen, wenn sichtbar
				
				// erst die bilder
				if (bildLayer==true&&bilder[k]!=null){
					for (var j=0;j<bilder[k].length;j++){
					
						this.bild=bilder[k][j];
						//img.src=bild.data;
						//zk.drawImage(img,bild.x,bild.y,bild.breite,bild.hoehe);
						var that=this.bild;
						var img=new Image();
						if (bilder[k][j].img==null){
							
						
						img.onload=function(){
							//ctx.drawImage(this,0,0);
							//var pngString=canvas.toDataURL();  // bild erst skalieren
							//var that=img; //in lokaler variable speichern
							//zk.drawImage(this,this.x,this.y,this.width,this.height);
					       // bilder[that.ebene][that.nr].img=this;
					        bildzaehler++;
					        if (bildzaehler==gesamtzahl){
					        	zeichneEbenen(layer,0,layerfolge.length-1,true);
					        }
					        var test="";
						}
						bilder[k][j].img=img;
						img.width=bilder[k][j].breite;
						img.height=bilder[k][j].hoehe;
						img.x=bilder[k][j].x;
						img.y=bilder[k][j].y;
						img.src=bilder[k][j].data;
						} else {
						
							
							zk.drawImage(bild.img,bild.x,bild.y,bild.breite,bild.hoehe);
							if (ebenenBunt==1){
								zk.strokeStyle=farben[k];
								zk.beginPath();
								zk.lineWidth="5";
								zk.rect(bild.x,bild.y,bild.breite,bild.hoehe);
								
								zk.moveTo(bild.x,bild.y);
								zk.lineTo(bild.x+bild.breite,bild.y+bild.hoehe);
								zk.moveTo(bild.x+bild.breite,bild.y);
								zk.lineTo(bild.x,bild.y+bild.hoehe);
								zk.stroke();
								
							}
						}
					}
				}
				if (kurven[k] != null) {
					for (var j = 0; j < order[k].length; j++) {
						if (order[k][j] > 0) {
							var tmp = kurven[k][order[k][j] - 1][0]; // 1
							// abziehen,
							// da
							// order immer um 1
							// zu hohen
							// kurvenwert
							// enthält

							zk.beginPath();
							zk.moveTo(tmp[0].x, tmp[0].y);
							zk.strokeStyle = kurven[k][order[k][j] - 1][4];
							if (ebenenBunt==1){
								zk.strokeStyle=farben[k];
							}
							zk.lineCap = "round";
							zk.lineWidth = "" + kurven[k][order[k][j] - 1][3];

							zk.bezierCurveTo(tmp[1].x, tmp[1].y, tmp[2].x,
									tmp[2].y, tmp[3].x, tmp[3].y);

							zk.stroke();
						}
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
			this.epsilon =  1e-11;
			this.TOLERANZ = 1e-6;
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
			var handle1=null,handle2=null;
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

			} else {
				var linie=this.subtrahiere(pkt2,pkt1);
				handle1=this.multipliziereMitSkalar(this.normiere(tan1),alpha1);
				handle2=this.multipliziereMitSkalar(this.normiere(tan2),alpha2);
				if (this.multipliziereSkalar(handle1,linie)-this.multipliziereSkalar(handle2,linie)>segLaenge*segLaenge){
					alpha1=alpha2=segLaenge/3;
					handle1=handle2=null;
				}
				
			}
			
			var r1=this.multipliziereMitSkalar(this
					.normiere(tan1), alpha1);
			var r2=this.multipliziereMitSkalar(this
					.normiere(tan2), alpha2);
					
			if (handle1!=null){
				r1=handle1;
			}
			if (handle2!=null){
				r2=handle2;
			}
			return [
					pkt1,
					this.addiere(pkt1, r1),
					this.addiere(pkt2, r2), pkt2 ];

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
		findeGroesstenFehler : function(start, ende, kontrollpunkte, u) { // findet
			// die
			// maximale
			// entfernung
			// zwischen
			// kontrollpunkt
			// und
			// kurve
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
		reparametrisiere : function(start, ende, u, kontrollpunkte) { // ruft
			// das
			// newton-verfahren
			// für
			// bessere
			// parameter
			// auf
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
