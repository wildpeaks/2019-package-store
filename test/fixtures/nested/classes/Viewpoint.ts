export type ViewpointJson = {
	position: string;
};

export class Viewpoint {
	public position: string;
	public constructor(position: string = "0 0 0") {
		this.position = position;
	}
	public toJson(): ViewpointJson {
		return {
			position: this.position
		};
	}
}
