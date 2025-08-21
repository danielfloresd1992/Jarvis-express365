'use strict';
import { returnTimeExceding } from '../../../../libs/date_time/time';
import { isTimeGreaterThanOther } from '../../../../libs/date_time/timeValidator';
//../../../../ libs / date_time / time';

const TABLET_RULES = [

];


function checkTime(rule, timeTotalResult) {

    const resultData = {
        approval: false,
        error: null,
        timeExceeding: '00:00:00'
    };

    if (!rule) return resultData;


    const calendar = new Date();
    const hour = calendar.getHours();

    const timeSelkectShift = hour >= 18 ? rule.timeLimit.night : rule.timeLimit.day;


    resultData.approval = isTimeGreaterThanOther(timeTotalResult, timeSelkectShift);
    resultData.timeExceeding = returnTimeExceding(timeTotalResult, timeSelkectShift);

    return resultData;
}


export { TABLET_RULES, checkTime };
