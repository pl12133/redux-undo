'use strict';
const undoable = require('../lib/').default;
const Redux = require('redux');
let reducerA = (state, action) => {
  state = state || "none";
  return state;
};
let reducerB = Redux.combineReducers({
  reducerA,
}); 
let store = Redux.createStore(undoable(reducerB, {
  initialState: {
    reducerA: "some"
  },  
  initialHistory: {
    past: [{reducerA: "past"}],
    present: {reducerA: "some (from history)"},
    future: [{reducerA: "future"}]
  }   
}));

let store2 = Redux.createStore(undoable(reducerA, {
  initialState: "some",
  initialHistory: {
    past: ["past"],
    present: "some (from history)",
    future: ["future"]
  }   
}));

console.log('Store 1: ', store.getState());
console.log('Store 2: ', store.getState());
