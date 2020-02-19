import React from 'react'
import moment from 'moment'
import { query,mutate,commonCodes,validate,line2Br,fileUrl,humanFileSize,OwpAttachFile,OwpSession,OwpPermitISSUE,OwpDept } from '@owp'
import Select from 'react-select';
import $ from 'jquery'

export default class IssueModify4 extends React.Component{
	constructor(props){
		super(props)
		this.state = { form : {}, prodCD : [], proNmCD : [], causeCD : [], dmTypeCD : [], methodCD : [], purCD : [], severity:[], authlist:[], eqValue :[], nowStatus: [] }
	}
	async componentDidMount () {
        // 로딩 시작 
        $('body').addClass('is-loading');

	  	query(`loadOwpIssue/${this.props.match.params.no}`).then(resp=> {
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

    await query(`loadNowIssueStatus/${this.props.match.params.no}`).then(resp=> {
      this.setState({nowStatus: {...resp} })
    })

		await query('listOwpCustomer').then( resp=> this.setState({ customer : this.jsonKeyChange(resp,'OWP_CUSTOMER.CUSTOMERCD','OWP_CUSTOMER.CUSTOMERFULLNM')}))
        await query(`/listIpxCommoncode?jsondata=${JSON.stringify({'IPX_COMMONCODE.GROUPID':'D007000'})}`).then( resp=> this.setState({ equipment : this.jsonKeyChange(resp,'IPX_COMMONCODE.CODEID','IPX_COMMONCODE.CODENM', 'IPX_COMMONCODE.MODELKEY', 1)}))
        await query(`/listIpxCommoncode?jsondata=${JSON.stringify({'IPX_COMMONCODE.GROUPID':'D008000'})}`).then( resp=> this.setState({ modelArea : this.jsonKeyChange(resp,'IPX_COMMONCODE.CODEID','IPX_COMMONCODE.CODENM', 'IPX_COMMONCODE.MODELKEY', 2)}))
        //await commonCodes('D007000').then( resp=> this.setState({ equipment : resp})) //장비군
        //await commonCodes('D008000').then( resp=> this.setState({ modelArea : resp })) //모델군
        await query('listOwpFacode').then( resp=> this.setState({ models : this.jsonKeyChange(resp,'OWP_FACODE.FACODESEQ','OWP_FACODE.MODEL_NM', 'OWP_FACODE.MODEL_CD', 3) })) //모델군
        await commonCodes('D009000').then( resp=> this.setState({ prodCD : resp }))
        await commonCodes('D010000').then( resp=> this.setState({ proNmCD : resp }))
        await commonCodes('D011000').then( resp=> this.setState({ causeCD : resp }))
        await commonCodes('D012000').then( resp=> this.setState({ dmTypeCD : resp }))
        await commonCodes('D013000').then( resp=> this.setState({ methodCD : resp }))
        await commonCodes('D014000').then( resp=> this.setState({ purCD : resp }))
        await commonCodes('D025000').then( resp=> this.setState({ severity : resp }))


        //장비군 this.state.equipment
        //모델군 this.state.modelArea
        //모델명 this.state.models

        //아래 두개가 상위 키가 됨
        //모델군 -> 장비군(MODELKEY)
        //모델명 -> 모델군(MODEL_CD)
        this.setState({cd: this.state.equipment.concat(this.state.modelArea).concat(this.state.models)}, () => {
            //장비 setting value
            const eq = this.state.form['OWP_ISSUE.EQUIPMENTCD']
            const eqNm = this.state.form['IPX_COMMONCODE.EQUIPMENTCD.CODENM']

            const model = this.state.form['OWP_ISSUE.MODELCD']
            const modelNm = this.state.form['IPX_COMMONCODE.MODELCD.CODENM']

            const fa = this.state.form['OWP_ISSUE.FACODESEQ']
            const faNm = this.state.form['OWP_FACODE.MODEL_NM']

            if(eq != null &&  eq != '' && (model == null || model == '')) {
                this.setState({eqValue:[{label: eqNm, value:eq}]})
            }
            if(model != null &&  model != '' && (fa == null || fa == '')) {
                this.setState({eqValue:[{label: modelNm, value:model}]})
            }
            if(fa != null && fa != '' ) {
                this.setState({eqValue:[{label: faNm, value:fa}]})
            }
        })

        //loading close
        $('body').removeClass('is-loading');
	}
	componentWillUnmount = () => {
        $('body').removeClass('is-loading');
    }
    
    /*
	componentDidMount = () => {
		query(`loadOwpIssue/${this.props.match.params.no}`).then(resp=> {
            this.setState({ form : {...resp} })
            this.reloadComment()
        })
		this.boardSwiper = new Swiper('.board-swiper-area .swiper-container', {
			pagination: {
				el: '.swiper-pagination'
			}
		})
	}
    */

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
        var label = item.label;
        var value = item.value;

        this.setState({
            eqValue: [
                {
                    label,value
                }
            ]
        })

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

    onSubmit = (data) => {

        var form = this.state.form
        delete form['OWP_ISSUE.WUSERSEQ']

        var params = {};

        form['OWP_ISSUE.EQUIPMENTCD'] = form['OWP_ISSUE.EQUIPMENTCD'] ? form['OWP_ISSUE.EQUIPMENTCD'] : ''
        form['OWP_ISSUE.MODELCD'] = form['OWP_ISSUE.MODELCD'] ? form['OWP_ISSUE.MODELCD'] : ''
        form['OWP_ISSUE.FACODESEQ'] = form['OWP_ISSUE.FACODESEQ'] ? form['OWP_ISSUE.FACODESEQ'] : ''
        form['OWP_ISSUE.PROBLEM_C_PROD_CD'] = form['OWP_ISSUE.PROBLEM_C_PROD_CD'] ? form['OWP_ISSUE.PROBLEM_C_PROD_CD'].value : ''
        form['OWP_ISSUE.PROCESS_NM_CD'] = form['OWP_ISSUE.PROCESS_NM_CD'] ? form['OWP_ISSUE.PROCESS_NM_CD'].value : ''
        form['OWP_ISSUE.I_CAUSE_CD'] = form['OWP_ISSUE.I_CAUSE_CD'] ? form['OWP_ISSUE.I_CAUSE_CD'].value : ''

        //추가
        form['OWP_ISSUE.PRODUCT_NO'] = form['OWP_ISSUE.PRODUCT_NO'] ? form['OWP_ISSUE.PRODUCT_NO'] : '' //품번
        form['OWP_ISSUE.PRODUCT_NM'] = form['OWP_ISSUE.PRODUCT_NM'] ? form['OWP_ISSUE.PRODUCT_NM'] : '' //품명
        form['OWP_ISSUE.PROBLEM_C_PUR_CD'] = form['OWP_ISSUE.PROBLEM_C_PUR_CD'] ? form['OWP_ISSUE.PROBLEM_C_PUR_CD'] : '' //문제점 구분
        //form['OWP_ISSUE.I_CONTENT'] = form['OWP_ISSUE.I_CONTENT'] ? form['OWP_ISSUE.I_CONTENT'] : '' //상세증상
        //form['OWP_ISSUE.I_CONTENT'] = form['OWP_ISSUE.I_CONTENT'] ? form['OWP_ISSUE.I_CONTENT'] : '' //긴급도
        //form['OWP_ISSUE.EQUIP_REPLACE_YN'] = form['OWP_ISSUE.EQUIP_REPLACE_YN'] ? form['OWP_ISSUE.EQUIP_REPLACE_YN'] : '' //장비교체요청
        form['OWP_ISSUE.I_DUE_DATE'] = form['OWP_ISSUE.I_DUE_DATE'] ? form['OWP_ISSUE.I_DUE_DATE'] : '' //희망처리일자

        //장비군, 모델군, 모델명의 컬럼명이 상세화면과 달라서 상세화면에서 보이지 않음(확인바람)
        if(!validate(form,'OWP_ISSUE.I_TITLE','제목을 입력해주세요')) return Promise.reject()
        if(!validate(form,'OWP_ISSUE.I_URGENCY_CD','긴급도를 입력해주세요')) return Promise.reject()
        form['OWP_ISSUE.EQUIP_REPLACE_YN'] = form['OWP_ISSUE.EQUIP_REPLACE_YN'] ? form['OWP_ISSUE.EQUIP_REPLACE_YN'] : 'N'
        form['OWP_ISSUE.FACODESEQ'] = form['OWP_ISSUE.FACODESEQ'].toString()
        form['OWP_ISSUE.CUSTOMERSEQ'] = form['OWP_ISSUE.CUSTOMERSEQ'].toString()
        form['OWP_ISSUE.DROP_FLAG'] = 'N'
        form['OWP_ISSUE.FLAG'] = 'Y'

        params = JSON.parse(JSON.stringify(form)) //객체 복사(deep copy)

        for(var key in params){
            if(key.indexOf("OWP_ISSUE") == -1 &&  key.indexOf("FILE") == -1 ){
                delete params[key]
            }
        }
        params['OWP_ISSUE.MUSERSEQ'] =  OwpSession('USERSEQ').toString()//수정자
        params['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no;
        return mutate('updateOwpIssue',params).then( () => {
          if( this.state.nowStatus['AFTSTATUSCD']==='D016009' ){ //REJECT

            let form = {};

            form['OWP_ISSUELOG.ILSEQ'] = ''; //key
            form['OWP_ISSUELOG.ISSUESEQ'] = this.props.match.params.no; //이슈번호
            form['OWP_ISSUELOG.PRESTATUSCD'] = 'D016009'; //이전상태 = REJECT
            form['OWP_ISSUELOG.AFTSTATUSCD'] = this.state.form['OWP_ISSUE.I_STATUS_CD']; //현재상태
            form['OWP_ISSUELOG.FLAG'] = 'Y'; //사용유무

            return mutate('createOwpIssuelog',form).then( () => {
              alert('수정되었습니다.')
              window.location.href = `/IssueDetail/${this.state.form['OWP_ISSUE.ISSUESEQ']}`;
            })

          }else{
            alert('수정되었습니다.')
            window.location.href = `/IssueDetail/${this.state.form['OWP_ISSUE.ISSUESEQ']}`;
          }
        })
    }

    render = () => (
        <React.Fragment>
			<div className="container pt-1 pb-3 bg-wh">
                {/* 이슈등록 사항 그대로이나 대부분 처리 - 엑셀표 참조 */}
				<div className="bx-form type2 mt-3">
					{/* 등록검토자는 수정 가능 */}
                    <div className="form-group row">
						<span className="col-3 col-form-label">제목</span>
						<div className="col-9">
							<input type="text" className="form-control" name="OWP_ISSUE.I_TITLE" onChange={this.handleChange} value={this.state.form['OWP_ISSUE.I_TITLE']} placeholder="제목을 입력해 주세요."/>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">상세증상</span>
						<div className="col-9">
							<textarea className="form-control" name="OWP_ISSUE.I_CONTENT" onChange={this.handleChange} value={this.state.form['OWP_ISSUE.I_CONTENT']} rows="5" placeholder="내용을 입력해주세요."></textarea>
			                <OwpAttachFile TableName="OWP_ISSUE" PageID="C102031" Attachs={ !this.state.form['FILES'] ? [] : this.state.form['FILES']} onChange={ attach=> {
								var form = this.state.form
								form['FILES'] = attach
								this.setState({ form : form})
							}}/>
						</div>
					</div>
				</div>
                {/* 이슈정보(외부고객) - 검토자는 장비군 등 수정가능 */}
                <div className="bx-form type2 mt-3">
					<div className="form-group row">
						<span className="col-3 col-form-label">제품</span>
						<div className="col-9">
                            <Select
                                // 해당값이 들어가게 해야함
                                value={this.state.eqValue}
                                onChange={
                                    this.selectedChange
                                }
                                options={this.state.cd}
                                name="OWP_ISSUE.CD"
                                placeholder="Select"
                            />
						</div>
					</div>
					<div className="form-group row" style={{display:'none'}}>
						<span className="col-3 col-form-label">고장일자</span>
						<div className="col-9">
							<div className="form-control-icon">
                                <input type="date" className="form-control" name="OWP_ISSUE.FAULT_DATE" onChange={this.handleChange}  value={this.state.form['OWP_ISSUE.FAULT_DATE']} />
                            </div>
						</div>
					</div>
                    <div className="form-group row align-items-center">
                        <span className="col-3 col-form-label">문제점 구분</span>
                        <div className="col-9">
							<select className="form-control" name="OWP_ISSUE.PROBLEM_C_PUR_CD" value={this.state.form['OWP_ISSUE.PROBLEM_C_PUR_CD']} onChange={this.handleChange}>
								<option>Select</option>
								{ this.state.purCD.map( item=> 
									<option key={item.value} value={item.value}>{item.label}</option>
								)}
							</select>
                        </div>
                    </div>
                    <div className="form-group row align-items-center">
                        <span className="col-3 col-form-label">개발/양산구분</span>
                        <div className="col-9">
							<select className="form-control" name="OWP_ISSUE.D_M_TYPE_CD" value={this.state.form['OWP_ISSUE.D_M_TYPE_CD']} onChange={this.handleChange}>
								<option>Select</option>
								{ this.state.dmTypeCD.map( item=> 
									<option key={item.value} value={item.value}>{item.label}</option>
								)}
							</select>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">공법</span>
                        <div className="col-9">
							<select className="form-control" name="OWP_ISSUE.I_METHOD_CD" value={this.state.form['OWP_ISSUE.I_METHOD_CD']} onChange={this.handleChange}>
								<option>Select</option>
								{ this.state.methodCD.map( item=> 
									<option key={item.value} value={item.value}>{item.label}</option>
								)}
							</select>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">품번</span>
                        <div className="col-9">
                            <input type="text" className="form-control" name="OWP_ISSUE.PRODUCT_NO" onChange={this.handleChange} value={this.state.form['OWP_ISSUE.PRODUCT_NO']}/>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">품명</span>
                        <div className="col-9">
                            <input type="text" className="form-control" name="OWP_ISSUE.PRODUCT_NM" onChange={this.handleChange} value={this.state.form['OWP_ISSUE.PRODUCT_NM']}/>
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
                            <input type="date" className="form-control" onChange={this.handleChange} value={ this.state.form['OWP_ISSUE.I_DUE_DATE'] } />
						</div>
					</div>
				</div>
			</div>
            <div className="fixed-btn row">
                <div className="col-6">
                    {this.state.nowStatus['AFTSTATUSCD']!=='D016009' &&
                    <button type="button" className="btn btn-primary btn-block" onClick={this.onSubmit}>저장</button>
                    }
                    {this.state.nowStatus['AFTSTATUSCD']==='D016009' &&
                    <button type="button" className="btn btn-primary btn-block" onClick={this.onSubmit}>보완 완료</button>
                    }
                </div>
                <div className="col-6">
                    <button type="button" className="btn btn-secondary btn-block" onClick={ ()=> {
                        this.props.history.goBack()
                    }}>뒤로</button>
                </div>
            </div>
		</React.Fragment>
    )
}