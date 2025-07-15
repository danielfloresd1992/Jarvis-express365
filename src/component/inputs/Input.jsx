'use client';
import { useState, useEffect } from 'react';

export default function InputBorderBlue({ 
    textLabel='', 
    type= 'text', 
    register = null, 
    name, 
    childSelect = [], 
    important = true,
    eventChengue = null,
    disable = false, 
    value = null,
    min = 0,
    max = 100,
    step = 0.1
}){

    const [ valueState, setValueState ] = useState();
    

    useEffect(() => {
        setValueState(value ? value : null);
    }, [ value ]);


    const printInput = () => {
        if(type === 'select'){
            return(
                <select 
                    required={ important ? true : true }
                    className='__input'
                    { ...(register ? register(name) : {}) }
                    defaultValue={  '--Selecione--' }
                    value={ valueState }
                    disabled={ disable }
                    onChange={ e => {
                        setValueState(e.target.value);
                        eventChengue ? eventChengue(e.target.value) : null;
                    }}
                >
                        <option value='--Selecione--' disabled={ true }>--Selecione--</option>
                        {
                            Array.isArray(childSelect) && childSelect.length > 0 ?
                                childSelect.map((option, index)=> (
                                    <option value={ option.value } key={ index } style={{color: '#000'}}>{ option.text || option.value }</option>
                                ))
                            : 
                            null
                        }
                </select>
            );
           
        }
        if(type === 'range'){
            return(
                <input 
                    type={ type }
                    className='__input'
                    value={  valueState ?  valueState : false }
                    disabled={ disable }
                    min={min}
                    max={max}
                    step={step}
                    { ...(register ?  register(name) : {}) }
                    onChange={ e => {
                        setValueState(e.target.value);
                        eventChengue ? eventChengue(e.target.value) : null;
                    }}
                />
            )
        }
        if(type === 'checkbox'){
            return(
                <input 
                    type={ type }
                    className='__input'
                    checked={  valueState ?  valueState : false }
                    disabled={ disable }
                    { ...(register ?  register(name) : {}) }
                    onChange={ e => {
                        setValueState(e.target.checked);
                        eventChengue ? eventChengue(e.target.checked) : null;
                    }}
                />
            )
        }
        else{
            return(
                <input 
                    type={ type }
                    required={ important ? true : true }
                    className='__input'
                    value={ valueState ?  valueState : ''}
                    disabled={ disable }
                    { ...(register ?  register(name) : {}) }
                    min={min}
                    max={max}
                    onChange={ e => {
                        setValueState(e.target.value);
                        eventChengue ? eventChengue(e.target.value) : null;
                    }}
                />
            );
        }
    }

    return(
        <label className='__width-complete __label'
            style={{ outline: 'none', color: '#000' }}
        >
            <p 
                className='form-label-p'
                style={ type === 'checkbox' ? { textAlign: 'center' } : null }
            >{ textLabel } { important ? <b style={{ color: 'red' }}>*</b> : null }</p>
            {
                printInput()
            }
    
        </label>
    );
}