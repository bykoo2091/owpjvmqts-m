import React from 'react'
import { query,mutate,commonCodes,validate,OwpSession,OwpAttachFile } from '@owp'
//import DatePicker from 'react-datepicker'
import Select from 'react-select';
import $ from "jquery";

export default class IssueAddD002004 extends React.Component{

	constructor(props){
		super(props)
		this.state = { form: [] , prodCD : [], proNmCD : [], causeCD : [] , cd : [] , selectedOption: ''}
	}

	async componentDidMount () {
        // 로딩 시작 
        $('body').addClass('is-loading');

      if(this.props.match.params.no != null && this.props.match.params.no != undefined && this.props.match.params.no != ''){
          await query(`loadOwpIssue/${this.props.match.params.no}`).then(resp=> {
              // 권한 체크
              if(resp['OWP_ISSUE.WUSERSEQ'].toString()!==OwpSession('USERSEQ').toString()){
                  //alert('권한이 없습니다')
              }
              resp['FILES'] = resp['FILES'].map( item=> {
                  return {
                      'IPX_FILE.FILESEQ' : item['IPX_FILE.FILESEQ'].toString(),
                      'FileSize' : item['IPX_FILE.FILESIZE'],
                      'FileName' : item['IPX_FILE.FILENAMEREAL'],
                      'IPX_FILE.FILETYPE' : item['IPX_FILE.FILETYPE']
                  }
              })

              this.setState({ form : {...resp} })
          })
      }

		await query('listOwpCustomer').then( resp=> this.setState({ customer : this.jsonKeyChange(resp,'OWP_CUSTOMER.CUSTOMERCD','OWP_CUSTOMER.CUSTOMERFULLNM')}))
        await query(`/listIpxCommoncode?jsondata=${JSON.stringify({'IPX_COMMONCODE.GROUPID':'D007000'})}`).then( resp=> this.setState({ equipment : this.jsonKeyChange(resp,'IPX_COMMONCODE.CODEID','IPX_COMMONCODE.CODENM', 'IPX_COMMONCODE.MODELKEY', 1)}))
        await query(`/listIpxCommoncode?jsondata=${JSON.stringify({'IPX_COMMONCODE.GROUPID':'D008000'})}`).then( resp=> this.setState({ modelArea : this.jsonKeyChange(resp,'IPX_COMMONCODE.CODEID','IPX_COMMONCODE.CODENM', 'IPX_COMMONCODE.MODELKEY', 2)}))
        //await commonCodes('D007000').then( resp=> this.setState({ equipment : resp})) //장비군
        //await commonCodes('D008000').then( resp=> this.setState({ modelArea : resp })) //모델군
        await query('listOwpFacode').then( resp=> this.setState({ models : this.jsonKeyChange(resp,'OWP_FACODE.FACODESEQ','OWP_FACODE.MODEL_NM', 'OWP_FACODE.MODEL_CD', 3) })) //모델군
        await commonCodes('D009000').then( resp=> this.setState({ prodCD : resp }))
        await commonCodes('D010000').then( resp=> this.setState({ proNmCD : resp }))
        await commonCodes('D011000').then( resp=> this.setState({ causeCD : resp }))

        //장비군 this.state.equipment
        //모델군 this.state.modelArea
        //모델명 this.state.models

        //아래 두개가 상위 키가 됨
        //모델군 -> 장비군(MODELKEY)
        //모델명 -> 모델군(MODEL_CD)
        this.setState({cd: this.state.equipment.concat(this.state.modelArea).concat(this.state.models)})
        //loading close
        $('body').removeClass('is-loading');
	}
	componentWillUnmount = () => {
        $('body').removeClass('is-loading');
    }

