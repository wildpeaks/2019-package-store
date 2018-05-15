/* eslint-env node, jasmine */
import {Store} from '..';

type Props = Readonly<{
	loading: boolean;
	result: string;
}>;

type State = Readonly<{
	loading: boolean;
	selected: string;
	results: Readonly<{
		[key: string]: string;
	}>
}>;

type DummyMessage = {
	action: 'dummy';
};


it('Missing serializer', () => {
	const store = new Store<State, Props, DummyMessage>();
	expect(typeof store.state).toBe('undefined', 'state initially');
	expect(typeof store.props).toBe('undefined', 'props initially');

	const spyOnProps = jasmine.createSpy();
	store.onprops = spyOnProps;
	expect(spyOnProps.calls.count()).toEqual(0, 'onprops initially');

	const spySchedule = spyOn(store, 'schedule').and.callThrough();
	expect(spySchedule.calls.count()).toEqual(0, 'schedule initially');

	let throws = false;
	try {
		store.state = {
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
