

function returnMenu(localData, LANG, title, table, time2, ref, description ){
    const localText = `*${ localData.name }*`;
    const titleText = LANG === 'es' ? `\n_*${title.es}*_` : `\n_*${title.en}*_`;
    const tableText = table !== '' ? `\n${ LANG === 'es' ? 'Mesa:' : 'Table:' } ${table}` : '';    

    const timeSpecial = title.especial ? `\n${ LANG === 'es' ? `${title.especial.time.timeInitTitle.es}: ${time1}\n${title.especial.time.timeEndTitle.es}: ${time2}` : `${title.especial.time.timeInitTitle.en}: ${time1}\n${title.especial.time.timeEndTitle.en}: ${time2}`}` : '';

    const clock = `${ref.current !== null ? `\n${ LANG ===  'es' ? 'Hora:' : 'Time:'} ${ref.current}` : ''}`
    const totalTime =  textResult !==  '' ? `\n${ LANG === 'es' ? 'Tiempo total:' : 'Time total:'} ${textResult}` : '';
    const note = description !== '' ? `\n${ LANG === 'es' ? 'Nota:' : 'Note:'} ${description.toLowerCase()}` : '';
    return `${localText}${titleText}${tableText}${timeSpecial}${clock}${totalTime}${note}`;
}


/*
if(LANG === 'es') { 
    if(title[0].time){
        if(title[0].table){
            if(title[0].especial){
                console.log('pase por aqui');
                text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\nMesa: ${table}\n${title[0].especial.time.timeInitTitle.es}: ${time1}\n${title[0].especial.time.timeEndTitle.es}: ${time2}\nTiempo total: ${textResult}${note}`;
            }
            else{
                text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\nMesa: ${table}\nTiempo total: ${textResult}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            
        }
        else{
            if(title[0].especial){
                text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\n${title[0].especial.time.timeInitTitle.es}: ${time1}\n${title[0].especial.time.timeEndTitle.es}: ${time2}\nTiempo total: ${textResult}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            else{
                text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\nTiempo total: ${textResult}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
        }
    }
    else{
        if(title[0].table){
            text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\nMesa: ${table}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
        }
        else{
            text =`*${ localData.name }*\n_*${title[0].es.trim()}*_${ref.current !== null ? `\nHora: ${ref.current}` : ''}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
        }
    }
}
else if(LANG === 'en'){
    if(title[0].time){
        if(title[0].table){
            if(title[0].especial){
                text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\ntable: ${table}\n${title[0].especial.time.timeInitTitle.en}: ${time1}\n${title[0].especial.time.timeEndTitle.en}: ${time2}\nTime total: ${textResult}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }
            else{
                text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\ntable: ${table}\nTime total: ${textResult}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }
        }
        else{
            if(title[0].especial){
                text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\n${title[0].especial.time.timeInitTitle.en}: ${time1}\n${title[0].especial.time.timeEndTitle.en}: ${time2}\nTime total: ${textResult}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }
            else{
                text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\nTime total: ${textResult}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }
            
        }
    }
    else{
        if(title[0].time){
            text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\nTable: ${table}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
        }
        else{
            text = `*${ localData.name }*\n_*${title[0].en.trim()}*_${ref.current !== null ? `\nCheck In: ${ref.current}` : ''}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
        }
        
    }
}
else{
    return boxModal.open('Error', 'la propiedad "LANG", es indefinida, por favor ponerse en contact con el personal de sistema')
}
*/


if(LANG === 'es') { 
    if(title[0].time){
        if(title[0].table){
            if(title[0].especial){
                text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\nMesa: ${table}\n${title[0].especial.time.timeInitTitle.es}: ${time1}\n${title[0].especial.time.timeEndTitle.es}: ${time2}\nTiempo total: ${textResult}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            else{
                text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\nMesa: ${table}\nTiempo total: ${textResult}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            
        }
        else{
            if(title[0].especial){
                text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\n${title[0].especial.time.timeInitTitle.es}: ${time1}\n${title[0].especial.time.timeEndTitle.es}: ${time2}\nTiempo total: ${textResult}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
            else{
                text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\nTiempo total: ${textResult}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
            }
        }
    }
    else{
        if(title[0].table){
            text =`*${ localData.name }*\n_*${title[0].es.trim()}*_\nMesa: ${table}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
        }
        else{
            text =`*${ localData.name }*\n_*${title[0].es.trim()}*_${ref.current !== null ? `\nHora: ${ref.current}` : ''}${description !== '' ? `\nNota: ${description.toLowerCase()}` : ''}`;
        }
    }
}
else if(LANG === 'en'){
    if(title[0].time){
        if(title[0].table){
            if(title[0].especial){
                text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\ntable: ${table}\n${title[0].especial.time.timeInitTitle.en}: ${time1}\n${title[0].especial.time.timeEndTitle.en}: ${time2}\nTime total: ${textResult}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }
            else{
                text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\ntable: ${table}\nTime total: ${textResult}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }
        }
        else{
            if(title[0].especial){
                text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\n${title[0].especial.time.timeInitTitle.en}: ${time1}\n${title[0].especial.time.timeEndTitle.en}: ${time2}\nTime total: ${textResult}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }
            else{
                text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\nTime total: ${textResult}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
            }
            
        }
    }
    else{
        if(title[0].time){
            text = `*${ localData.name }*\n_*${title[0].en.trim()}*_\nTable: ${table}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
        }
        else{
            text = `*${ localData.name }*\n_*${title[0].en.trim()}*_${ref.current !== null ? `\nCheck In: ${ref.current}` : ''}${description !== '' ? `\nNote: ${description.toLowerCase()}` : ''}`;
        }
        
    }
}
else{
    return boxModal.open('Error', 'la propiedad "LANG", es indefinida, por favor ponerse en contact con el personal de sistema')
}
