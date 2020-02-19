import React from 'react'
import { withRouter, NavLink } from 'react-router-dom'
class Layout extends React.Component{
    render = () => {
        return (
            <React.Fragment>
                <header id="hd">
                    <div className="container">
                        <button className="icon-back" onClick={ ()=> {
                            this.props.history.goBack()
                        } }>이전 페이지 이동</button>
                        <h1><NavLink to="/Issue"><img src="../img/logo_qts.png" height="24" alt="QTS" /></NavLink></h1>
                        <a className="float-right" href="/logout">로그아웃(임시)</a>
                        <NavLink to="/Alarm" className="xi-bell-o">
                            <span className="sr-only">알림</span>
                            <span className="badge badge-primary">3</span>
                        </NavLink>
                    </div>
                    <nav id="gnb">
                        <ul className="row no-gutters">
                        <li className="col-3">
                            <NavLink to="/Issue">
                            <i className="icon-gnb01"></i>
                            <span>이슈</span>
                            </NavLink>
                        </li>
                        <li className="col-3">
                            <NavLink to="/Notice">
                            <i className="icon-gnb02">
                                <span className="badge badge-primary">3</span>
                            </i>
                            <span>공지</span>
                            </NavLink>
                        </li>
                        <li className="col-3">
                            <NavLink to="/Search">
                            <i className="icon-gnb03"></i>
                            <span>검색</span>
                            </NavLink>
                        </li>
                        <li className="col-3">
                            <NavLink to="/Mypage">
                            <i className="icon-gnb04"></i>
                            <span>설정</span>
                            </NavLink>
                        </li>
                        </ul>
                    </nav>
                </header>
                {this.props.children}
            </React.Fragment>
        )
    }
}
  
export default withRouter(Layout)