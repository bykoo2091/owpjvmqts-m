import React from 'react'

export default class FindPw extends React.Component{

    render = () => (
        <React.Fragment>
            <h2 className="login-side-hd">비밀번호 찾기</h2>
            <div className="container">
				<h2 className="h2 text-center">가입 당시 등록하신 이메일을 입력해주세요.</h2>
				<div className="bx-form mt-3">
					<div className="form-group">
						<span className="form-label">이메일</span>
						<input type="text" className="form-control form-control-md" placeholder="이메일을 입력해주세요."/>
					</div>
				</div>
				<button type="button" className="btn btn-dark btn-block btn-lg mt-4">확인</button>
			</div>
        </React.Fragment>
    )
    componentDidMount = () => {
        document.getElementById('wrap').classList.add('login-side');
    }
    componentWillUnmount = () => {
        document.getElementById('wrap').classList.remove('login-side');
    }
}