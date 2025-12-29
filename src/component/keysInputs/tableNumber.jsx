import { useState, useEffect, useRef } from 'react';



export function TableInput({ onChangeEvent, disabled, value }) {


    const [tableNeeded, setTableNeeded] = useState(true);


    if (disabled) return null;

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
    const inputRef = useRef(null);



    useEffect(() => {
        const preventScrollEvent = (e) => {
            e.preventDefault();
        };

        if(inputRef.current) inputRef.current.addEventListener('wheel', preventScrollEvent, {passive: false})
        


        return () => {
            if(inputRef.current) inputRef.current.removeEventListener('wheel', preventScrollEvent);
        }
    }, [inputRef]);



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
                            id="inicio"
                            value={value}
                            required
                            onChange={e => onChangeEvent(e.target.value)}
                            type='number'
                            ref={inputRef}
                        />
                    </label>
                    :
                    null
            }
        </>

    );
}