import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { pushNotifications, deleteNotifications } from '../../store/slices/alert_line';
import data from '../../libs/dataexaple';
import AlertUpdateCard from './templates/AlertUpdateCard';
import { requestNotificationPermission, notifyAlertUpdate, pushOSNotification } from '../../libs/osNotification';
import { socketAppManager } from '../../store/slices/socketio';
import { v4 as uuidv4 } from 'uuid';
import { isMobile } from 'react-device-detect';




export default function Notifications() {


    const dispatch = useDispatch()
    const alerts = useSelector(store => store.alert_line);
    const user = useSelector(store => store.user);
    const localSeleted = useSelector(store => store.establishment);


    useEffect(() => {
        requestNotificationPermission()
    }, []);




    const pushData = (data) => {

        const userShareId = data?.doc?.sharedByUser?.user?.id?._id;
        const localSeletedId = localSeleted?._id;
        const localDataId = data?.doc?.local?.idLocal;


        if (localSeletedId === localDataId && user?._id === userShareId) {
            dispatch(pushNotifications({
                type: 'alertUpdate',
                data: data?.doc,
                id: data?.doc?._id
            }))
            notifyAlertUpdate(data?.doc)
        }
    };




    // Push cuando un usuario ENVÍA una nueva alerta/novedad (evento created_Alert)
    const pushCreatedAlert = (payload) => {
        const doc = payload?.doc;
        if (!doc) return;

        // No notificar la alerta que envió el propio usuario
        const senderId = doc?.sharedByUser?.user?.id?._id;
        if (senderId && user?._id === senderId) return;

        const localName = doc?.local?.localName || doc?.local?.name || '';
        const icon = doc?.imageToShare || doc?.imageUrl?.[0]?.url || undefined;

        pushOSNotification({
            title: `Nueva alerta — ${doc?.title || 'Novedad'}`,
            body: [localName && `📍 ${localName}`, '→ Por validar'].filter(Boolean).join('\n'),
            icon,
            tag: doc?._id,
        });
    };




    useEffect(() => {
        let subcript = true;
        !isMobile && subcript && socketAppManager.on('document_updated', pushData);
        !isMobile && subcript && socketAppManager.on('created_Alert', pushCreatedAlert);

        /*

        data.forEach(items => {
            dispatch(pushNotifications({
                type: 'alertUpdate',
                data: items,
                id: uuidv4()
            }))
            notifyAlertUpdate(items)
        });

        */

        return () => {
            subcript = false;
            socketAppManager.off('document_updated', pushData);
        }
    }, [user, localSeleted]);




    return (
        <div className='absolute h-[240px] bottom-[0] right-[0] p-[3rem] flex items-center gap-[1rem] pointer-events-none z-1000 '>
            {
                alerts.map(data => {


                    if (data.type === 'alertUpdate') return <CardNotifications key={data.id} id={data.id} ><AlertUpdateCard data={data.data} /></CardNotifications>
                    else return null;
                })
            }
        </div>
    );
}




function CardNotifications({ id, children }) {


    const dispatch = useDispatch();

    useEffect(() => {
        const timeDelete = 100000;
        const timeOut = setTimeout(() => {
            dispatch(deleteNotifications(id));
        }, timeDelete);

        return () => clearTimeout(timeOut);
    }, []);




    return (
        <div className='notif-enter w-[300px] h-[162px] overflow-hidden rounded-xl border border-slate-200 pointer-events-auto'
            onDoubleClick={() => {
                dispatch(deleteNotifications(id))
            }}
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}>
            {children}
        </div>
    );
}