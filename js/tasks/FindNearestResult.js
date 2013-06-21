define([
	"dojo/_base/declare"], 
	function(declare) {
	return declare(null, {
		constructor : function(point, feature, distance) {	
			this.nearestPoint = point;
			this.nearestFeature = feature;
			this.distance = distance;	
		}
	});
}); 