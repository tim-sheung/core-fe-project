import {useAction, useBinaryAction, useObjectKeyAction, useUnaryAction} from "../src/hooks";
import {Action} from "../src/reducer";

/**
 * Using real useModuleAction in Jest environment will error, because the hooks are not called in a React component context.
 */
jest.mock("../src/hooks", () => ({useAction: () => () => {}, useUnaryAction: () => () => {}, useBinaryAction: () => () => {}, useObjectKeyAction: () => () => {}}));

type ActionCreator<P extends any[]> = (...args: P) => Action<P>;

describe("useAction(type test)", () => {
    test("Should accept ActionCreator with only primitive dependency", () => {
        const allPrimitiveActionCreator: ActionCreator<[number, string, boolean]> = (a, b, c) => ({type: "test", payload: [a, b, c]});

        const allCurry = useAction(allPrimitiveActionCreator, 1, "", false);
        const expectAllCurryToPass = allCurry();
    });

    test("Should reject ActionCreators with object as deps", () => {
        const updateAction: ActionCreator<[string, {value: number}]> = (id: string, data: {value: number}) => ({type: "test", payload: [id, data]});
        // @ts-expect-error
        const updateDataWithObject = useAction(updateAction, "id", {value: 2});
    });

    test("type union test", () => {
        const createTabChangeAction: ActionCreator<["a" | "b" | "c"]> = (tab) => ({type: "String Union test", payload: [tab]});

        const changeToA = useAction(createTabChangeAction, "a");
        const changeToB = useAction(createTabChangeAction, "b");
        const changeToC = useAction(createTabChangeAction, "c");
        const expectPassA = changeToA();
        const expectPassB = changeToB();
        const expectPassC = changeToC();

        // @ts-expect-error
        const expectToFail = useAction(createTabChangeAction, "not valid");
        // @ts-expect-error
        const expectToFail = useAction(createTabChangeAction, null);
        // @ts-expect-error
        const shouldNotHaveParam = changeToA(1);
    });

    test("String literal union with multiple param", () => {
        const createTabChangeAction: ActionCreator<["a" | "b" | "c" | null | undefined | 100, {data: string}]> = (tab, data) => ({type: "String Union test", payload: [tab, data]});
        const changeToA = useUnaryAction(createTabChangeAction, "a");
        const changeToB = useUnaryAction(createTabChangeAction, "b");
        const changeToC = useUnaryAction(createTabChangeAction, "c");
        const changeToNull = useUnaryAction(createTabChangeAction, null);
        const changeToUndefined = useUnaryAction(createTabChangeAction, undefined);
        const changeTo100 = useUnaryAction(createTabChangeAction, 100);

        const expectChangeToAToPass = changeToA({data: "test"});

        // @ts-expect-error
        const expectToFail1 = changeToA();
        // @ts-expect-error
        const expectToFail2 = changeToA("");
    });
});

describe("useUnaryAction(type test)", () => {
    test("Should curry id", () => {
        const updateAction: ActionCreator<[string, {value: number}]> = (id: string, data: {value: number}) => ({type: "test", payload: [id, data]});
        const updateObjectWithId = useUnaryAction(updateAction, "id");
        updateObjectWithId({value: 1});

        // @ts-expect-error
        updateObjectWithId({value: "s"});
    });

    test("String literal union with multiple param", () => {
        const createTabChangeAction: ActionCreator<["a" | "b" | "c" | null | undefined | 100, {data: string}]> = (tab, data) => ({type: "String Union test", payload: [tab, data]});
        const changeToA = useUnaryAction(createTabChangeAction, "a");
        const changeToB = useUnaryAction(createTabChangeAction, "b");
        const changeToC = useUnaryAction(createTabChangeAction, "c");
        const changeToNull = useUnaryAction(createTabChangeAction, null);
        const changeToUndefined = useUnaryAction(createTabChangeAction, undefined);
        const changeTo100 = useUnaryAction(createTabChangeAction, 100);

        const expectChangeToAToPass = changeToA({data: "test"});

        // @ts-expect-error
        const expectToFail1 = changeToA();
        // @ts-expect-error
        const expectToFail2 = changeToA("");
    });

    test("Curry with type union args", () => {
        const createTabChangeAction: ActionCreator<[id: string, tabId: "a" | "b" | "c" | null | undefined | 100]> = (id, tabId) => ({type: "String Union test", payload: [id, tabId]});
        const changeTab = useUnaryAction(createTabChangeAction, "test");
        changeTab("a");

        // @ts-expect-error
        changeTab("d");

        // @ts-expect-error
        changeTab({});
    });
});

describe("useBinaryAction(type test)", () => {
    test("Curry two params", () => {
        const updateAction: ActionCreator<[string, number]> = (id: string, data: number) => ({type: "test", payload: [id, data]});
        const updateObjectWithId = useBinaryAction(updateAction);

        updateObjectWithId("54", 50);

        // @ts-expect-error
        const updateObjectUnaryParam = useBinaryAction(updateAction, "10");
        // @ts-expect-error
        const updateObjectBinaryParam = useBinaryAction(updateAction, "10", 5);

        // @ts-expect-error
        updateObjectWithId("5", "100");
        // @ts-expect-error
        updateObjectWithId(5, "10");
        // @ts-expect-error
        updateObjectWithId(5, 100);

        // @ts-expect-error
        updateObjectWithId("5", {value: "5"});
    });

    test("Curry union type params", () => {
        const action: ActionCreator<["a" | "b" | "c" | null | undefined | 100, {data: string}]> = (tab, data) => ({type: "String Union test", payload: [tab, data]});

        const update = useBinaryAction(action);
        update("a", {data: "100"});
        update(null, {data: "100"});
        update(100, {data: "100"});

        // @ts-expect-error
        const updateObject1 = useBinaryAction(action, 100);
        // @ts-expect-error
        const updateObject2 = useBinaryAction(action, "a");

        // @ts-expect-error
        update("d");
        // @ts-expect-error
        update("a", {data: 5});
        // @ts-expect-error
        update("d", {data: "100"});
    });
});

describe("useModuleObjectKeyAction(type test)", () => {
    test("Should accept key of object", () => {
        const updateObjectAction: ActionCreator<[{a: string; b: number; c: boolean; d: null | "a" | "b"}]> = (object) => ({type: "update object", payload: [object]});
        const updateA = useObjectKeyAction(updateObjectAction, "a");
        const updateB = useObjectKeyAction(updateObjectAction, "b");
        const updateC = useObjectKeyAction(updateObjectAction, "c");
        const updateD = useObjectKeyAction(updateObjectAction, "d");

        // @ts-expect-error
        const updateNotKey = useObjectKeyAction(updateObjectAction, "NOT KEY");

        updateA("string");
        updateB(1);
        updateC(false);
        updateD(null);
        updateD("a");
        updateD("b");

        // @ts-expect-error
        updateA(1);
        // @ts-expect-error
        updateB("s");
        // @ts-expect-error
        updateC(3);
        // @ts-expect-error
        updateD("e");
        // @ts-expect-error
        updateD(undefined);
    });
});
