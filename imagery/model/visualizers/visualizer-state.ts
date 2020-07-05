import { IVisualizerStyle, MarkerSize } from './visualizer-style';

export interface IVisualizerStateStyle {
	opacity: number;
	colors?: {
		active: string,
		inactive: string,
		display: string,
		favorite: string
	},
	initial?: IVisualizerStyle;
	hover?: Partial<IVisualizerStyle>;
	minSimplifyVertexCountLimit?: number;
	entities?: {
		[key: string]: Partial<IVisualizerStyle>;
	};
	extra?: any;
}

export enum VisualizerStates {
	INITIAL = 'initial',
	HOVER = 'hover',
	ENTITIES = 'entities'
}

export const ANNOTATIONS_INITIAL_STYLE: IVisualizerStyle = {
	stroke: '#27b2cfe6',
	'stroke-width': 1,
	fill: `white`,
	'fill-opacity': 0.4,
	'stroke-opacity': 1,
	'marker-size': MarkerSize.medium,
	'marker-color': `#ffffff`,
}
