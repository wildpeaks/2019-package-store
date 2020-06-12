/* eslint-env node */
/* eslint-disable prefer-arrow-callback */
import {strictEqual, deepStrictEqual} from "assert";
import {it} from "mocha";
import * as sinon from "sinon";
import {Store, IStore} from "../src/Store";

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

type SelectMessage = {
	action: "select";
	id: string;
};
type DownloadMessage = {
	action: "download";
};
type ParseMessage = {
	action: "parse";
	downloaded: {
		[key: string]: string;
	};
};

function actionSelect(message: SelectMessage, store: IStore<State, never>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {
		selected: message.id,
		results: oldState.results,
		loading: oldState.loading
	});
	Object.freeze(newState);
	store.state = newState;
}

function actionDownload(_message: DownloadMessage, store: IStore<State, ParseMessage>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {
		selected: oldState.selected,
		results: oldState.results,
		loading: true
	});
	Object.freeze(newState);
	store.state = newState;

	setTimeout(() => {
		store.schedule({
			action: "parse",
			downloaded: {
				id0: "DOWNLOADED Item 0",
				id1: "DOWNLOADED Item 1",
				id2: "DOWNLOADED Item 2"
			}
		});
	}, 300);
}

function actionParse(message: ParseMessage, store: IStore<State, never>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {
		selected: oldState.selected,
		results: message.downloaded,
		loading: false
	});
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

it("Sync & Scheduled Actions", /* @this */ async function (): Promise<void> {
	this.slow(2000);
	this.timeout(2000);

	const store = new Store<State, Props, SelectMessage | DownloadMessage | ParseMessage>();
	store.register("select", actionSelect);
	store.register("download", actionDownload);
	store.register("parse", actionParse);
	store.serialize = (state) => {
		const props: Props = {
			loading: state.loading,
			result: state.selected in state.results ? state.results[state.selected] : ""
		};
		Object.freeze(props);
		return props;
	};
	strictEqual(typeof store.state, "undefined", "state initially");
	strictEqual(typeof store.props, "undefined", "props initially");

	const spyOnProps = sinon.fake();
	store.onprops = spyOnProps;
	strictEqual(spyOnProps.callCount, 0, "onprops initially");

	const spySchedule = sinon.spy(store, "schedule");
	strictEqual(spySchedule.callCount, 0, "schedule initially");

	store.state = {
		selected: "id0",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		},
		loading: false
	};
	await sleep();
	strictEqual(spyOnProps.callCount, 1, "onprops after initial state");
	strictEqual(spySchedule.callCount, 0, "schedule after initial state");
	deepStrictEqual(store.props, {loading: false, result: "CACHED Item 0"}, "store.props after initial state");
	deepStrictEqual(store.state, {
		loading: false,
		selected: "id0",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		}
	}, "store.state after initial state");

	store.schedule({
		action: "select",
		id: "id1"
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 2, "onprops after @select");
	strictEqual(spySchedule.callCount, 1, "schedule after @select");
	deepStrictEqual(store.props, {loading: false, result: "CACHED Item 1"}, "store.props after @select");
	deepStrictEqual(store.state, {
		loading: false,
		selected: "id1",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		}
	}, "store.state @select");

	store.schedule({
		action: "download"
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 3, "onprops after @download");
	strictEqual(spySchedule.callCount, 2, "schedule after @download");
	deepStrictEqual(store.props, {loading: true, result: "CACHED Item 1"}, "store.props after @download");
	deepStrictEqual(store.state, {
		loading: true,
		selected: "id1",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		}
	}, "store.state @download");

	store.schedule({
		action: "select",
		id: "id0"
	});
	await sleep();
	strictEqual(spyOnProps.callCount, 4, "onprops after @download");
	strictEqual(spySchedule.callCount, 3, "schedule after @download");
	deepStrictEqual(store.props, {loading: true, result: "CACHED Item 0"}, "store.props after @download");
	deepStrictEqual(store.state, {
		loading: true,
		selected: "id0",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		}
	}, "store.state @download");

	await sleep(400);
	strictEqual(spyOnProps.callCount, 5, "onprops after @download");
	strictEqual(spySchedule.callCount, 4, "schedule after @download");
	deepStrictEqual(store.props, {loading: false, result: "DOWNLOADED Item 0"}, "store.props after @download");
	deepStrictEqual(store.state, {
		loading: false,
		selected: "id0",
		results: {
			id0: "DOWNLOADED Item 0",
			id1: "DOWNLOADED Item 1",
			id2: "DOWNLOADED Item 2"
		}
	}, "store.state @download");

	const calls = spyOnProps.getCalls().map((call) => call.args);
	deepStrictEqual(calls, [
		[{loading: false, result: "CACHED Item 0"}],
		[{loading: false, result: "CACHED Item 1"}],
		[{loading: true, result: "CACHED Item 1"}],
		[{loading: true, result: "CACHED Item 0"}],
		[{loading: false, result: "DOWNLOADED Item 0"}]
	]);
});
