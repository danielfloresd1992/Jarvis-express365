import { useState, useEffect } from 'react';



export default function PersonKeyInput({ changeEvent }) {


    const [person, setPerson] = useState({
        gender: '',
        garment: '',
        color: ''
    });


    const [activate, setActivate] = useState(false);



    useEffect(() => {
        changeEvent(person);
    }, [person]);




    useEffect(() => {
        if (activate === false) setActivate({
            gender: '',
            garment: '',
            color: ''
        })
    }, [activate]);



    return (
        <div className='w-full'>
            {
                title.isDescriptionPerson ?
                    (
                        <>
                            <h2 style={{ color: 'rgb(223 0 155)' }}>Descripción de la persona</h2>
                            <label className='box-label'> Genero
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
                                            setPerson({ ...person, gender: e.target.value })
                                        }
                                    }
                                >
                                    <option value=''>Selecione</option>
                                    <option value={local.lang === 'es' ? 'dama' : 'lady'}>Dama</option>
                                    <option value={local.lang === 'es' ? 'caballero' : 'glentmen'}>Caballero</option>
                                </select>
                            </label>
                            <label
                                className='box-label'> Tipo de prenda de la persona
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
                                            setPerson({ ...person, garment: e.target.value })
                                        }
                                    }
                                >
                                    <option value=''>Selecione</option>
                                    <option value={local.lang === 'es' ? 'suéter' : 'sweater'}>Sueter</option>
                                    <option value={local.lang === 'es' ? 'chaqueta' : 'jacket'}>Chaqueta</option>
                                    <option value={local.lang === 'es' ? 'camisa' : 'shirt'}>Camisa</option>
                                    <option value={local.lang === 'es' ? 'vestido' : 'dress'}>Vestido</option>
                                </select>
                            </label>
                            <label
                                className='box-label'> Color la prenda
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
                                            setPerson({ ...person, color: e.target.value })
                                        }
                                    }
                                >
                                    <option value=''>Selecione</option>
                                    <option value={local.lang === 'es' ? 'negro' : 'black'}>negro</option>
                                    <option value={local.lang === 'es' ? 'blanco' : 'white'}>blanco</option>
                                    <option value={local.lang === 'es' ? 'verde' : 'green'}>verde</option>
                                    <option value={local.lang === 'es' ? 'amarillo' : 'yellow'}>amarillo</option>
                                    <option value={local.lang === 'es' ? 'azul' : 'blue'}>azul</option>
                                    <option value={local.lang === 'es' ? 'rojo' : 'red'}>rojo</option>
                                    <option value='beige'>beige</option>
                                    <option value={local.lang === 'es' ? 'marron' : 'brown'}>marron</option>
                                    <option value={local.lang === 'es' ? 'rosa' : 'pink'}>rosa</option>
                                    <option value={local.lang === 'es' ? 'gris' : 'grey'}>gris</option>
                                    <option value={local.lang === 'es' ? 'dorado' : 'golden'}>dorado</option>
                                    <option value={local.lang === 'es' ? 'vinotinto' : 'burgundy'}>vinotinto</option>
                                    <option value={local.lang === 'es' ? 'naranja' : 'orange'}>naranja</option>
                                </select>
                            </label>
                        </>
                    )
                    :
                    (null)
            }
        </div>
    );
}