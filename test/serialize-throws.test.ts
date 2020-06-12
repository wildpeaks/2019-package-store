/* eslint-env node */
/* eslint-disable prefer-arrow-callback */
import {strictEqual} from "assert";
import {it} from "mocha";
import * as sinon from "sinon";
import {Store, IStore} from "../src/Store";

type Props = Readonly<{
	readonly value: string;
}>;

type State = Readonly<{
	count: number;
}>;

type AddMessage = {
	action: "add";
	delta: number;
};

type PartialState = {
	count: number;
};

function actionAdd<State extends PartialState>(message: AddMessage, store: IStore<State, never>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {count: oldState.count + message.delta});
	Object.freeze(newState);
	store.state = newState;
}

function sleep(delay: number = 1): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
}

it("State as Class", /* @this */ async function (): Promise<void> {
	this.slow(2000);
	this.timeout(2000);

	const store = new Store<State, Props, AddMessage>();
	store.register("add", actionAdd);
	store.serialize = (_state) => {
		throw new Error("Expected Error");
	};
	strictEqual(typeof store.props, "undefined", "props initially");
	strictEqual(typeof store.state, "undefined", "state initially");

	const spyOnProps = sinon.fake();
	store.onprops = spyOnProps;
	strictEqual(spyOnProps.callCount, 0, "onprops initially");

	const spySchedule = sinon.spy(store, "schedule");
	strictEqual(spySchedule.callCount, 0, "schedule initially");

	let throws = false;
	try {
		store.state = {
			count: 0
		};
	} catch (e) {
		throws = true;
	}
	await sleep();
	strictEqual(throws, true, "initial state throws an Error");
	strictEqual(spyOnProps.callCount, 0, "onprops after initial state");
	strictEqual(spySchedule.callCount, 0, "schedule after initial state");
	strictEqual(typeof store.props, "undefined", "props after initial state");
	strictEqual(typeof store.state, "undefined", "state after initial state");
});
