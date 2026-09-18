export type UploadedBrandingIcon = File & {
	arrayBuffer(): Promise<ArrayBuffer>;
};
