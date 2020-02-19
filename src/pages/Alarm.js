/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'

export default class Alarm extends React.Component{


    render = () => (
        <React.Fragment>
            <ul class="lst-board">
                {/* 안읽은 거 */}
				<li>
					<a className="link bg-sky" href="">
						<p>"포장지 이등분 안됨" 게시글에 <strong>댓글</strong>이 추가 되었습니다.</p>
						<span class="h6 text-muted">2019.12.12 11:00</span>
					</a>
				</li>
				<li>
					<a className="link" href="">
						<p>"APS 마모 확인요청" 게시글이 <strong>이슈 완료</strong> 되었습니다.</p>
						<span class="h6 text-muted">2019.12.12 11:00</span>
					</a>
				</li>
			</ul>
        </React.Fragment>

    )
}

