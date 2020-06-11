/* eslint-env node */
/* eslint-disable prefer-arrow-callback */
import {strictEqual, deepStrictEqual} from "assert";
import {it} from "mocha";
import * as sinon from "sinon";
import {Store, IStore} from "../src/Store";

type Props = Readonly<{
	value: string;
}>;

type State = Readonly<{
	count: number;
}>;

type AddMessage = {
	action: "add";
	delta: number;
};
type SubtractMessage = {
	action: "subtract";
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
function actionSubtract<State extends PartialState>(message: SubtractMessage, store: IStore<State, never>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {count: oldState.count - message.delta});
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


it("Sync Actions", /* @this */ async function (): Promise<void> {
	this.slow(5000);
	this.timeout(5000);

	const store = new Store<State, Props, AddMessage | SubtractMessage>();
	store.register("add", actionAdd);
	store.register("subtract", actionSubtract);
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
	deepStrictEqual(store.state, {count: 0}, "store.state after initial state");

	store.schedule({
		action: "add",
		delta: 1
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 2, "onprops after first @dd");
	strictEqual(spySchedule.callCount, 1, "schedule after first @dd");
	deepStrictEqual(store.props, {value: "Count is 1"}, "store.props after first @add");
	deepStrictEqual(store.state, {count: 1}, "store.state after first @add");

	store.schedule({
		action: "add",
		delta: 10
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 3, "onprops after second @dd");
	strictEqual(spySchedule.callCount, 2, "schedule after second @dd");
	deepStrictEqual(store.props, {value: "Count is 11"}, "store.props after second @add");
	deepStrictEqual(store.state, {count: 11}, "store.state after second @add");

	store.schedule({
		action: "add",
		delta: 0
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 3, "onprops after third @dd");
	strictEqual(spySchedule.callCount, 3, "schedule after third @dd");
	deepStrictEqual(store.props, {value: "Count is 11"}, "store.props after third @add");
	deepStrictEqual(store.state, {count: 11}, "store.state after third @add");

	store.schedule({
		action: "add",
		delta: 200
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 4, "onprops after fourth @dd");
	strictEqual(spySchedule.callCount, 4, "schedule after fourth @dd");
	deepStrictEqual(store.props, {value: "Count is 211"}, "store.props after fourth @add");
	deepStrictEqual(store.state, {count: 211}, "store.state after fourth @add");

	const calls = spyOnProps.getCalls().map((call) => call.args);
	deepStrictEqual(calls, [
		[{value: "Count is 0"}],
		[{value: "Count is 1"}],
		[{value: "Count is 11"}],
		[{value: "Count is 211"}]
	]);
});
