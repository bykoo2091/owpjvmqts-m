/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { NavLink, withRouter } from 'react-router-dom'
import { query, mutate, putV } from '@owp'
import { path as ramda } from 'ramda'
import { connect } from 'react-redux'

class Login extends React.Component{

    constructor(props){
        super(props)
        this.state = { userId : props.preference.lastUserId , userPw : ''}
    }
 
    render = () => (
        <React.Fragment>
            <button type="button" className="icon-lang" data-toggle="modal" data-target="#modal1">언어 선택</button>
            <div className="container">
				<h2 className="mb-5"><img className="center-block" src="./img/logo_qts_wh.png" height="65" alt="QTS Quality Total System"/></h2>
				<div className="form-group">
					<input type="text" className="form-control form-control-lg form-id" placeholder="아이디" name="userId" onChange={ e=> this.setState({[e.target.name] : e.target.value})} value={this.state.userId} maxLength="30"/>
				</div>
				<div className="form-group mb-5">
					<input type="password" className="form-control form-control-lg form-pw" placeholder="비밀번호" name="userPw" onChange={ e=> this.setState({[e.target.name] : e.target.value})} value={this.state.userPw} maxLength="50"/>
				</div>
				<div className="form-group">
                    {/* 목업용으로 링크로 해둠 */}
					<button className="btn btn-dark btn-block btn-lg" onClick={this.doLogin}><img className="mt-1 mr-2" src="./img/icon/icon_login.png" height="15" alt="" />로그인</button>
				</div>
				<div className="text-center">
					<ul className="lst-split h2 text-wh">
						<li><NavLink to="/FindId">아이디 찾기</NavLink></li>
						<li><NavLink to="/FindPw">비밀번호 찾기</NavLink></li>
					</ul>
				</div>
			</div>

            <div id="modal1" className="modal fade">
                <div className="modal-dialog modal-dialog-centered modal-xl">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="modal-title">언어선택</div>
                            <button type="button" className="close" data-dismiss="modal">
                                <span>×</span>
                            </button>
                        </div>
                        <div className="modal-body">
                            <ul className="lst-lang"> 
                                <li><a href="">Korea(한국어)</a></li>
                                <li><a href="">English</a></li>
                                <li><a href="">China</a></li>
                                <li><a href="">Germany</a></li>
                                <li><a href="">Spain</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </React.Fragment>

    )
    componentDidMount = () => {
        document.getElementById('wrap').classList.add('login');
    }
    componentWillUnmount = () => {
        document.getElementById('wrap').classList.remove('login');
    }

    doLogin = () => {
        let { userId, userPw} = this.state
        let OWPMaxLoaginFailCount = 5
        let OWPSessionExpireMinute = 600000
        if(!userId || !userPw) return
        query(`loadIpxSystemmanage`).then( resp => {
            OWPMaxLoaginFailCount = resp['IPX_SYSTEMMANAGE.MAXLOAGINFAILCOUNT']
            OWPSessionExpireMinute = resp['IPX_SYSTEMMANAGE.SESSIONEXPIREMINUTE']*60*1000
            return query(`loadIpxUserForLogin/${userId}/${userPw}`,undefined,{ handling : false })
        }).then( resp=> {
            var fails = this.props.preference.loginFails || {}
            var failCnt = fails[userId] || 0
            failCnt = failCnt+1
            let errorMessage = ramda(['resultData','errorMessage'],resp)
            if(resp.resultCode === 'STATUS_0' && errorMessage){
                alert(errorMessage)
            }else if(resp.resultCode === 'STATUS_0'){
                // PASSWORD 오류
                alert(`로그인 ${failCnt}회 실패하였습니다. ${OWPMaxLoaginFailCount}회 실패 시 계정이 잠김니다.`)
                if(failCnt >= OWPMaxLoaginFailCount){
                    mutate(`updateIPX_User_LockFlag/${userId}/Y`,undefined,{ ignoreError : true }).then( resp=> {
                        fails[userId] = 0
                        putV('loginFails',fails)
                    }) 
                }else{
                    fails[userId] = failCnt
                    putV('loginFails',fails)
                }
            }else if(resp.resultCode === 'STATUS_1'){
                fails[userId] = 0
                putV('loginFails',fails)
                putV('lastUserId', userId)
                putV('session', resp.resultData)
                putV('OWPSessionExpireMinute', OWPSessionExpireMinute)
                this.props.history.replace('/')
            }else{
                // 서버오류
            }
        })
    }
}

export default connect( state=> {
    return { preference : state.preference }
})(withRouter(Login))