import { useState } from 'react';


export function TableInput({ onChangeEvent, value }) {


    const [tableNeeded, setTableNeeded] = useState(true);


    return (
        <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '.5rem'
        }}>
            <label htmlFor="" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexDirection: 'column' }}>
                <p style={{ color: '#fff' }}>¿no se necesita numero de mesa?</p>
                <input type='checkbox'
                    checked={tableNeeded}
                    onChange={e => {
                        if (!e.target.checked) onChangeEvent('');
                        setTableNeeded(e.target.checked)
                    }}
                />
            </label>

            {
                tableNeeded ?
                    <label className='box-label' style={{ color: '#fff' }} > Número de mesa
                        <input
                            className='box-inputText'
                            type="text"
                            id="inicio"
                            value={value}
                            required
                            onChange={e => onChangeEvent(e.target.value)}
                        />
                    </label>
                    :
                    null
            }
        </div>
    );
}




export function TikekInput({ onChangeEvent, value }) {


    const [tableNeeded, setTableNeeded] = useState(true);


    return (

        <>
            <label htmlFor="" style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexDirection: 'column' }}>
                <p style={{ color: '#fff' }}>¿no se necesita numero de Ticket?</p>
                <input type='checkbox'
                    checked={tableNeeded}
                    onChange={e => {
                        if (!e.target.checked) onChangeEvent('');
                        setTableNeeded(e.target.checked)
                    }}
                />
            </label>

            {
                tableNeeded ?
                    <label className='box-label' style={{ color: '#fff' }} > Número de Ticket
                        <input
                            className='box-inputText'
                            type="text"
                            id="inicio"
                            value={value}
                            required
                            onChange={e => onChangeEvent(e.target.value)}
                        />
                    </label>
                    :
                    null
            }
        </>

    );
}