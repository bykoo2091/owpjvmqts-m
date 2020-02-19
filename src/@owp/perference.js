
import store from '@modules'
import { put } from '@modules/preference'
export function putV(key,value){
    store.dispatch(put(key,value))
}

export function logout(){
    store.dispatch(put('session',undefined))
}