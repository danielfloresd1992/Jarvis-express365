'use strict';
import { returnTimeExceding } from '../../../../libs/date_time/time';
import { isTimeGreaterThanOther } from '../../../../libs/date_time/timeValidator';
//../../../../ libs / date_time / time';

const TABLET_RULES = [

];


// checkTime = «la preparación pasó del tiempo del plato ('rule', un plato de la carta) en su turno»
// 'shift' ('day' | 'night') es opcional: lo manda Mesas, el turno de la rotación con que marcó la demora. Sin él, la
// hora del equipo: de noche desde las 18:00.
function checkTime(rule, timeTotalResult, shift) {

    const resultData = {
        approval: false,
        error: null,
        ignore: true,
        timeExceeding: '00:00:00'
    };

    if (!rule || !rule?.timeLimit) return resultData;

    resultData.ignore = false;

    const calendar = new Date();
    const hour = calendar.getHours();

    const night = shift ? shift === 'night' : hour >= 18;
    const timeSelkectShift = night ? rule.timeLimit.night : rule.timeLimit.day;


    resultData.approval = isTimeGreaterThanOther(timeTotalResult, timeSelkectShift);
    resultData.timeExceeding = returnTimeExceding(timeTotalResult, timeSelkectShift);

    return resultData;
}


export { TABLET_RULES, checkTime };
