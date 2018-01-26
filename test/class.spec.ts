/* eslint-env node, jasmine */
import {ActionsWorker, IDispatcher} from '../src/ActionsWorker';

type Props = {
	readonly value: string;
};

class State {
	public count: number = 0;
	constructor(fromState?: State) {
		if (fromState){
			this.count = fromState.count;
		}
	}
}


enum Actions {
	ADD = 'add',
	SUBTRACT = 'subtract'
}
type AddMessage = {
	action: Actions.ADD;
	delta: number;
};
type Messages = AddMessage;
type Dispatcher = IDispatcher<State, Messages>;

function add(message: AddMessage, dispatcher: Dispatcher): void {
	const newState: State = new State(dispatcher.state);
	newState.count += message.delta;
	dispatcher.state = Object.freeze(newState);
}


class Storage extends ActionsWorker<Props, State, Messages> {
	constructor() {
		super();
		this.actions[Actions.ADD] = add;
	}
	protected serialize(state: Readonly<State>): Readonly<Props> { // eslint-disable-line class-methods-use-this
		const props: Props = {
			value: `Count is ${state.count}`
		};
		Object.freeze(props);
		return props;
	}
}


function wait(ms: number = 1): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, ms);
	});
}


it('State as Class', async() => {
	const storage = new Storage();
	expect(typeof storage.props).toBe('undefined', 'props initially');
	expect(typeof storage.state).toBe('undefined', 'state initially');

	const spyOnProps = jasmine.createSpy();
	storage.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(storage, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	storage.state = new State({
		count: 0
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(1, 'onprops after initial state');
	expect(spySchedule.calls.count()).toEqual(0, 'schedule after initial state');
	expect(storage.props).toEqual({value: 'Count is 0'});
	expect(storage.state instanceof State).toBe(true, 'state is a State after initial state');
	expect(storage.state.count).toBe(0);

	storage.schedule({
		action: Actions.ADD,
		delta: 1
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(2, 'onprops after @add');
	expect(spySchedule.calls.count()).toEqual(1, 'schedule after @add');
	expect(storage.props).toEqual({value: 'Count is 1'});
	expect(storage.state instanceof State).toBe(true, 'state is a State after @add');
	expect(storage.state.count).toBe(1);

	const calls = spyOnProps.calls.all();
	expect(calls[0].args).toEqual([{value: 'Count is 0'}]);
	expect(calls[1].args).toEqual([{value: 'Count is 1'}]);
});
