/* eslint-env browser */
import {ApplicationStore} from "./stores/ApplicationStore";
import {Viewpoint} from "./classes/Viewpoint";

// Store that uses a second store internally
const applicationStore = new ApplicationStore();
applicationStore.onprops = (props) => {
	if ("MOCHA_ON_STORE_PROPS" in window) {
		//@ts-ignore
		window.MOCHA_ON_STORE_PROPS(JSON.stringify(props)); // eslint-disable-line
	} else {
		console.log("[PROPS]", props);
	}
};
applicationStore.initialize();

// Send actions
applicationStore.schedule({
	action: "SELECT VIEWPOINT",
	id: "initial2"
});
applicationStore.viewpointsStore.schedule({
	action: "SET VIEWPOINT",
	key: "new1",
	value: new Viewpoint("4 0 0")
});
applicationStore.viewpointsStore.schedule({
	action: "SET VIEWPOINT",
	key: "new2",
	value: new Viewpoint("5 0 0")
});
applicationStore.schedule({
	action: "SELECT VIEWPOINT",
	id: "new1"
});
