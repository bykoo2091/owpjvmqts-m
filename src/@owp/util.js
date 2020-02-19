export function line2Br(value){
    if(!value) return ''
    return value.replace(/\\r\\n/g,'<br/>').replace(/\n/g,'<br/>')
}

export function humanFileSize(bytes ) {
    bytes = parseInt(bytes)
    var thresh =  1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = ['kB','MB','GB','TB','PB','EB','ZB','YB']
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1)+' '+units[u];
}

export function fileUrl(seq){
    return process.env.REACT_APP_REST_API_URL.replace('/restService','/FileStream') + '?pisnetFileSeq='+seq
}

export function validate(form,field,message){
    if(!form[field] || !form[field].toString().trim()){
        alert(message);
        return false
    }
    return true
   
}