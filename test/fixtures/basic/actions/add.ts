/**
 * @file An action that can emit additional "log" actions
 */
/* eslint-env shared-node-browser */
import {IStore} from "../../../..";
import {Message as AddMessage} from "../messages/add";
import {Message as LogMessage, format as log} from "../messages/log";


export type PartialState = {
	count: number;
};

export function action<State extends PartialState>(message: AddMessage, store: IStore<State, LogMessage>): void {
	const oldState = store.state;
	const text = `COUNT ${oldState.count} + ${message.toAdd}`;
	const newState = Object.assign({}, oldState, {count: oldState.count + message.toAdd});
	Object.freeze(newState);
	store.state = newState;

	store.schedule(
		log(`[immediately after] ${text}`)
	);
	setTimeout(() => {
		store.schedule(
			log(`[250ms after] ${text}`)
		);
	}, 250);
}
