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
	DUMMY = 'dummy'
}

type DummyMessage = {
	action: Actions.DUMMY;
};
type Messages = DummyMessage;
type Dispatcher = IDispatcher<State, Messages>;

function actionDummy(_message: DummyMessage, _dispatcher: Dispatcher): void {} // eslint-disable-line no-empty-function


class Storage extends ActionsWorker<Props, State, Messages> {
	constructor() {
		super();
		this.actions[Actions.DUMMY] = actionDummy;
	}
}


it('Unserializable State', () => {
	const storage = new Storage();
	expect(typeof storage.state).toBe('undefined', 'state initially');
	expect(typeof storage.props).toBe('undefined', 'props initially');

	const spyOnProps = jasmine.createSpy();
	storage.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(storage, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	let throws = false;
	try {
		storage.state = {
			selected: 'id0',
			results: {
				id0: 'CACHED Item 0',
				id1: 'CACHED Item 1'
			},
			loading: false
		};

	} catch(e){
		throws = true;
	}
	expect(throws).toBe(true);
});
