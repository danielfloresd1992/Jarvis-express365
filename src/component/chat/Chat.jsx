import './style.css';
import { isDesktop } from 'react-device-detect';
import axios from 'axios';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { socketAppManager } from '../../store/slices/socketio.js';
import { getMessageForChat, setMessageForChat } from '../../libs/fetch_data/chatFetch.js';




const EMOJIS = [
    '😀', '😁', '😂', '🤣', '😊', '😍', '😘', '😎', '🤩', '😇',
    '🙂', '😉', '😌', '😋', '😜', '🤗', '🤔', '🤨', '😐', '😴',
    '😅', '😆', '🥰', '😗', '🙃', '😏', '😒', '😞', '😢', '😭',
    '😤', '😠', '😡', '🤯', '😳', '🥺', '😬', '🙄', '😱', '🥳',
    '👍', '👎', '👏', '🙏', '💪', '👌', '✌️', '🤝', '👊', '👀',
    '❤️', '🔥', '⭐', '✅', '❌', '⚠️', '🎉', '💯', '💚', '🚀',
    '☕', '🍔', '🍕', '🌮',
];

const STICKERS = ['👍', '🙏', '🎉', '🔥', '❤️', '😂', '😍', '👏', '💯', '😎', '🥳', '✅', '⚠️', '🚀', '💪', '🤝', '☕', '👀', '😴', '🤯'];


// ¿el texto es solo emojis? -> se renderiza en grande, como sticker
const isEmojiOnly = (t) => {
    if (!t) return false;
    const s = t.trim();
    if (!s || /[a-zA-Z0-9]/.test(s)) return false;
    return Array.from(s).length <= 3 && /\p{Extended_Pictographic}/u.test(s);
};




