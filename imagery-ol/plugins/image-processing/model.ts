
export interface ImageManualProcessArgs {
	Brightness?: number;
	Contrast?: number;
	Gamma?: number;
	Saturation?: number;
	Sharpness?: number;
}

export interface IImageProcessingData {
	isAutoImageProcessingActive?: boolean;
	imageManualProcessArgs?: ImageManualProcessArgs;
}

export interface IImageProcParam {
	name: string,
	defaultValue: number,
	min: number,
	max: number
}
