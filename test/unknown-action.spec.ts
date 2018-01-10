/* eslint-env node, jasmine */
import {ActionsWorker, IDispatcher} from '../src/ActionsWorker';

type Props = {
	readonly dummy: string;
};

type State = {
	readonly dummy: string;
};

enum Actions {
	GOOD = 'good',
	BAD = 'bad'
}

type GoodMessage = {
	action: Actions.GOOD;
};
type BadMessage = {
	action: Actions.BAD;
};
type Messages = GoodMessage | BadMessage;
type Dispatcher = IDispatcher<State, Messages>;

function actionGood(_message: GoodMessage, _dispatcher: Dispatcher): void {} // eslint-disable-line no-empty-function


class Storage extends ActionsWorker<Props, State, Messages> {
	constructor() {
		super();
		this.actions[Actions.GOOD] = actionGood;
	}
	protected serialize(_state: State): Props { // eslint-disable-line class-methods-use-this
		const props: Props = {
			dummy: 'hello'
		};
		Object.freeze(props);
		return props;
	}
}


it('Undefined Action', () => {
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

	storage.schedule({
		action: Actions.GOOD
	});
	let throws = false;
	try {
		storage.schedule({
			action: Actions.BAD
		});
	} catch(e){
		throws = true;
	}
	expect(throws).toBe(true);
});
