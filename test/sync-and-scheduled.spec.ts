/* eslint-env node, jasmine */
import {ActionsWorker, IDispatcher} from '../src/ActionsWorker';

type Props = {
	readonly loading: boolean;
	readonly result: string;
};

type State = {
	readonly loading: boolean;
	readonly selected: string;
	readonly results: {
		readonly [key: string]: string;
	}
};

enum Actions {
	SELECT = 'select',
	DOWNLOAD = 'download',
	PARSE = 'parse',
}

type SelectMessage = {
	action: Actions.SELECT;
	id: string;
};
type DownloadMessage = {
	action: Actions.DOWNLOAD
};
type ParseMessage = {
	action: Actions.PARSE;
	downloaded: {
		[key: string]: string;
	};
};
type Messages = SelectMessage | DownloadMessage | ParseMessage;
type Dispatcher = IDispatcher<State, Messages>;

function actionSelect(message: SelectMessage, dispatcher: Dispatcher): void {
	const oldState: State = dispatcher.state;
	const newState: State = {
		selected: message.id,
		results: oldState.results,
		loading: oldState.loading
	};
	dispatcher.state = Object.freeze(newState);
}

function actionDownload(_message: DownloadMessage, dispatcher: Dispatcher): void {
	const oldState: State = dispatcher.state;
	const newState: State = {
		selected: oldState.selected,
		results: oldState.results,
		loading: true
	};
	dispatcher.state = Object.freeze(newState);
	setTimeout(() => {
		dispatcher.schedule({
			action: Actions.PARSE,
			downloaded: {
				id0: 'DOWNLOADED Item 0',
				id1: 'DOWNLOADED Item 1',
				id2: 'DOWNLOADED Item 2'
			}
		});
	}, 300);
}

function actionParse(message: ParseMessage, dispatcher: Dispatcher): void {
	const oldState: State = dispatcher.state;
	const newState: State = {
		selected: oldState.selected,
		results: message.downloaded,
		loading: false
	};
	dispatcher.state = Object.freeze(newState);
}


class Storage extends ActionsWorker<Props, State, Messages> {
	constructor() {
		super();
		this.actions[Actions.SELECT] = actionSelect;
		this.actions[Actions.DOWNLOAD] = actionDownload;
		this.actions[Actions.PARSE] = actionParse;
	}
	protected serialize(state: Readonly<State>): Readonly<Props> {
		if (state.selected in state.results){
			const props: Props = {
				loading: state.loading,
				result: state.results[state.selected]
			};
			return Object.freeze(props);
		}
		return super.serialize(state);
	}
}


function wait(ms: number = 1): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}


it('Sync & Scheduled Actions', async() => {
	const storage = new Storage();
	expect(typeof storage.state).toBe('undefined', 'state initially');
	expect(typeof storage.props).toBe('undefined', 'props initially');

	const spyOnProps = jasmine.createSpy();
	storage.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(storage, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	storage.state = {
		selected: 'id0',
		results: {
			id0: 'CACHED Item 0',
			id1: 'CACHED Item 1'
		},
		loading: false
	};
	await wait();
	expect(spyOnProps.calls.count()).toEqual(1, 'onprops after initial state');
	expect(spySchedule.calls.count()).toEqual(0, 'schedule after initial state');
	expect(storage.props).toEqual({loading: false, result: 'CACHED Item 0'});
	expect(storage.state).toEqual({
		loading: false,
		selected: 'id0',
		results: {
			id0: 'CACHED Item 0',
			id1: 'CACHED Item 1'
		}
	});

	storage.schedule({
		action: Actions.SELECT,
		id: 'id1'
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(2, 'onprops after @select');
	expect(spySchedule.calls.count()).toEqual(1, 'schedule after @select');
	expect(storage.props).toEqual({loading: false, result: 'CACHED Item 1'});
	expect(storage.state).toEqual({
		loading: false,
		selected: 'id1',
		results: {
			id0: 'CACHED Item 0',
			id1: 'CACHED Item 1'
		}
	});

	storage.schedule({
		action: Actions.DOWNLOAD
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(3, 'onprops after @download');
	expect(spySchedule.calls.count()).toEqual(2, 'schedule after @download');
	expect(storage.props).toEqual({loading: true, result: 'CACHED Item 1'});
	expect(storage.state).toEqual({
		loading: true,
		selected: 'id1',
		results: {
			id0: 'CACHED Item 0',
			id1: 'CACHED Item 1'
		}
	});

	storage.schedule({
		action: Actions.SELECT,
		id: 'id0'
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(4, 'onprops after @download');
	expect(spySchedule.calls.count()).toEqual(3, 'schedule after @download');
	expect(storage.props).toEqual({loading: true, result: 'CACHED Item 0'});
	expect(storage.state).toEqual({
		loading: true,
		selected: 'id0',
		results: {
			id0: 'CACHED Item 0',
			id1: 'CACHED Item 1'
		}
	});

	await wait(400);
	expect(spyOnProps.calls.count()).toEqual(5, 'onprops after @download');
	expect(spySchedule.calls.count()).toEqual(4, 'schedule after @download');
	expect(storage.props).toEqual({loading: false, result: 'DOWNLOADED Item 0'});
	expect(storage.state).toEqual({
		loading: false,
		selected: 'id0',
		results: {
			id0: 'DOWNLOADED Item 0',
			id1: 'DOWNLOADED Item 1',
			id2: 'DOWNLOADED Item 2'
		}
	});

	const calls = spyOnProps.calls.all();
	expect(calls[0].args).toEqual([{loading: false, result: 'CACHED Item 0'}]);
	expect(calls[1].args).toEqual([{loading: false, result: 'CACHED Item 1'}]);
	expect(calls[2].args).toEqual([{loading: true, result: 'CACHED Item 1'}]);
	expect(calls[3].args).toEqual([{loading: true, result: 'CACHED Item 0'}]);
	expect(calls[4].args).toEqual([{loading: false, result: 'DOWNLOADED Item 0'}]);
});
