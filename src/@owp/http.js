import store from '@modules'
import { logout } from '@owp'
import axios from 'axios'
import { path as ramda } from 'ramda'
const SERVER_URL = process.env.REACT_APP_REST_API_URL

export function query(url,params,options){
    let token = ramda(['preference','session','token'],store.getState())
    let tHeader = token ? { 'Authorization' : token } : {}
    options = Object.assign({ ignoreError : false, handling : true },options)
    return new Promise( (resolve,reject)=> {
        axios({
            method : 'GET',
            url : `${SERVER_URL}/${url}`,
            params : params ? { 'jsondata' : JSON.stringify(params) } : undefined,
            headers : Object.assign({},tHeader),
            timeout : 10000
        }).then( resp => { 
            var proc = handleResponse(resp,options)
            if(proc.success) resolve(proc.data)
            else{
                handleErrorMessage(proc.message,options)
                reject(proc.message)
            }
        }).catch( e=> {
            if(e.response && e.response.status === 401){
                logout()
            }
        })
    })
}

export function mutate(url,params,options){
    let token = ramda(['preference','session','token'],store.getState())
    let tHeader = token ? { 'Authorization' : token } : {}
    let method = url.indexOf('update') === 0 || url.indexOf('delete') === 0 ? 'PUT' : 'POST'
    options = Object.assign({ ignoreError : false, handling : true },options)
    return new Promise( (resolve,reject)=> {
        axios({
            method : method,
            url : `${SERVER_URL}/${url}`,
            data : JSON.stringify(params),
            headers : Object.assign({ 'Content-Type' : 'application/json'},tHeader),
            timeout : 10000
        }).then( resp => {
            var proc = handleResponse(resp,options)
            if(proc.success) resolve(proc.data)
            else{
                handleErrorMessage(proc.message,options)
                reject(proc.message)
            }
        }).catch( e=> {
            if(e.response && e.response.status === 401){
                logout()
            }
        })        
    })
}

function handleErrorMessage(message,options){
    if(!options.ignoreError){
        alert(message)
    }
}

function handleResponse(resp,options){
    if(resp.status / 200 === 1){
        if(options.handling){
            if(resp.data.resultCode !== 'STATUS_1'){
                return { success : false , message : resp.data.resultMessage }
            }else{
                return { success : true, data : resp.data.resultData}
            }
        }else{
            return { success : true, data : resp.data}
        }
    }else{
        return { success : false , message : resp.message }
    }
}

export function commonCodes(groupID){
    return query('listIpxCommoncode', {'IPX_COMMONCODE.GROUPID' : groupID} ).then( resp=> {
        return  resp.map( item=> {
            return { label : item['IPX_COMMONCODE.CODENM'] , value : item['IPX_COMMONCODE.CODEID'] }
        })
    })
}


export const uploadFile = (tableName,pageId,userSeq,options)=> {
    let token = ramda(['preference','session','token'],store.getState())
    let tHeader = token ? { 'Authorization' : token } : {}
    options = Object.assign({ ignoreError : false, handling : true },options)
    return new Promise( (resolve,reject)=> {
        let $ref = document.createElement('input')
        $ref.setAttribute('type','file')
        $ref.onchange = () => {
            if($ref.value){
                let $form = document.createElement('form')
                let formData = new FormData($form)
                for(var i=0;i<$ref.files.length;i++){
                    formData.append('file'+i,$ref.files[i])
                }
                formData.append('TABLENAME',tableName)
                formData.append('PAGEID',pageId)
                formData.append('WUSERSEQ',userSeq)
                axios({
                    method : 'post',
                    url : `${SERVER_URL}/uploadFileRestService`,
                    data : formData,
                    headers : Object.assign({ 'Content-Type' : 'multipart/form-data'},tHeader), 
                }).then( resp=> {
                    var proc = handleResponse(resp,options)
                    if(proc.success) resolve(proc.data)
                    else{
                        handleErrorMessage(proc.message,options)
                        reject(proc.message)
                    }
                }).catch( e=> {
                    if(e.response && e.response.status === 401){
                        logout()
                    }
                    alert(e.message)
                })
            }
        }
        $ref.click()
    })
   
}
