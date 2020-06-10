/* eslint-env node */
/* eslint-disable prefer-arrow-callback */
import {strictEqual, deepStrictEqual} from "assert";
import {it} from "mocha";
import {Store, IStore} from "../src/Store";
import * as sinon from "sinon";

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
	const store = new Store<State, Props, AddMessage>();
	store.register("add", actionAdd);
	store.serialize = (state) => {
		const props: Props = {
			value: `Count is ${state.count}`
		};
		Object.freeze(props);
		return props;
	};
	strictEqual(typeof store.props, "undefined", "props initially");
	strictEqual(typeof store.state, "undefined", "state initially");

	const spyOnProps = sinon.fake();
	store.onprops = spyOnProps;
	strictEqual(spyOnProps.callCount, 0, "onprops initially");

	const spySchedule = sinon.spy(store, "schedule");
	strictEqual(spySchedule.callCount, 0, "schedule initially");

	store.state = {
		count: 0
	};
	await sleep();
	strictEqual(spyOnProps.callCount, 1, "onprops after initial state");
	strictEqual(spySchedule.callCount, 0, "schedule after initial state");
	deepStrictEqual(store.props, {value: "Count is 0"}, "store.props after initial state");
	strictEqual(typeof store.state, "object", "state is an Object after initial state");
	strictEqual(store.state.count, 0, "store.state.count after initial state");

	store.schedule({
		action: "add",
		delta: 1
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 2, "onprops after @add");
	strictEqual(spySchedule.callCount, 1, "schedule after @add");
	deepStrictEqual(store.props, {value: "Count is 1"}, "store.props after @add");
	strictEqual(typeof store.state, "object", "state is an Object after @add");
	strictEqual(store.state.count, 1, "store.state.count after @add");

	const calls = spyOnProps.getCalls().map((call) => call.args);
	deepStrictEqual(calls, [
		[{value: "Count is 0"}],
		[{value: "Count is 1"}]
	]);
});