	jsonKeyChange = (json, id, name, parentKey, depth) => {
	    let colModified = json.map(
            obj => {
                return {
                    "value": obj[id],
                    "label" : obj[name],
                    "parent" : obj[parentKey], //장비모델 을 위해 추가
                    "depth" : depth //장비모델 을 위해 추가
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

    selectedChange = (item, target) => {
        var name = target.name;
        var value = item.value;
        console.log('name',"'"+name+"'")
        console.log('value',"'"+value+"'")
        var jsonArray = this.state.cd;
        var index = 0;
        var depth = 0;
        var parent = "";
        for( var i=0; i<jsonArray.length; i++){
            if(jsonArray[i].value === value){
                index = i;
                depth = jsonArray[i].depth;
                parent = jsonArray[i].parent;
            }
        }
        if(depth <= 0){
            this.setState({
                form: { ...this.state.form, [name] : value}
            })
            return;
        }
        var depth1 = "",
            depth2 = "",
            depth3 = "";
        if(depth===1){ //장비군 변경
            depth3 = "";
            depth2 = "";
            depth1 = value;
        }
        if(depth===2){ //모델군 변경
            depth3 = "";
            depth2 = value;
            depth1 = this.getParent(depth2);
        }
        if(depth===3){ //모델명 변경
            depth3 = value;
            depth2 = this.getParent(depth3);
            depth1 = this.getParent(depth2);
        }

        //비동기 문제로 아래와같이 콜백에 넣음..
        this.setState({
            form: { ...this.state.form, ['OWP_ISSUE.FACODESEQ'] : depth3}
        }, () => {
            this.setState({
                form: { ...this.state.form, ['OWP_ISSUE.MODELCD'] : depth2}
            }, () => {
                this.setState({
                    form: { ...this.state.form, ['OWP_ISSUE.EQUIPMENTCD'] : depth1}
                })
            })
        })
    }

    getParent = (value) => {
	    var jsonArray = this.state.cd;
        for( var i=0; i<jsonArray.length; i++){
            if(jsonArray[i].value === value){
                return jsonArray[i].parent;
            }
        }
    }

    onSubmit = (status) => {
        var form = this.state.form
        delete form['OWP_ISSUE.WUSERSEQ']

        let preStatus = form['OWP_ISSUE.I_STATUS_CD'];

        form['OWP_ISSUE.ISSUESEQ'] = form['OWP_ISSUE.ISSUESEQ'] ? form['OWP_ISSUE.ISSUESEQ'].toString() : '' //이슈번호

        form['OWP_ISSUE.EQUIPMENTCD'] = form['OWP_ISSUE.EQUIPMENTCD'] ? form['OWP_ISSUE.EQUIPMENTCD'] : ''
        form['OWP_ISSUE.MODELCD'] = form['OWP_ISSUE.MODELCD'] ? form['OWP_ISSUE.MODELCD'] : ''
        form['OWP_ISSUE.FACODESEQ'] = form['OWP_ISSUE.FACODESEQ'] ? form['OWP_ISSUE.FACODESEQ'] : ''

        //추가
        form['OWP_ISSUE.PRODUCT_NO'] = form['OWP_ISSUE.PRODUCT_NO'] ? form['OWP_ISSUE.PRODUCT_NO'] : '' //품번
        form['OWP_ISSUE.PRODUCT_NM'] = form['OWP_ISSUE.PRODUCT_NM'] ? form['OWP_ISSUE.PRODUCT_NM'] : '' //품명
        form['OWP_ISSUE.I_DUE_DATE'] = form['OWP_ISSUE.I_DUE_DATE'] ? form['OWP_ISSUE.I_DUE_DATE'] : '' //희망처리일자


        //장비군, 모델군, 모델명의 컬럼명이 상세화면과 달라서 상세화면에서 보이지 않음(확인바람)
        if(!validate(form,'OWP_ISSUE.I_TITLE','제목을 입력해주세요')) return Promise.reject()
        if(!validate(form,'OWP_ISSUE.I_CONTENT','상세증상을 입력해주세요')) return Promise.reject()
        if(!validate(form,'OWP_ISSUE.I_URGENCY_CD','긴급도를 입력해주세요')) return Promise.reject()
        if(!validate(form,'OWP_ISSUE.I_DUE_DATE','희망처리일자를 입력해주세요')) return Promise.reject()
        form['OWP_ISSUE.EQUIP_REPLACE_YN'] = form['OWP_ISSUE.EQUIP_REPLACE_YN'] ? form['OWP_ISSUE.EQUIP_REPLACE_YN'] : 'N'
        form['OWP_ISSUE.FACODESEQ'] = form['OWP_ISSUE.FACODESEQ'].toString()
        form['OWP_ISSUE.DROP_FLAG'] = 'N'
        form['OWP_ISSUE.FLAG'] = 'Y'
        form['OWP_ISSUE.I_STATUS_CD'] = status
        form['OWP_ISSUE.WUSERSEQ'] = OwpSession('USERSEQ').toString()
        form['OWP_ISSUE.MUSERSEQ'] = OwpSession('USERSEQ').toString()

        //처음 임시저장할때는 create 그다음부터는 update
        let createApiUrl = '';

        //임시저장을 하면서 파라미터 번호가 없을 경우 (신규 임시저장)
        if(status === "D016013" && !this.props.match.params.no)
        {
            createApiUrl = "createOwpIssue"
        }
        //등록을 하면서 파라미터 번호가 없을 경우 (신규 등록)
        else if(status === "D016001" && !this.props.match.params.no)
        {
            createApiUrl = "createOwpIssue"
        }
        //임시저장 -> 등록, 외 임시저장 -> 임시저장
        else
        {
            createApiUrl = "updateOwpIssue"
        }

        //mutate(url,params,options)
        return mutate('createOwpIssue',form).then( () => {

            //임시저장중 -> 검토중 일때 ISSUELOG 입력
            if(preStatus === "D016013" && status === "D016001"){

                form = {}
                form['OWP_ISSUELOG.ILSEQ'] = ''; //key
                form['OWP_ISSUELOG.ISSUESEQ'] = this.props.match.params.no; //이슈번호
                form['OWP_ISSUELOG.PRESTATUSCD'] = preStatus; //이전상태 = REJECT
                form['OWP_ISSUELOG.AFTSTATUSCD'] = status; //현재상태
                form['OWP_ISSUELOG.FLAG'] = 'Y'; //사용유무

                return mutate('createOwpIssuelog',form).then( () => {
                    alert('저장되었습니다.')
                    window.location.href = "/Issue";
                })

            }else{
                alert('저장되었습니다.')
                window.location.href = "/Issue";
            }
        })
    }

    render = () => (
        <React.Fragment>
			{
			<div className="container">
				<div className="bx-form type2 mt-3">
					<div className="form-group row">
						<span className="col-3 col-form-label">제목</span>
						<div className="col-9">
							<input type="text" className="form-control" name="OWP_ISSUE.I_TITLE" onChange={this.handleChange} value={this.state.form['OWP_ISSUE.I_TITLE']} placeholder="제목을 입력해 주세요." required />
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">상세증상</span>
						<div className="col-9">
                            <textarea className="form-control" rows="5" name="OWP_ISSUE.I_CONTENT" onChange={this.handleChange} value={this.state.form['OWP_ISSUE.I_CONTENT']} required></textarea>
						</div>
					</div>
					<div className="row">
						<div className="offset-3 col-9">
			                <OwpAttachFile TableName="OWP_ISSUE" PageID="C102031" Attachs={ !this.state.form['FILES'] ? [] : this.state.form['FILES']} onChange={ attach=> {
								var form = this.state.form
								form['FILES'] = attach
								this.setState({ form : form})
							}}/>
						</div>
					</div>
				</div>
                <div className="bx-form type2 mt-3">
                    <div className="form-group row" style={{display:'none'}}>
                        <span className="col-3 col-form-label">제품</span>
                        <div className="col-9">
                            <Select
                                onChange={
                                    this.selectedChange
                                }
                                options={this.state.cd}
                                name="OWP_ISSUE.CD"
                                placeholder="Select"
                            />
                        </div>
                    </div>
                    {/* JVS/ERP는 연동 */}
					<div className="form-group row" style={{display:'none'}}>
						<span className="col-3 col-form-label">고장일자</span>
						<div className="col-9">
                            <input type="date" className="form-control" name="OWP_ISSUE.FAULT_DATE" onChange={this.handleChange} value={ this.state.form['OWP_ISSUE.FAULT_DATE'] } />
						</div>
					</div>
                    <div className="form-group row" style={{display:'none'}}>
                        <span className="col-3 col-form-label">장비 SN번호</span>
                        <div className="col-9">
                            <input type="text" className="form-control" name="OWP_ISSUE.EQUIPMENT_SN" onChange={this.handleChange} value={ this.state.form['OWP_ISSUE.EQUIPMENT_SN'] } />
                        </div>
                    </div>
                    <div className="form-group row align-items-center">
                        <span className="col-3 col-form-label">문제점 구분</span>
                        <div className="col-9">
							<select className="form-control" name="OWP_ISSUE.PROBLEM_C_PROD_CD" value={this.state.form['OWP_ISSUE.PROBLEM_C_PROD_CD']} onChange={this.handleChange}>
								<option>Select</option>
								{ this.state.prodCD.map( item=> 
									<option key={item.value} value={item.value}>{item.label}</option>
								)}
							</select>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">공정명</span>
                        <div className="col-9">
							<select className="form-control" name="OWP_ISSUE.PROCESS_NM_CD" value={this.state.form['OWP_ISSUE.PROCESS_NM_CD']} onChange={this.handleChange}>
								<option>Select</option>
								{ this.state.proNmCD.map( item=> 
									<option key={item.value} value={item.value}>{item.label}</option>
								)}
							</select>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">원인</span>
                        <div className="col-9">
							<select className="form-control" name="OWP_ISSUE.I_CAUSE_CD" value={this.state.form['OWP_ISSUE.I_CAUSE_CD']} onChange={this.handleChange}>
								<option>Select</option>
								{ this.state.causeCD.map( item=> 
									<option key={item.value} value={item.value}>{item.label}</option>
								)}
							</select>
                        </div>
                    </div>
				</div>
                {/* 등록요청사항 */}
                <div className="bx-form type2 mt-3">
					<div className="form-group row">
						<span className="col-3 col-form-label">긴급도</span>
						<div className="col-9">
                            <select className="form-control" name="OWP_ISSUE.I_URGENCY_CD" onChange={this.handleChange} value={this.state.form['OWP_ISSUE.I_URGENCY_CD']} required>
                                <option>Select</option>
                                <option value="D015002">일반</option>
                                <option value="D015001">긴급</option>
                            </select>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">희망처리일자</span>
						<div className="col-9">
                            <input type="date"
                                   className="form-control"
                                   onChange={this.handleChange}
                                   value={ this.state.form['OWP_ISSUE.I_DUE_DATE'] }
                                   name="OWP_ISSUE.I_DUE_DATE"
                                    />
						</div>
					</div>
				</div>
                <p className="m-3"></p>
			</div>
            }
            <div className="fixed-btn row">
                <div className="col"><button type="button" className="btn btn-secondary btn-block" onClick={ () => {this.onSubmit('D016013')}}>임시저장</button></div>
                <div className="col"><button type="button" className="btn btn-primary btn-block" onClick={ () => {this.onSubmit('D016001')}}>등록</button></div>
            </div>
		</React.Fragment>
    )
}