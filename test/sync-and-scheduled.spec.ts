/* eslint-env node, jasmine */
/// <reference types="jasmine" />
import {Store, IStore} from "..";

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
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
}

it("Sync & Scheduled Actions", async () => {
	const store = new Store<State, Props, SelectMessage | DownloadMessage | ParseMessage>();
	store.register("select", actionSelect);
	store.register("download", actionDownload);
	store.register("parse", actionParse);
	store.serialize = state => {
		const props: Props = {
			loading: state.loading,
			result: state.selected in state.results ? state.results[state.selected] : ""
		};
		Object.freeze(props);
		return props;
	};
	expect(typeof store.state).toBe("undefined", "state initially");
	expect(typeof store.props).toBe("undefined", "props initially");

	const spyOnProps = jasmine.createSpy();
	store.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, "onprops initially");

	const spySchedule = spyOn(store, "schedule").and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, "schedule initially");

	store.state = {
		selected: "id0",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		},
		loading: false
	};
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(1, "onprops after initial state");
	expect(spySchedule.calls.count()).toEqual(0, "schedule after initial state");
	expect(store.props).toEqual({loading: false, result: "CACHED Item 0"});
	expect(store.state).toEqual({
		loading: false,
		selected: "id0",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		}
	});

	store.schedule({
		action: "select",
		id: "id1"
	});
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(2, "onprops after @select");
	expect(spySchedule.calls.count()).toEqual(1, "schedule after @select");
	expect(store.props).toEqual({loading: false, result: "CACHED Item 1"});
	expect(store.state).toEqual({
		loading: false,
		selected: "id1",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		}
	});

	store.schedule({
		action: "download"
	});
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(3, "onprops after @download");
	expect(spySchedule.calls.count()).toEqual(2, "schedule after @download");
	expect(store.props).toEqual({loading: true, result: "CACHED Item 1"});
	expect(store.state).toEqual({
		loading: true,
		selected: "id1",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		}
	});

	store.schedule({
		action: "select",
		id: "id0"
	});
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(4, "onprops after @download");
	expect(spySchedule.calls.count()).toEqual(3, "schedule after @download");
	expect(store.props).toEqual({loading: true, result: "CACHED Item 0"});
	expect(store.state).toEqual({
		loading: true,
		selected: "id0",
		results: {
			id0: "CACHED Item 0",
			id1: "CACHED Item 1"
		}
	});

	await sleep(400);
	expect(spyOnProps.calls.count()).toEqual(5, "onprops after @download");
	expect(spySchedule.calls.count()).toEqual(4, "schedule after @download");
	expect(store.props).toEqual({loading: false, result: "DOWNLOADED Item 0"});
	expect(store.state).toEqual({
		loading: false,
		selected: "id0",
		results: {
			id0: "DOWNLOADED Item 0",
			id1: "DOWNLOADED Item 1",
			id2: "DOWNLOADED Item 2"
		}
	});

	const calls = spyOnProps.calls.all();
	expect(calls[0].args).toEqual([{loading: false, result: "CACHED Item 0"}]);
	expect(calls[1].args).toEqual([{loading: false, result: "CACHED Item 1"}]);
	expect(calls[2].args).toEqual([{loading: true, result: "CACHED Item 1"}]);
	expect(calls[3].args).toEqual([{loading: true, result: "CACHED Item 0"}]);
	expect(calls[4].args).toEqual([{loading: false, result: "DOWNLOADED Item 0"}]);
});
