import { withKeyValueReducer } from './preference'
import { combineReducers,createStore } from 'redux'

const reducer = combineReducers({
    preference : withKeyValueReducer
})

const store = createStore(reducer)

export default store