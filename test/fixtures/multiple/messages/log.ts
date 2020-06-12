export const messageId = "log";

export type Message = Readonly<{
	action: "log";
	text: string;
}>;

export function format(blabla: string): Message {
	return {
		action: messageId,
		text: blabla
	};
}
