import React from 'react'
import moment from 'moment'
import { query, humanFileSize,line2Br } from '@owp'

export default class NoticeDetail extends React.Component{

	constructor(props){
		super(props)
		this.state = { notice : undefined }
	}

	componentDidMount = () => {
		query(`loadOwpNotice/${this.props.match.params.no}`).then( resp=> this.setState({ notice : {...resp} }))
	}

    render = () => (
        <React.Fragment>
			{ this.state.notice &&
				<div className="container pb-3">
					<div className="pt-2 pb-2">
						<span>{this.state.notice['IPX_COMMONCODE.CLASSID.CODENM']}</span>
						<p className="font-weight-bold mt-1 mb-1">{this.state.notice['OWP_NOTICE.CONTENT']}</p>
						<ul className="list-inline lst-icon h6">
							<li className="list-inline-item">
								<i className="icon-clock"></i>
								<span className="text-muted">{moment(this.state.notice['OWP_NOTICE.WDATE']).format('YYYY.MM.DD HH:mm')}</span>
							</li>
							<li className="list-inline-item">
								<i className="icon-user"></i>
								<span className="text-muted">{this.state.notice['IPX_USER.USERNAME']}</span>
							</li>
						</ul>
					</div>
					<div className="bx-form type2 h6">{line2Br(this.state.notice['OWP_NOTICE.CONTENT'])}</div>
					{ this.state.notice['FILES'] && this.state.notice['FILES'].length !== 0 &&
					<div className="bx-form type2 mt-3">
						<div className="row">
							<div className="col-3 col-form-label">첨부파일</div>
							<div className="col-9">
								<div className="bx-file">
									<ul>
										{this.state.notice['FILES'].map( item=> 
											<li key={item['IPX_FILE.FILESEQ']}>
												<span className="file-size">{humanFileSize(item['IPX_FILE.FILESIZE'])}</span>
												<label>
													<input type="checkbox"/> {item['IPX_FILE.FILENAMEREAL']}
												</label>
											</li>
										)}
									</ul>
								</div>
							</div>
						</div>
					</div>
					}
				</div>			
			
			}
		</React.Fragment>
    )
}