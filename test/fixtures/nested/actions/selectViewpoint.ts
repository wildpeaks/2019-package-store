import {IStore} from "../../../..";

export const actionId = "SELECT VIEWPOINT";
export type Message = Readonly<{
	action: "SELECT VIEWPOINT";
	id: string;
}>;

export type PartialState = {
	selected: string;
};

export function action<State extends PartialState>(message: Message, store: IStore<State, never>): void {
	const newState = Object.assign({}, store.state, {selected: message.id});
	Object.freeze(newState);
	store.state = newState;
}
