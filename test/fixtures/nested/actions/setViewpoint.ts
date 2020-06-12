import {IStore} from "../../../..";
import {Viewpoint} from "../classes/Viewpoint";

export const actionId = "SET VIEWPOINT";
export type Message = Readonly<{
	action: "SET VIEWPOINT";
	key: string;
	value: Viewpoint;
}>;

export function action<State>(message: Message, store: IStore<State, never>): void {
	const newItems: any = {};
	newItems[message.key] = message.value;
	const newState = Object.assign({}, store.state, newItems);
	Object.freeze(newState);
	store.state = newState;
}
