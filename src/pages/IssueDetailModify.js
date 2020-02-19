import React from 'react'
import moment from 'moment'
import { query,mutate,commonCodes,validate,line2Br,fileUrl,humanFileSize,OwpAttachFile,OwpSession } from '@owp'
import Swiper from 'swiper'
import Select from 'react-select';
import $ from 'jquery'

export default class IssueDetail extends React.Component{
	constructor(props){
		super(props)
		this.state = { form : {}, prodCD : [], proNmCD : [], causeCD : [], dmTypeCD : [], methodCD : [], purCD : [], severity:[], authlist:[], eqValue :[] }
	}
	async componentDidMount () {
        // 로딩 시작 
        $('body').addClass('is-loading');

	  	query(`loadOwpIssue/${this.props.match.params.no}`).then(resp=> {
            this.setState({ form : {...resp} })
        })

      //입력 된 이슈SEQ로 이슈정보를 불러와서 현재 접속한 사용자의 권한과 비교하여 이슈 항목 권한 리스트를 리턴
      await query(`/loadOwpIssueViewAuthority/${this.props.match.params.no}`).then( resp => {
          this.setState({ authlist : resp})

          resp.forEach( item => {

            //ISSUECOLNM
            //ISPERMISSIONNM
            //O : 수동입력(필수), △ : 수동입력, 수정가능(필수), 자동 : 시스템 자동입력, X : 표시안함, ReadOnly : 표시(편집X)


            var permission = item["OWP_ISSUEATTRPERMISSION.ISPERMISSIONNM"];
            var colNm = item["OWP_ISSUEATTRPERMISSION.ISSUECOLNM"];

              let targetEl;

              if(permission == "X") { //표시안함

                console.log("colNm",colNm)
                targetEl = $('[name $= "'+colNm+'"]');
                targetEl.closest('.form-group').hide()

              }

              if(permission == "ReadOnly") {
                $('[name $= "'+colNm+'"]').attr('disabled','');
              }

          })

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
        if(!validate(form,'OWP_ISSUE.CUSTOMERSEQ','고객코드를 정확히 입력해주세요')) return Promise.reject()
        //if(!validate(form,'OWP_ISSUE.EQUIPMENTCD','장비군을 입력해주세요')) return Promise.reject()
        //if(!validate(form,'OWP_ISSUE.MODELCD','모델군을 입력해주세요')) return Promise.reject()
        //if(!validate(form,'OWP_ISSUE.FACODESEQ','모델명을 입력해주세요')) return Promise.reject()
        //if(!validate(form,'OWP_ISSUE.EQUIPMENT_SN','정비번호를 입력해주세요')) return Promise.reject()
        //if(!validate(form,'OWP_ISSUE.PROBLEM_C_PROD_CD','문제점 구분을 입력해주세요')) return Promise.reject()
        if(!validate(form,'OWP_ISSUE.PROBLEM_C_PUR_CD','문제점 구분을 입력해주세요')) return Promise.reject()
        //if(!validate(form,'OWP_ISSUE.PROCESS_NM_CD','공정명을 입력해주세요')) return Promise.reject()
        //if(!validate(form,'OWP_ISSUE.I_CAUSE_CD','원인을 입력해주세요')) return Promise.reject()
        if(!validate(form,'OWP_ISSUE.I_CONTENT','상세증상을 입력해주세요')) return Promise.reject()
        if(!validate(form,'OWP_ISSUE.I_URGENCY_CD','긴급도를 입력해주세요')) return Promise.reject()
        if(!validate(form,'OWP_ISSUE.I_DUE_DATE','희망처리일자를 입력해주세요')) return Promise.reject()
        form['OWP_ISSUE.EQUIP_REPLACE_YN'] = form['OWP_ISSUE.EQUIP_REPLACE_YN'] ? form['OWP_ISSUE.EQUIP_REPLACE_YN'] : 'N'
        form['OWP_ISSUE.FACODESEQ'] = form['OWP_ISSUE.FACODESEQ'].toString()
        form['OWP_ISSUE.CUSTOMERSEQ'] = form['OWP_ISSUE.CUSTOMERSEQ'].toString()
        form['OWP_ISSUE.DROP_FLAG'] = 'N'
        form['OWP_ISSUE.FLAG'] = 'Y'
        form['OWP_ISSUE.I_STATUS_CD'] = 'D016001'
        form['OWP_ISSUE.WUSERSEQ'] = OwpSession('USERSEQ')


        params = JSON.parse(JSON.stringify(form)) //객체 복사(deep copy)

        for(var key in params){
            if(key.indexOf("OWP_ISSUE") == -1){
                delete params[key]
            }
        }
        params['OWP_ISSUE.MUSERSEQ'] = new String(params['OWP_ISSUE.MUSERSEQ']);
        params['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no;

        //
        // params['OWP_ISSUE.ISSUESEQ'] = this.props.match.params.no;
        // params['OWP_ISSUE.I_TITLE'] = form['OWP_ISSUE.I_TITLE'] //제목
        // params['OWP_ISSUE.EQUIPMENTCD'] = form['OWP_ISSUE.EQUIPMENTCD'] //장비
        // params['OWP_ISSUE.MODELCD'] = form['OWP_ISSUE.MODELCD'] //모델
        // params['OWP_ISSUE.FACODESEQ'] = form['OWP_ISSUE.FACODESEQ'] //모델명
        // params['OWP_ISSUE.FAULT_DATE'] = form['OWP_ISSUE.FAULT_DATE'] //고장일자
        // params['OWP_ISSUE.EQUIPMENT_NO'] = form['OWP_ISSUE.EQUIPMENT_NO'] //장비호기
        // params['OWP_ISSUE.EQUIPMENT_SN'] = form['OWP_ISSUE.EQUIPMENT_SN'] //장비 SN번호
        // params['OWP_ISSUE.EQUIPMENT_SN'] = form['OWP_ISSUE.JVS_NO'] //JVS 접수번호
        // params['OWP_ISSUE.EQUIPMENT_SN'] = form['OWP_ISSUE.JVS_DATE'] //JVS 접수일자
        // params['OWP_ISSUE.EQUIPMENT_SN'] = form['OWP_ISSUE.JVS_DATE'] //JVS 증상코드
        //
        //
        // /*
        //
        // 							<input type="text" className="form-control" value={this.state.form['OWP_ISSUE.JVS_NO']}/>
		// 				</div>
		// 			</div>
		// 			<div className="form-group row">
		// 				<span className="col-3 col-form-label">JVS 접수일자</span>
		// 				<div className="col-9">
		// 					<input type="text" className="form-control" value={this.state.form['OWP_ISSUE.JVS_DATE']}/>
		// 				</div>
		// 			</div>
		// 			<div className="form-group row">
		// 				<span className="col-3 col-form-label">JVS 증상코드</span>
		// 				<div className="col-9">
		// 					<input type="text" className="form-control" value={this.state.form['OWP_ISSUE.JVS_DATE']}/>
        //
        // */
        //
        //


        //mutate(url,params,options)
        return mutate('updateOwpIssue',params).then( () => {
            alert('수정되었습니다.')
            window.location.href = `/IssueDetail/${this.state.form['OWP_ISSUE.ISSUESEQ']}`;
        })
    }

    isHidden = (name) => {
      return this.state.authlist[name].permission == 'X' ? true : false
    }

    isReadonly = (name) => {

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
					<div className="form-group row">
						<span className="col-3 col-form-label">고장일자</span>
						<div className="col-9">
							<div className="form-control-icon">
                                <input type="date" className="form-control" name="OWP_ISSUE.FAULT_DATE" onChange={this.handleChange}  value={this.state.form['OWP_ISSUE.FAULT_DATE']} />
                            </div>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">장비 호기</span>
						<div className="col-9">
							<input type="text" className="form-control" name="OWP_ISSUE.EQUIPMENT_NO" value={this.state.form['OWP_ISSUE.EQUIPMENT_NO']}/>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">장비 SN번호</span>
						<div className="col-9">
							<input type="text" className="form-control" name="OWP_ISSUE.EQUIPMENT_SN" value={this.state.form['OWP_ISSUE.EQUIPMENT_SN']} readOnly/>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">JVS 접수번호</span>
						<div className="col-9">
							<input type="text" className="form-control" name="OWP_ISSUE.JVS_NO" value={this.state.form['OWP_ISSUE.JVS_NO']} readOnly/>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">JVS 접수일자</span>
						<div className="col-9">
							<input type="text" className="form-control" name="OWP_ISSUE.JVS_DATE" value={this.state.form['OWP_ISSUE.JVS_DATE']} readOnly/>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">JVS 증상코드</span>
						<div className="col-9">
							<input type="text" className="form-control" name="OWP_ISSUE.JVS_CODE" value={this.state.form['OWP_ISSUE.JVS_CODE']} readOnly/>
						</div>
					</div>
				</div>
                {/* 이슈정보(생산) - 생산라인 검토자(생기/생관 팀장) 보이고 수정가능 */}
                <div className="bx-form type2 mt-3">
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
                {/* 이슈정보(구매) - 구매라인 검토자(구매 담당자-부서전원) 보이고 수정가능 */}
                <div className="bx-form type2 mt-3">
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
                            <input type="text" className="form-control" name="OWP_ISSUE.PRODUCT_NO" value={this.state.form['OWP_ISSUE.PRODUCT_NO']}/>
                        </div>
                    </div>
                    <div className="form-group row">
                        <span className="col-3 col-form-label">품명</span>
                        <div className="col-9">
                            <input type="text" className="form-control" name="OWP_ISSUE.PRODUCT_NM" value={this.state.form['OWP_ISSUE.PRODUCT_NM']}/>
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
				</div>
        {/* 이슈설명 */}
        <div className="bx-form type2 mt-3">
					<div className="form-group row">
						<span className="col-3 col-form-label">상세증상</span>
						<div className="col-9">
							<textarea className="form-control" name="OWP_ISSUE.I_CONTENT" onChange={this.handleChange} value={this.state.form['OWP_ISSUE.I_CONTENT']} rows="5" placeholder="내용을 입력해주세요."></textarea>
			                <OwpAttachFile TableName="OWP_ISSUE" PageID="C102031" Attachs={ !this.state.form['FILES'] ? [] : this.state.form['FILES']} onChange={ attach=> {
								var form = this.state.form
								form['FILES2'] = attach
								this.setState({ form : form})
							}}/>
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
						<span className="col-3 col-form-label">장비교체요청</span>
						<div className="col-9">
                            <label className="mt-2">
                                <input type="checkbox" defaultChecked={this.state.form['OWP_ISSUE.EQUIP_REPLACE_YN'] === 'Y'} name='OWP_ISSUE.EQUIP_REPLACE_YN' onChange={ e=> {
                                    this.setState({ form : { ...this.state.form ,[e.target.name] : e.target.checked ? 'Y' : 'N'}})
                                }}/>
                            </label>
						</div>
					</div>
					<div className="form-group row">
						<span className="col-3 col-form-label">희망처리일자</span>
						<div className="col-9">
                            <input type="date" className="form-control" onChange={this.handleChange} value={ this.state.form['OWP_ISSUE.I_DUE_DATE'] } />
						</div>
					</div>
				</div>
                {/* 상세 더보기 - PC의 우측 영역 */}
				<button type="button" className="btn btn-sm btn-block btn-outline-muted collapsed mt-3" data-toggle="collapse" data-target="#collapse1"><span className="h5">상세정보 더보기 <i className="xi-angle-down-thin"></i></span></button>
				<div id="collapse1" className="collapse-wrp collapse mt-3">
					<div className="bx-form type2">
						<div className="form-group row">
							<div className="col-3 col-form-label">상태</div>
							<div className="col-9">
                                {/* 변경가능한 상태만 표기 : 권한이 없으면 해당 항목 막아버리기? */}
								<select className="form-control" name="OWP_ISSUE.I_STATUS_CD" value={this.state.form['OWP_ISSUE.I_STATUS_CD']}>
                                    <option value="D016012" disabled>등록요청중</option>
									<option value="D016001" disabled>등록검토중</option>
									<option value="D016005" disabled>주관팀할당중</option>
									<option value="D016002" disabled>담당자할당중</option>
									<option value="D016003" disabled>처리중</option>
									<option value="D016006">이슈처리완료</option>
									<option value="D016004">품질승인완료</option>
									<option value="D016007">설변중</option>
									<option value="D016008">설변완료</option>
								</select>
							</div>
						</div>
					</div>
					<div className="bx-form type2 mt-2">
						<p className="h5 font-weight-normal mb-2">부서/담당자</p>
						<table className="tb tb-fixed">
							<thead>
								<tr>
									<th>할당 일자<img className="float-right" src="../img/icon/icon_updown.png" height="9" alt=""/></th>
									<th>할당된 부서<img className="float-right" src="../img/icon/icon_updown.png" height="9" alt=""/></th>
									<th>할당된 담당자</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>2019.10.28 10:00</td>
									<td>설계1팀</td>
									<td>홍길동</td>
								</tr>
								<tr>
									<td>2019.10.28 10:00</td>
									<td>설계1팀</td>
									<td>홍길동</td>
								</tr>
								<tr>
									<td>2019.10.28 10:00</td>
									<td>설계1팀</td>
									<td>홍길동</td>
								</tr>
								<tr>
									<td>2019.10.28 10:00</td>
									<td>설계1팀</td>
									<td>홍길동</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div className="bx-form type2 mt-2">
						<div className="form-group row">
							<div className="col-3 col-form-label">담당자 결과</div>
							<div className="col-9">
								<textarea className="form-control" name="OWP_ISSUE.CONTACTRST" rows="5" placeholder="내용을 입력해주세요."></textarea>
                                <OwpAttachFile TableName="OWP_ISSUE" PageID="C102031" Attachs={ !this.state.form['FILES2'] ? [] : this.state.form['FILES2']} onChange={ attach=> {
                                    var form = this.state.form
                                    form['FILES2'] = attach
                                    this.setState({ form : form})
                                }}/>
							</div>
						</div>
					</div>
					<div className="bx-form type2 mt-2">
						<div className="form-group row">
							<div className="col-3 col-form-label">최종 결과</div>
							<div className="col-9">
								<textarea className="form-control" name="OWP_ISSUE.FINALRST" rows="5" placeholder="내용을 입력해주세요."></textarea>
                                <OwpAttachFile TableName="OWP_ISSUE" PageID="C102031" Attachs={ !this.state.form['FILES3'] ? [] : this.state.form['FILES3']} onChange={ attach=> {
                                    var form = this.state.form
                                    form['FILES3'] = attach
                                    this.setState({ form : form})
                                }}/>
                            </div>
						</div>
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
									<th>DFMEA 번호<img className="float-right" src="../img/icon/icon_updown.png" height="9" alt=""/></th>
									<th>부품 및 도번<img className="float-right" src="../img/icon/icon_updown.png" height="9" alt=""/></th>
									<th>작성자<img className="float-right" src="../img/icon/icon_updown.png" height="9" alt=""/></th>
									<th>작성일<img className="float-right" src="../img/icon/icon_updown.png" height="9" alt=""/></th>
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
                                <select className="form-control" name="OWP_ISSUE.I_SEVERITY" value={this.state.form['OWP_ISSUE.I_SEVERITY']} onChange={this.handleChange}>
                                    <option>Select</option>
                                    { this.state.severity.map( item=> 
                                        <option key={item.value} value={item.value}>{item.label}</option>
                                    )}
                                </select>
							</div>
						</div>
						<div className="form-group row align-items-center">
							<div className="col-3">품질 검사항목 검출유무</div>
							<div className="col-9">
								<select className="form-control" name="OWP_ISSUE.I_DETECTION" value={this.state.form['OWP_ISSUE.I_DETECTION']} onChange={this.handleChange}>
                                    <option>Select</option>
									<option value="D024001">Y</option>
									<option value="D024002">N</option>
								</select>
							</div>
						</div>
						<div className="form-group row">
							<div className="col-3 col-form-label">품질승인사유</div>
							<div className="col-9">
								<textarea className="form-control" name="OWP_ISSUE.APPROVALRSN" value={this.state.form['OWP_ISSUE.APPROVALRSN']} rows="5" placeholder="내용을 입력해주세요." onChange={this.handleChange}></textarea>
							</div>
						</div>
					</div>
				</div>
			</div>
            <div className="fixed-btn row">
                <div className="col-6">
                    <button type="button" className="btn btn-primary btn-block" onClick={this.onSubmit}>저장</button>
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