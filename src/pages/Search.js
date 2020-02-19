import React from 'react'
import { query,mutate,OwpPermitISSUE,OwpDept,commonCodes,OwpSession } from '@owp'
import { NavLink } from 'react-router-dom'
import moment from 'moment'
import DatePicker from 'react-datepicker'
import Select from 'react-select';

const defaultJSON = { sidx : '`OWP_ISSUE.ISSUESEQ`' , sord : 'DESC'}

export default class Search extends React.Component{
    constructor(props){
		super(props)
		this.state = { form: [], issues : [], users: [] , dept:[], assignType: '1', assignDept:[], clickableValue:'', search : {}}
	}
	componentDidMount = () => {
      //이슈리스트
      query('listOwpIssue',defaultJSON).then( resp=> this.setState({ issues : resp }))

      //이슈 드랍,삭제,보완요청 유무(OWP_ISSUELOG)


      //부서
      query(`listIpxCommoncode?jsondata=${JSON.stringify({'IPX_COMMONCODE.GROUPID':'A001001', 'IPX_COMMONCODE.ASSIGNDEPT':'1'})}`).then(resp=> {
          this.setState({dept:this.jsonKeyChange(resp,'IPX_COMMONCODE.CODEID','IPX_COMMONCODE.CODENM')})
      })

      //담당자(사용자목록)
      query(`listIpxUser?jsondata=${JSON.stringify({'IPX_USER.DEPTID':OwpSession('DEPTID')})}`).then(resp=> {
          console.log(resp)
          this.setState({users:this.jsonKeyChange(resp,'IPX_USER.USERSEQ','IPX_USER.USERNAME', 'IPX_USER.DEPTID', 'RANKID_CODENM')})
      })

	}
    jsonKeyChange = (json, id, name, deptCd, rank) => {

        let colModified = json.map(
          obj => {
              return {
                  "value": obj[id],
                  "label" : obj[name] + ((rank != null && rank != '' && rank != undefined) ? ` (${obj[rank]})` : ``),
                  "deptCd" : obj[deptCd]
              }
          }
        )
        return colModified;
    }

    handleChange = (e) => {

        const name = e.target.name;
        const value = e.target.value;
        this.setState({
            form: { ...this.state.form, [name] : value}
        })
    }

	clickHandler = (key) => {
        this.setState({clickableValue : key})
    }

    //부서할당 선택시
    selectedChange1 = (selectedOption) => {
        this.setState({assignDept:selectedOption})
    }

    selectedChange2 = (selectedOption) => {
        this.setState({assignUser:selectedOption})
    }

    clickAssign = (assignType) => {
        this.setState({assignType})
    }

    //부서할당
    issueAssign = () => {

        let arrayData = new Array();

        //1.부서할당
        if(this.state.assignType === '1') {

            let check = true;

            this.state.assignDept.forEach( item => {

                let jsonData = new Object();
                jsonData["OWP_ISSUEDEPTASSIGN.STATUS"] = 'CREATE'
                jsonData["OWP_ISSUEDEPTASSIGN.ISSUESEQ"] = this.state.clickableValue.toString();
                jsonData["OWP_ISSUEDEPTASSIGN.DEPTCD"] = item['value']
                jsonData["OWP_ISSUEDEPTASSIGN.WUSERSEQ"] = OwpSession('USERSEQ')
                jsonData["OWP_ISSUEDEPTASSIGN.FLAG"] = 'Y'
                jsonData["OWP_ISSUEDEPTASSIGN.PAGEID"] = ''
                jsonData["OWP_ISSUEDEPTASSIGN.REASON"] = this.state.form["OWP_ISSUEDEPTASSIGN.REASON"];

                if(jsonData["OWP_ISSUEDEPTASSIGN.REASON"] == null || jsonData["OWP_ISSUEDEPTASSIGN.REASON"] ===''){
                    alert('사유를 입력하세요.')
                    check = false;
                    return;
                }

                arrayData.push(jsonData)
            })

            if(!check)return;
            if(arrayData.length == 0){
                alert('할당부서를 선택하세요');
                return;
            }

            var params = new Object;
            params.PARAMNAME = arrayData;

            return mutate('processOwpIssuedeptassign/PARAMNAME',params).then( () => {
                alert('저장되었습니다.')
            })
        }

        //2.부서담당자 할당
        if(this.state.assignType == '2') {

            this.state.assignUser.forEach( item => {

                let jsonData = new Object();
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.STATUS"] = 'CREATE'
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.ISSUESEQ"] = this.state.clickableValue.toString();
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.DEPTCD"] = item['deptCd'] + ''
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.MANAGERSEQ"] = item['value'] + ''
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.ISSUERST"] = ''
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.WUSERSEQ"] = OwpSession('USERSEQ') + ''
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.FLAG"] = 'Y'
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.PAGEID"] = ''

                arrayData.push(jsonData)
            })

            var params = new Object;
            params.PARAMNAME = arrayData;

            return mutate('processOwpIssuedeptmanagerassign/PARAMNAME',params).then( () => {
                alert('저장되었습니다.')
            })

        }

    }

