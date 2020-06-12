export const messageId = "add";

export type Message = Readonly<{
	action: "add";
	toAdd: number;
}>;
