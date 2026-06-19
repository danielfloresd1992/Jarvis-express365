import './style.css';
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
    const establishment = useSelector(store => store.establishment);
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

        const isMe = message.submittedByUser?.userId === userSeled?._id;

        return (
            <div key={message._id} className={isMe ? 'msm-contain myText' : 'msm-contain'}>
                {/* Nombre — sólo en mensajes ajenos */}
                {!isMe && (
                    <p className="msm-name">
                        {message?.submittedByUser?.name?.toLowerCase()}
                        {message?.establishment?.name ? ` · ${message.establishment.name.toLowerCase()}` : ''}
                    </p>
                )}
                <p className='msm-body'>{message.message}</p>
                <p className='msm-time'>{readableDate}</p>
            </div>
        );
    };



    const handdlerSubmit = e => {
        e.preventDefault();
        if (inputRef.current.value === '') return null;
        setMessageForChat({
            message: inputRef.current.value.trim(),
            establishment: {
                name: establishment.name,
                establishmentId: establishment._id
            }
        })
            .then(response => {
                const text = `_*${userSeled?.name} ${userSeled?.surName} ha escrito:*_\n${inputRef.current.value}${establishment ? `\n*en: ${establishment.name}*` : ''}`;

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
                                    {/* ── Header estilo WhatsApp ── */}
                                    <div className='chat-boxText-header'>
                                        <div className='chat-header-avatar'>💬</div>
                                        <div className='chat-header-info'>
                                            <p className='chat-header-name'>Chat Jarvis</p>
                                            <p className='chat-header-status'>en línea</p>
                                        </div>
                                    </div>

                                    {/* ── Mensajes ── */}
                                    <div className='text-chat'>
                                        {chatState.length > 0 ? (
                                            <>
                                                {chatState.map(data => printText(data))}
                                                <button
                                                    className='chat-load-more'
                                                    onClick={() => getChat(refPaginate.current + 1)}
                                                >
                                                    Ver mensajes anteriores
                                                </button>
                                            </>
                                        ) : (
                                            <div className='chat-await'>
                                                <p className='chat-await-p'>Sin mensajes aún…</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Input ── */}
                                    <form className='textContain' onSubmit={handdlerSubmit}>
                                        <input
                                            className='textContain-textArea'
                                            type='text'
                                            placeholder='Escribe un mensaje…'
                                            disabled={userSeled?._id === '65a9620cf47d628f65772149'}
                                            ref={inputRef}
                                        />
                                        <button className='textContain-btn' type='submit' title='Enviar'>
                                            {/* Ícono send SVG inline */}
                                            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                            </svg>
                                        </button>
                                    </form>
                                </div>

                                <div className='chat-banner' onClick={() => setWindowState(!hiddenWindowState)}>
                                    Chat Jarvis activo
                                </div>
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