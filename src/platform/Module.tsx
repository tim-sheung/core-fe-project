import {push} from "connected-react-router";
import {Location} from "history";
import {SagaIterator} from "../typed-saga";
import {put} from "redux-saga/effects";
import {app} from "../app";
import {Logger} from "../Logger";
import {LifecycleDecoratorFlag, TickIntervalDecoratorFlag} from "../module";
import {navigationPreventionAction, setStateAction, State} from "../reducer";

export interface ModuleLifecycleListener<RouteParam extends {} = {}, HistoryState extends {} = {}> {
    onEnter: ((entryComponentProps?: any) => SagaIterator) & LifecycleDecoratorFlag;
    onRender: ((routeParameters: RouteParam, location: Location<HistoryState | undefined>) => SagaIterator) & LifecycleDecoratorFlag;
    onDestroy: (() => SagaIterator) & LifecycleDecoratorFlag;
    onTick: (() => SagaIterator) & LifecycleDecoratorFlag & TickIntervalDecoratorFlag;
}

export class Module<ModuleState extends {}, RouteParam extends {} = {}, HistoryState extends {} = {}, RootState extends State = State> implements ModuleLifecycleListener<RouteParam, HistoryState> {
    constructor(readonly name: string, readonly initialState: ModuleState) {}

    *onEnter(entryComponentProps: any): SagaIterator {
        /**
         * Called when the attached component is initially mounted.
         */
    }

    *onRender(routeParameters: RouteParam, location: Location<HistoryState | undefined>): SagaIterator {
        /**
         * Called when the attached component is in either case:
         * - Initially mounted
         * - Re-rendered due to location updates (only for route connected components)
         */
    }

    *onDestroy(): SagaIterator {
        /**
         * Called when the attached component is going to unmount
         */
    }

    *onTick(): SagaIterator {
        /**
         * Called periodically during the lifecycle of attached component
         * Usually used together with @Interval decorator, to specify the period (in second)
         * Attention: The next tick will not be triggered, until the current tick has finished
         */
    }

    get state(): Readonly<ModuleState> {
        return this.rootState.app[this.name];
    }

    get rootState(): Readonly<RootState> {
        return app.store.getState() as Readonly<RootState>;
    }

    get logger(): Logger {
        return app.logger;
    }

    setNavigationPrevented(isPrevented: boolean) {
        app.store.dispatch(navigationPreventionAction(isPrevented));
    }

    /**
     * CAVEAT:
     * Do not use Partial<ModuleState> as parameter.
     * Because it allows {foo: undefined} to be passed, and set that field undefined, which is not supposed to be.
     */
    setState<K extends keyof ModuleState>(newState: Pick<ModuleState, K> | ModuleState) {
        app.store.dispatch(setStateAction(this.name, newState, `@@${this.name}/setState[${Object.keys(newState).join(",")}]`));
    }

    /**
     * CAVEAT:
     * (1)
     * Calling this.pushHistory to other module should cancel the following logic.
     * Using store.dispatch here will lead to error while cancelling in lifecycle.
     *
     * Because the whole process is in sync mode:
     * dispatch push action -> location change -> router component will un-mount -> lifecycle saga cancel
     *
     * Cancelling the current sync-running saga will throw "TypeError: Generator is already executing".
     *
     * (2)
     * Adding yield cancel() in pushHistory is also incorrect.
     * If this.pushHistory is only to change state rather than URL, it will lead to the whole lifecycle saga cancelled.
     *
     * https://github.com/react-boilerplate/react-boilerplate/issues/1281
     */
    pushHistory(url: string, state?: HistoryState): SagaIterator;
    pushHistory(state: HistoryState): SagaIterator;
    *pushHistory(urlOrState: HistoryState | string, state?: HistoryState): SagaIterator {
        if (typeof urlOrState === "string") {
            if (state === null) {
                yield put(push(urlOrState));
            } else {
                yield put(push(urlOrState, state));
            }
        } else {
            const currentURL = location.pathname + location.search;
            yield put(push(currentURL, urlOrState));
        }
    }
}
