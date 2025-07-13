function returnTimeExceding(time, timelimit) {
   
    const hour = Number(time.split(':')[0]);
    const minute = Number(time.split(':')[1]);
    const second = Number(time.split(':')[2]);

    let hourLimit = Number(timelimit.split(':')[0]);
    let minuteLimit = Number(timelimit.split(':')[1]);
    let secondLimit = Number(timelimit.split(':')[2]);

    let timeDecimal = hour + ( minute / 60 ) + ( second / 3600 );
    let timeLimitDecimal = hourLimit + ( minuteLimit / 60 ) + ( secondLimit / 3600 );

    const result = timeDecimal - timeLimitDecimal;

    let hourResult = Math.floor(result);
    let minuteResultDecimal = (result - Number(hourResult)) * 60;
    let minuteResult = Math.floor(minuteResultDecimal);
    let secondResult = Math.round(( minuteResultDecimal - Math.floor(minuteResultDecimal)) * 60);

   
    if(Number(secondResult) === 60){
        secondResult = 0;
        minuteResult = minuteResult + 1;
    }

    return `${isNaN(hourResult) ? '00' : `0${hourResult}`.substr(-2)}:${isNaN(minuteResult) ? '00' :`0${minuteResult}`.substr(-2)}:${isNaN(secondResult) ? '00' : `0${secondResult}`.substr(-2)}`;
}


export { returnTimeExceding };