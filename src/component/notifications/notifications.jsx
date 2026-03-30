import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { pushNotifications, deleteNotifications } from '../../store/slices/alert_line';
import data from '../../libs/dataexaple';
import AlertUpdateCard from './templates/AlertUpdateCard';
import { requestNotificationPermission, notifyAlertUpdate } from '../../libs/osNotification';
import { socketAppManager } from '../../store/slices/socketio';
import { v4 as uuidv4 } from 'uuid';


export default function Notifications() {


    const dispatch = useDispatch()
    const alerts = useSelector(store => store.alert_line);
    const user = useSelector(store => store.user);


    useEffect(() => {
        requestNotificationPermission()
    }, [])




    useEffect(() => {
        let subcript = true;


        {/*

        
         data.forEach(items => {
            dispatch(pushNotifications({
                type: 'alertUpdate',
                data: items,
                id: uuidv4()
            }))
            notifyAlertUpdate(items)
        });
         
        */}

        const pushData = (data) => {
            if(user?._id === data?.user?.idUser && subcript){
                dispatch(pushNotifications({
                    type: 'alertUpdate',
                    data: data?.doc,
                    id: data?.doc?._id
                }))
                notifyAlertUpdate(data?.doc)
            }
        }

        socketAppManager.on('document_updated', pushData);

        return () => {
            subcript = false;
            socketAppManager.off('document_updated', pushData);
        }
    }, [user]);


    console.log(user)



    return (
        <div className='absolute h-[240px] bottom-[0] right-[0] p-[3rem] flex items-center gap-[1rem] pointer-events-none z-1000 '>
            {
                alerts.map(data => {


                    if (data.type === 'alertUpdate') return <CardNotifications key={data.id} id={data.id} ><AlertUpdateCard data={data.data} /></CardNotifications>
                    else return null;
                })
            }
        </div>
    )
}




function CardNotifications({ id, children }) {


    const dispatch = useDispatch();


    useEffect(() => {
        const timeDelete = 180000;
        const timeOut = setTimeout(() => {
            dispatch(deleteNotifications(id));
        }, timeDelete);

        return () =>  clearTimeout(timeOut);
    }, []);



    return (
        <div className='notif-enter w-[300px] h-[162px] overflow-hidden rounded-xl border border-slate-200'
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)' }}>
            {children}
        </div>
    )
}