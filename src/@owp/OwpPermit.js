import { OwpSession } from '@owp'

export const OwpPermitISSUE = function (){
/*권한
D002001 시스템관리자
D002002 등록자(국내엔지니어)
D002003 등록자(해외대리점)
D002004 등록자(생산직반장)
D002005 등록자(협력사)
D002006 검토자(국내지역장)
D002007 검토자(영업관리)
D002008 검토자(생산팀장)
D002009 검토자(구매담당자)
D002010 연구팀장
D002011 품질팀장
D002012 생산팀장
D002013 처리담당자(연구)
D002014 처리담당자(연구외)
D002015 열람자
D002016 운영관리자
----- 아직 모름 ----
D002017 테스트"
D002018 구매팀장"
*/
    return OwpSession('PERMISSIONID')
}

export const OwpDept = function (type){
    let dept = OwpSession('DEPTID');
    /* 부서
"A001002"	"상품기획팀"
"A001003"	"디자인팀"
"A001004"	"설계1팀"
"A001005"	"설계2팀"
"A001006"	"설계3팀"
"A001007"	"소프트웨어1팀"
"A001008"	"소프트웨어2팀"
"A001009"	"연구관리팀"
"A001010"	"개발팀"
"A001011"	"품질경영팀"
"A001012"	"품질보증팀"
"A001013"	"구매자재팀"
"A001014"	"생산관리팀"
"A001015"	"생산기술팀"
"A001016"	"생산1팀"
"A001017"	"생산1팀(소형)"
"A001018"	"생산1팀(기구)"
"A001019"	"생산1팀(대형)"
"A001020"	"생산1팀(가공)"
"A001021"	"생산1팀(캐니스터)"
"A001022"	"생산1팀(반자동)"
"A001023"	"생산1팀(지원)"
"A001024"	"생산1팀(포장)"
"A001025"	"생산2팀"
"A001026"	"MP팀"
"A001027"	"인사총무팀"
"A001028"	"재경기획팀"
"A001029"	"영업관리팀"
"A001030"	"IT전략팀"
"A001031"	"대표이사"
"A001032"	"해외"
"A001033"	"거래처/협력사"
"A001034"	"국내엔지니어(JVM)"
"A001035"	"국내지역장(JVM)"
"A001036"	"부사장"
================
MP팀 : mp
IT전략팀 : it
영업관리팀 : sa
디자인팀 :de
상품기획팀 : pp
구매자재팀 : bu
---- 생산 ----
생산관리팀 : pm
생산기술팀 : pt
---- 연구 ----
개발팀 : dv
설계1팀 : d1
설계2팀 : d2
설계3팀 : d3
소프트웨어1팀 : s1
소프트웨어2팀 : s2
연구관리팀 : rm
---- 품질 ----
품질경영팀 : qm
품질보증팀 : qc
    */
    // 구매
    if(dept==="A001013") { 
        return '구매'
    // 생산 
    } else if(dept==="A001017" || dept==="A001018" || dept==="A001019" || dept==="A001020" || dept==="A001021" || dept==="A001022" || dept==="A001023" || dept==="A001024" || dept==="A001025"){
        return '생산'
    // 연구 
    } else if(dept==="A001004" || dept==="A001005" || dept==="A001006" || dept==="A001007" || dept==="A001008" || dept==="A001009" || dept==="A001010"){
        return '연구'
    // 품질 
    } else if(dept==="A001011" || dept==="A001012"){
        return '품질'
    }
}
