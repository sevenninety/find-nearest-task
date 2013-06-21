define([
	"dojo/parser",
	"dojo/dom", 
	"dojo/number", 
    "esri/map", 
    "esri/layers/FeatureLayer",
    "esri/geometry/webMercatorUtils",
    "esri/tasks/query", 
    "esri/tasks/QueryTask",
    "custom/tasks/FindNearestParameters", 
    "custom/tasks/FindNearestTask",
    "dijit/layout/BorderContainer", 
    "dijit/layout/ContentPane", 
    "dojo/domReady!"], 
    function(parser, dom, number, Map, FeatureLayer, webMercatorUtils, Query, QueryTask, FindNearestParameters, FindNearestTask) {
    	var app = {
    		// The feature layer to query
			layerUrl: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer/2",
			// Feature layer to work with
			featureLayer: null, 
			// Cached featureSet
			featureCache: null 
		};
		
		// Parse layout dijits explicitly
		parser.parse();
		
		// Create the map
		app.map = new Map("map", {
			basemap: "national-geographic",
			center: [-119.511, 35.473], 
          	zoom: 8
        });
        
        // Create a feature layer
        app.featureLayer = new FeatureLayer(app.layerUrl, {
			mode: FeatureLayer.MODE_ONDEMAND,
			outFields: ["objectid"]
		});
		
		// Get initial set of features once the layer has loaded
		// so we can work with feature in-memory
		app.map.on("layer-add-result", function(evt) {
			if (evt.layer === app.featureLayer) {						
				// Update features when the extent changes
				app.map.on("extent-change", function(evt) {
					getFeatures();
				});				
							
				// Perform find nearest on mouse move event
				app.map.on("mouse-move", function(evt) {
			 		clearTimeout(app.trigger);
	
			 		app.trigger = setTimeout(function(){
			 			// Find nearest with a little delay so we 
			 			// don't overload the app
			 			findNearest(evt.mapPoint);
			 		}, 1);
			 	});
		
				// Get initial set of features
				getFeatures();
				
				// Set selection symbol
				setSelectionSymbol(app.featureLayer);
			}
		});

		// Add the feature layer
		app.map.addLayer(app.featureLayer);						

		// Add events to show map coordinates
		app.map.on("load", function(theMap) {
			app.map.on("mouse-move", showCoordinates);
			app.map.on("mouse-drag", showCoordinates);
		});

		app.map.on("click", function(evt) {
			// Perform find nearest on map click event
			//findNearest(evt.mapPoint); // Un-comment to work on map click
		});
		
		// Sets the symbol when a selection is made
		function setSelectionSymbol(featureLayer) {
			var highlightLineSymbol = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,255,0]), 2),
				highlightMarkerSymbol = new esri.symbol.SimpleMarkerSymbol().setColor(new dojo.Color([255,255,0])),
				highlightFillSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
					new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, new dojo.Color([255,255,0,0.9]), 2), new dojo.Color([255,255,0,0.5])),
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
			query.geometry = app.map.extent;
			
			app.featureLayer.queryFeatures(query, function(results) {
				// Store the features
				app.featureCache = results;
			}, function(err) {
				console.log(err.message);
			});
		}
		
		// Create task and execute
		function findNearest(mapPoint) {					
			var params = new FindNearestParameters(), 						
				map = app.map;
				task = new FindNearestTask(map);

			// Set parms
			params.point = mapPoint;
			params.featureSet = app.featureCache;

			task.execute(params, function(result) {
				// Handle result
				var markerSymbol = new esri.symbol.SimpleMarkerSymbol(
					esri.symbol.SimpleMarkerSymbol.STYLE_CROSS, 30, 
					new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_DASH, new dojo.Color([0,0,0]), 2)),							
					query;

				// TODO: we don't want to delete all graphics
				map.graphics.clear();

				if (result) {			
					// Draw the click point				
					map.graphics.add(new esri.Graphic(mapPoint, markerSymbol));

					// Select the nearest feature	
					query = new Query();
					//query.geometry = result.nearestFeature.geometry;
					query.objectIds = [result.nearestFeature.attributes.objectid];
					app.featureLayer.selectFeatures(query, FeatureLayer.SELECTION_NEW);
				}
			}, function(err) {
				console.error(err.message);
			});
		}
		
		// Shows the map coordinates
		function showCoordinates(evt) {
			var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
			//var mp = evt.mapPoint;
			dom.byId("info").innerHTML = number.round(mp.x, 3) + ", " + number.round(mp.y, 3);
		}
	}
);			