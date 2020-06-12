/**
 * @file An action that can emit additional "log" actions
 */
import {IStore} from "../../../..";
import {Message as AddMessage} from "../messages/add";

export type PartialState = {
	count: number;
};

export function action<State extends PartialState>(message: AddMessage, store: IStore<State, never>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {count: oldState.count + message.toAdd});
	Object.freeze(newState);
	store.state = newState;
}
