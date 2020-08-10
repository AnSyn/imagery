import { Color, PolylineDashMaterialProperty, ColorMaterialProperty, PolylineArrowMaterialProperty } from 'cesium';
import { IVisualizerStateStyle, MarkerSize } from '@ansyn/imagery';
import { AnnotationMode } from '../../models/annotation-mode.enum';

type HexaColor = string;
type RgbaColor = string;

export function getStrokeWidth(style: Partial<IVisualizerStateStyle>): number {
    return style?.initial?.['stroke-width'] || 3;
}

export function getFillColor(style: Partial<IVisualizerStateStyle>): Color {
    const fill: string = style?.initial?.['fill'];
    const fillOpacity: number = style?.initial?.['fill-opacity'];
    return getColor(fill, fillOpacity);
}

export function getShowFill(style: Partial<IVisualizerStateStyle>): boolean {
    const fillOpacity: number = style?.initial?.['fill-opacity'];
    return fillOpacity !== 0;
}

export function getStrokeColor(style: Partial<IVisualizerStateStyle>): Color {
    const stroke: string = style?.initial?.['stroke'];
    const strokeOpacity: number = style?.initial?.['stroke-opacity'];
    return getColor(stroke, strokeOpacity);
}

export function getShowOutline(style: Partial<IVisualizerStateStyle>): boolean {
    return style?.initial?.['stroke-opacity'] !== 0;
}

export function getLineMaterial(style: Partial<IVisualizerStateStyle>, mode?: AnnotationMode): PolylineArrowMaterialProperty | PolylineDashMaterialProperty | ColorMaterialProperty {
    const color = getStrokeColor(style);
    if (!!mode && mode === AnnotationMode.Arrow) {
        return new PolylineArrowMaterialProperty(color);
    } else {
        const dashLength: number = style?.initial?.['stroke-dasharray'];
        return dashLength > 0
            ? new PolylineDashMaterialProperty({ color, dashLength })
            : new ColorMaterialProperty(color);
    }
}

export function getMarkerColor(style: Partial<IVisualizerStateStyle>): Color {
    const markerColor = style?.initial?.['marker-color'];
    return getColor(markerColor);
}

export function getMarkerSize(style: Partial<IVisualizerStateStyle>): number {
    const markerSize: MarkerSize = style?.initial?.['marker-size'];
    switch (markerSize) {
        case MarkerSize.small:
            return 8;
        case MarkerSize.medium:
            return 12;
        case MarkerSize.large:
            return 20;
        default:
            return 1;
    }
}

export function getColor(colorStr: HexaColor | RgbaColor, opacity?: number): Color {
    const color = Color.fromCssColorString(colorStr);
    if (color) {
        color.alpha = opacity ?? color.alpha;
    }
    return color;
}