function Chat() {


    if (!isDesktop) return null;

    const userSeled = useSelector(state => state.user);
    const [chatState, setChatState] = useState([]);
    const [hiddenWindowState, setWindowState] = useState(false);
    const [text, setText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTab, setPickerTab] = useState('emoji');
    const inputRef = useRef(null);
    const local = JSON.parse(localStorage.getItem('local_appExpress'))[0];
    const refPaginate = useRef(0);


    useEffect(() => {
        getChat(refPaginate.current);
    }, []);



    useEffect(() => {
        let key = true;
        const recibeData = message => {
            if (key) {
                setChatState([message, ...chatState]);
                setWindowState(true);
            }
        };
        socketAppManager.on('receive_message', recibeData);

        return () => {
            socketAppManager.off('receive_message', recibeData);
            key = false;
        };
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




    // Envío unificado: texto normal o sticker (emoji suelto)
    const sendMessage = (rawText) => {
        const value = (rawText ?? '').trim();
        if (value === '') return;

        const payload = {
            message: value,
            establishment: { name: local?.name, establishmentId: local?._id }
        };
        if (replyingTo) {
            payload.replyTo = {
                messageId: replyingTo._id,
                message: replyingTo.message || replyingTo.sharedAlert?.title || 'Alerta',
                name: replyingTo.submittedByUser?.name
            };
        }

        setMessageForChat(payload)
            .then(() => {
                const waText = `_*${userSeled?.name} ${userSeled?.surName} ha escrito:*_\n${value}${local ? `\n*en: ${local.name}*` : ''}`;
                axios.post('https://72.68.60.254:4000/bot/imgV2/number=120363370695210667@g.us', { 'my-text': waText })
                    .catch(error => console.log(error));
            })
            .catch(error => {
                console.log(error);
            });

        setText('');
        setReplyingTo(null);
        setPickerOpen(false);
    };


    const handdlerSubmit = e => {
        e.preventDefault();
        sendMessage(text);
    };


    const insertEmoji = (emoji) => {
        setText(prev => prev + emoji);
        inputRef.current?.focus();
    };


    // Sube hasta el mensaje original y lo resalta 2s
    const scrollToReplied = (messageId) => {
        if (!messageId) return;
        const el = document.querySelector(`[data-msg-id="${messageId}"]`);
        if (!el) return;
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('msg-highlight');
        void el.offsetWidth; // reflow para re-disparar la animación
        el.classList.add('msg-highlight');
        setTimeout(() => el.classList.remove('msg-highlight'), 2000);
    };




    const printText = message => {

        const readableDate = new Date(message.date).toLocaleDateString('es-ES', {
            hour: 'numeric', minute: 'numeric', second: 'numeric', year: 'numeric', month: 'long', day: 'numeric'
        });

        const isMe = message.submittedByUser?.userId === userSeled?._id;
        const alert = message.sharedAlert;
        const sticker = !alert && isEmojiOnly(message.message);

        return (
            <div
                key={message._id}
                data-msg-id={message._id}
                className={`msm-contain ${isMe ? 'myText' : ''} ${sticker ? 'msm-sticker' : ''}`}
            >
                <button className='msm-reply-btn' type='button' title='Responder' onClick={() => setReplyingTo(message)}>↩</button>

                {!isMe && !sticker && (
                    <p className="msm-name">
                        {message?.submittedByUser?.name?.toLowerCase()}
                        {message?.establishment?.name ? ` · ${message.establishment.name.toLowerCase()}` : ''}
                    </p>
                )}

                {/* Cita del mensaje respondido */}
                {message.replyTo && (message.replyTo.message || message.replyTo.name) && (
                    <div className='msm-reply-quote' onClick={() => scrollToReplied(message.replyTo.messageId)} title='Ir al mensaje original'>
                        <b>{message.replyTo.name || 'Mensaje'}</b>
                        <span>{message.replyTo.message}</span>
                    </div>
                )}

                {/* Alerta del muro compartida */}
                {alert && (
                    <div className='msm-alert'>
                        {alert.image && <img src={alert.image} alt='alerta compartida' className='msm-alert-img' loading='lazy' />}
                        <div className='msm-alert-body'>
                            <div className='msm-alert-head'>
                                <b>{alert.title || 'Alerta'}</b>
                                <span className={`msm-alert-badge ${alert.validation === 'true' ? 'ok' : alert.validation === 'false' ? 'no' : 'pend'}`}>
                                    {alert.validation === 'true' ? 'Aprobada' : alert.validation === 'false' ? 'Rechazada' : 'Pendiente'}
                                </span>
                            </div>
                            {alert.localName && <span className='msm-alert-local'>{alert.localName}</span>}
                            {alert.menu && <p className='msm-alert-menu'>{alert.menu}</p>}
                        </div>
                    </div>
                )}

                {/* Texto / sticker */}
                {message.message && (
                    <p className={sticker ? 'msm-sticker-emoji' : 'msm-body'}>{message.message}</p>
                )}

                <p className='msm-time'>{readableDate}</p>
            </div>
        );
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

                                    {/* ── Preview de respuesta ── */}
                                    {replyingTo && (
                                        <div className='chat-reply-preview'>
                                            <div className='chat-reply-preview-body'>
                                                <b>Respondiendo a {replyingTo.submittedByUser?.name || ''}</b>
                                                <span>{replyingTo.message || replyingTo.sharedAlert?.title || 'Alerta'}</span>
                                            </div>
                                            <button type='button' onClick={() => setReplyingTo(null)} aria-label='Cancelar respuesta'>×</button>
                                        </div>
                                    )}

                                    {/* ── Panel de emojis / stickers ── */}
                                    {pickerOpen && (
                                        <div className='chat-picker'>
                                            <div className='chat-picker-tabs'>
                                                <button type='button' className={pickerTab === 'emoji' ? 'active' : ''} onClick={() => setPickerTab('emoji')}>Emojis</button>
                                                <button type='button' className={pickerTab === 'sticker' ? 'active' : ''} onClick={() => setPickerTab('sticker')}>Stickers</button>
                                            </div>
                                            <div className='chat-picker-grid'>
                                                {(pickerTab === 'emoji' ? EMOJIS : STICKERS).map((e, i) => (
                                                    <button
                                                        key={i}
                                                        type='button'
                                                        className={pickerTab === 'sticker' ? 'sticker' : ''}
                                                        onClick={() => pickerTab === 'emoji' ? insertEmoji(e) : sendMessage(e)}
                                                    >
                                                        {e}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ── Input ── */}
                                    <form className='textContain' onSubmit={handdlerSubmit}>
                                        <button
                                            type='button'
                                            className='chat-emoji-btn'
                                            title='Emojis y stickers'
                                            onClick={() => setPickerOpen(o => !o)}
                                        >
                                            😊
                                        </button>
                                        <input
                                            className='textContain-textArea'
                                            type='text'
                                            placeholder='Escribe un mensaje…'
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                            ref={inputRef}
                                        />
                                        <button className='textContain-btn' type='submit' title='Enviar'>
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
