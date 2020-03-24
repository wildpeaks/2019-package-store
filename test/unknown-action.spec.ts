/* eslint-env node, jasmine */
/// <reference types="jasmine" />
import {Store, IStore} from "..";

type Props = Readonly<{
	dummy: string;
}>;

type State = Readonly<{
	dummy: string;
}>;

type GoodMessage = {
	action: "good";
};
type BadMessage = {
	action: "bad";
};

function actionGood<State>(_message: GoodMessage, _store: IStore<State, never>): void {
	// nothing to do
}

it("Undefined Action", () => {
	const store = new Store<State, Props, GoodMessage | BadMessage>();
	store.register("good", actionGood);
	store.serialize = (_state) => {
		const props: Props = {
			dummy: "hello"
		};
		Object.freeze(props);
		return props;
	};
	expect(typeof store.state).toBe("undefined", "state initially");
	expect(typeof store.props).toBe("undefined", "props initially");

	let throws1 = false;
	try {
		store.schedule({
			action: "good"
		});
	} catch (e) {
		throws1 = true;
	}
	expect(throws1).toBe(false, `@good doesn't throw`);

	let throws2 = false;
	try {
		store.schedule({
			action: "bad"
		});
	} catch (e) {
		throws2 = true;
	}
	expect(throws2).toBe(true, `@bad throws`);
});
