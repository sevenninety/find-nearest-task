// http://dojotoolkit.org/documentation/tutorials/1.7/declare/
define([
	"dojo/_base/declare", 
	"dojo/_base/lang", 
	"dojo/_base/array", 
	"custom/tasks/FindNearestResult",
	"esri/geometry/Point",
	"esri/geometry/mathUtils"], 
	function(declare, lang, array, FindNearestResult, Point, mathUtils) {
	return declare(null, {
		_map : null,

		constructor : function(map, options) {
			this._map = map;
		},

		execute : function(params, callback, errback) {
			try {
				var result = this._getNearestResult(params.point, params.featureSet);
				// Return result
				callback(result);
			} catch (err) {
				errback(err);
			}
		},

		_getNearestResult : function(point, featureSet) {
			var features = featureSet.features, 
				distance = this._map.cs === "Web Mercator" ? this._greatCircleDistance : this._euclidianDistance, 				
				candidates = [],
				geometry,
				result, 
				filtered;

			// Supported in 10.1 or greater
			if (featureSet.exceededTransferLimit && featureSet.exceededTransferLimit === true) {
				console.warn("Feature limit reached, the result may not be accurate.");
			}

			// Calculate distance for each feature
			if (featureSet.geometryType === "esriGeometryPoint") {
				array.forEach(features, function(feature) {
					candidates.push(new FindNearestResult(feature, feature, distance(point, feature.geometry)));
				});
				
				result = this._getMin(candidates);
			} else if (featureSet.geometryType === "esriGeometryPolygon") {
				array.forEach(features, function(feature) {
					geometry = feature.geometry;
					array.forEach(geometry.rings, function(ring, ringIndex) {
						var candidate = this._getNearest(point, feature, ring);
						candidate.contains = geometry.contains(point);
						candidates.push(candidate);
					}, this);
				}, this);
				
				// Get a list of candidates found inside the polygon as
				// this subset will be the nearest
				filtered = array.filter(candidates, function(item){
    				return item.contains === true;
				});

				if (filtered.length > 0) {
					result = this._getMin(filtered);
				} else {
					result = this._getMin(candidates);
				}				
			} else if (featureSet.geometryType === "esriGeometryPolyline") {
				array.forEach(features, function(feature) {
					geometry = feature.geometry;
					array.forEach(geometry.paths, function(path, pathIndex) {
						candidates.push(this._getNearest(point, feature, path));
					}, this);
				}, this);

				result = this._getMin(candidates);
			} else if (featureSet.geometryType === "esriGeometryMultipoint") {
				// TODO
				result = null;
			}

			return result;
		},

		_getMin : function(features) {
			var comparator = this._comparator;

			// Sort the features
			features.sort(comparator);

			// return the first feature (minimum distance)
			return features[0];
		},
		
		_getNearest: function (/*esri/geometry/Point*/point, /*esri/geometry/Geometry*/parentFeature, /*Number[]*/path) {
	        var minDistance = null, from, to, x, y, dx, dy, i, a, b, distance, n, len,
	            pathPoints, fromPoint, toPoint, length2, toEnd2, toStart2, distance2, calcLength2, result;
	
	        function square(num) {
	            // Faster than Math.pow to square a number
	            return num * num;
	        }
	
	        // Convert path to pathPoints
	        pathPoints = array.map(path, function (item) {
	            return { "x": item[0], "y": item[1] };
	        });
	        
	        if (pathPoints.length > 1) {
	            for (n = 1, len = pathPoints.length; n < len; n++) {
	                // Get segment from points
	                fromPoint = pathPoints[n - 1];
	                toPoint = pathPoints[n];
	
	                if (toPoint.x !== fromPoint.x) {
	                    a = (toPoint.y - fromPoint.y) / (toPoint.x - fromPoint.x);
	                    b = toPoint.y - a * toPoint.x;
	                    distance = Math.abs(a * point.x + b - point.y) / Math.sqrt(a * a + 1);
	                } else {
	                    distance = Math.abs(point.x - toPoint.x);
	                }
	
	                // Length squared of the line segment 
	                length2 = square(toPoint.y - fromPoint.y) + square(toPoint.x - fromPoint.x);
	                // Distance squared of point to the start of the line segment
	                toStart2 = square(fromPoint.y - point.y) + square(fromPoint.x - point.x);
	                // Distance squared of point to end of the line segment
	                toEnd2 = square(toPoint.y - point.y) + square(toPoint.x - point.x);
	                // Minimum distance squared of the point to the infinite line
	                distance2 = square(distance);
	                // Calculated length squared of the line segment
	                calcLength2 = toEnd2 - distance2 + toStart2 - distance2;
	
	                // Redefine minimum distance to line segment (not infinite line) if necessary
	                if (calcLength2 > length2) {
	                    distance = Math.sqrt(Math.min(toEnd2, toStart2));
	                }
	
	                if ((minDistance === null) || (minDistance > distance)) {
	                    if (calcLength2 > length2) {
	                        if (toStart2 < toEnd2) {
	                            to = 0; // Nearer to previous point
	                            from = 1;
	                        } else {
	                            from = 0; // Nearer to current point
	                            to = 1;
	                        }
	                    } else {
	                        // perpendicular from point intersects line segment
	                        to = ((Math.sqrt(toStart2 - distance2)) / Math.sqrt(length2));
	                        from = ((Math.sqrt(toEnd2 - distance2)) / Math.sqrt(length2));
	                    }
	
	                    minDistance = distance;
	                    i = n;
	                }
	            }
	
	            // Calculate coordinates
	            dx = pathPoints[i - 1].x - pathPoints[i].x;
	            dy = pathPoints[i - 1].y - pathPoints[i].y;
	            x = pathPoints[i - 1].x - (dx * to);
	            y = pathPoints[i - 1].y - (dy * to);
	        }

	        // Return feature
	        return new FindNearestResult(new Point(x, y, point.spatialReference), parentFeature, minDistance);
	    },

		_euclidianDistance : function(p1, p2) {
			return mathUtils.getLength(p1, p2);
		},

		_greatCircleDistance : function(p1, p2) {
			// Haversine formula (http://www.movable-type.co.uk/scripts/latlong.html)
			var toRad = this._toRad, 
				radius = 6371, // Earth's mean radius in km
				lat1 = toRad(p1.y), 
				lon1 = toRad(p1.x), 
				lat2 = toRad(p2.y), 
				lon2 = toRad(p2.x), 
				dLat = lat2 - lat1, 
				dLon = lon2 - lon1, 
				a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2), 
				c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

			return radius * c;
			// Length in km
		},

		_toRad : function(number) {
			return mathUtils.degToRad(number);
		},

		_comparator : function(a, b) {
			if (a.distance < b.distance) {
				return -1;
			}

			if (a.distance > b.distance) {
				return 1;
			}

			return 0;
		}
	});
});
