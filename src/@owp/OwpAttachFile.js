import React from 'react'
import { uploadFile } from '@owp';
import { humanFileSize } from '@owp';
import { connect } from 'react-redux'

class OwpAttachFileImpl extends React.Component {

    constructor(props){
        super(props)
        this.state = { attachs : props.Attachs ? props.Attachs : [] }
    }

    UNSAFE_componentWillReceiveProps(nextProps){
        if(nextProps.Attachs !== this.props.Attachs){
            this.setState({ attachs : [...nextProps.Attachs]})
        }
    }

   
    onAttachFile = () => {
        uploadFile(this.props.TableName,this.props.PageID,this.props.preference['USERSEQ']).then( resp=> {
            this.setState({ attachs : this.state.attachs.concat(resp)})
            this.props.onChange(this.state.attachs)
        })
    }
    deleteRow = () => {
        var attach = this.state.attachs.filter( item=> item['CHECKED'] !== true )
        this.setState({ attachs : attach })
    }
    deleteAll = () => {
        this.setState({ attachs : [] })
    }
    checkChange = (e,seq) => {
        var attach = this.state.attachs
        attach = attach.map( item=> {
            if(item['IPX_FILE.FILESEQ'] === seq){
                item['CHECKED'] = e.target.checked
            }
            return item
        })
        this.setState({ attachs : attach })
    }

    render = () => (
        <div className="bx-file">
            <div className="file-btn d-flex no-gutters">
                <div className="col"><button type="button" className="btn btn-dark2 btn-block btn-sm" onClick={this.onAttachFile}><i className="icon-clip"></i> 파일첨부</button></div>
                <div className="col pl-1"><button type="button" className="btn btn-dark2 btn-block btn-sm" onClick={this.deleteRow}><i className="icon-del2"></i> 삭제</button></div>
                <div className="col pl-1"><button type="button" className="btn btn-dark2 btn-block btn-sm" onClick={this.deleteAll}><i className="icon-x"></i> 모두삭제</button></div>
            </div>
            <ul>
                {this.state.attachs.map( item=> (
                <li key={item['IPX_FILE.FILESEQ']}>
                    <span className="file-size">{humanFileSize(item.FileSize)}</span>
                    <label>
                        <input type="checkbox" onChange={ (e)=> this.checkChange(e,item['IPX_FILE.FILESEQ']) }/> {item.FileName}
                    </label>
                </li>
                ))}
            </ul>
        </div>
    )
} 


export const OwpAttachFile = connect( state=> {
    return { preference : state.preference }
})(OwpAttachFileImpl)