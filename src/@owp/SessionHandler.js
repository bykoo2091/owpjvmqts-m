import React from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { useIdle } from '@owp'

function SessionIdle({isLoginedIn,timeout,history}){
    useIdle(timeout,isLoginedIn , ()=> {
        history.replace('/logout')
    })
    return <React.Fragment></React.Fragment>
}
class SessionHanlder extends React.Component{

    componentDidUpdate(prevProps,prevState){
        let prevSession = prevProps.preference
        let session = this.props.preference
        if(prevSession !== session && session === undefined){
            this.history.replace('/logout')
        }
    }

    render = ()=> {
        return  <SessionIdle isLoginedIn={this.props.preference.session !== undefined} timeout={this.props.preference['OWPSessionExpireMinute']} history={this.props.history}/>
    }

}



export const SessionHanlderImpl = connect( state=> {
    return { preference : state.preference }
})(withRouter(SessionHanlder))