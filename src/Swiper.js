import React from 'react'
import SwiperM from 'swiper'

export default class Swiper extends React.Component{


    constructor(props){
        super(props)
    }

    render = () => (
        <div className="swiper-container">
            <div className="swiper-wrapper">
                {
                    this.props.sildes.map( (item,index) => {
                     return <div key={index} className="swiper-slide">{item.name}</div>
                    })
                }
            </div>
        </div>
    )


    componentDidMount = () => {
        this.swiper = new SwiperM('.swiper-container', {})
    }

    componentDidUpdate = () => {
        this.swiper.update()
    }
}