    //상태변경
    updateStatusClick = (status) => {

        let param = {};
        param["OWP_ISSUE.ISSUESEQ"] = this.state.clickableValue.toString();
        //param["OWP_ISSUE.I_STATUS_CD"] = "" <== STT_NM 으로 대체
        param["OWP_ISSUE_REASON.REASON_CONTENT"] = this.state.form["OWP_ISSUE_REASON.REASON_CONTENT"];

        return mutate(`updateOwpIssue-chgStt/`+status, param).then( () => {
            alert(status+" 완료");
            window.location.reload();
        })

    }

    // search
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
							<input type="text" className="form-control" placeholder="장비명" name="" onChange={ e=> this.onSearchChange(e)}/>
						</div>
						<div className="col-6">
							<input type="text" className="form-control" placeholder="내용" name="" onChange={ e=> this.onSearchChange(e)}/>
						</div>
					</div>
					<div className="form-group row mb-1">
						<div className="col-6">
							<select className="form-control" name="" onChange={ e=> this.onSearchChange(e)}>
								<option value="">등록유형</option>
							</select>
						</div>
						<div className="col-6">
							<input type="text" className="form-control" placeholder="상태" name="" onChange={ e=> this.onSearchChange(e)}/>
						</div>
					</div>
					<div className="form-group row">
						<div className="col">
							<div className="form-control-icon">
								<DatePicker dateFormat='yyyy/MM/dd' selected={this.state.search['RANGE.DATE']} onChange={ (v)=> {
									let search = this.state.search
									search['RANGE.DATE'] = v
									this.setState({ search : { ...search }})
								}} className="form-control" />
								<img className="rt" src="img/icon/icon_cal.png" height="15" alt=""/>
							</div>
						</div>
						<div className="col-auto">
							<button type="button" className="btn btn-primary btn-sm pl-2 pr-2" onClick={this.onSearchClick}><i className="xi-search mr-1"></i>검색</button>
						</div>
					</div>
				</div>
				<hr className="mb-0"/>
			</div>
            

{/* 드랍 */}
<div id="issueDrop" className="modal fade">
    <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
            <div className="modal-header">
                <div className="modal-title">Drop</div>
                <button type="button" className="close" data-dismiss="modal">
                    <span>×</span>
                </button>
            </div>
            <div className="modal-body pt-3 pb-3">
                <h4 className="h2 mb-3">사유를 입력해주세요</h4>
                <textarea className="form-control" rows="4" name="OWP_ISSUE_REASON.REASON_CONTENT" onChange={this.handleChange}></textarea>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">취소</button>
                <button type="button" className="btn btn-primary" onClick={ () => this.updateStatusClick('DROP')}>확인</button>
            </div>
        </div>
    </div>
</div>
{/* 할당 */}
<div id="issueAssign" className="modal fade">
    <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
            <div className="modal-header">
                <div className="modal-title">할당</div>
                <button type="button" className="close" data-dismiss="modal">
                    <span>×</span>
                </button>
            </div>
            <div className="modal-body pt-3 pb-3">
                <ul className="nav mb-3">
                    <li className="nav-item">
                        <a className="nav-link active" href="#issueAssign-1" data-toggle="tab" onClick={ () => {this.clickAssign('1')} }>부서 할당</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#issueAssign-2" data-toggle="tab" onClick={ () => {this.clickAssign('2')} }>담당자 할당</a>
                    </li>
                </ul>
                <div className="tab-content">
                    <div id="issueAssign-1" className="tab-pane active">
                        {/* 셀렉트로 부서 검색 */}
                        <Select
                            isMulti
                            options={this.state.dept}
                            onChange={this.selectedChange1}
                            name=""
                            placeholder="Select"
                        />
                        <div className="modal-body pt-3 pb-3">
                            <h4 className="h2 mb-3">사유를 입력해주세요</h4>
                            <textarea className="form-control" rows="4" name="OWP_ISSUEDEPTASSIGN.REASON" onChange={this.handleChange}></textarea>
                        </div>
                    </div>
                    <div id="issueAssign-2" className="tab-pane">
                        {/* 담당자 검색 */}
                        <Select
                          isMulti
                          options={this.state.users}
                          name=""
                          placeholder="Select"
                          onChange={this.selectedChange2}
                        />
                    </div>
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">취소</button>
                <button type="button" className="btn btn-primary" onClick={this.issueAssign}>확인</button>
            </div>
        </div>
    </div>
</div>
{/* 삭제 */}
<div id="issueDelete" className="modal fade">
    <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
            <div className="modal-header">
                <div className="modal-title">삭제</div>
                <button type="button" className="close" data-dismiss="modal">
                    <span>×</span>
                </button>
            </div>
            <div className="modal-body pt-3 pb-3">
                <h4 className="h2 mb-3">사유를 입력해주세요</h4>
                <textarea className="form-control" rows="4" name="OWP_ISSUE_REASON.REASON_CONTENT" onChange={this.handleChange}></textarea>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">취소</button>
                <button type="button" className="btn btn-primary" onClick={ () => this.updateStatusClick('REMOVE')}>확인</button>
            </div>
        </div>
    </div>
</div>
		</React.Fragment>
    )
}