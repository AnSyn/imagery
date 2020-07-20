import { Color, PolylineDashMaterialProperty, ColorMaterialProperty } from 'cesium';
import { IVisualizerStateStyle } from '@ansyn/imagery';

type HexaColor = string;
type RgbaColor = string;

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

function getColor(colorStr: HexaColor | RgbaColor, opacity?: number): Color {
    const color = Color.fromCssColorString(colorStr);
    color.alpha = opacity ?? color.alpha;
    return color;
}
