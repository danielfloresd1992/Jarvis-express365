import { useState, useEffect, useRef } from 'react';
import './style.css';


export default function InputHour({ title = '', result }) {


    const [state, setState] = useState(`0${new Date().getHours()}`.substr(-2) + ':' + `0${new Date().getMinutes()}`.substr(-2) + ':' + `0${new Date().getSeconds()}`.substr(-2));

    const styleSelect = {
        backgroundColor: 'transparent',
        color: '#000',
        fontSize: '1.5rem',
        padding: '0.5rem',
        borderRadius: '5px'
    };



    useEffect(() => {
        result(state);
    }, [state]);



    const handlerOnChangueTime = (text, nameInput) => {
        const stateSplit = state.split(':')
        if (nameInput === 'hour') {
            return `${text}:${stateSplit[1]}:${stateSplit[2]}`;
        }
        else if (nameInput === 'minute') {
            return `${stateSplit[0]}:${text}:${stateSplit[2]}`;
        }
        else if (nameInput === 'second') {
            return `${stateSplit[0]}:${stateSplit[1]}:${text}`;
        }
    };



    return (
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor=""><p style={{ color: '#000', fontSize: '1.5rem' }} >{title}</p></label>
            <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
                <select defaultValue={`0${new Date().getHours()}`.substr(-2)} required={true} style={styleSelect} name="" id="hour" onChange={e => { console.log(e.target.value); setState(handlerOnChangueTime(e.target.value, 'hour')) }}>

                    <option style={{ color: '#000' }} value="00">00</option>
                    <option style={{ color: '#000' }} value="01">01</option>
                    <option style={{ color: '#000' }} value="02">02</option>
                    <option style={{ color: '#000' }} value="03">03</option>
                    <option style={{ color: '#000' }} value="04">04</option>
                    <option style={{ color: '#000' }} value="05">05</option>
                    <option style={{ color: '#000' }} value="06">06</option>
                    <option style={{ color: '#000' }} value="07">07</option>
                    <option style={{ color: '#000' }} value="08">08</option>
                    <option style={{ color: '#000' }} value="09">09</option>
                    <option style={{ color: '#000' }} value="10">10</option>
                    <option style={{ color: '#000' }} value="11">11</option>
                    <option style={{ color: '#000' }} value="12">12</option>
                    <option style={{ color: '#000' }} value="13">13</option>
                    <option style={{ color: '#000' }} value="14">14</option>
                    <option style={{ color: '#000' }} value="15">15</option>
                    <option style={{ color: '#000' }} value="16">16</option>
                    <option style={{ color: '#000' }} value="17">17</option>
                    <option style={{ color: '#000' }} value="18">18</option>
                    <option style={{ color: '#000' }} value="19">19</option>
                    <option style={{ color: '#000' }} value="20">20</option>
                    <option style={{ color: '#000' }} value="21">21</option>
                    <option style={{ color: '#000' }} value="22">22</option>
                    <option style={{ color: '#000' }} value="23">23</option>
                </select>
                <select defaultValue={`0${new Date().getMinutes()}`.substr(-2)} required={true} style={styleSelect} name="" id="hour" onChange={e => setState(handlerOnChangueTime(e.target.value, 'minute'))}>

                    <option style={{ color: '#000' }} value="00">00</option>
                    <option style={{ color: '#000' }} value="01">01</option>
                    <option style={{ color: '#000' }} value="02">02</option>
                    <option style={{ color: '#000' }} value="03">03</option>
                    <option style={{ color: '#000' }} value="04">04</option>
                    <option style={{ color: '#000' }} value="05">05</option>
                    <option style={{ color: '#000' }} value="06">06</option>
                    <option style={{ color: '#000' }} value="07">07</option>
                    <option style={{ color: '#000' }} value="08">08</option>
                    <option style={{ color: '#000' }} value="09">09</option>
                    <option style={{ color: '#000' }} value="10">10</option>
                    <option style={{ color: '#000' }} value="11">11</option>
                    <option style={{ color: '#000' }} value="12">12</option>
                    <option style={{ color: '#000' }} value="13">13</option>
                    <option style={{ color: '#000' }} value="14">14</option>
                    <option style={{ color: '#000' }} value="15">15</option>
                    <option style={{ color: '#000' }} value="16">16</option>
                    <option style={{ color: '#000' }} value="17">17</option>
                    <option style={{ color: '#000' }} value="18">18</option>
                    <option style={{ color: '#000' }} value="19">19</option>
                    <option style={{ color: '#000' }} value="20">20</option>
                    <option style={{ color: '#000' }} value="21">21</option>
                    <option style={{ color: '#000' }} value="22">22</option>
                    <option style={{ color: '#000' }} value="23">23</option>
                    <option style={{ color: '#000' }} value="24">24</option>
                    <option style={{ color: '#000' }} value="25">25</option>
                    <option style={{ color: '#000' }} value="26">26</option>
                    <option style={{ color: '#000' }} value="27">27</option>
                    <option style={{ color: '#000' }} value="28">28</option>
                    <option style={{ color: '#000' }} value="29">29</option>
                    <option style={{ color: '#000' }} value="30">30</option>
                    <option style={{ color: '#000' }} value="31">31</option>
                    <option style={{ color: '#000' }} value="32">32</option>
                    <option style={{ color: '#000' }} value="33">33</option>
                    <option style={{ color: '#000' }} value="34">34</option>
                    <option style={{ color: '#000' }} value="35">35</option>
                    <option style={{ color: '#000' }} value="36">36</option>
                    <option style={{ color: '#000' }} value="37">37</option>
                    <option style={{ color: '#000' }} value="38">38</option>
                    <option style={{ color: '#000' }} value="39">39</option>
                    <option style={{ color: '#000' }} value="40">40</option>
                    <option style={{ color: '#000' }} value="41">41</option>
                    <option style={{ color: '#000' }} value="42">42</option>
                    <option style={{ color: '#000' }} value="43">43</option>
                    <option style={{ color: '#000' }} value="44">44</option>
                    <option style={{ color: '#000' }} value="45">45</option>
                    <option style={{ color: '#000' }} value="46">46</option>
                    <option style={{ color: '#000' }} value="47">47</option>
                    <option style={{ color: '#000' }} value="48">48</option>
                    <option style={{ color: '#000' }} value="49">49</option>
                    <option style={{ color: '#000' }} value="50">50</option>
                    <option style={{ color: '#000' }} value="51">51</option>
                    <option style={{ color: '#000' }} value="52">52</option>
                    <option style={{ color: '#000' }} value="53">53</option>
                    <option style={{ color: '#000' }} value="54">54</option>
                    <option style={{ color: '#000' }} value="55">55</option>
                    <option style={{ color: '#000' }} value="56">56</option>
                    <option style={{ color: '#000' }} value="57">57</option>
                    <option style={{ color: '#000' }} value="58">58</option>
                    <option style={{ color: '#000' }} value="59">59</option>
                </select>

                <select defaultValue={`0${new Date().getSeconds()}`.substr(-2)} required={true} style={styleSelect} name="" id="hour" onChange={e => setState(handlerOnChangueTime(e.target.value, 'second'))}>
                    <option style={{ color: '#000' }} value="00">00</option>
                    <option style={{ color: '#000' }} value="01">01</option>
                    <option style={{ color: '#000' }} value="02">02</option>
                    <option style={{ color: '#000' }} value="03">03</option>
                    <option style={{ color: '#000' }} value="04">04</option>
                    <option style={{ color: '#000' }} value="05">05</option>
                    <option style={{ color: '#000' }} value="06">06</option>
                    <option style={{ color: '#000' }} value="07">07</option>
                    <option style={{ color: '#000' }} value="08">08</option>
                    <option style={{ color: '#000' }} value="09">09</option>
                    <option style={{ color: '#000' }} value="10">10</option>
                    <option style={{ color: '#000' }} value="11">11</option>
                    <option style={{ color: '#000' }} value="12">12</option>
                    <option style={{ color: '#000' }} value="13">13</option>
                    <option style={{ color: '#000' }} value="14">14</option>
                    <option style={{ color: '#000' }} value="15">15</option>
                    <option style={{ color: '#000' }} value="16">16</option>
                    <option style={{ color: '#000' }} value="17">17</option>
                    <option style={{ color: '#000' }} value="18">18</option>
                    <option style={{ color: '#000' }} value="19">19</option>
                    <option style={{ color: '#000' }} value="20">20</option>
                    <option style={{ color: '#000' }} value="21">21</option>
                    <option style={{ color: '#000' }} value="22">22</option>
                    <option style={{ color: '#000' }} value="23">23</option>
                    <option style={{ color: '#000' }} value="24">24</option>
                    <option style={{ color: '#000' }} value="25">25</option>
                    <option style={{ color: '#000' }} value="26">26</option>
                    <option style={{ color: '#000' }} value="27">27</option>
                    <option style={{ color: '#000' }} value="28">28</option>
                    <option style={{ color: '#000' }} value="29">29</option>
                    <option style={{ color: '#000' }} value="30">30</option>
                    <option style={{ color: '#000' }} value="31">31</option>
                    <option style={{ color: '#000' }} value="32">32</option>
                    <option style={{ color: '#000' }} value="33">33</option>
                    <option style={{ color: '#000' }} value="34">34</option>
                    <option style={{ color: '#000' }} value="35">35</option>
                    <option style={{ color: '#000' }} value="36">36</option>
                    <option style={{ color: '#000' }} value="37">37</option>
                    <option style={{ color: '#000' }} value="38">38</option>
                    <option style={{ color: '#000' }} value="39">39</option>
                    <option style={{ color: '#000' }} value="40">40</option>
                    <option style={{ color: '#000' }} value="41">41</option>
                    <option style={{ color: '#000' }} value="42">42</option>
                    <option style={{ color: '#000' }} value="43">43</option>
                    <option style={{ color: '#000' }} value="44">44</option>
                    <option style={{ color: '#000' }} value="45">45</option>
                    <option style={{ color: '#000' }} value="46">46</option>
                    <option style={{ color: '#000' }} value="47">47</option>
                    <option style={{ color: '#000' }} value="48">48</option>
                    <option style={{ color: '#000' }} value="49">49</option>
                    <option style={{ color: '#000' }} value="50">50</option>
                    <option style={{ color: '#000' }} value="51">51</option>
                    <option style={{ color: '#000' }} value="52">52</option>
                    <option style={{ color: '#000' }} value="53">53</option>
                    <option style={{ color: '#000' }} value="54">54</option>
                    <option style={{ color: '#000' }} value="55">55</option>
                    <option style={{ color: '#000' }} value="56">56</option>
                    <option style={{ color: '#000' }} value="57">57</option>
                    <option style={{ color: '#000' }} value="58">58</option>
                    <option style={{ color: '#000' }} value="59">59</option>
                </select>
            </div>
        </div>
    )
}