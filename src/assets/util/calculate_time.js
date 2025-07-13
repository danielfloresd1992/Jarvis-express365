
export default function calculateTime(time1, time2){
    if(!time1 && !time2) return '';
    let hourTotal = time2.split(':')[0] - time1.split(':')[0];
    let minuteTotal = time2.split(':')[1] - time1.split(':')[1];
    let secondTotal = time2.split(':')[2] - time1.split(':')[2];

    if (secondTotal < 0) {
        secondTotal = 60 - Math.abs(secondTotal)
        --minuteTotal;
    }
    if (minuteTotal < 0) {
        minuteTotal = 60 - Math.abs(minuteTotal);
        --hourTotal
    }
    if (minuteTotal < 10) minuteTotal = `0${minuteTotal}`
    if (secondTotal < 10) secondTotal = `0${secondTotal}`
    if (hourTotal < 9) hourTotal = `0${hourTotal}`;

    let housExceed = '00';
    let minuteExceed = (`0${minuteTotal - 3}`).substr(-2);
    let secondExceed = (`0${secondTotal - 0}`).substr(-2);

    if (secondExceed < 0) {
        secondExceed = 60 - Math.abs(secondExceed);
        --minuteExceed;
    }
    if (minuteExceed < 0) {
        minuteExceed = 60 - Math.abs(minuteExceed);
        --housExceed;
    }

    return ` ${isNaN(hourTotal) ? '❌' : hourTotal}:${isNaN(minuteTotal) ? '❌' : minuteTotal}:${isNaN(secondTotal) ? '❌' : secondTotal}`;
}