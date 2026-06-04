import { useState } from 'react';
import Fuse from 'fuse.js';

function Search({ array, config, callback }) {

    let [resultSearch, setSearch] = useState([]);
    let [inputValue, setInputValue] = useState('');

    const autoComplete = (value, array) => {
        const autoComplet = new Fuse(array, {
            minMatchCharLength: 4,
            includeScore: true,
            keys: config.key
        });
        let arrayTitle = [];

        autoComplet.search(value).forEach(title => {
            arrayTitle.push(title.item);
        });

        setSearch(resultSearch = arrayTitle);
    };

    const setTitleComponent = text => {
        setSearch(resultSearch = []);
        setInputValue(inputValue = text);
    };



    return (
        <div className='speedContain'>
            <div className='speed'>
                <input className='speed-input' type='text' placeholder={config.placeholder} value={inputValue} onChange={e => { autoComplete(e.target.value, array), setInputValue(inputValue = e.target.value) }} required />
                <button className='speed-btn' type='button' aria-label='Buscar'>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="7" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </button>
            </div>
            <div className='resultContain'>
                {
                    resultSearch.length > 0 ?
                        (
                            resultSearch.map((element, index) => (

                                //<p onClick={ e => setTitleComponent( e.target.textContent ) } className='speed-title' key={ element._id } >{ element.es }</p>

                                <div>
                                    {
                                        callback(element, setTitleComponent, index)
                                    }
                                </div>

                            ))
                        )
                        :
                        (
                            null
                        )
                }
            </div>
        </div>
    );
}

export { Search };