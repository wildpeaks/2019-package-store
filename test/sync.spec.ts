/* eslint-env node, jasmine */
import {Store, IStore} from '..';

type Props = Readonly<{
	value: string;
}>;

type State = Readonly<{
	count: number;
}>;

type AddMessage = {
	action: 'add';
	delta: number;
};
type SubtractMessage = {
	action: 'subtract';
	delta: number;
};


type PartialState = {
	count: number;
};
function actionAdd<State extends PartialState>(message: AddMessage, store: IStore<State, never>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {count: oldState.count + message.delta});
	Object.freeze(newState);
	store.state = newState;
}
function actionSubtract<State extends PartialState>(message: SubtractMessage, store: IStore<State, never>): void {
	const oldState = store.state;
	const newState = Object.assign({}, oldState, {count: oldState.count - message.delta});
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


it('Sync Actions', async() => { // eslint-disable-line
	const store = new Store<State, Props, AddMessage | SubtractMessage>();
	store.register('add', actionAdd);
	store.register('subtract', actionSubtract);
	store.serialize = state => {
		const props: Props = {
			value: `Count is ${state.count}`
		};
		Object.freeze(props);
		return props;
	};
	expect(typeof store.props).toBe('undefined', 'props initially');
	expect(typeof store.state).toBe('undefined', 'state initially');

	const spyOnProps = jasmine.createSpy();
	store.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(store, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	store.state = {
		count: 0
	};
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(1, 'onprops after initial state');
	expect(spySchedule.calls.count()).toEqual(0, 'schedule after initial state');
	expect(store.props).toEqual({value: 'Count is 0'});
	expect(store.state).toEqual({count: 0});

	store.schedule({
		action: 'add',
		delta: 1
	});
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(2, 'onprops after first @add');
	expect(spySchedule.calls.count()).toEqual(1, 'schedule after first @add');
	expect(store.props).toEqual({value: 'Count is 1'});
	expect(store.state).toEqual({count: 1});

	store.schedule({
		action: 'add',
		delta: 10
	});
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(3, 'onprops after second @add');
	expect(spySchedule.calls.count()).toEqual(2, 'schedule after second @add');
	expect(store.props).toEqual({value: 'Count is 11'});
	expect(store.state).toEqual({count: 11});

	store.schedule({
		action: 'add',
		delta: 0
	});
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(3, 'onprops after second @add');
	expect(spySchedule.calls.count()).toEqual(3, 'schedule after second @add');
	expect(store.props).toEqual({value: 'Count is 11'});
	expect(store.state).toEqual({count: 11});

	store.schedule({
		action: 'add',
		delta: 200
	});
	await sleep();
	expect(spyOnProps.calls.count()).toEqual(4, 'onprops after third @add');
	expect(spySchedule.calls.count()).toEqual(4, 'schedule after third @add');
	expect(store.props).toEqual({value: 'Count is 211'});
	expect(store.state).toEqual({count: 211});

	const calls = spyOnProps.calls.all();
	expect(calls[0].args).toEqual([{value: 'Count is 0'}]);
	expect(calls[1].args).toEqual([{value: 'Count is 1'}]);
	expect(calls[2].args).toEqual([{value: 'Count is 11'}]);
	expect(calls[3].args).toEqual([{value: 'Count is 211'}]);
});
