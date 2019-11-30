/* eslint-env node, jasmine */
/// <reference types="jasmine" />
import {Store, IStore} from '..';

type Props = Readonly<{
	readonly value: string;
}>;

type State = Readonly<{
	count: number;
}>;

type AddMessage = {
	action: 'add';
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

function sleep(delay: number = 1): Promise<void> {
	return new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, delay);
	});
}


it('State as Class', async() => {
	const store = new Store<State, Props, AddMessage>();
	store.register('add', actionAdd);
	store.serialize = _state => {
		throw new Error('Expected Error');
	};
	expect(typeof store.props).toBe('undefined', 'props initially');
	expect(typeof store.state).toBe('undefined', 'state initially');

	const spyOnProps = jasmine.createSpy();
	store.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(store, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	let throws = false;
	try {
		store.state = {
			count: 0
		};
	} catch(e){
		throws = true;
	}
	await sleep();
	expect(throws).toEqual(true, 'initial state throws an Error');
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops after initial state');
	expect(spySchedule.calls.count()).toEqual(0, 'schedule after initial state');
	expect(typeof store.props).toBe('undefined', 'props after initial state');
	expect(typeof store.state).toBe('undefined', 'state after initial state');
});
