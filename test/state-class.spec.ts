/* eslint-env node, jasmine */
/// <reference types="jasmine" />
import {Store, IStore} from "..";

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
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
}

it("State as Class", async () => {
	const store = new Store<StateClass, Props, AddMessage>();
	store.register("add", actionAdd);
	store.serialize = state => {
		const props: Props = {
			value: `Number is ${state.mynumber}, String is ${state.mystring}`
		};
		Object.freeze(props);
		return props;
	};
	expect(typeof store.props).toBe("undefined", "props initially");
	expect(typeof store.state).toBe("undefined", "state initially");

	const spyOnProps = jasmine.createSpy();
	store.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, "onprops initially");

	const spySchedule = spyOn(store, "schedule").and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, "schedule initially");

	const initialState = new StateClass();
	initialState.hello();
	store.state = initialState;
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(1, "onprops after initial state");
	expect(spySchedule.calls.count()).toEqual(0, "schedule after initial state");
	expect(store.props).toEqual({value: "Number is 0, String is hello"});
	expect(typeof store.state).toBe("object", "state is an Object after initial state");
	expect(store.state.mynumber).toBe(0);
	expect(store.state.mystring).toBe("hello");

	store.schedule({
		action: "add",
		delta: 1
	});
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(2, "onprops after @add");
	expect(spySchedule.calls.count()).toEqual(1, "schedule after @add");
	expect(store.props).toEqual({value: "Number is 1, String is hello"});
	expect(typeof store.state).toBe("object", "state is an Object after @add");
	expect(store.state.mynumber).toBe(1);
	expect(store.state.mystring).toBe("hello");

	const calls = spyOnProps.calls.all();
	expect(calls[0].args).toEqual([{value: "Number is 0, String is hello"}]);
	expect(calls[1].args).toEqual([{value: "Number is 1, String is hello"}]);
});
