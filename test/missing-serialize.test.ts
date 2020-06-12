/* eslint-env node */
/* eslint-disable prefer-arrow-callback */
import {strictEqual} from "assert";
import {it} from "mocha";
import * as sinon from "sinon";
import {Store} from "../src/Store";

type Props = Readonly<{
	loading: boolean;
	result: string;
}>;

type State = Readonly<{
	loading: boolean;
	selected: string;
	results: Readonly<{
		[key: string]: string;
	}>;
}>;

type DummyMessage = {
	action: "dummy";
};

it("Missing serializer", /* @this */ function (): void {
	const store = new Store<State, Props, DummyMessage>();
	strictEqual(typeof store.state, "undefined", "state initially");
	strictEqual(typeof store.props, "undefined", "props initially");

	const spyOnProps = sinon.fake();
	store.onprops = spyOnProps;
	strictEqual(spyOnProps.callCount, 0, "onprops initially");

	const spySchedule = sinon.spy(store, "schedule");
	strictEqual(spySchedule.callCount, 0, "schedule initially");

	let throws = false;
	try {
		store.state = {
			selected: "id0",
			results: {
				id0: "CACHED Item 0",
				id1: "CACHED Item 1"
			},
			loading: false
		};
	} catch (e) {
		throws = true;
	}
	strictEqual(throws, true, "Throws");
});
