define([
	"dojo/dom",
<<<<<<< HEAD
	"dojo/dom-attr",
	"dojo/number",
	"dojo/_base/Color",
	"dojo/on",
=======
	"dojo/number",
	"dojo/_base/Color",
>>>>>>> origin/develop

	"esri/map",
	"esri/layers/FeatureLayer",
	"esri/graphic",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/SimpleFillSymbol",
<<<<<<< HEAD
	"esri/geometry/Circle",
	"esri/tasks/query",
	"esri/tasks/QueryTask",
	"esri/units", 
	"esri/toolbars/draw", 
=======
	"esri/geometry/webMercatorUtils",
	"esri/tasks/query",
	"esri/tasks/QueryTask",
>>>>>>> origin/develop

	"app/tasks/FindNearestTask",

	"dojo/domReady!"],
	function(
<<<<<<< HEAD
		dom, domAttr, number, Color, on,
		Map, FeatureLayer, Graphic, SimpleLineSymbol, SimpleMarkerSymbol, SimpleFillSymbol,
		Circle, Query, QueryTask, Units, Draw,
		FindNearestTask) {
		"use strict";

		// Declare variables
		var	featureLayer, map, toolbar;
=======
		dom, number, Color,
		Map, FeatureLayer, Graphic, SimpleLineSymbol, SimpleMarkerSymbol, SimpleFillSymbol,
		webMercatorUtils, Query, QueryTask, FindNearestTask) {
		"use strict";

		var
			// The feature layer to query
			layerUrl = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0",
			// Feature layer to work with
			featureLayer,
			// Cached featureSet
			featureCache,
			trigger, map;
>>>>>>> origin/develop
		
		// Create the map
		map = new Map("map-canvas", {
			basemap: "national-geographic",
			center: [-119.511, 35.473],
			zoom: 8
		});
		
<<<<<<< HEAD
		map.on("load", function() {
			// Create a feature layer
			featureLayer = new FeatureLayer("http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/0", {
				mode: FeatureLayer.MODE_ONDEMAND,
				outFields: ["objectid", "areaname"]
			});		
			
			// Set the selection symbol
			setSelectionSymbol(featureLayer);		
			
			// Add the feature layer
			map.addLayers([featureLayer]);	
		});
		
		map.on("layer-add-result", function() {			
			// Create a draw toolbar
			toolbar = new Draw(map);
			
			// Hook up event handler		
			on(toolbar, "draw-end", getFeatures);
			
			on(dom.byId("select"), "click", function() {
				map.graphics.clear();
				
				map.disableMapNavigation();
				// Activate the toolbar to draw a point
				toolbar.activate(Draw.POINT);
			});				
		});	

		// Sets the symbol when a selection is made
		function setSelectionSymbol(featureLayer) {
			var symbol = new SimpleMarkerSymbol().setColor(new Color([255,255,0]));
				
			// Apply symbol	
			featureLayer.setSelectionSymbol(symbol);
		}
		
		// Get features from the Feature Layer
		function getFeatures(evt) {
			// Query the features on the map
			var query = new Query(),
				bufferSymbol = new SimpleFillSymbol(
		          SimpleFillSymbol.STYLE_NULL,
		          new SimpleLineSymbol(
		            SimpleLineSymbol.STYLE_SHORTDASHDOTDOT,
		            new Color([105, 105, 105]),
		            4
		          ), new Color([255, 255, 0, 0.25])
		        ),
		        locationSymbol = new SimpleMarkerSymbol(
					SimpleMarkerSymbol.STYLE_CROSS, 40,
					new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([105,105,105]), 2));
						
			query.where = "1=1"; // Get everything 
			query.geometry = new Circle({
				center: evt.geometry,
				radius: 50,
				radiusUnit: Units.MILES
			});
			
			// Show the buffer and marker on the map
			map.graphics.add(new Graphic(query.geometry, bufferSymbol));
			map.graphics.add(new Graphic(evt.geometry, locationSymbol));

			// Query the feature layer
			featureLayer.queryFeatures(query).then(function(results) {
				// Find nearest feature within the buffer
				findNearest(evt.geometry, results);
			}).otherwise(function(err) {
				console.log(err.message);
			}).always(function(){
				toolbar.deactivate(); 
				map.enableMapNavigation();				
=======
		// Create a feature layer
		featureLayer = new FeatureLayer(layerUrl, {
			mode: FeatureLayer.MODE_ONDEMAND,
			outFields: ["OBJECTID"]
		});
		
		// Get initial set of features once the layer has loaded
		// so we can work with feature in-memory
		map.on("layer-add-result", function(evt) {
			if (evt.layer === featureLayer) {
				// Update features when the extent changes
				map.on("extent-change", function() {
					getFeatures();
				});
							
				// Perform find nearest on mouse move event
				map.on("mouse-move", function(evt) {
					clearTimeout(trigger);
	
					trigger = setTimeout(function(){
						// Find nearest with a little delay so we 
						// don't overload the app
						findNearest(evt.mapPoint);
					}, 1);
				});
		
				// Get initial set of features
				getFeatures();
				
				// Set selection symbol
				setSelectionSymbol(featureLayer);
			}
		});

		// Add the feature layer
		map.addLayer(featureLayer);				

		// Add events to show map coordinates
		map.on("load", function(theMap) {
			map.on("mouse-move", showCoordinates);
			map.on("mouse-drag", showCoordinates);
		});

		/*
		map.on("click", function(evt) {
			// Perform find nearest on map click event
			findNearest(evt.mapPoint); // Un-comment to work on map click
		});
		*/
		
		// Sets the symbol when a selection is made
		function setSelectionSymbol(featureLayer) {
			var highlightLineSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,255,0]), 2),
				highlightMarkerSymbol = new SimpleMarkerSymbol().setColor(new Color([255,255,0])),
				highlightFillSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
					new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,255,0,0.9]), 2), new Color([255,255,0,0.5])),
				selectionSymbol;
			
			// Determine geometry type
			if (featureLayer.geometryType === "esriGeometryPoint") {
				selectionSymbol = highlightMarkerSymbol;
			} else if (featureLayer.geometryType === "esriGeometryPolygon") {
				selectionSymbol = highlightFillSymbol;
			} else if (featureLayer.geometryType === "esriGeometryPolyline")  {
				selectionSymbol = highlightLineSymbol;
			}
				
			// Apply symbol	
			featureLayer.setSelectionSymbol(selectionSymbol);
		}
		
		// Get features from the Feature Layer
		function getFeatures() {
			// Query the features on the map
			var query = new Query();
			query.where = "1=1"; // Get everything in the map extent
			query.geometry = map.extent;
			
			featureLayer.queryFeatures(query, function(results) {
				// Store the features
				featureCache = results;
			}, function(err) {
				console.log(err.message);
>>>>>>> origin/develop
			});
		}
		
		// Create task and execute
