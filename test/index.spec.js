let { expect } = require('chai')
let { default: undoable, ActionCreators, excludeAction } = require('../src/index')

const ignoredActionsOne = ['DECREMENT']
const testConfigOne = {
  limit: 100,
  initTypes: 'RE-INITIALIZE',
  initialHistory: {
    past: [0, 1, 2, 3],
    present: 4,
    future: [5, 6, 7]
  },
  FOR_TEST_ONLY_ignoredActions: ignoredActionsOne,
  filter: excludeAction(ignoredActionsOne)
}

const testConfigTwo = {
  limit: 200,
  initialState: 100
}

const testConfigThree = {
  limit: 1024,
  initTypes: 'RE-INITIALIZE',
  initialState: -1,
  initialHistory: {
    past: [123],
    present: 5,
    future: [-1, -2, -3]
  }
}

runTestWithConfig({}, 'Default config')
runTestWithConfig(testConfigOne, 'Initial History and Filters')
runTestWithConfig(testConfigTwo, 'Initial State equals 100')
runTestWithConfig(testConfigThree, 'Initial State and Initial History')

// Test undoable reducers as a function of a configuration object
// `label` describes the nature of the configuration object used to run a test
function runTestWithConfig(testConfig, label) {
  describe('Undoable: ' + label, () => {
    testConfig.initTypes = (Array.isArray(testConfig.initTypes)) ? testConfig.initTypes : [testConfig.initTypes]
    let mockUndoableReducer
    let mockInitialState
    let incrementedState

    before('setup mock reducers and states', () => {
      let countInitialState = 0
      let countReducer = (state = countInitialState, action = {}) => {
        switch (action.type) {
          case 'INCREMENT':
            return state + 1
          case 'DECREMENT':
            return state - 1
          default:
            return state
        }
      }
      mockUndoableReducer = undoable(countReducer, testConfig)
      mockInitialState = mockUndoableReducer(undefined, {})
      incrementedState = mockUndoableReducer(mockInitialState, { type: 'INCREMENT' })
      console.info('  Beginning Test! Good luck!')
      console.info('    mockInitialState:', mockInitialState);
      console.info('    incrementedState:', incrementedState);
      console.info('');
    })

    it('should not record unwanted actions', () => {
      if (testConfig.FOR_TEST_ONLY_ignoredActions && testConfig.FOR_TEST_ONLY_ignoredActions[0]) {
        let decrementedState = mockUndoableReducer(mockInitialState, { type: testConfig.FOR_TEST_ONLY_ignoredActions[0] })

        expect(decrementedState.past).to.deep.equal(mockInitialState.past)
        expect(decrementedState.future).to.deep.equal(mockInitialState.future)
      }
    })
    it('should reset upon init actions', () => {
      if (testConfig.initTypes[0]) {
        let doubleIncrementedState = mockUndoableReducer(incrementedState, {type: 'INCREMENT'})
        let reInitializedState = mockUndoableReducer(doubleIncrementedState, { type: testConfig.initTypes[0] })

        expect(reInitializedState.past.length).to.equal(testConfig.initialHistory.past.length)
        expect(reInitializedState.future.length).to.equal(testConfig.initialHistory.future.length)
      }
    })

    describe('Undo', () => {
      let undoState
      before('perform an undo action', () => {
        undoState = mockUndoableReducer(incrementedState, ActionCreators.undo())
      })
      it('should change present state back by one action', () => {
        expect(undoState.present).to.equal(mockInitialState.present)
      })
      it('should change present state to last element of \'past\'', () => {
        expect(undoState.present).to.equal(incrementedState.past[incrementedState.past.length - 1])
      })
      it('should add a new element to \'future\' from last state', () => {
        expect(undoState.future[0]).to.equal(incrementedState.present)
      })
      it('should decrease length of \'past\' by one', () => {
        expect(undoState.past.length).to.equal(incrementedState.past.length - 1)
      })
      it('should increase length of \'future\' by one', () => {
        expect(undoState.future.length).to.equal(incrementedState.future.length + 1)
      })
      it('should do nothing if \'past\' is empty', () => {
        let undoInitialState = mockUndoableReducer(mockInitialState, ActionCreators.undo())
        if (!mockInitialState.past.length) {
          expect(undoInitialState.present).to.deep.equal(mockInitialState.present)
        }
      })
    })
    describe('Redo', () => {
      let undoState
      let redoState
      before('perform an undo action then a redo action', () => {
        undoState = mockUndoableReducer(incrementedState, ActionCreators.undo())
        redoState = mockUndoableReducer(undoState, ActionCreators.redo())
      })
      it('should change present state to equal state before undo', () => {
        expect(redoState.present).to.equal(incrementedState.present)
      })
      it('should change present state to first element of \'future\'', () => {
        expect(redoState.present).to.equal(undoState.future[0])
      })
      it('should add a new element to \'past\' from last state', () => {
        expect(redoState.past[redoState.past.length - 1]).to.equal(undoState.present)
      })
      it('should decrease length of \'future\' by one', () => {
        expect(redoState.future.length).to.equal(undoState.future.length - 1)
      })
      it('should increase length of \'past\' by one', () => {
        expect(redoState.past.length).to.equal(undoState.past.length + 1)
      })
      it('should do nothing if \'future\' is empty', () => {
        let secondRedoState = mockUndoableReducer(redoState, ActionCreators.redo())
        if (!redoState.future.length) {
          expect(secondRedoState.present).to.deep.equal(redoState.present)
        }
      })
    })
  })
}
