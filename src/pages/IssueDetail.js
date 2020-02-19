import React from 'react'
import moment from 'moment'
import { query,mutate,line2Br,fileUrl,humanFileSize,OwpAttachFile,OwpSession,commonCodes,OwpPermitISSUE,OwpDept } from '@owp'
import { NavLink } from 'react-router-dom'
import Swiper from 'swiper'
import {PhotoSwipe} from 'react-photoswipe';
import 'react-photoswipe/lib/photoswipe.css';
import Select from 'react-select';
import $ from 'jquery'

export default class IssueDetail extends React.Component{
	constructor(props){
		super(props)
		this.state = { 
            form : {},
            isOpen: false,
            items: [],
            options: {},
            dept: [],
            assignDept: [],
            users: [],
            assignUser: [],
            assjgnType: '1',
            nowStatus: [],
            authlist: [],
            severity:[], eqValue :[],
            modifyUrl:'',
            initAssignDept: [],
            contactStatus:[],
            contactCmtOpen:true,
            authTeam:'disabled',
            authTeamQ:'disabled',
            authMember:'disabled',
            assignInfo: [],
        }
	}

    async componentDidMount () {
        // 로딩 시작 
        $('body').addClass('is-loading');

        //이슈상태(DROP,REMOVE,REJECT)
        await query(`loadNowIssueStatus/${this.props.match.params.no}`).then(resp=> {
          this.setState({nowStatus: {...resp} })
        })

      //이슈할당정보
      await query(`listIssueAssign/${this.props.match.params.no}`).then(resp=> {
        this.setState({assignInfo:resp}, ()=> {
          console.log(this.state.assignInfo)
        })
      })

        await query(`loadOwpIssue/${this.props.match.params.no}`).then(resp=> {
            this.setState({ form : {...resp} })
            commonCodes('D025000').then( resp=> this.setState({ severity : resp }))
            commonCodes('D023000').then( resp=> this.setState({ contactStatus : resp }))
            
            this.boardSwiper = new Swiper('.board-swiper-area .swiper-container', {
                pagination: {
                    el: '.swiper-pagination'
                }
            })
            this.reloadComment()
            let imgItems = this.state.form['FILES'].map( item=> {
                let img = new Image()
                img.src = fileUrl(item['IPX_FILE.FILESEQ'])
                // 이미지 넓이값을 넣어야 함
                img.onload = function(){
                    let w = this.naturalWidth,
                        h = this.naturalHeight
                }
                return {'src':fileUrl(item['IPX_FILE.FILESEQ']),'w':'100%','h':''}
            })
            this.setState({ items: imgItems })
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
            // 할당된 팀과 팀원 권한
            if(this.state.form['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']==='Y') {
                if((OwpSession('RANKID')==='D004002' || OwpSession('RANKID')==='D004008')) {
                    this.setState({authTeam:''})
                    if(OwpPermitISSUE()==='D002011' && this.state.form['OWP_ISSUE.I_STATUS_CD']==='D016003') this.setState({authTeamQ:''}) // 품질팀장
                } else if(OwpPermitISSUE()==='D002013' || OwpPermitISSUE()==='D002014'){
                    this.setState({authMember:''})
                }
            }
            // 담당자 입력부분 권한자 아니면 막기 
            //$('#collapse1 .form-control').attr('disabled','disabled')
            
            // 비어있는 항목 안보이게 처리
            $('.bx-form div.form-control').each(function(){
                var t = $(this),
                    group = t.closest('.form-group'),
                    bx = t.closest('.bx-form');
                bx.hide();
                if(!t.text()){
                    group.hide();
                } else {
                    bx.addClass('d-block');
                }
            });
        })

        //부서
        //commonCodes('A001001').then( resp=>  this.setState({ dept : resp }) )

        //부서${this.props.match.params.no}
        query(`listIpxCommoncode?jsondata=${JSON.stringify({'IPX_COMMONCODE.GROUPID':'A001001', 'IPX_COMMONCODE.ASSIGNDEPT':'1'})}`).then(resp=> {
          this.setState({dept:this.jsonKeyChange(resp,'IPX_COMMONCODE.CODEID','IPX_COMMONCODE.CODENM')})
        })

      //할당부서
      await  query(`listOwpIssuedeptassign?jsondata=${JSON.stringify({'OWP_ISSUEDEPTASSIGN.ISSUESEQ':this.props.match.params.no})}`).then(resp=> {
        this.setState({initAssignDept:this.jsonKeyChange(resp,'OWP_ISSUEDEPTASSIGN.DEPTCD','OWP_ISSUEDEPTASSIGN.DEPTCD_NM')}, () => {
          //console.log(JSON.stringify(this.state.initAssignDept))
        })
      })

        //담당자(사용자목록) - 할당자일때만
    var permissionid = OwpSession('PERMISSIONID')
    if( permissionid === "D002010" || permissionid === "D002011" || permissionid === "D002012" ||
        this.state.form['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']==='Y' //사용자 할당대상 유무
    )
    {
      query(`/listIPX_User_assignTarget/${OwpSession('DEPTID')}`).then( resp => {
        this.setState({users:this.jsonKeyChange(resp,'USERSEQ','USERNAME', 'DEPTID', 'RANKID_CODENM', 'DEPT_NM')})
      })
    }//



        //loading close
        $('body').removeClass('is-loading');
	}
	componentWillUnmount = () => {
        $('body').removeClass('is-loading');
    }

  jsonKeyChange = (json, id, name, deptCd, rank, deptNm) => {

    let colModified = json.map(
      obj => {
        return {
          "value": obj[id],
          "label" : obj[name] + ((rank != null && rank != '' && rank != undefined) ? ` (${obj[deptNm]} ${obj[rank]})` : ``),
          "deptCd" : obj[deptCd]
        }
      }
    )
    return colModified;
  }

    openPhotoSwipe = (e) => {
        e.preventDefault();
        this.setState({
            isOpen: true,
            options: {
                closeOnScroll: false
            }
        });
    };
    handleClose = () => {
        this.setState({
            isOpen: false
        });
    };

