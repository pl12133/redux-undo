#### Important Definitions

1. `undoable` - the default function exported by 'redux-undo'.
2. `undoable reducer` - A reducer returned by `undoable`, eg. `let undoableReducer = undoable(myReducer)`.
3. `undoable config` - A configuration object used to create an `undoable reducer`.
4. `history` - The state of your reducer wrapped with `{ past: [], present: state, future: [] }`
4. `storing/adding to past` - Adding a state to `past` in a `history` so that it can be restored through an Undo action.

##### Q. Where should I include `undoable` in my App?

A. This decision depends on the design of your App. **(1)** If you have a large state tree or only want certain actions to be `undoable`, you may get better performance by making pieces of your state tree `undoable`. **(2)** If you have a small or medium size state tree, or you want all actions to be `undoable`, you can make your `rootReducer` an `undoable reducer`.

  1. If you want one piece of your Redux state tree to be `undoable`, then import `undoable` in the files where you export your reducer (eg. `reducers/todos.js`), in order to keep the logic of your `undoable` and `undoable config` inside one file. 

  2. If you want your entire Redux state tree to be `undoable`, import `undoable` in the main reducers file (eg. `reducers/index.js`) and apply it to your `rootReducer`.

##### Q. Which actions are added to `past`?

A. If an action does not change the state of an undoable reducer, it is not added to `past`. Then, if the `filter` function in your `undoable config` returns true it will be added to `past`.

_Tip:_ Use `debug: true` in your `undoable config` to easily see if an action is being added to `past`.

##### Q. I am dispatching a continous stream of actions. How can I debounce storing actions into past?

A. You are able to use an advanced filter to achieve action debouncing. Here is a filter that will only add one state to past per the duration of `timeout`, courtesy of @peteruithoven.
```js
// ignore rapid action types that are the same type
function includeActionDebounced(actions, timeout) {
  let ignoreRapid = false;
  let prevActionType;
  return function rapidSameFilter(action) {
    if (actions.indexOf(action.type) < 0)
      return false;
      
    if (action.type !== prevActionType) {
      ignoreRapid = false;
      prevActionType = action.type;
      return true;
    }
    if (ignoreRapid) {
      return false;
    }
    ignoreRapid = true;
    setTimeout(() => {
      ignoreRapid = false;
    }, timeout);
    return true;
  }
```
  
Then create an `undoable reducer` with that configuration, and it will only record at most one action per 1000 milliseconds:

```js
  let undoableReducer = undoable(myReducer, {
    filter: includeActionDebounced(['SOME_RAPID_ACTION'], 1000)
  })
```
##### Q. I have multiple undoable reducers, can I have one undo action for undoing both of them?

A. You can create a new reducer by combining those two reducers into one `undoable reducer`; then add it in your `rootReducer` like so:

```js
// + src/reducers/undoGroup.js
import reducerA from 'reducers/reducerA';
import reducerA from 'reducers/reducerB';
import undoable from 'redux-undo';
import combineReducers from 'redux';

export default undoable(combineReducers({
  reducerA,
  reducerB
}))
```
```js
// + src/reducers/index.js
import undoGroup from 'reducers/undoGroup'
import combineReducers from 'redux';

const rootReducer = combineReducers({
  ...otherReducers,
  undoGroup
})
```

##### Q. I have multiple `undoable reducer`s and I want them to have seperate undo actions.

A. In each `undoable reducer`, set a custom `undoType` property on that `undoable config`. That action type will then only cause an Undo on that one `undoable reducer`.
