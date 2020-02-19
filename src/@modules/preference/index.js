const defaultPerference = ()=> {
    let defaultPerference = { session : { isAuthed : false }}
    if(window.localStorage.getItem('preference')){
        try{
            defaultPerference = JSON.parse(window.localStorage.getItem('preference'))
        }catch(e){
        }
    }
    return defaultPerference
}


export const put = (key,value) => ({ type : 'RSEA/KV', key : key , value : value })

export const withKeyValueReducer = ( state = defaultPerference() , action) => {

    switch(action.type){
        case 'RSEA/KV' : {
            let object = Object.assign({},state, { [action.key] : action.value })
            window.localStorage.setItem('preference', JSON.stringify(object))
            return object
        }
        default:
            return state
    }
}
