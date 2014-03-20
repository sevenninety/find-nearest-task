define([
	"dojo/dom",
	"dojo/dom-attr",
	"dojo/number",
	"dojo/_base/Color",
	"dojo/on",

	"esri/map",
	"esri/layers/FeatureLayer",
	"esri/graphic",
	"esri/symbols/SimpleLineSymbol",
	"esri/symbols/SimpleMarkerSymbol",
	"esri/symbols/SimpleFillSymbol",
	"esri/geometry/Circle",
	"esri/tasks/query",
	"esri/tasks/QueryTask",
	"esri/units", 
	"esri/toolbars/draw", 

	"app/tasks/FindNearestTask",

	"dojo/domReady!"],
	function(
		dom, domAttr, number, Color, on,
		Map, FeatureLayer, Graphic, SimpleLineSymbol, SimpleMarkerSymbol, SimpleFillSymbol,
		Circle, Query, QueryTask, Units, Draw,
		FindNearestTask) {
		"use strict";

		// Declare variables
		var	featureLayer, map, toolbar;
		
		// Create the map
		map = new Map("map-canvas", {
			basemap: "national-geographic",
			center: [-119.511, 35.473],
			zoom: 8
		});
		
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
			});
		}
		
		// Create task and execute
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
					featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
				}
			}).otherwise(function(err) {
				console.error(err.message);
			});
		}

		function showInfo(result) {
			var np = result.point,
				nf = result.feature,
				npInfo = "Nearest Point: " + number.round(np.x) + "," + number.round(np.y),
				nfInfo = "Nearest ObjectID: " + nf.attributes.objectid,
				distInfo = "Distance: " + number.round(result.distance, 1) + "m";
			
			domAttr.set("info", { innerHTML:  npInfo + "<br/>" + nfInfo + "<br/>" + distInfo });
		}
	}
);			