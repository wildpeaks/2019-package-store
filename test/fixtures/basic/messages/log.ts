export const id = "log";

export type Message = Readonly<{
	action: "log";
	text: string;
}>;

export function format(blabla: string): Message {
	return {
		action: id,
		text: blabla
	};
}
