import React from 'react'
import { putV } from '@owp'
import { path as ramda } from 'ramda'
import { connect, Provider } from 'react-redux'
import store from '@modules' 
import { SessionHanlderImpl } from '@owp'
import { BrowserRouter , Route , Redirect } from 'react-router-dom'
// Layout
import Layout from './layout/Layout'

// 페이지
import Login from './pages/Login'
import FindId from './pages/FindId'
import FindPw from './pages/FindPw'
import Issue from './pages/Issue'
import IssueAdd from './pages/IssueAdd'
import IssueAddD002002 from './pages/IssueAddD002002'
import IssueAddD002003 from './pages/IssueAddD002003'
import IssueAddD002004 from './pages/IssueAddD002004'
import IssueAddD002005 from './pages/IssueAddD002005'
import IssueDetail from './pages/IssueDetail'
import IssueDetailModify from './pages/IssueDetailModify'
import IssueModify1 from './pages/IssueModify1'
import IssueModify2 from './pages/IssueModify2'
import IssueModify3 from './pages/IssueModify3'
import IssueModify4 from './pages/IssueModify4'
import Notice from './pages/Notice'
import NoticeDetail from './pages/NoticeDetail'
import Search from './pages/Search'
import Mypage from './pages/Mypage'
import Alarm from './pages/Alarm'

const AuthRoute = connect( state => {
    return { preference : state.preference }
})(  props=> {
    let {preference , component : Component , exact, path} = props
    let isAuthed = ramda(['session','token'],preference)
    return <Route exact={exact} path={path} render={ (childProps)=> {
        return isAuthed ? <Component {...childProps}/> : <Redirect to="/Login"/>
    }}></Route>
})

export default class App extends React.Component {
    render = () =>  (      
        <React.Fragment>
            <Provider store={store}>
                <BrowserRouter>
                    <Layout>
                        <div id="ct">
                            <AuthRoute exact path="/" component={ ()=> <Redirect to="/Issue"/>}></AuthRoute>
                            <Route exact path="/Login" component={Login}></Route>
                            <Route exact path="/Logout" render={()=> {
                                putV('session',undefined)
                                return <Redirect to="/Login"/>
                            }}></Route>
                            <AuthRoute exact path="/FindId" component={FindId}></AuthRoute>
                            <AuthRoute exact path="/FindPw" component={FindPw}></AuthRoute>
                            <AuthRoute exact path="/Issue" component={Issue}></AuthRoute>
                            <AuthRoute exact path="/IssueAdd/:no" component={IssueAdd}></AuthRoute>
                            <AuthRoute exact path="/IssueAddD002002/:no" component={IssueAddD002002}></AuthRoute>
                            <AuthRoute exact path="/IssueAddD002003/:no" component={IssueAddD002003}></AuthRoute>
                            <AuthRoute exact path="/IssueAddD002004/:no" component={IssueAddD002004}></AuthRoute>
                            <AuthRoute exact path="/IssueAddD002005/:no" component={IssueAddD002005}></AuthRoute>
                            <AuthRoute exact path="/IssueAddD002002/" component={IssueAddD002002}></AuthRoute>
                            <AuthRoute exact path="/IssueAddD002003/" component={IssueAddD002003}></AuthRoute>
                            <AuthRoute exact path="/IssueAddD002004/" component={IssueAddD002004}></AuthRoute>
                            <AuthRoute exact path="/IssueAddD002005/" component={IssueAddD002005}></AuthRoute>
                            <AuthRoute exact path="/IssueDetail/:no" component={IssueDetail}></AuthRoute>
                            <AuthRoute exact path="/IssueDetailModify/:no" component={IssueDetailModify}></AuthRoute>
                            <AuthRoute exact path="/IssueModify1/:no" component={IssueModify1}></AuthRoute>
                            <AuthRoute exact path="/IssueModify2/:no" component={IssueModify2}></AuthRoute>
                            <AuthRoute exact path="/IssueModify3/:no" component={IssueModify3}></AuthRoute>
                            <AuthRoute exact path="/IssueModify4/:no" component={IssueModify4}></AuthRoute>
                            <AuthRoute exact path="/Notice" component={Notice}></AuthRoute>
                            <AuthRoute exact path="/NoticeDetail/:no" component={NoticeDetail}></AuthRoute>
                            <AuthRoute exact path="/Search" component={Search}></AuthRoute>
                            <AuthRoute exact path="/Mypage" component={Mypage}></AuthRoute>
                            <AuthRoute exact path="/Alarm" component={Alarm}></AuthRoute>
                        </div>
                    </Layout>
                    <SessionHanlderImpl/>
                </BrowserRouter>      
            </Provider>
        </React.Fragment>
     )
} 