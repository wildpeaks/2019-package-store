/* eslint-env browser */
import {IStore, Store} from "../../..";

type ViewpointJson = {
	position: string;
};
class Viewpoint {
	public position: string;
	public constructor(position: string = "0 0 0") {
		this.position = position;
	}
	public toJson(): ViewpointJson {
		return {
			position: this.position
		};
	}
}

type MapOf<T> = {
	[id: string]: T;
};
type ViewpointsState = MapOf<Viewpoint>;
type ViewpointsProps = MapOf<ViewpointJson>;

type SetMessage = Readonly<{
	action: "set";
	key: string;
	value: Viewpoint;
}>;

export function actionSet<ViewpointsState>(message: SetMessage, store: IStore<ViewpointsState, never>): void {
	const newItems: any = {};
	newItems[message.key] = message.value;
	const newState = Object.assign({}, store.state, newItems);
	Object.freeze(newState);
	store.state = newState;
}

const collection = new Store<ViewpointsState, ViewpointsProps, SetMessage>();
collection.register("set", actionSet);
collection.serialize = (state) => {
	const props: ViewpointsProps = {};
	for (const id in state) {
		props[id] = state[id].toJson();
	}
	return props;
};

// Subscribe to props
collection.onprops = (props) => {
	if ("MOCHA_ON_STORE_PROPS" in window) {
		//@ts-ignore
		window.MOCHA_ON_STORE_PROPS(JSON.stringify(props)); // eslint-disable-line
	} else {
		console.log("[PROPS]", props);
	}
};

// Initial state
collection.state = {
	initial1: new Viewpoint("1 0 0"),
	initial2: new Viewpoint("2 0 0"),
	initial3: new Viewpoint("3 0 0")
};

// Send actions
collection.schedule({
	action: "set",
	key: "new1",
	value: new Viewpoint("4 0 0")
});
collection.schedule({
	action: "set",
	key: "new2",
	value: new Viewpoint("5 0 0")
});
