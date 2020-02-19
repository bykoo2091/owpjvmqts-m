import React from 'react'
import { query,commonCodes } from '@owp'
import { NavLink } from 'react-router-dom'
import moment from 'moment'
import DatePicker from 'react-datepicker'

const defaultJSON = { sidx : '`OWP_NOTICE.NOTICESEQ`' , sord : 'DESC'}

export default class Notice extends React.Component{

	
	constructor(props){
		super(props)
		this.state = { notices : [] , search : {}  , classIds : [] }
	}
		
	componentDidMount = () => {
		commonCodes('D005000').then( resp=> this.setState({ classIds: resp}))
		query('listOwpNotice',defaultJSON).then( resp=> this.setState({ notices : resp }))
	}

	onSearchClick = () => {
		let params = Object.assign(defaultJSON,this.state.search)
		params['RANGE.DATE'] = params['RANGE.DATE'] ? moment(params['RANGE.DATE']).format('YYYY-MM-DD') : undefined
		query('listOwpNotice',params).then( resp=> this.setState({ notices : [...resp] }))
	}

	onSearchChange = (e) => {
		let search = this.state.search
		search[e.target.name] = e.target.value
		this.setState({ search : { ...search }})
	}

    render = () => (
        <React.Fragment>
			<div className="bg-wh pt-3">
				<div className="container">
					<div className="form-group row mb-1">
						<div className="col-6">
							<select className="form-control" name="OWP_NOTICE.CLASSID" onChange={ e=> this.onSearchChange(e)}>
								<option value="">분류</option>
								{ this.state.classIds.map( item=> 
									<option key={item.value} value={item.value}>{item.label}</option>
								)}
							</select>
						</div>
						<div className="col-6">
							<input type="text" className="form-control" placeholder="키워드" name="OWP_NOTICE.TITLE" onChange={ e=> this.onSearchChange(e)}/>
						</div>
					</div>
					<div className="form-group row">
						<div className="col-6">
							<input type="text" className="form-control" placeholder="작성자" name="IPX_USER.USERNAME" onChange={ e=> this.onSearchChange(e)}/>
						</div>
						<div className="col-6">
							<div className="form-control-icon">
								<DatePicker dateFormat='yyyy/MM/dd' selected={this.state.search['RANGE.DATE']} onChange={ (v)=> {
									let search = this.state.search
									search['RANGE.DATE'] = v
									this.setState({ search : { ...search }})
								}} className="form-control" />
								<img className="rt" src="../img/icon/icon_cal.png" height="15" alt=""/>
							</div>
						</div>
					</div>
					<button type="button" className="btn btn-primary btn-block" onClick={this.onSearchClick}><i className="xi-search mr-1"></i>검색</button>
				</div>
				<hr className="mb-0"/>
			</div>
			<ul className="lst-board"> 
				{this.state.notices && this.state.notices.map( item=> 
				<li key={item['OWP_NOTICE.NOTICESEQ']}>
					<NavLink to={`/NoticeDetail/${item['OWP_NOTICE.NOTICESEQ']}`} className="link">
						<div className="h6">{item['IPX_COMMONCODE.CLASSID.CODENM']}</div>
						<p className="title twoline">{item['OWP_NOTICE.TITLE']}</p>
						<ul className="list-inline lst-icon h6">
							<li className="list-inline-item">
								<i className="icon-clock"></i>
								<span className="text-muted">{moment(item['OWP_NOTICE.WDATE']).format('YYYY.MM.DD HH:mm')}</span>
							</li>
							<li className="list-inline-item">
								<i className="icon-user"></i>
								<span className="text-muted">{item['IPX_USER.USERNAME']}</span>
							</li>
						</ul>
					</NavLink>
				</li>		
				)}
			</ul>
		</React.Fragment>
    )
}
