'use strict';


const TABLET_RULES = [
    {
        name_rules: 'toBocasGroup',
        ristorants_id: [ '637a76d41a8ed7ed7d7e71c1', '637a77921a8ed7ed7d7e71c8', '637a78031a8ed7ed7d7e71cd' ],
        plate: [
            {
                name: 'Lunch',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:17:00', totalTime: '00:10:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:17:00', totalTime: '00:10:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:17:00', totalTime: '00:10:00' }, // Martes
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:17:00', totalTime: '00:10:00' }, // Miércoles
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:17:00', totalTime: '00:10:00' }, // Jueves
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:17:00', totalTime: '00:10:00' }, // Viernes
                ],               
            },
            {
                name: 'Plato Fuerte',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:18:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:18:00' }, // Lunes, 
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:18:00' }, // Martes, 
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:18:00' }, // Miercoles, 
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:18:00' }, // Jueves, 
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:18:00' }, // Viernes, 
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:18:00' }, // Sabado, 
                ],      
            }
        ]
    },
    
    {
        name_rules: 'toBocaRaton',
        ristorants_id: [ '637a91691a8ed7ed7d7e724b' ],
        plate: [
            {
                name: 'Appetizer',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Martes
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Miercoles
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Jueves
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Viernes
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Sabado
                ],               
            },
            {
                name: 'Main dish',
                dayActivate: [
                    { type: 'double', dayOfWeek: 0, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //Domingo
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00' } 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 1, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //lunes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 2, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //martes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 3, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //miercoles
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 4, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //jueves
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 5, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //viernes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { type: 'double', dayOfWeek: 6, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //viernes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    } // Domingo
                    
                ],      
            },
            {
                name: 'Salad',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:05:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:05:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:05:00' }, // Martez
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:05:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:05:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:05:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:05:00' }, // Domingo
                ],      
            },
            {
                name: 'Dessert',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Martes
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Miércoles
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Jueves
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Viernes
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:07:00' }, // Viernes
                ],              
            }
        ]
    },
    {
        name_rules: 'toTurtlerCreek',
        ristorants_id: [ '63a21bbe1f1582bab43daf01' ],
        plate: [
            {
                name: 'Appetizer',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Martes
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Miércoles
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Jueves
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Viernes
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Viernes
                ],               
            },
            {
                name: 'Main dish',
                dayActivate: [
                    { type: 'double', dayOfWeek: 0, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //Domingo
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 1, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //lunes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 2, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //martes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 3, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //miercoles
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 4, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //jueves
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 5, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //viernes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { type: 'double', dayOfWeek: 6, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //Sabado
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'}  
                    } 
                    
                ],      
            },
            {
                name: 'Salad',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Martez
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Miercoles
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Jueves 
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Viernes
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Sabado
                ],      
            },
            {
                name: 'Dessert',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Martes
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Miércoles
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Jueves
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Viernes
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Sabado
                ],               
            },
        ]
    },
    {
        name_rules: 'toMisterPembroke',
        ristorants_id: [ '637a91f01a8ed7ed7d7e7250' ],
        plate: [
            {
                name: 'Appetizer',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Martes
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Miércoles
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Jueves
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Viernes
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:08:00' }, // Viernes
                ],               
            },
            {
                name: 'Main dish',
                dayActivate: [
                    { type: 'double', dayOfWeek: 0, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //Domingo
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 1, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //lunes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 2, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //martes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 3, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //miercoles
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 4, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //jueves
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { 
                        type: 'double', dayOfWeek: 5, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //viernes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    }, 
                    { type: 'double', dayOfWeek: 6, 
                        first: { startTime: '00:10:00', endTime: '00:16:00', totalTime: '00:15:00'} , //viernes
                        second: { startTime: '00:17:00', endTime: '00:23:00', totalTime: '00:20:00'} 
                    } // Domingo
                    
                ],      
            },
            {
                name: 'Salad',
                dayActivate: [
                    { type: 'simple', dayOfWeek: 0, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:04:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 1, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:04:00' }, // Lunes
                    { type: 'simple', dayOfWeek: 2, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:04:00' }, // Martez
                    { type: 'simple', dayOfWeek: 3, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:04:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 4, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:04:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 5, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:04:00' }, // Domingo
                    { type: 'simple', dayOfWeek: 6, startTime: '00:10:00', endTime: '00:23:00', totalTime: '00:04:00' }, // Domingo
                ],      
            }
        ]
    },
];


function checkTime( rules, ristorant, time_DishNeme ){
    const calendar = new Date();
    const day = calendar.getDay();
    const date = calendar.getDate();
    const month = calendar.getMonth();
    const year = calendar.getFullYear();
    const hour = calendar.getHours();

    const timeArrayUser = time_DishNeme.time.split(':');
    let result = false;
    let indexOf = -1;
    let error = 'El tiempo es menor al indicado';
    let errorHour = 'no corresponde a esta hora';
    let timeExceeding = '';

    for(let i = 0; i < rules.length; i++){
        indexOf = rules[i].ristorants_id.indexOf(ristorant._id); ////revisar function 
        if(indexOf > -1){
            rules[i].plate.some(plate => {
                if(plate.name.toLowerCase() === time_DishNeme.dishName.toLowerCase()){  
                    const dayRules = plate.dayActivate.filter( dayObject => dayObject.dayOfWeek === day )[0];
                    if(dayRules.type === 'simple'){
                        if(hour >= Number(dayRules.startTime.split(':')[1]) && hour <= Number(dayRules.endTime.split(':')[1])){
                            if(Number(timeArrayUser[0]) > dayRules.totalTime.split(':')[0] || Number(timeArrayUser[1]) >= dayRules.totalTime.split(':')[1]){
                                result = true;
                                timeExceeding = dayRules.totalTime;
                                error = '';
                            }
                            else{
                                error += ` ${ dayRules.totalTime }`;
                            }
                        }
                        else{
                            error = `${plate.name} ${errorHour}`;
                        }
                    }
                    else if(dayRules.type === 'double'){
                        if(hour >= Number(dayRules.first.startTime.split(':')[1]) && hour <= Number(dayRules.first.endTime.split(':')[1])){
                            if(Number(timeArrayUser[0]) > dayRules.first.totalTime.split(':')[0] || Number(timeArrayUser[1]) >= dayRules.first.totalTime.split(':')[1]){ 
                                result = true;
                                timeExceeding = dayRules.first.totalTime;
                                error = '';
                            }
                            else{
                                error += ` ${ dayRules.first.totalTime }`;
                            }
                        }
                        else if(hour >= Number(dayRules.second.startTime.split(':')[1]) && hour <= Number(dayRules.second.endTime.split(':')[1])){
                            if(Number(timeArrayUser[0]) >= dayRules.second.totalTime.split(':')[0] || Number(timeArrayUser[1]) >= dayRules.second.totalTime.split(':')[1]){ 
                                result = true;
                                timeExceeding = dayRules.second.totalTime;
                                error = '';
                            }
                            else{
                                error += ` ${ dayRules.second.totalTime }`;
                            }
                        }
                        else{
                            error = `${plate.name} ${errorHour}`;
                        }
                    }
                }
            });
            break;
        }
    }
    
    return {
        result,
        indexOf,
        error,
        timeExceeding
    };
}


export { TABLET_RULES, checkTime };
