import React from 'react'
import { path as ramda } from 'ramda'
import { connect } from 'react-redux'
import { mutate,logout } from '@owp'

class Mypage extends React.Component{


	constructor(props){
		super(props)
		this.state = { form : { 
			'IPX_USER.USERSEQ' : ramda(['session','USERSEQ'],this.props.preference).toString(),
			'IPX_USER.USERNAME' : ramda(['session','USERNAME'],this.props.preference)
		}}
	}

	onHandleChange = (e)=>{
		let form = this.state.form
		form[e.target.name] = e.target.value
		this.setState({ form : {...form }})
	}
	

	onModifyClick = () => {
		if(!this.state.form['IPX_USER.USERNAME']){
			alert('이름을 입력해주세요')
			return
		}
		if(!this.state.form['IPX_USER.USERPASSWORD']){
			alert('비밀번호를 입력해주세요')
			return
		}
		if(this.state.form['IPX_USER.USERPASSWORD'] !== this.state.form['IPX_USER.USERPASSWORD2']){
			alert('비밀번호을 확인해주세요.')
			return
		}
		mutate('updateIpxUser',Object.assign({},this.state.form)).then( resp=> {
			alert('개인정보가 변경되었습니다. 다시 로그인해주세요.')
			logout()
		})
	}

    render = () => (
        <React.Fragment>
            <div className="container">
				<div className="bx-form mt-3">
					<div className="form-group">
						<span className="form-label">이름</span>
						<input type="text" className="form-control form-control-md" placeholder="이름을 입력해주세요." name="IPX_USER.USERNAME" value={this.state.form['IPX_USER.USERNAME']} onChange={ e=> this.onHandleChange(e) }/>
					</div>
					<div className="form-group">
						<span className="form-label">비밀번호</span>
						<input type="password" className="form-control form-control-md" name="IPX_USER.USERPASSWORD" placeholder="비밀번호를 입력해주세요." onChange={ e=> this.onHandleChange(e) }/>
					</div>
					<div className="form-group">
						<span className="form-label">비밀번호 확인</span>
						<input type="password" className="form-control form-control-md" name="IPX_USER.USERPASSWORD2" placeholder="비밀번호를 입력해주세요." onChange={ e=> this.onHandleChange(e) }/>
					</div>
				</div>
				<button type="button" className="btn btn-primary btn-block btn-lg mt-3" onClick={this.onModifyClick}>수정</button>
				<a className="btn btn-dark2 btn-block btn-lg mt-3" href="/logout">로그아웃</a>
			</div>
        </React.Fragment>

    )
}

export default connect( state=> {
	return { preference : state.preference }
})(Mypage)