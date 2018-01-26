/* eslint-env node, jasmine */
import {ActionsWorker, IDispatcher} from '../src/ActionsWorker';

type Props = {
	readonly value: string;
};

type State = {
	readonly count: number;
};


enum Actions {
	ADD = 'add',
	SUBTRACT = 'subtract'
}
type AddMessage = {
	action: Actions.ADD;
	delta: number;
};
type SubtractMessage = {
	action: Actions.SUBTRACT;
	delta: number;
};
type Messages = AddMessage | SubtractMessage;
type Dispatcher = IDispatcher<State, Messages>;

function add(message: AddMessage, dispatcher: Dispatcher): void {
	const oldState: State = dispatcher.state;
	const newState: State = {
		count: oldState.count + message.delta
	};
	dispatcher.state = Object.freeze(newState);
}

function subtract(message: SubtractMessage, dispatcher: Dispatcher): void {
	const oldState: State = dispatcher.state;
	const newState: State = {
		count: oldState.count - message.delta
	};
	dispatcher.state = Object.freeze(newState);
}


class Storage extends ActionsWorker<Props, State, Messages> {
	constructor() {
		super();
		this.actions[Actions.ADD] = add;
		this.actions[Actions.SUBTRACT] = subtract;
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


it('Sync Actions', async() => {
	const storage = new Storage();
	expect(typeof storage.props).toBe('undefined', 'props initially');
	expect(typeof storage.state).toBe('undefined', 'state initially');

	const spyOnProps = jasmine.createSpy();
	storage.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(storage, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	storage.state = {
		count: 0
	};
	await wait();
	expect(spyOnProps.calls.count()).toEqual(1, 'onprops after initial state');
	expect(spySchedule.calls.count()).toEqual(0, 'schedule after initial state');
	expect(storage.props).toEqual({value: 'Count is 0'});
	expect(storage.state).toEqual({count: 0});

	storage.schedule({
		action: Actions.ADD,
		delta: 1
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(2, 'onprops after first @add');
	expect(spySchedule.calls.count()).toEqual(1, 'schedule after first @add');
	expect(storage.props).toEqual({value: 'Count is 1'});
	expect(storage.state).toEqual({count: 1});

	storage.schedule({
		action: Actions.ADD,
		delta: 10
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(3, 'onprops after second @add');
	expect(spySchedule.calls.count()).toEqual(2, 'schedule after second @add');
	expect(storage.props).toEqual({value: 'Count is 11'});
	expect(storage.state).toEqual({count: 11});

	storage.schedule({
		action: Actions.ADD,
		delta: 0
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(3, 'onprops after second @add');
	expect(spySchedule.calls.count()).toEqual(3, 'schedule after second @add');
	expect(storage.props).toEqual({value: 'Count is 11'});
	expect(storage.state).toEqual({count: 11});

	storage.schedule({
		action: Actions.ADD,
		delta: 200
	});
	await wait();
	expect(spyOnProps.calls.count()).toEqual(4, 'onprops after third @add');
	expect(spySchedule.calls.count()).toEqual(4, 'schedule after third @add');
	expect(storage.props).toEqual({value: 'Count is 211'});
	expect(storage.state).toEqual({count: 211});

	const calls = spyOnProps.calls.all();
	expect(calls[0].args).toEqual([{value: 'Count is 0'}]);
	expect(calls[1].args).toEqual([{value: 'Count is 1'}]);
	expect(calls[2].args).toEqual([{value: 'Count is 11'}]);
	expect(calls[3].args).toEqual([{value: 'Count is 211'}]);
});
