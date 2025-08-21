import './style.css';
import icoSend from '../../../public/ico/send/send.svg';
import { isDesktop } from 'react-device-detect';
import axios from 'axios';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { socketAppManager } from '../../store/slices/socketio.js';
import { getMessageForChat, setMessageForChat } from '../../libs/fetch_data/chatFetch.js';





function Chat() {


    if (!isDesktop) return null;

    const userSeled = useSelector(state => state.user);
    const [chatState, setChatState] = useState([]);
    const [hiddenWindowState, setWindowState] = useState(false);
    const inputRef = useRef(null);
    const local = JSON.parse(localStorage.getItem('local_appExpress'))[0];
    const refPaginate = useRef(0);


    useEffect(() => {
        getChat(refPaginate.current)
    }, [])



    useEffect(() => {
        let key = true;
        const recibeData = message => {
            if (key) {
                console.log(message);
                setChatState([message, ...chatState]);
                setWindowState(true);
            }
        };
        socketAppManager.on('receive_message', recibeData)

        return () => {
            socketAppManager.off('receive_message', recibeData);
            key = false;
        }
    }, [chatState]);




    const getChat = useCallback((numberPge) => {
        getMessageForChat({ page: numberPge, limit: 10 })
            .then(response => {
                setChatState([...chatState, ...response.data.result]);
            })
            .catch(error => {
                console.log(error);
            });
    }, [chatState]);





    const printText = message => {

        const newDate = new Date(message.date); // Opciones para formatear la fecha 
        const options = {
            hour: 'numeric', minute: 'numeric', second: 'numeric', year: 'numeric', month: 'long', day: 'numeric'

        }; // Convertir la fecha a un formato legible 
        const readableDate = newDate.toLocaleDateString('es-ES', options);

        return (
            <>

                <div key={message._id} className={message.submittedByUser?.userId === userSeled?._id ? 'msm-contain myText' : 'msm-contain'}>
                    <div style={{ width: '100%', lineHeight: 'normal' }}>
                        <p className="msm-name">{message?.submittedByUser?.name.toLowerCase()}</p>
                        {
                            message.establishment ?
                                <p className='msm-name' style={{ fontSize: '.8rem' }}>{message?.establishment?.name ? message?.establishment?.name.toLowerCase() : null}</p>
                                :
                                null
                        }
                    </div>

                    <p className='msm-body'>{message.message}</p>
                    <p style={{ fontSize: '.7rem', color: '#000' }}>{readableDate}</p>
                </div>

            </>
        );
    };



    const handdlerSubmit = e => {
        e.preventDefault();
        if (inputRef.current.value === '') return null;
        setMessageForChat({
            message: inputRef.current.value.trim(),
            establishment: {
                name: local.name,
                establishmentId: local._id
            }
        })
            .then(response => {
                const text = `_*${userSeled?.name} ${userSeled?.surName} ha escrito:*_\n${inputRef.current.value}${local ? `\n*en: ${local.name}*` : ''}`;

                axios.post('https://72.68.60.254:4000/bot/imgV2/number=120363370695210667@g.us', { "my-text": text })
                    .then(response => {
                        console.log(response);
                    })
                    .catch(error => {
                        console.log(error);
                    })
                inputRef.current.value = '';
            })
            .catch(error => {
                console.log(error);
            })

    };



    return (
        isDesktop ?
            <>
                <div className="chat-component">
                    {
                        userSeled?._id !== '65a9620cf47d628f65772149' ?
                            <div className='chat-chatContain' style={{ overflow: hiddenWindowState ? 'inherit' : 'hidden' }}>
                                <div className='chat-boxText'>
                                    <div className='text-chat'>
                                        {
                                            chatState.length > 0 ?
                                                <>
                                                    {
                                                        chatState.map(data => (
                                                            printText(data)
                                                        ))
                                                    }
                                                    <button onClick={() => getChat(refPaginate.current + 1)}>Cargar chat</button>
                                                </>
                                                :
                                                <div className='chat-await'>
                                                    <p className='chat-await-p'>...esperando</p>
                                                </div>
                                        }

                                    </div>
                                    <form className='textContain' onSubmit={handdlerSubmit}>
                                        <input className='textContain-textArea' type='text' disabled={userSeled?._id === '65a9620cf47d628f65772149'} ref={inputRef} />

                                        <button className='textContain-btn'>
                                            <img className='textContain-imgBtn' src={icoSend} />
                                        </button>
                                    </form>
                                </div>
                                <div className='chat-banner' onClick={() => setWindowState(!hiddenWindowState)}>Chat Jarvis activo</div>
                            </div>
                            :
                            null
                    }

                </div>
            </>
            :
            null
    );
}

export default Chat;