<<<<<<< HEAD
		function findNearest(point, featureSet) {					
			var task = new FindNearestTask({
				maxFeatures: 1 // Return nearest feature only
			}), params = {
				point: point,
				featureSet: featureSet
			};

			task.execute(params).then(function(results) {
				// Handle result
				var	query;

				if (results && results.length > 0) {
					// Show result information
					showInfo(results[0]);
					// Select the nearest feature	
					query = new Query();
					//query.geometry = result.nearestFeature.geometry;
					query.objectIds = [results[0].feature.attributes.objectid];
=======
		function findNearest(mapPoint) {					
			var task = new FindNearestTask({
				maxFeatures: 1
			}), params = {
				point: mapPoint,
				featureSet: featureCache
			};

			task.execute(params).then(function(result) {
				// Handle result
				var markerSymbol = new SimpleMarkerSymbol(
					SimpleMarkerSymbol.STYLE_CROSS, 30,
					new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([0,0,0]), 2)),
					query;
					
				// TODO: we don't want to clear all graphics only the one added before
				map.graphics.clear();

				if (result) {
					// Show result information
					showInfo(result);
					
					// Draw the nearest point			
					map.graphics.add(new Graphic(result.nearestPoint, markerSymbol));

					// Select the nearest feature	
					query = new Query();
					//query.geometry = result.nearestFeature.geometry;
					query.objectIds = [result.nearestFeature.attributes.objectid];
>>>>>>> origin/develop
					featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
				}
			}).otherwise(function(err) {
				console.error(err.message);
			});
		}
<<<<<<< HEAD

		function showInfo(result) {
			var np = result.point,
				nf = result.feature,
=======
		
		// Shows the map coordinates
		function showCoordinates(evt) {
			var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
			//var mp = evt.mapPoint;
			dom.byId("coords").innerHTML = number.round(mp.x, 3) + "," + number.round(mp.y, 3);
		}
		
		function showInfo(result) {
			var np = result.nearestPoint,
				nf = result.nearestFeature,
>>>>>>> origin/develop
				npInfo = "Nearest Point: " + number.round(np.x) + "," + number.round(np.y),
				nfInfo = "Nearest ObjectID: " + nf.attributes.objectid,
				distInfo = "Distance: " + number.round(result.distance, 1) + "m";
			
<<<<<<< HEAD
			domAttr.set("info", { innerHTML:  npInfo + "<br/>" + nfInfo + "<br/>" + distInfo });
=======
			dom.byId("info").innerHTML = npInfo + "<br/>" + nfInfo + "<br/>" + distInfo;
>>>>>>> origin/develop
		}
	}
);			