/* eslint-env node, jasmine */
import {Store, IStore} from '..';

type Props = Readonly<{
	dummy: string;
}>;

type State = Readonly<{
	dummy: string;
}>;

type DummyMessage = {
	action: 'dummy';
};

function actionDummy<State>(_message: DummyMessage, _store: IStore<State, never>): void {
	//
}


it('Bad onmessage (undefined)', () => {
	const store = new Store<State, Props, DummyMessage>();
	store.register('dummy', actionDummy);
	store.serialize = _state => {
		const props: Props = {
			dummy: 'hello'
		};
		Object.freeze(props);
		return props;
	};
	expect(typeof store.state).toBe('undefined', 'state initially');
	expect(typeof store.props).toBe('undefined', 'props initially');

	const spyOnProps = jasmine.createSpy();
	store.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(store, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	store.state = {
		dummy: 'default'
	};

	let throws = false;
	try {
		store.onmessage({
			data: undefined // eslint-disable-line no-undefined
		});
	} catch(e){
		throws = true;
	}
	expect(throws).toBe(true);
});


it('Bad onmessage (null)', () => {
	const store = new Store<State, Props, DummyMessage>();
	store.register('dummy', actionDummy);
	store.serialize = _state => {
		const props: Props = {
			dummy: 'hello'
		};
		Object.freeze(props);
		return props;
	};
	expect(typeof store.state).toBe('undefined', 'state initially');
	expect(typeof store.props).toBe('undefined', 'props initially');

	const spyOnProps = jasmine.createSpy();
	store.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(store, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	store.state = {
		dummy: 'default'
	};

	let throws = false;
	try {
		store.onmessage({
			data: null
		});
	} catch(e){
		throws = true;
	}
	expect(throws).toBe(true);
});
