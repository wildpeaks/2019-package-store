export const id = "add";

export type Message = Readonly<{
	action: "add";
	toAdd: number;
}>;
