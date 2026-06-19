import { isMobile } from "react-device-detect";


function useTextMenu({
    localData,
    LANG,
    title,
    amountState,
    table,
    time1,
    time2,
    textResult,
    ref,
    description,
    car,
    person,
    area
}) {

    const localText = `*${localData.name}*`;
    const headerText = Boolean(title[0].textHeader) ? `\n*${LANG === 'es' ? title[0].textHeader.es : title[0].textHeader.en}*` : '';
    console.log(title[0].en.trim().includes('\r\n'))
    const titleText = LANG === 'es' ?

        title[0].es.trim().includes('\r\n') || title[0].es.trim().includes('\n') ? `\n${title[0].es.trim()}` : `\n_*${title[0].es.trim()}*_`
        :

        title[0].en.trim().includes('\r\n') || title[0].es.trim().includes('\n') ? `\n${title[0].en.trim()}` : `\n_*${title[0].en.trim()}*_`;

    const amountText = amountState !== '' ? (LANG === 'es' ? `\nCantidad total: ${amountState}` : `\nAmount: ${amountState}`) : '';

    const tableText = table !== '' ? `\n${LANG === 'es' ? 'Mesa:' : 'Table:'} ${table}` : '';


    const timeSpecial = title[0].especial !== null ? `\n${LANG === 'es' ? `${title[0].especial.time.timeInitTitle.es}: ${time1}\n${title[0].especial.time.timeEndTitle.es}: ${time2}` : `${title[0].especial.time.timeInitTitle.en}: ${time1}\n${title[0].especial.time.timeEndTitle.en}: ${time2}`}` : '';


    const clock = `${ref.current !== null ? `\n${LANG === 'es' ? 'Hora:' : 'Time:'} ${ref.current}` : ''}`
    const totalTime = textResult !== '' ? `\n${LANG === 'es' ? 'Tiempo total:' : 'Total time:'} ${textResult}` : '';
    const Brand = Boolean(car?.brand) ? LANG === 'es' ? `\nMarca del vehículo: ${car.brand}` : `\nBrand: ${car.brand}` : '';
    const model = Boolean(car?.model) ? LANG === 'es' ? `\nModelo: ${car.model}` : `\nCar model: ${car.model}` : '';
    const color = Boolean(car?.color) ? LANG === 'es' ? `\nColor: ${car.color}` : `\nColor: ${car.color}` : '';

    const personMenu = Boolean(person) ? LANG === 'es' ? `\nDescipción: ${person.gender} con ${person.garment} ${person.color}` : `\nDescription:  ${person.gender} with ${person.garment} ${person.color}` : '';
    const areaMenu = Boolean(area) ? LANG === 'es' ? `\nÁrea: ${area}` : `\nArea: ${area}` : '';
    const note = description !== '' ? `\n${LANG === 'es' ? 'Nota: ' : 'Note: '} ${description.toLowerCase()}` : '';
    return `${localText}${headerText}${titleText}${tableText}${amountText}${timeSpecial}${clock}${totalTime}${Brand}${model}${color}${personMenu}${areaMenu}${note}`;
}


function useDataUser(user, local, storangeUser, storangeLocal) {
    const userData = {};
    const localData = {};
    let LANG = null;


    userData.userName = `${user.name} ${user.surName}`;
    userData.userId = user._id;
    localData.name = local.name;
    localData.franchise = local.franchise;
    localData.localId = local._id;
    LANG = local.lang;

    return { userData, localData, LANG }
}

export { useTextMenu, useDataUser };