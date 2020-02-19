export const OwpSession = function(key){
    let session = JSON.parse(window.localStorage.getItem('preference')).session;
    if(session){
        return ""+session[key];
    }else{
        return null;
    }
}