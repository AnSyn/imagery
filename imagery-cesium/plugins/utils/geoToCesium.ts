declare const Cesium: any;


export function coordinatesToCartesian(coordinates) {
	return Cesium.Cartesian3.fromDegrees(coordinates[0], coordinates[1], coordinates[2]);
}

export function coordinatesArrayToCartesian(coordinates) {
	const result = [];
	for (let i = 0; i < coordinates.length; i++) {
		result.push(coordinatesToCartesian(coordinates[i]));
	}
	return result;
}

export function multiLineToCartesian(coordinates) {
	const result = [];
	for (let i = 0; i < coordinates.length; i++) {
		result.push(coordinatesToCartesian(coordinates[i]));
	}
	return result;
}

export function polygonCoordinatesToCartesian(coordinates) {
	return coordinatesArrayToCartesian(coordinates);
}

export function multiPolygonCoordinatesToCartesian(coordinates) {
	const result = [];
	for (let i = 0; i < coordinates.length; i++) {
		result.push(coordinatesArrayToCartesian(coordinates[i][0]));
	}
	return result;
}
