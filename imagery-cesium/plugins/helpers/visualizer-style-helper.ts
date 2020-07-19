import { Color, PolylineDashMaterialProperty, ColorMaterialProperty } from "cesium";
import { IVisualizerStateStyle } from '@ansyn/imagery';

export function getStrokeWidth(style: IVisualizerStateStyle) {
    return style.initial['stroke-width'] || 3;
}

export function getFillColor(style: IVisualizerStateStyle): Color {
    const fill: string = style.initial['fill'];
    const fillOpacity: number = style.initial['fill-opacity'];
    return getColor(fill, fillOpacity);
}

export function getStrokeColor(style: IVisualizerStateStyle): Color {
    const stroke: string = style.initial['stroke'];
    const strokeOpacity: number = style.initial['stroke-opacity'];
    return getColor(stroke, strokeOpacity);
}

export function getShowOutline(style: IVisualizerStateStyle): boolean {
    return style.initial['stroke-opacity'] !== 0;
}

export function getLineMaterial(style: IVisualizerStateStyle): PolylineDashMaterialProperty | ColorMaterialProperty {
    const color = getStrokeColor(style);
    const dashLength: number = style.initial['stroke-dasharray'];
    if (dashLength > 0) {
        return new PolylineDashMaterialProperty({ color, dashLength });
    } else {
        return new ColorMaterialProperty(color);
    }
}

// TODO => take care of all kinds of color inputs (for ex: '#fff', '#fa34b2', 'rgba(124, 52, 201, 0.85)')
function getColor(rgbaColor: string, opacity?: number): Color {
    const rrggbbaaMatcher = /^#([0-9a-f]{8})$/i;
    const matches = rrggbbaaMatcher.exec(rgbaColor);

    const alpha = parseInt(rgbaColor.substring(7), 16) / 255;
    const rootColor = matches === null ? rgbaColor : rgbaColor.substring(0, 7);

    const color = Color.fromCssColorString(rootColor);
    color.alpha = opacity ?? (alpha !== NaN ? alpha : 1);

    return color;
}
