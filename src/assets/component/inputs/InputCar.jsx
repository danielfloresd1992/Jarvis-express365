import { useState, useEffect } from 'react';
import modelCardCompleteArr from '../../../../public/modelCardComplete.json';


const styleContain = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    margin: 'auto',
    with: '100%'
}


const styleImg = {
    width: '200px',
    height: '200px',
    backgroundColor: '#fff',
    margin: 'auto'
};


const styleImgCar = {
    width: '260px',
    height: '150px',
    backgroundColor: '#fff',
};

const styleWComplete = {
    with: '100%'
};


const styleOption = { color: '#000', backgroundColor: '#fff' }


export default function CarsSelect({ changueInput, lang, imagenCompare }) {

    const [vehicleTypesStateRender, setVehicleTypesStateRender] = useState('cars');
    const [brandState, setBrandState] = useState(null);
    const [carState, setCarState] = useState(null);
    const [colorVehicleState, setColorVehicleState] = useState(null)

    console.log(carState);
    console.log(colorVehicleState);

    useEffect(() => {

        if (brandState && carState) changueInput({ brand: brandState.brand, model: carState.model, color: colorVehicleState });

    }, [brandState, carState, colorVehicleState]);


    const printCarLogoSeleted = (brandString) => {
        if (!brandString) return null;

        return (
            <img src={brandString.logo} style={styleImg} alt="logoCar" />
        )
    };



    const printIntputBrands = (carObject) => {
        if (!carObject) return null;


        return (
            <>
                <label className='box-label' style={styleWComplete}> Modelo
                    <select
                        className='box-inputText'
                        style={
                            {
                                textAlign: 'left'
                            }
                        }
                        required
                        onChange={
                            e => {
                                const selected = carObject.models.filter(item => e.target.value === item.model);
                                setCarState(selected[0]);
                            }
                        }
                    >
                        <option value='' style={styleOption}>Selecione</option>
                        {

                            carObject.models.sort((a, b) => a.model.localeCompare(b.model)).map(brand => (
                                <option value={brand.brand} style={styleOption}>{brand.model}</option>
                            ))
                        }

                    </select>
                </label>
            </>
        )
    };



    const printCar = (car) => {
        if (!car) return null;

        return (
            <>
                <span className='box-label'>Ímagenes de referencia</span>
                {
                    car.title ? <p style={{ color: '#fff' }}>{car.title}</p> : null
                }
                {
                    car.img.map(img => (
                        <img src={img} style={styleImgCar} alt="logoCar" />
                    ))
                }
                {
                    imagenCompare ?
                    <>
                        <span className='box-label'>Tu ímagen</span>
                        <img src={imagenCompare} style={styleImgCar} alt="logoCar" />
                    </>
                    : 
                    null
                }
            </>
        );
    };

    

    if (vehicleTypesStateRender === 'cars') {
        return (
            <div style={styleContain}>

                <h2 style={ { color: 'rgb(223 0 155)' } }>Descripción del vehículo</h2> 
                <label className='box-label'> Marca
                    <select
                        className='box-inputText'
                        style={
                            {
                                textAlign: 'left'
                            }
                        }
                        required
                        onChange={
                            e => {
                                const selected = modelCardCompleteArr.filter(item => e.target.value === item.brand);
                                setBrandState(selected[0]);
                                setCarState(null);
                            }
                        }
                    >
                        <option value='' style={styleOption}>Selecione</option>
                        {

                            modelCardCompleteArr.sort((a, b) => a.brand.localeCompare(b.brand)).map(brand => (
                                <option value={brand.brand} style={{ color: '#000', backgroundColor: '#fff' }}>{brand.brand}</option>
                            ))
                        }

                    </select>
                </label>
                {
                    printCarLogoSeleted(brandState)
                }
                {
                    printIntputBrands(brandState)
                }
                {
                    printCar(carState)
                }
                <label
                    className='box-label'> Color del vehículo
                    <select
                        className='box-inputText'
                        style={
                            {
                                textAlign: 'left'
                            }
                        }
                        required
                        onChange={
                            e => {
                                setColorVehicleState(e.target.value);
                            }
                        }
                    >
                        <option style={styleOption} value=''>Selecione</option>
                        <option style={styleOption} value={lang === 'es' ? 'negro' : 'black'}>negro</option>
                        <option style={styleOption} value={lang === 'es' ? 'blanco' : 'white'}>blanco</option>
                        <option style={styleOption} value={lang === 'es' ? 'verde' : 'green'}>verde</option>
                        <option style={styleOption} value={lang === 'es' ? 'amarillo' : 'yellow'}>amarillo</option>
                        <option style={styleOption} value={lang === 'es' ? 'azul' : 'blue'}>azul</option>
                        <option style={styleOption} value={lang === 'es' ? 'rojo' : 'red'}>rojo</option>
                        <option style={styleOption} value='beige'>beige</option>
                        <option style={styleOption} value={lang === 'es' ? 'marron' : 'brown'}>marron</option>
                        <option style={styleOption} value={lang === 'es' ? 'rosa' : 'pink'}>rosa</option>
                        <option style={styleOption} value={lang === 'es' ? 'gris' : 'grey'}>gris</option>
                        <option style={styleOption} value={lang === 'es' ? 'dorado' : 'golden'}>dorado</option>
                        <option style={styleOption} value={lang === 'es' ? 'vinotinto' : 'burgundy'}>vinotinto</option>
                        <option style={styleOption} value={lang === 'es' ? 'naranja' : 'orange'}>naranja</option>
                    </select>
                </label>
            </div>
        );
    }
    else {
        return null
    }
}
