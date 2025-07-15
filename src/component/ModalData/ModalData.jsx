import ImgLocal from './hook/ImgLocal.jsx';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Line, Bar, Pie } from 'react-chartjs-2'
import Chart from 'chart.js/auto';

import zoomPlugin from 'chartjs-plugin-zoom';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useSelector } from 'react-redux';
import calculateBonus from '../../libs/calculateBonus.js';
import { arrayBufferToBase64 } from '../../libs/script/toBase64.js';
import formatDate from '../../libs/date_time/formatTime.js';
import orderNovelties from '../../libs/orderNoventie.js';
import './style.css';
import like from '../../../public/ico/like/like.svg';
import dislike from '../../../public/ico/like/dislike.svg';
import ignore from '../../../public/ico/like/visibility_off.svg';
import cancel from '../../../public/ico/cancel/cancel.svg';


export default function ModalData() {

    console.log('soy la ruta mybonus');

    const navegate = useNavigate();
    const [locals, setLocals] = useState(null);
    const [myNoveltiesAarray, setNovelties] = useState([]);
    let [keyAnimation, setAnimation] = useState(false);
    const userRef = useRef(null);
    const noveltieRef = useRef(null);
    const bonusRef = useRef(null);


    useEffect(() => {

        if (locals < 1) {
            axios.get(`https://${window.location.hostname}/localLigth`)
                .then(response => {
                    setLocals([...response.data]);

                })
                .catch(err => {
                    console.log(err);
                });
        }

        userRef.current = JSON.parse(window.sessionStorage.session);


        axios.get(`https://${window.location.hostname}/noveltiesFill-user=${userRef.current._id}/&since=${new Date(`${calculateDay().since} 00:00:00`)}/&until=${new Date(`${calculateDay().until} 23:59:59`)}`)
            .then(response => {
                setNovelties(myNoveltiesAarray => myNoveltiesAarray = response.data);
                console.log()
                console.log(calculateBonus(response.data));
                const order = orderNovelties(response.data);
                noveltieRef.current = {
                    data: {
                        labels: order.days,
                        datasets: [{
                            label: 'validadas',
                            data: order.validate,
                            borderWidth: 2,
                            backgroundColor: ['rgba(1, 86, 144 )'],
                            borderColor: 'rgb(0, 85, 255)',
                        },
                        {
                            label: 'invalidadas',
                            data: order.inValidate,
                            borderWidth: 2,
                            backgroundColor: ['rgba(181, 75, 15)'],
                            borderColor: 'rgb(255, 0, 0)',
                        },
                        {
                            label: 'Ignoradas por el coordinador',
                            data: order.ignore,
                            borderWidth: 2,
                            backgroundColor: ['rgba(133, 133, 133 )'],
                            borderColor: 'rgb(165, 165, 165)',
                        }]
                    },
                    options: {
                        plugins: {
                            datalabels: {
                                display: true,
                                color: '#fff',
                                anchor: 'top',
                                lign: 'end',
                                font: { size: 14 },
                                formatter: (value) => {
                                    return value;
                                }
                            }
                        },
                        scales: {
                            y: {
                                ticks: {
                                    stepSize: 5,
                                    fontColor: '#fff',
                                },
                                color: '#fff',
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'cantidad',
                                    color: '#fff',
                                }
                            },
                            x: {
                                ticks: {
                                    fontColor: '#fff',
                                },
                                color: '#fff',
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Días',
                                    color: '#fff',
                                }
                            }
                        }
                    }
                }
                bonusRef.current = {
                    data: {
                        labels: order.days,
                        datasets: [
                            {
                                label: 'Bonos',
                                data: order.ignore,
                                borderWidth: 2,
                                backgroundColor: ['rgba(133, 133, 133 )'],
                                borderColor: 'rgb(165, 165, 165)',
                            }]
                    },
                    options: {
                        plugins: {
                            datalabels: {
                                display: true,
                                color: '#fff',
                                anchor: 'top',
                                lign: 'end',
                                font: { size: 14 },
                                formatter: (value) => {
                                    return value;
                                }
                            }
                        },
                        scales: {
                            y: {
                                ticks: {
                                    stepSize: 5,
                                    fontColor: '#fff',
                                },
                                color: '#fff',
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'cantidad',
                                    color: '#fff',
                                }
                            },
                            x: {
                                ticks: {
                                    fontColor: '#fff',
                                },
                                color: '#fff',
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Días',
                                    color: '#fff',
                                }
                            }
                        }
                    }
                }
            })
            .catch(err => {
                console.log(err);
            })
        return () => {
        };
    }, []);


    const calculateDay = () => {
        const date = new Date();
        let daysSinceWednesday = date.getDay() - 3;
        if (daysSinceWednesday < 0) {
            daysSinceWednesday += 7;
        }
        const dateWednesday = new Date(date.getFullYear(), date.getMonth(), date.getDate() - daysSinceWednesday);
        return {
            since: `${dateWednesday.getFullYear()}-${`0${dateWednesday.getMonth() + 1}`.substr(-2)}-${`0${dateWednesday.getDate()}`.substr(-2)}`,
            until: `${date.getFullYear()}-${`0${date.getMonth() + 1}`.substr(-2)}-${`0${date.getDate()}`.substr(-2)}`
        }
    };


    const fillListNovewltie = dataArray => {
        let forDay = {};
        dataArray.forEach(title => {

            if (forDay[formatDate(title.date)]) {
                forDay[formatDate(title.date)].push(title);
            }
            else {
                forDay[formatDate(title.date)] = [];
                forDay[formatDate(title.date)].push(title);
            }
        });


        const fullDate = text => {
            const dateParam = text.split('-');
            const date = new Date(`${dateParam[0]}-${dateParam[1]}-${Number(dateParam[2]) + 1}`);
            const day = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
            const month = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            return {
                day: day[date.getDay()],
                date: date.getDate(),
                month: month[date.getMonth()],
                year: date.getFullYear()
            }
        };


        function printValidate(validation) {
            if (validation.validation === 'true') {
                return (
                    <>
                        <div className='icon second'>
                            <img src={like} className='icoValidate validate' alt="" />
                            <p className='icon-text'>validado por</p>
                            <p className='icon-text'>{validation.for}</p>
                        </div>
                    </>
                )
            }
            else if (validation.validation === 'false') {
                return (
                    <>
                        <div className='icon second'>
                            <img src={dislike} className='icoValidate invalidate' alt="" />
                            <p className='icon-text'>invalidado por</p>
                            <p className='icon-text'>{validation.for}</p>
                        </div>
                    </>
                )
            }
            else {
                return (
                    <>
                        <div className='icon second'>
                            <img src={ignore} className='icoValidate ignore' alt="" />
                            <p className='icon-text'>ignorado</p>
                        </div>
                    </>
                )
            }
        }


        return (
            <>
                <div className='listContaint'>
                    {
                        Object.entries(forDay).map(([date, items]) => (
                            <div className='listContaint-box' key={date} style={{ color: '#fff' }} >
                                <div
                                    className='listContaint-title'
                                    onClick={e => {
                                        e.target.parentNode.children[1].classList.toggle('close-box');
                                        setAnimation(keyAnimation = true);
                                    }}
                                >       <div className='header-line header-title'>
                                        <p> {fullDate(date).day} </p>
                                        <p> {fullDate(date).date} - {fullDate(date).month} - {fullDate(date).year} </p>
                                    </div>
                                    <div className='header-line'>
                                        <p>Total reportado: {items.length}</p>
                                        <p className='text-purple'>Total Bonos por dia: {calculateBonus(items).bonusTotal}</p>
                                    </div>

                                    {
                                        console.log(items)
                                    }
                                </div>
                                <ul className="list close-box">

                                    {
                                        items.map(item => (
                                            <li className={keyAnimation ? 'box-traslateLelf' : ''} key={item._id} style={{ color: '#fff' }} >
                                                <div className='content'>
                                                    <div className='icon'>
                                                        {
                                                            locals ?
                                                                (
                                                                    <>
                                                                        {
                                                                            locals.map(local => (
                                                                                local._id === item.local?.idLocal ?
                                                                                    (
                                                                                        <ImgLocal id={local._id} key={local._id} />
                                                                                    )
                                                                                    :
                                                                                    (null)
                                                                            ))
                                                                        }
                                                                    </>
                                                                )
                                                                :
                                                                (null)

                                                        }
                                                    </div>
                                                    <div>
                                                        <div>
                                                            <p className='title' title={item.title}>{item.title}</p>
                                                            <p className='text' title={item.local.name}>{item.local.name}</p>
                                                        </div>
                                                        <div className='textBonusContent'>
                                                            {
                                                                item.rulesForBonus.worth === 0 && item.rulesForBonus.amulative === 0 ?
                                                                    (
                                                                        <>
                                                                            <p className='text-bonus'>Esta novedad no bonifica.</p>
                                                                            <img className='text-bonus-cancel text-red' src={cancel} alt="" />
                                                                        </>
                                                                    )
                                                                    :
                                                                    (
                                                                        <>
                                                                            <p className='text-bonus textGreen'>valor: {item.rulesForBonus.worth}</p>
                                                                            <p className='text-bonus textGreen'>Cantidad para bonifocar: {item.rulesForBonus.amulative} </p>
                                                                        </>
                                                                    )
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className='icon-second'>
                                                        {
                                                            printValidate(item.isValidate)
                                                        }
                                                    </div>
                                                </div>
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        ))
                    }
                </div>
            </>
        );
    }


    return (
        <>
            <div className='homeComponent listComponent'>
                <nav className='NavComponent nav'>
                    <button className='NavComponent-a nav-button' onClick={() => { navegate('/home') }}>
                        regregar
                    </button>
                </nav>
                {
                    myNoveltiesAarray.length > 0 ?
                        (
                            <>
                                {
                                    fillListNovewltie(myNoveltiesAarray)
                                }
                                <main className='mainContent'>
                                    <article className='mainContent-GrafigContain'>
                                        <h2 className='GrafigContain-textTitle'>Bonos por dia</h2>
                                        {/*<Bar />*/}
                                    </article>
                                    <section className='mainContent-GrafigContain'>
                                        <h2 className='GrafigContain-textTitle'>Tu rendimineto</h2>
                                        <Line className='grafig' data={noveltieRef.current.data} options={noveltieRef.current.options} plugins={[ChartDataLabels, zoomPlugin]} />
                                    </section>
                                </main>
                            </>
                        )
                        :
                        (
                            null
                        )
                }
            </div>
        </>
    );
}