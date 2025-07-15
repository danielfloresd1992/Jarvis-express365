import { useState } from 'react';
import search from '../../../../public/ico/seach/search.svg';
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
                <button className='speed-btn' type='button' >
                    <img className='speed-btnImg' src={search} alt="" />
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