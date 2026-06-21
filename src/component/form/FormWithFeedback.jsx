import { useState } from  'react';
import { useSelector, useDispatch } from 'react-redux';
import { useImgAlternative } from '@/hook/useImgAlternative';
import FormLayaut from '@/component/layaut/form_layaut';




export default function FormWithFeedback({ components }) {


//  DATA SESSION USER
    const user = useSelector(store => store.user);
    const establishment = useSelector(store => store.establishment);
    const [listToastAndDishState, setListToastAndDish] = useState(false);
    const managers = establishment.managers;
    const listDishes = establishment?.dishes || [];


//  TABLE TOAST TICKER
    const [tableNeeded, setTableNeeded] = useState(true);
    const [table, setNumberTable] = useState('');
    const [ticket, setTiket] = useState('');
    const [dishState, setDishState] = useState(null);

//  DATA TIME
    const [time1, setTime1] = useState('00:00:00');
    const [time2, setTime2] = useState('00:00:00');
    const [time3, setTime3] = useState('00:00:00');
    const [time4, setTime4] = useState('00:00:00');
    const timeTotal = calculateTime(time1, time2);
    const [hasFinishedState, setHasFinishedState] = useState(true);
    


//  DATA MENU
    const [amountState, setAmountState] = useState('');
    const [car, setCar] = useState(null);
    const [person, setPerson] = useState(null);
    const [area, setArea] = useState(null);

    const keySubmit = useRef(true);



//  MULTIMEDIA
    let [files, setFiles] = useState([]);

    const [isRequieredVideoState, setIsRequieredVideo] = useState(true);
    const [videoState, setVideoState] = useState(null);
    const { htmlAdapterRef } = useAdapterResize({ breackWidth: 1350 });


//  FINISH
    const [description, setDescription] = useState('');





    return (
        <FormLayaut>
    
        </FormLayaut>
    );
}