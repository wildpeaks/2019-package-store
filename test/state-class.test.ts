/* eslint-env node */
/* eslint-disable prefer-arrow-callback */
import {strictEqual, deepStrictEqual} from "assert";
import {it} from "mocha";
import * as sinon from "sinon";
import {Store, IStore} from "../src/Store";

type Props = Readonly<{
	readonly value: string;
}>;

class StateClass {
	public mynumber: number = 0;
	public mystring: string = "hello";
	public constructor(fromState?: StateClass) {
		if (fromState) {
			this.mynumber = fromState.mynumber;
			this.mystring = fromState.mystring;
		}
	}
	public increase(delta: number = 1): void {
		this.mynumber += delta;
	}
	public hello(): void {
		this.mystring = "hello";
	}
}

type AddMessage = {
	action: "add";
	delta: number;
};

// It has to reference the actual class instead of a partial when using a State class
function actionAdd(message: AddMessage, store: IStore<StateClass, never>): void {
	const newState = new StateClass(store.state);
	newState.increase(message.delta);
	store.state = newState;
}

function sleep(delay: number = 1): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
}

it("State Class", /* @this */ async function (): Promise<void> {
	this.slow(2000);
	this.timeout(2000);

	const store = new Store<StateClass, Props, AddMessage>();
	store.register("add", actionAdd);
	store.serialize = (state) => {
		const props: Props = {
			value: `Number is ${state.mynumber}, String is ${state.mystring}`
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

	const initialState = new StateClass();
	initialState.hello();
	store.state = initialState;
	await sleep();
	strictEqual(spyOnProps.callCount, 1, "onprops after initial state");
	strictEqual(spySchedule.callCount, 0, "schedule after initial state");
	deepStrictEqual(store.props, {value: "Number is 0, String is hello"}, "store.props after initial state");
	strictEqual(typeof store.state, "object", "state is an Object after initial state");
	strictEqual(store.state.mynumber, 0, "store.state.mynumber after initial state");
	strictEqual(store.state.mystring, "hello", "store.state.mystring after initial state");

	store.schedule({
		action: "add",
		delta: 1
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 2, "onprops after @add");
	strictEqual(spySchedule.callCount, 1, "schedule after @add");
	deepStrictEqual(store.props, {value: "Number is 1, String is hello"}, "store.props after @add");
	strictEqual(typeof store.state, "object", "state is an Object after @add");
	strictEqual(store.state.mynumber, 1, "store.state.mynumber is an Object after @add");
	strictEqual(store.state.mystring, "hello", "store.state.mystring is an Object after @add");

	const calls = spyOnProps.getCalls().map((call) => call.args);
	deepStrictEqual(calls, [
		[{value: "Number is 0, String is hello"}],
		[{value: "Number is 1, String is hello"}]
	]);
});
