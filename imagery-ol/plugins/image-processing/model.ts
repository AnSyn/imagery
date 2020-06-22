import { cloneDeep } from 'lodash';

export interface IImageManualProcessArgs {
	Brightness?: number;
	Contrast?: number;
	Gamma?: number;
	Saturation?: number;
	Sharpness?: number;
}

export interface IImageProcessingData {
	isAutoImageProcessingActive?: boolean;
	imageManualProcessArgs?: IImageManualProcessArgs;
}

export interface IImageProcParam {
	name: string,
	defaultValue: number,
	min: number,
	max: number
}

const defaultImageProcParams: IImageProcParam[] = [
	{
		'name': 'Sharpness',
		'defaultValue': 0,
		'min': 0,
		'max': 100
	},
	{
		'name': 'Contrast',
		'defaultValue': 0,
		'min': -100,
		'max': 100
	},
	{
		'name': 'Brightness',
		'defaultValue': 0,
		'min': -100,
		'max': 100
	},
	{
		'name': 'Gamma',
		'defaultValue': 100,
		'min': 1,
		'max': 200
	},
	{
		'name': 'Saturation',
		'defaultValue': 100,
		'min': 1,
		'max': 100
	}
];

export function getDefaultImageProcParams(): IImageProcParam[] {
	return cloneDeep(defaultImageProcParams);
}
