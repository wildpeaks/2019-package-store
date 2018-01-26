/* eslint-env node, jasmine */
import {ActionsWorker, IDispatcher} from '../src/ActionsWorker';

type Props = {
	readonly dummy: string;
};

type State = {
	readonly dummy: string;
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
	protected serialize(_state: Readonly<State>): Readonly<Props> { // eslint-disable-line class-methods-use-this
		const props: Props = {
			dummy: 'hello'
		};
		Object.freeze(props);
		return props;
	}
}


it('Bad worker message (undefined)', () => {
	const storage = new Storage();
	expect(typeof storage.state).toBe('undefined', 'state initially');
	expect(typeof storage.props).toBe('undefined', 'props initially');

	const spyOnProps = jasmine.createSpy();
	storage.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(storage, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	storage.state = {
		dummy: 'default'
	};

	let throws = false;
	try {
		storage.onmessage({
			data: undefined // eslint-disable-line no-undefined
		});
	} catch(e){
		throws = true;
	}
	expect(throws).toBe(true);
});


it('Bad worker message (null)', () => {
	const myworker = new Storage();
	expect(typeof myworker.state).toBe('undefined', 'state initially');
	expect(typeof myworker.props).toBe('undefined', 'props initially');

	const spyOnProps = jasmine.createSpy();
	myworker.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(myworker, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	myworker.state = {
		dummy: 'default'
	};

	let throws = false;
	try {
		myworker.onmessage({
			data: null
		});
	} catch(e){
		throws = true;
	}
	expect(throws).toBe(true);
});
