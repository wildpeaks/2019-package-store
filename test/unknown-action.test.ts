/* eslint-env node */
/* eslint-disable prefer-arrow-callback */
import {strictEqual} from "assert";
import {it} from "mocha";
import {Store, IStore} from "../src/Store";

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

it("Undefined Action", /* @this */ function (): void {
	const store = new Store<State, Props, GoodMessage | BadMessage>();
	store.register("good", actionGood);
	store.serialize = (_state) => {
		const props: Props = {
			dummy: "hello"
		};
		Object.freeze(props);
		return props;
	};
	strictEqual(typeof store.state, "undefined", "state initially");
	strictEqual(typeof store.props, "undefined", "props initially");

	let throws1 = false;
	try {
		store.schedule({
			action: "good"
		});
	} catch (e) {
		throws1 = true;
	}
	strictEqual(throws1, false, `@good doesn't throw`);

	let throws2 = false;
	try {
		store.schedule({
			action: "bad"
		});
	} catch (e) {
		throws2 = true;
	}
	strictEqual(throws2, true, `@bad throws`);
});
