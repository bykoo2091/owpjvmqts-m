import React from 'react'
import { query,mutate,OwpPermitISSUE,OwpDept,commonCodes,OwpSession } from '@owp'
import { NavLink } from 'react-router-dom'
import moment from 'moment'
import Select from 'react-select';
import Swiper from 'swiper'
import $ from 'jquery'

const defaultJSON = { sidx : '`OWP_ISSUE.ISSUESEQ`' , sord : 'DESC'}

export default class Issue extends React.Component{
    constructor(props){
		super(props)
		this.state = { form: [], issues : [], users: [] , dept:[], assignType: '1', assignDept:[], clickableValue:''}
	}
	componentDidMount = () => {
        //이슈리스트
        query('listOwpIssue',defaultJSON).then(
        resp=> {
            this.setState({ issues : resp })
            // swiper
            var lstSwiper = new Swiper('.lst-board .swiper-container', {
                slidesPerView: 'auto',
            });
        }
      )

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
        // 권한과 속성 정의
        /* 등록요청과 검토프로세스에서만 수정화면
            국내엔지니어, 국내지역장 : IssueDetailModify1
            해외엔지니어 : IssueDetailModify2
            생관팀장 : IssueDetailModify3
            협력사, 구매담당자 : IssueDetailModify4
        */
        const pms = OwpSession('PERMISSIONID');
        if(pms==="D002002" || pms==="D002006") {
            this.setState({modifyUrl:'IssueModify1'})
        } else if(pms==="D002003" || pms==="D002007"){
            this.setState({modifyUrl:'IssueModify2'})
        } else if(pms==="D002004" || pms==="D002008"){
            this.setState({modifyUrl:'IssueModify3'})
        } else if(pms==="D002005" || pms==="D002009"){
            this.setState({modifyUrl:'IssueModify4'})
        }
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

    // api sender : 아직 안되었음 
    clickApiURGENCY = (key) => {
        var form = {};
        form['OWP_ISSUE.ISSUESEQ'] = key
        form['OWP_ISSUE.I_URGENCY_CD'] = this.state.form['OWP_ISSUE.I_URGENCY_CD'] === 'D015002' ? 'D015001' : 'D015002'
        return mutate('updateOwpIssue',form).then( () => {
            alert('변경되었습니다.')
        })
    }

    render = () => (
        <React.Fragment>
			<ul className="lst-board lst-swiper">
				{this.state.issues && this.state.issues.map( item=>
				<li key={item['OWP_ISSUE.ISSUESEQ']} onClick={ () => this.clickHandler(item['OWP_ISSUE.ISSUESEQ'])}>
                    <div className="swiper-container">
                        <div className="swiper-wrapper">
                            <div className="swiper-slide">
                                <NavLink to={`/IssueDetail/${item['OWP_ISSUE.ISSUESEQ']}`} className="link">
                                    <div className="h6">
                                        {item['OWP_CUSTOMER.CUSTOMERNM'] && <span>{item['OWP_CUSTOMER.CUSTOMERNM']}</span>}
                                        <span>{item['IPX_COMMONCODE.EQUIPMENTCD.CODENM']}
                                            {item['IPX_COMMONCODE.MODELCD.CODENM'] && '/'+item['IPX_COMMONCODE.MODELCD.CODENM'] }
                                            {item['OWP_FACODE.PRODUCT_CD.CODENM'] && '/'+item['OWP_FACODE.PRODUCT_CD.CODENM'] }
                                        </span>
                                        {item['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']==='Y' && <span className="float-right text-danger">나에게 할당된 이슈</span>}
                                    </div>
                                    <p className="title twoline">{item['OWP_ISSUE.I_TITLE']}</p>
                                    <ul className="list-inline lst-icon h6">
                                        <li className="list-inline-item">
                                            {item['OWP_ISSUE.I_URGENCY_CD']==='D015001' ? <i className="circle bg-danger"></i> : <i className="circle bg-muted"></i>}
                                            {(item['APPROVAL.APPROVAL_CUR_STATUSCD'] !== 'D016009' && item['APPROVAL.APPROVAL_CUR_STATUSCD'] !=='D016010') &&
                                                <span className="text-primary">{item['IPX_COMMONCODE.APPROVAL_CUR_STATUSCD.CODENM']}
                                                    {(item['OWP_ISSUE.I_STATUS_CD']==='D016002') && <b>({item['APPROVAL.APPROVAL_DEPTMANAGERASSIGN_CNT']}/{item['APPROVAL.APPROVAL_DEPTASSIGN_CNT']})</b>}
                                                </span>
                                            }
                                            {item['APPROVAL.APPROVAL_CUR_STATUSCD']==='D016009' &&
                                                <span className="text-danger">{item['IPX_COMMONCODE.APPROVAL_CUR_STATUSCD.CODENM']}</span>
                                            }
                                            {item['APPROVAL.APPROVAL_CUR_STATUSCD']==='D016010' &&
                                                <span className="text-danger">{item['IPX_COMMONCODE.APPROVAL_CUR_STATUSCD.CODENM']}</span>
                                            }
                                        </li>
                                        <li className="list-inline-item">
                                            <i className="icon-clock"></i>
                                            <span className="text-muted">{moment(item['OWP_ISSUE.WDATE']).format('YYYY.MM.DD HH:mm')}</span>
                                        </li>
                                        <li className="list-inline-item">
                                            <i className="icon-user"></i>
                                            <span className="text-muted">{item['OWP_ISSUE.WUSER_NAME_DEPT']}</span>
                                        </li>
                                        <li className="list-inline-item">
                                            <i className="icon-cmt"></i>
                                            <span className="text-muted">{item['OWP_COMMENT.COMMENT_CNT']}</span>
                                        </li>
                                    </ul>
                                </NavLink>
                                {/* 임시저장 : 바로 수정화면으로 */}
                                {item['OWP_ISSUE.I_STATUS_CD']==='D016013' &&
                                    <NavLink to={`/issueAdd${OwpPermitISSUE()}/${item['OWP_ISSUE.ISSUESEQ']}`} className="btn-modify text-hide">수정</NavLink>
                                }
                            </div>
                            <div className="swiper-slide btn-group issue-act">
                                {/* 긴급도 상태 변화에 따라 text-danger 클래스 변경*/}
                                <button type="button" className="no-style" onClick={ () => this.clickApiURGENCY(item['OWP_ISSUE.ISSUESEQ'])}><i className="xi-error-o"></i><b className="sr-only1">긴급도</b></button>
                                {/* 상단고정 변화에 따라 text-primary 클래스 변경*/}
                                <button type="button" className="no-style"><i className="xi-bookmark-o"></i><b className="sr-only1">상단고정</b></button>
                                {item['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']==='Y' && item['OWP_ISSUE.I_STATUS_CD']!=='D016001' && (OwpSession('RANKID')==='D004002' || OwpSession('RANKID')==='D004008') && <button type="button" className="no-style" data-toggle="modal" data-target="#issueAssign"><i className="xi-user-plus-o"></i><b className="sr-only1">할당</b></button>}
                                <button type="button" className="no-style" data-toggle="modal" data-target="#issueDelete"><i className="xi-trash-o"></i><b className="sr-only1">삭제</b></button>
                                <button type="button" className="no-style" data-toggle="modal" data-target="#issueDrop"><i className="xi-ban"></i><b className="sr-only1">드랍</b></button>
                            </div>
                        </div>
                    </div>
				</li>
				)}
			</ul>
            {(OwpPermitISSUE()==='D002002' || OwpPermitISSUE()==='D002003' || OwpPermitISSUE()==='D002004' || OwpPermitISSUE()==='D002005') &&
                <a href={'/issueAdd'+OwpPermitISSUE()} className="btn-quick no-style">New</a>
            }


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