    handleChange = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        this.setState({
            form: { ...this.state.form, [name] : value}
        })
    }

    selectedChange1 = (selectedOption) => {
        this.setState({assignDept:selectedOption})
    }

    selectedChange2 = (selectedOption) => {
        this.setState({assignUser:selectedOption})
    }
    //검토완료
    //검토자 권한의 사용자가 해당 이슈의 상태를 검토 완료한다.
    ///updateOwpIssue-review-confirm
    //input parameter {"OWP_ISSUE.ISSUESEQ":"1111"}
    confirmClick = () => {
        let param = {};
        param["OWP_ISSUE.ISSUESEQ"] = this.props.match.params.no
        param["OWP_ISSUE_REASON.REASON_CONTENT"] = this.state.form["OWP_ISSUE_REASON.REASON_CONTENT"];
        return mutate(`updateOwpIssue-review-confirm`, param).then( () => {
            alert("검토완료");
            window.location.href = "/Issue";
            //$('.modal').modal('hide');
        })
    }

    //상태변경(status = "REMOVE, DROP, NM")
    //선택한 이슈를 REMOVE, DROP, REJECT 한다.
    //updateOwpIssue-chgStt/{STT_NM}
    //STT_NM : "REMOVE / DROP / REJECT" 중 하나(대문자)
    // body-key
    // - "OWP_ISSUE.ISSUESEQ" : 변경되는 대상 이슈 key
    // - "OWP_ISSUE.I_STATUS_CD" : 변경될 상태값
    // - "OWP_ISSUE_REASON.REASON_CONTENT" : 거절/드랍/숨김사유
    updateStatusClick = (status) => {
        let param = {};
        param["OWP_ISSUE.ISSUESEQ"] = this.props.match.params.no
        //param["OWP_ISSUE.I_STATUS_CD"] = "" <== STT_NM 으로 대체
        param["OWP_ISSUE_REASON.REASON_CONTENT"] = this.state.form["OWP_ISSUE_REASON.REASON_CONTENT"];
        return mutate(`updateOwpIssue-chgStt/`+status, param).then( () => {
            alert(status+" 완료");
            window.location.href = "/Issue";
            //$('.modal').modal('hide');
        })
    }

    modalOpenClick = () => {
        this.setState({...this.state.form, ['OWP_ISSUE_REASON.REASON_CONTENT'] : ''})
    }

    // 복원 - 현재 사유입력 부분이 없음 
    restoreClick = () => {
        let param = {};
        param["OWP_ISSUE.ISSUESEQ"] = this.props.match.params.no
        param["OWP_ISSUE_REASON.REASON_CONTENT"] = this.state.form["OWP_ISSUE_REASON.REASON_CONTENT"];
        return mutate(`updateOwpIssue-restore-status/`, param).then( () => {
            alert('복원되었습니다');
            window.location.href = "/Issue";
            //$('.modal').modal('hide');
        })
    }

    clickAssign = (assignType) => {
        this.setState({assignType})
    }

    //할당
    issueAssign = () => {

        let arrayData = new Array();

        let assignType = this.state.assignType;

        if(assignType === null || assignType === undefined || assignType === '' ){
          assignType = '1'
        }

        //1.부서할당
        if(assignType === '1') {

            this.state.assignDept.forEach( item => {

                let jsonData = new Object();
                jsonData["OWP_ISSUEDEPTASSIGN.STATUS"] = 'CREATE'
                jsonData["OWP_ISSUEDEPTASSIGN.ISSUESEQ"] = this.props.match.params.no
                jsonData["OWP_ISSUEDEPTASSIGN.DEPTCD"] = item['value']
                jsonData["OWP_ISSUEDEPTASSIGN.WUSERSEQ"] = OwpSession('USERSEQ')
                jsonData["OWP_ISSUEDEPTASSIGN.FLAG"] = 'Y'
                jsonData["OWP_ISSUEDEPTASSIGN.PAGEID"] = ''

                arrayData.push(jsonData)
            })


            var params = new Object;
            params.PARAMNAME = arrayData;

            return mutate('processOwpIssuedeptassign/PARAMNAME',params).then( () => {
                alert('저장되었습니다.')
                window.location.href = "/Issue";
                //$('.modal').modal('hide');
            })
        }

        //2.부서담당자 할당
        if(assignType == '2') {

            this.state.assignUser.forEach( item => {

                let jsonData = new Object();
                //담당자 할당 파라미터
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.STATUS"] = 'CREATE'
                jsonData["OWP_ISSUEDEPTMANAGERASSIGN.ISSUESEQ"] = this.props.match.params.no
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
                window.location.href = "/Issue";
                //$('.modal').modal('hide');
            })

        }

    }

  // api sender
    clickApiURGENCY = () => {
        var form = {};
        form['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no
        if(this.state.form['OWP_ISSUE.I_URGENCY_CD']==='D015002'){
            form['OWP_ISSUE.I_URGENCY_CD'] = 'D015001'
            this.setState({
                form: { ...this.state.form,['OWP_ISSUE.I_URGENCY_CD'] : 'D015001'}
            })
        } else {
            form['OWP_ISSUE.I_URGENCY_CD'] = 'D015002'
            this.setState({
                form: { ...this.state.form,['OWP_ISSUE.I_URGENCY_CD'] : 'D015002'}
            })
        }
        return mutate('updateOwpIssue',form).then( () => {
            alert('변경되었습니다.')
        })
    }
    // 설변
    clickApiSUBUN = (e) => {
        const name = e.target.name;
        const value = e.target.value;
        this.setState({
            form: { ...this.state.form, [name] : value}
        })
        var form = {};
        form['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no
        form['OWP_ISSUE.SUBUN_YN'] = value
        return mutate('updateOwpIssue',form).then( () => {
            alert('변경되었습니다.')
        })
    }
    clickApiSUBUNECO = () => {
        var form = {};
        form['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no
        form['OWP_ISSUE.SULBYUN_ECO'] = this.state.form['OWP_ISSUE.SULBYUN_ECO']
        return mutate('updateOwpIssue',form).then( () => {
            alert('변경되었습니다.')
        })
    }
    clickApiFINAL = () => {
        var form = {};
        form['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no
        form['OWP_ISSUE.FINALRST'] = this.state.form['OWP_ISSUE.FINALRST']
        // 파일처리하는 부분 넣어야 
        
        return mutate('updateOwpIssue',form).then( () => {
            alert('변경되었습니다.')
        })
    }
    clickApiCS = () => {
        var form = {};
        form['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no
        form['OWP_ISSUE.CSRESPONSE_FLAG'] = 'Y'
        form['OWP_ISSUE.CSRESPONSE_WDATE'] = moment().format('YYYY.MM.DD HH:mm')
        form['OWP_ISSUE.CSRESPONSE_COMMENT'] = this.state.form['OWP_ISSUE.CSRESPONSE_COMMENT']
        // 파일처리하는 부분 넣어야 
        
        return mutate('updateOwpIssue',form).then( () => {
            alert('변경되었습니다.')
        })
    }
    clickApiQC = () => {
        var form = {};
        form['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no
        form['OWP_ISSUE.I_SEVERITY'] = this.state.form['OWP_ISSUE.I_SEVERITY']
        form['OWP_ISSUE.I_DETECTION'] = this.state.form['OWP_ISSUE.I_DETECTION']
        form['OWP_ISSUE.APPROVALRSN'] = this.state.form['OWP_ISSUE.APPROVALRSN']
        form['OWP_ISSUE.I_STATUS_CD'] = 'D016004'
        return mutate('updateOwpIssue',form).then( () => {
            alert('변경되었습니다.')
        })
    }

    //담당자이력
  contactClick = () => {
      var form = {};
      form['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no
      form['OWP_ISSUE.CONTACTSTATUS'] =this.state.form['OWP_ISSUE.CONTACTSTATUS']
      form['OWP_ISSUE.CONTACTRST'] =this.state.form['OWP_ISSUE.CONTACTRST']
      //form['CONTACTFILESEQ'] = this.state.form['CONTACTFILESEQ'] 파일 넣어야함

      return mutate('updateOwpIssue',form).then( () => {
      alert('변경되었습니다.')

    })
  }


// comment
    reloadComment = ()=> {
        let params = {
            'OWP_COMMENT.ISSUESEQ' : this.state.form['OWP_ISSUE.ISSUESEQ'].toString()
        }
        query(`listOWP_COMMENTOrdered?jsondata=${JSON.stringify(params)}`).then( resp=> this.setState({ comments : resp}))
    }
    createOwpComment = (message,commentSeq)=> {
        if(!message) return
        var files = !commentSeq ? this.state.cmtFile : []
        let params = {
            'OWP_COMMENT.ISSUESEQ' : this.state.form['OWP_ISSUE.ISSUESEQ'].toString(),
            'OWP_COMMENT.C_CONTENT' : message,
            'OWP_COMMENT.FLAG' : 'Y',
            'OWP_COMMENT.WUSERSEQ' : OwpSession('USERSEQ'),
            'OWP_COMMENT.COMMENTPARENTSEQ' : commentSeq ? commentSeq.toString() : '',
            'FILES' : files
        }
        return mutate('createOwpComment',params).then( (resp)=> {
            this.setState({ inputComment : '' , cmtFile : [] })
            this.reloadComment()
        })
    }
    commentList = (type)=> {
        var comments = []
        if(type === 'ALL'){
            comments = this.state.comments
        }else if(type === 'COMMENTS'){
            comments = this.state.comments
        }else if(type === 'HISTORY'){
            comments = []
        }
        return (
            <React.Fragment>
            <ul className="comment">
                { (comments && comments.length !== 0) && comments.map((item,index) => (
                <React.Fragment key={index}>
                <li>
                    <div className="name">{item['IPX_USER.USERNAME']}</div>
                    <div className="txt">{item['OWP_COMMENT.C_CONTENT']}</div>
                    { item['FILES'] && item['FILES'].length !== 0 && 
                        <button type="button" className="no-style" title="File" onClick={ ()=> {
                        this.state.comments[index].isAttchOpen = !this.state.comments[index].isAttchOpen
                        this.setState({ comments : [...this.state.comments]})
                        }}><i className="xi-paperclip"></i></button>
                    }
                    <button type="button" className="no-style" title="Re-comment" onClick={ ()=> {
                        this.state.comments[index].isOpenChild = !this.state.comments[index].isOpenChild
                        this.setState({ comments : [...this.state.comments]})
                    }}><i className="xi-speech-o"></i></button>
                    <div className="date text-muted">{moment(item['OWP_COMMENT.WDATE']).format('YYYY.MM.DD HH:mm')}</div>
                    { item.isOpenChild &&
                        <div className="cmt-re-wrt row">
                            <div className="col">
                                <div className="form-control-icon">
                                    <textarea className="form-control" name="inputComment" onChange={ e=> 
                                        this.setState({ ['inputComment'+index] : e.target.value })
                                        }></textarea>
                                </div>
                            </div>
                            <div className="col-auto">
                                <button type="button" className="btn btn-sm btn-primary pr-2 pl-2" onClick={ ()=> {
                                    this.createOwpComment(this.state['inputComment'+index],item['OWP_COMMENT.COMMENTSEQ'].toString())
                                    this.setState( { ['inputComment' + index] : '' })
                                    }}><span className="h5">등록</span></button>
                            </div>
                        </div>
                    }
                    { item.isAttchOpen &&
                    <div className="cmt-re-wrt bx-file">
                        <ul> 
                            {
                            item['FILES'].map( file=> (
                            <li key={file['IPX_FILE.FILESEQ'].toString()}>
                            <a href={fileUrl(file['IPX_FILE.FILESEQ'])} target="_blank" rel="noopener noreferrer"><span className="file-size">{humanFileSize(file['IPX_FILE.FILESIZE'])}</span> {file['IPX_FILE.FILENAMEREAL']}</a>
                            </li>
                            ))
                            }
                        </ul>
                    </div>
                    }
                </li>
                { item['CHILDS'] && item['CHILDS'].map( item2 => (
                <li key={item2['OWP_COMMENT.COMMENTSEQ']} className="cmt">
                    <div className="icon"><i className="xi-subdirectory-arrow"></i></div>
                    <div className="name">{item2['IPX_USER.USERNAME']}</div>
                    <div className="txt">{item2['OWP_COMMENT.C_CONTENT']}</div>
                    <div className="date text-muted">{moment(item2['OWP_COMMENT.WDATE']).format('YYYY.MM.DD HH:mm')}</div>
                </li>
                ))}
                </React.Fragment>
                ))}
                { (!comments || comments.length === 0) && 
                    <li className="justify-content-center">내용이 없습니다.</li>
                }
            </ul>
            <div className="form-group row mt-3">
                <div className="col">
                    <div className="form-control-icon">
                        <textarea className="form-control" name="inputComment" onChange={ e=> this.setState({ inputComment : e.target.value }) } value={this.state.inputComment || ''}></textarea>
                        <button type="button" className="no-style rt h6" onClick={ ()=> this.setState({ isCmtFileOpen : !this.state.isCmtFileOpen}) }>
                            <img src="../img/icon/icon_clip2.png" height="20" alt="첨부하기"/>
                        </button>
                    </div>
                </div>
                <div className="col-auto">
                    <button type="button" className="btn btn-sm btn-primary pr-2 pl-2" onClick={ ()=> this.createOwpComment(this.state.inputComment)}><span className="h5">등록</span></button>
                </div>
            </div>
            { this.state.isCmtFileOpen && 
            <div className="commentFilebox">
                <OwpAttachFile TableName="OWP_COMMENT" PageID="C102010" Attachs={this.state.cmtFile} onChange={ attach=> this.setState({ cmtFile : [...attach]})}/>
            </div>
            }
        </React.Fragment>
        )
    }

    render = () => (
        <React.Fragment>
			<div className="container pb-3 bg-wh">
				<div className="text-right pt-3 issue-act">
                    {/* 클릭 시 : 긴급도 변경 */}
					<button type="button" className="no-style" onClick={ () => this.clickApiURGENCY()}>{this.state.form['OWP_ISSUE.I_URGENCY_CD']==='D015001' ? <i className="xi-error-o text-danger"></i> : <i className="xi-error-o text-muted"></i>}<b className="sr-only1">긴급도</b></button>
                    {/* 클릭 시 : 상단고정 변경*/}
					<button type="button" className="no-style"><i className="xi-bookmark-o text-primary"></i><b className="sr-only1">상단고정</b></button>
                    {/* 1. 팀장(직책이 이사 포함) 2. 연구팀장은 자기에게 할당된 것만 */}
                    {this.state.form['OWP_ISSUE.I_STATUS_CD']!=='D016001' && (OwpSession('RANKID')==='D004002' || OwpSession('RANKID')==='D004008') &&
					   <button type="button" className="no-style" data-toggle="modal" data-target="#issueAssign" onClick={this.modalOpenClick}><i className="xi-user-plus-o"></i><b className="sr-only1">할당</b></button>
                    }
                    {/* 삭제/드랍과 복원은 서로 반대로 */}
                    {(this.state.form['OWP_ISSUE.FLAG']==='Y' && this.state.form['OWP_ISSUE.DROP_FLAG']==='N') &&
                        <React.Fragment>
                        <button type="button" className="no-style" data-toggle="modal" data-target="#issueDelete" onClick={this.modalOpenClick}><i className="xi-trash-o"></i><b className="sr-only1">삭제</b></button>
                        {(OwpPermitISSUE()!=='D002002' && OwpPermitISSUE()!=='D002003' && OwpPermitISSUE()!=='D002004' && OwpPermitISSUE()!=='D002005') && <button type="button" className="no-style" data-toggle="modal" data-target="#issueDrop" onClick={this.modalOpenClick}><i className="xi-ban"></i><b className="sr-only1">드랍</b></button>}
                        </React.Fragment>
                    }
                    {(this.state.form['OWP_ISSUE.FLAG']!=='Y' || this.state.form['OWP_ISSUE.DROP_FLAG']!=='N') &&
					   <button type="button" className="no-style" data-toggle="modal" data-target="#issueRestore" onClick={this.modalOpenClick}><i className="xi-renew"></i><b className="sr-only1">복원</b></button>
                    }
				</div>
				<div className="pt-2 pb-2">
					<div className="h6">
                        {this.state.form['OWP_CUSTOMER.CUSTOMERFULLNM'] && <span className="mr-2">{this.state.form['OWP_CUSTOMER.CUSTOMERFULLNM']}</span>}
						<span className="mr-2">ISSUE NO. {this.state.form['OWP_ISSUE.ISSUESEQ']}</span>
                        {this.state.form['OWP_ISSUE.JVS_CODE'] && <span>JVS. {this.state.form['OWP_ISSUE.JVS_CODE']}</span>}
                        {this.state.form['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']==='Y' && <span className="float-right text-danger">나에게 할당된 이슈</span>}
					</div>
					<p className="font-weight-bold mt-1 mb-1">{this.state.form['OWP_ISSUE.I_TITLE']}</p>
					<ul className="list-inline lst-icon h6">
						<li className="list-inline-item">
                            {(this.state.nowStatus['AFTSTATUSCD'] !== 'D016009' && this.state.nowStatus['AFTSTATUSCD'] !=='D016010') &&
                            <span className="text-primary">{this.state.nowStatus['AFTSTATUSCD_NM']}
                                {(this.state.form['OWP_ISSUE.I_STATUS_CD']==='D016002') && <b>({this.state.form['APPROVAL.APPROVAL_DEPTMANAGERASSIGN_CNT']}/{this.state.form['APPROVAL.APPROVAL_DEPTASSIGN_CNT']})</b>}
                            </span>
                            }
                            {this.state.nowStatus['AFTSTATUSCD']==='D016009' &&
                            <span className="text-danger">REJECT</span>
                            }
                            {this.state.nowStatus['AFTSTATUSCD']==='D016010' &&
                            <span className="text-danger">DROP</span>
                            }
						</li>
						<li className="list-inline-item">
							<i className="icon-clock"></i>
							<span className="text-muted">{moment(this.state.form['OWP_ISSUE.WDATE']).format('YYYY.MM.DD HH:mm')}</span>
						</li>
						<li className="list-inline-item">
							<i className="icon-user"></i>
							<span className="text-muted">{this.state.form['IPX_USER.USERNAME']}/{this.state.form['IPX_COMMONCODE.DEPTID.CODENM']}</span>
						</li>
						<li className="list-inline-item">
							<i className="icon-cmt"></i>
							<span className="text-muted">{this.state.form['OWP_COMMENT.COMMENT_CNT']}</span>
						</li>
					</ul>
				</div>
				<hr/>
				<div className="board-detail">
                    <div className="content" dangerouslySetInnerHTML={ {__html: line2Br(this.state.form['OWP_ISSUE.I_CONTENT']) } }></div>
                    {this.state.form['FILES'] &&
                    <div className="board-swiper-area">
                        <div className="swiper-container">
                            <div className="swiper-wrapper">
                                {this.state.form['FILES'].map( item=>
                                    <React.Fragment key={item['IPX_FILE.FILESEQ']}>
                                        {item['IPX_FILE.FILETYPE'].indexOf('image')>-1 ? <div className="swiper-slide"><img className="img-fluid" src={fileUrl(item['IPX_FILE.FILESEQ'])} alt="" onClick={this.openPhotoSwipe} /></div> : ''}
                                        {item['IPX_FILE.FILETYPE'].indexOf('video')>-1 ? <div className="swiper-slide"><video controls="controls" className="img-fluid" webkit-playsinline="" playsinline=""><source src={fileUrl(item['IPX_FILE.FILESEQ'])} type="video/mp4" /></video></div> : ''}
                                    </React.Fragment>
                                )}
                            </div>
                            <div className="swiper-pagination"></div>
                        </div>
                    </div>
                    }
                    <PhotoSwipe isOpen={this.state.isOpen} items={this.state.items} options={this.state.options} onClose={this.handleClose}/>
				</div>
                {/* 이슈정보(외부고객) - 검토자는 장비군 등 수정가능 */}
                <div className="bx-form type2 mt-3">
					<div className="form-group row">
						<span className="col-3 col-form-label">장비군</span>
						<div className="col-9">
                            <div className="form-control">{this.state.form['IPX_COMMONCODE.EQUIPMENTCD.CODENM']}</div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">모델군</span>
						<div className="col-9">
                            <div className="form-control">{this.state.form['IPX_COMMONCODE.MODELCD.CODENM']}</div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">모델명</span>
						<div className="col-9">
                            <div className="form-control">{this.state.form['OWP_FACODE.MODEL_NM']}</div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">고장일자</span>
						<div className="col-9">
							<div className="form-control-icon">
                                <div className="form-control">{this.state.form['OWP_ISSUE.FAULT_DATE']}</div>
                            </div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">장비 호기</span>
						<div className="col-9">
							<div className="form-control">{this.state.form['OWP_ISSUE.EQUIPMENT_NO']}</div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">장비 SN번호</span>
						<div className="col-9">
							<div className="form-control">{this.state.form['OWP_ISSUE.EQUIPMENT_SN']}</div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">JVS 접수번호</span>
						<div className="col-9">
							<div className="form-control">{this.state.form['OWP_ISSUE.JVS_NO']}</div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">JVS 접수일자</span>
						<div className="col-9">
							<div className="form-control">{this.state.form['OWP_ISSUE.JVS_DATE']}</div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">JVS 증상코드</span>
						<div className="col-9">
							<div className="form-control">{this.state.form['OWP_ISSUE.JVS_CODE']}</div>
						</div>
					</div>
                    {/* 이슈정보(해외) */}
                    <div className="form-group row align-items-center">
                        <span className="col-3 col-form-label">Customer/<br />Location</span>
                        <div className="col-9">
							<div className="form-control">{this.state.form['OWP_ISSUE.CUSTOMERLOCATION']}</div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">Trobleshooting<br />history</span>
                        <div className="col-9">
							<div className="form-control">{this.state.form['OWP_ISSUE.TROBLESHOOTING']}</div>
                        </div>
                    </div>
				</div>
                <div className="bx-form type2 mt-3">
                    {/* 이슈정보(생산) - 생산라인 검토자(생기/생관 팀장) 보이고 수정가능 */}
                    <div className="form-group row align-items-center">
                        <span className="col-3 col-form-label">문제점 구분</span>
                        <div className="col-9">
							<div className="form-control">{this.state.form['IPX_COMMONCODE.PROBLEM_C_PROD_CD.CODENM']}</div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">공정명</span>
                        <div className="col-9">
							<div className="form-control">{this.state.form['IPX_COMMONCODE.PROCESS_NM_CD.CODENM']}</div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">원인</span>
                        <div className="col-9">
							<div className="form-control">{this.state.form['IPX_COMMONCODE.I_CAUSE_CD.CODENM']}</div>
                        </div>
                    </div>
				</div>
                {/* 이슈정보(구매) - 구매라인 검토자(구매 담당자-부서전원) 보이고 수정가능 */}
                <div className="bx-form type2 mt-3">
                    <div className="form-group row align-items-center">
                        <span className="col-3 col-form-label">문제점 구분</span>
                        <div className="col-9">
							<div className="form-control">{this.state.form['IPX_COMMONCODE.PROBLEM_C_PUR_CD.CODENM']}</div>
                        </div>
                    </div>
                    <div className="form-group row align-items-center">
                        <span className="col-3 col-form-label">개발/양산구분</span>
                        <div className="col-9">
							<div className="form-control">{this.state.form['IPX_COMMONCODE.D_M_TYPE_CD.CODENM']}</div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">공법</span>
                        <div className="col-9">
							<div className="form-control">{this.state.form['IPX_COMMONCODE.I_METHOD_CD.CODENM']}</div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">품번</span>
                        <div className="col-9">
                            <div className="form-control">{this.state.form['OWP_ISSUE.PRODUCT_NO']}</div>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">품명</span>
                        <div className="col-9">
                            <div className="form-control">{this.state.form['OWP_ISSUE.PRODUCT_NM']}</div>
                        </div>
                    </div>
				</div>
                {/* 이슈설명 */}
                {this.state.form['FILES'] &&
                <div className="bx-file">
                    {this.state.form['FILES'].map( item=>
                        <React.Fragment key={fileUrl(item['IPX_FILE.FILESEQ'])}>
                            {item['IPX_FILE.FILETYPE'].indexOf('image')<0 && item['IPX_FILE.FILETYPE'].indexOf('video')<0 ? <a href={fileUrl(item['IPX_FILE.FILESEQ'])} target="_blank" rel="noopener noreferrer">{item['IPX_FILE.FILENAMEREAL']}</a> : ''}
                        </React.Fragment>
                    )}
                </div>
                }
                {/* 등록요청사항 */}
                <div className="bx-form type2 mt-3">
					<div className="form-group row">
						<span className="col-3 col-form-label">장비교체요청</span>
						<div className="col-9">
                            <div className="form-control">{this.state.form['OWP_ISSUE.EQUIP_REPLACE_YN']}</div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">희망처리일자</span>
						<div className="col-9">
                            <div className="form-control">{ this.state.form['OWP_ISSUE.I_DUE_DATE'] }</div>
						</div>
					</div>
				</div>
                {/* 상세 더보기 - PC의 우측 영역 */}
				<button type="button" className="btn btn-sm btn-block btn-outline-muted collapsed mt-3" data-toggle="collapse" data-target="#collapse1"><span className="h5">상세정보 더보기 <i className="xi-angle-down-thin"></i></span></button>
				<div id="collapse1" className="collapse-wrp collapse mt-3">
					<div className="bx-form type2">
						<div className="form-group row">
							<div className="col-2 col-form-label">설변</div>
							<div className="col-10">
								<select className="form-control" name="OWP_ISSUE.SUBUN_YN" value={this.state.form['OWP_ISSUE.SUBUN_YN']} onChange={this.clickApiSUBUN} disabled={this.state['authMember']}>
									<option>설변여부</option>
									<option value="Y">설변중</option>
									<option value="F">설변완료</option>
								</select>
							</div>
				        </div>
						<div className="form-group row">
							<div className="col-2 col-form-label">설변 ECO</div>
							<div className="col">
                                <input type="text" className="form-control" name="OWP_ISSUE.SULBYUN_ECO" onChange={this.handleChange} value={ this.state.form['OWP_ISSUE.SULBYUN_ECO'] } placeholder="설변 ECO"  disabled={this.state['authMember']} />
							</div>
							<div className="col-2" disabled={this.state['authMember']}>
                                <button type="button" className="btn btn-block btn-sm btn-dark" onClick={ ()=> this.clickApiSUBUNECO() }>등록</button>
                            </div>
						</div>
					</div>
					<div className="bx-form type2 mt-2">
						<h4 className="h5 font-weight-normal mb-2">부서/담당자</h4>
                        <table className="tb tb-fixed text-center">
                            <thead>
                                <tr>
                                    <th>일자</th>
                                    <th>할당된 부서</th>
                                    <th>할당된 담당자</th>
                                    <th>할당한 부서</th>
                                    <th>할당한 담당자</th>
                                </tr>
                            </thead>
                            <tbody>
                            { this.state.assignInfo.map( item =>
                                <tr key={item.value}>
                                    <td>{moment(item['MANAGER_WDATE']).format('YYYY.MM.DD HH:mm')}</td>
                                    <td>{item['MANAGER_DEPT_NM']}</td>
                                    <td>{item['MANAGER_USER_NM']}</td>
                                    <td>{item['W_DEPT_NM']}</td>
                                    <td>{item['W_USER_NM']}</td>
                                </tr>
                            )}
                                {/* 내용이 없는 경우 */}
                                {this.state.assignInfo.length <= 0 &&
                                <tr>
                                    <td className="text-center" colSpan="5">내용이 없습니다</td>
                                </tr>
                                }
                            </tbody>
                        </table>
					</div>
                    {/* 담당자 이력 */}
					<div className="bx-form type2 mt-2">
				        <h4 className="h5 font-weight-normal mb-2">
                            담당자 이력
                            <button type="button" className="btn btn-h5 btn-sm btn-dark" onClick={ ()=> this.setState({ contactCmtOpen : !this.state.contactCmtOpen }) } disabled={this.state['disabled4']}>이력 추가</button>
                        </h4>
                        {!this.state.contactCmtOpen &&
                        <div className="bx-result row">
                            <div className="col-12">
								<select className="form-control form-control-sm mb-1 col-4" name="OWP_ISSUE.CONTACTSTATUS" value={this.state.form['OWP_ISSUE.CONTACTSTATUS']} onChange={this.handleChange}>
									<option>처리 유형</option>
                                    {this.state.contactStatus.map( item=> 
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    )}
								</select>
                            </div>
                            <div className="col"><textarea className="form-control" name="OWP_ISSUE.CONTACTRST" value={this.state.form['OWP_ISSUE.CONTACTRST']} onChange={this.handleChange} rows="2" placeholder="내용을 입력해주세요."></textarea></div>
                            <div className="col-auto"><button type="button" className="btn btn-sm btn-dark" onClick={this.contactClick} >등록</button></div>
                            <div className="col-12">
                                <OwpAttachFile TableName="OWP_ISSUE" PageID="C102031" Attachs={ !this.state.form['CONTACTFILESEQ'] ? [] : this.state.form['CONTACTFILESEQ']} onChange={ attach=> {
                                    var form = this.state.form
                                    form['CONTACTFILESEQ'] = attach
                                    this.setState({ form : form})
                                }}/>
                            </div>
                        </div>
                        }
                        <ul className="lst-result">
                            <li>
                                <div className="meta">
                                    <span className="date">2019.12.11 11:00</span>
                                    <b>처리완료</b>
                                    <span className="name">김현중 (설계1팀)</span>
                                    {/* 클릭시 아래 파일첨부 박스 열림 */}
                                    <button type="button" className="no-style float-right" title="File"><i className="xi-paperclip"></i></button>
                                </div>
                                {/*
                                <div className="bx-file">
                                    <ul>
                                        <li><a href="http://219.248.158.153:8080/FileStream?pisnetFileSeq=330" target="_blank" rel="noopener noreferrer"><span className="file-size">162.3 kB</span> 202002_type1_1920.jpg</a></li>
                                    </ul>
                                </div>
                                */}
                                <div className="txt">코멘트 내용입니다. 코멘트 내용입니다.</div>
                            </li>
                            <li>
                                <div className="meta">
                                    <span className="date">2019.12.11 11:00</span>
                                    <b>처리완료</b>
                                    <span className="name">김현중 (설계1팀)</span>
                                    {/* 클릭시 아래 파일첨부 박스 열림 */}
                                    <button type="button" className="no-style float-right" title="File"><i className="xi-paperclip"></i></button>
                                </div>
                                {/*
                                <div className="bx-file">
                                    <ul>
                                        <li><a href="http://219.248.158.153:8080/FileStream?pisnetFileSeq=330" target="_blank" rel="noopener noreferrer"><span className="file-size">162.3 kB</span> 202002_type1_1920.jpg</a></li>
                                    </ul>
                                </div>
                                */}
                                <div className="txt">코멘트 내용입니다. 코멘트 내용입니다.</div>
                            </li>
                        </ul>
					</div>
                    {/* 최종 결과 : 품질팀장만 */}
					<div className="bx-form type2 mt-2">
				        <h4 className="h5 font-weight-normal mb-2">최종 결과</h4>
{/* 임시 {this.state.form['OWP_ISSUE.I_STATUS_CD']==='D016003' && OwpPermitISSUE()==='D002011' && */}
                        {OwpPermitISSUE()==='D002011' &&
						<div className="bx-result row">
                            <div className="col"><textarea className="form-control" name="OWP_ISSUE.FINALRST" rows="2" value={this.state.form['OWP_ISSUE.FINALRST']} onChange={this.handleChange} placeholder="내용을 입력해주세요."></textarea></div>
                            <div className="col-auto"><button type="button" className="btn btn-sm btn-dark" onClick={ ()=> this.clickApiFINAL() }>등록</button></div>
                            <div className="col-12">
                                <OwpAttachFile TableName="OWP_ISSUE" PageID="C102031" Attachs={ !this.state.form['FINALFILESEQ'] ? [] : this.state.form['FINALFILESEQ']} onChange={ attach=> {
                                    var form = this.state.form
                                    form['FINALFILESEQ'] = attach
                                    this.setState({ form : form})
                                }}/>
                            </div>
						</div>
                        }
                        {/* 임시 {(this.state.form['OWP_ISSUE.I_STATUS_CD']!=='D016003' || OwpPermitISSUE()!=='D002011') && */}
                        {OwpPermitISSUE()!=='D002011' &&
						<div className="bx-result">
                            <textarea className="form-control" rows="2" value={this.state.form['OWP_ISSUE.FINALRST']} readOnly></textarea>
                            {/* 첨부파일 출력 */}
                            <div className="bx-file">
                                <ul>
                                    <li><a href="http://219.248.158.153:8080/FileStream?pisnetFileSeq=330" target="_blank" rel="noopener noreferrer"><span className="file-size">162.3 kB</span> 202002_type1_1920.jpg</a></li>
                                </ul>
                            </div>
						</div>
                        }
					</div>
                    {/* 고객 대응 완료 */}
					<div className="bx-form type2 mt-2">
				        <h4 className="h5 font-weight-normal mb-2">고객 대응 완료</h4>
                        {this.state.form['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']==='Y' && (OwpPermitISSUE()==='D002013' || OwpPermitISSUE()==='D002014') &&
						<div className="bx-result row">
                            <div className="col"><textarea className="form-control" name="OWP_ISSUE.CSRESPONSE_COMMENT" rows="2" value={this.state.form['OWP_ISSUE.CSRESPONSE_COMMENT']} onChange={this.handleChange} placeholder="내용을 입력해주세요."></textarea></div>
                            <div className="col-auto"><button type="button" className="btn btn-sm btn-dark" onClick={ ()=> this.clickApiCS() }>등록</button></div>
                            <div className="col-12">
                                <OwpAttachFile TableName="OWP_ISSUE" PageID="C102031" Attachs={ !this.state.form['aaa'] ? [] : this.state.form['aaa']} onChange={ attach=> {
                                    var form = this.state.form
                                    form['aaa'] = attach
                                    this.setState({ form : form})
                                }}/>
                            </div>
						</div>
                        }
                        {this.state.form['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']!=='Y' && (OwpPermitISSUE()!=='D002013' && OwpPermitISSUE()!=='D002014') &&
						<div className="bx-result">
                            <textarea className="form-control" rows="2" value={this.state.form['OWP_ISSUE.CSRESPONSE_COMMENT']} readOnly></textarea>
                            {/* 첨부파일 출력 */}
                            <div className="bx-file">
                                <ul>
                                    <li><a href="http://219.248.158.153:8080/FileStream?pisnetFileSeq=330" target="_blank" rel="noopener noreferrer"><span className="file-size">162.3 kB</span> 202002_type1_1920.jpg</a></li>
                                </ul>
                            </div>
						</div>
                        }
					</div>
					<div className="bx-form type2 mt-2">
						<p className="h5 font-weight-normal mb-2">DFMEA 링크</p>
						<table className="tb tb-fixed">
							<colgroup>
								<col width="90px"/>
								<col/>
								<col width="60px"/>
								<col width="70px"/>
							</colgroup>
							<thead>
								<tr>
									<th>DFMEA 번호</th>
									<th>부품 및 도번</th>
									<th>작성자</th>
									<th>작성일</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>DFMEA</td>
									<td>부품-xxxxxxxx</td>
									<td>홍길동</td>
									<td>2019.11.07</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div className="bx-form type2 mt-2">
						<div className="form-group row">
							<div className="col-3 col-form-label">이슈심각도</div>
							<div className="col-9">
                                <select className="form-control" name="OWP_ISSUE.I_SEVERITY" value={this.state.form['OWP_ISSUE.I_SEVERITY']} onChange={this.handleChange} disabled={this.state['authTeamQ']}>
                                    <option>Select</option>
                                    { this.state.severity.map( item=> 
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    )}
                                </select>
							</div>
						</div>
						<div className="form-group row align-items-center">
							<div className="col-3 col-form-label">품질 검사항목 검출유무</div>
							<div className="col-9">
								<select className="form-control" name="OWP_ISSUE.I_DETECTION" value={this.state.form['OWP_ISSUE.I_DETECTION']} onChange={this.handleChange} disabled={this.state['authTeamQ']}>
                                    <option>Select</option>
									<option value="D024001">Y</option>
									<option value="D024002">N</option>
								</select>
							</div>
						</div>
						<div className="form-group row">
							<div className="col-3 col-form-label">품질승인사유</div>
							<div className="col-9">
								<textarea className="form-control" name="OWP_ISSUE.APPROVALRSN" value={this.state.form['OWP_ISSUE.APPROVALRSN']} rows="5" placeholder="내용을 입력해주세요." onChange={this.handleChange} disabled={this.state['authTeamQ']}></textarea>
							</div>
						</div>
						<div className="form-group mt-2" disabled={this.state['authTeamQ']}>
                            <button type="button" className="btn btn-sm btn-dark btn-block" onClick={ ()=> this.clickApiQC() }>등록</button>
						</div>
					</div>
				</div>
                {/* 외부자X */}
                {(OwpPermitISSUE()!=='D002002' && OwpPermitISSUE()!=='D002003' && OwpPermitISSUE()!=='D002005' && OwpPermitISSUE()!=='D002006') &&
                <React.Fragment>
				<ul className="nav mt-3">
					<li className="nav-item">
						<a href="#tabCmt" className="nav-link active" data-toggle="tab">전체</a>
					</li>
					<li className="nav-item">
						<a href="#tabCmt2" className="nav-link" data-toggle="tab">댓글</a>
					</li>
					<li className="nav-item">
						<a href="#tabCmt3" className="nav-link" data-toggle="tab">이력</a>
					</li>
				</ul>
                <div className="tab-content">
                    <div id="tabCmt" className="tab-pane active">
                        {this.commentList('ALL')}
                    </div>
                    <div id="tabCmt2" className="tab-pane">
                        {this.commentList('COMMENTS')}
                    </div>
                    <div id="tabCmt3" className="tab-pane">
                        {this.commentList('HISTORY')}
                    </div>
                </div>
                </React.Fragment>
                }
			</div>
            <div className="fixed-btn row">
                {/* 검토에서 돌아온 경우 */}
                {(this.state.form['OWP_ISSUE.I_STATUS_CD']==='D016001' && this.state.nowStatus['AFTSTATUSCD']==='D016009') && (OwpPermitISSUE()==='D002002' || OwpPermitISSUE()==='D002003' || OwpPermitISSUE()==='D002004' || OwpPermitISSUE()==='D002005') &&
                <div className="col">
                    <NavLink to={`/${this.state.modifyUrl}/${this.state.form['OWP_ISSUE.ISSUESEQ']}`} className="btn btn-primary btn-block">수정</NavLink>
                </div>
                }
                {/* 할당에서 돌아온 경우 */}
                {(this.state.form['OWP_ISSUE.I_STATUS_CD']!=='D016001' && this.state.nowStatus['AFTSTATUSCD']==='D016009') && (OwpPermitISSUE()==='D002006' || OwpPermitISSUE()==='D002007' || OwpPermitISSUE()==='D002008' || OwpPermitISSUE()==='D002009') &&
                <div className="col">
                    <NavLink to={`/${this.state.modifyUrl}/${this.state.form['OWP_ISSUE.ISSUESEQ']}`} className="btn btn-primary btn-block">수정</NavLink>
                </div>
                }
                {/* 기본적으로 자신이 권한글+상태를 따라가야함 : 스크립트로 처리 불가능(모든스테이터스+각권한자 조건문의 조합으로 하면 경우의 수가 많음) */}
                {this.state.nowStatus['AFTSTATUSCD']!=='D016009' && (OwpPermitISSUE()!=='D002002' && OwpPermitISSUE()!=='D002003' && OwpPermitISSUE()!=='D002004' && OwpPermitISSUE()!=='D002005') &&
                <div className="col">
                    <button type="button" className="btn btn-secondary btn-block" data-toggle="modal" data-target="#issueReject" onClick={this.modalOpenClick}>보완요청</button>
                </div>
                }
                {/* 검토중+검토자만 */}
                {this.state.form['OWP_ISSUE.I_STATUS_CD']==='D016001' && this.state.nowStatus['AFTSTATUSCD']!=='D016009' && (OwpPermitISSUE()==='D002006' || OwpPermitISSUE()==='D002007' || OwpPermitISSUE()==='D002008' || OwpPermitISSUE()==='D002009') &&
                <div className="col">
                    <button type="button" className="btn btn-info btn-block" data-toggle="modal" data-target="#issueReview" onClick={this.modalOpenClick}>검토완료</button>
                </div>
                }
            </div>

{/* 복원 */}
<div id="issueRestore" className="modal fade">
    <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
            <div className="modal-header">
                <div className="modal-title">복원</div>
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
                <button type="button" className="btn btn-primary" onClick={ () => this.restoreClick()}>확인</button>
            </div>
        </div>
    </div>
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
                    {this.state.form['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']==='Y' &&
                    <li className="nav-item">
                        <a className="nav-link" href="#issueAssign-2" data-toggle="tab" onClick={ () => {this.clickAssign('2')} }>담당자 할당</a>
                    </li>
                    }
                </ul>
                <div className="tab-content">
                    <div id="issueAssign-1" className="tab-pane active">
                        {/* 셀렉트로 부서 검색 */}
                      {this.state.initAssignDept.length > 0 &&
                        <Select
                          defaultValue={ this.state.initAssignDept }
                          isMulti
                          options={this.state.dept}
                          name=""
                          placeholder="Select"
                          onChange={this.selectedChange1}
                        />
                      }
                        <div className="modal-body pt-3 pb-3">
                            <h4 className="h2 mb-3">사유를 입력해주세요</h4>
                            <textarea className="form-control" rows="4" name="OWP_ISSUEDEPTASSIGN.REASON" onChange={this.handleChange}></textarea>
                        </div>
                    </div>
                    {this.state.form['APPROVAL.APPROVAL_ASSIGNED_TO_ME_YN']==='Y' &&
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
                    }
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
{/* 보완요청 */}
<div id="issueReject" className="modal fade">
    <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
            <div className="modal-header">
                <div className="modal-title">보완요청</div>
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
                <button type="button" className="btn btn-primary" onClick={ () => this.updateStatusClick('REJECT')}>확인</button>
            </div>
        </div>
    </div>
</div>
{/* 검토완료 */}
<div id="issueReview" className="modal fade">
    <div className="modal-dialog modal-dialog-centered modal-xl">
        <div className="modal-content">
            <div className="modal-header">
                <div className="modal-title">검토완료</div>
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
                <button type="button" className="btn btn-primary" onClick={this.confirmClick}>확인</button>
            </div>
        </div>
    </div>
</div>
		</React.Fragment>
    )
}