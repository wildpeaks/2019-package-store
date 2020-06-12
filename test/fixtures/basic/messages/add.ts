export const id = "add";

export type Message = Readonly<{
	action: "add";
	toAdd: number;
}>;

export function format(blabla: number): Message {
	return {
		action: id,
		toAdd: blabla
	};
}
