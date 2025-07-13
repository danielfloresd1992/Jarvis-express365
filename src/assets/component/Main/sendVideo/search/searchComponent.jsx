import { useState } from 'react';
import search  from '../../../../../../public/ico/seach/search.svg';
import Fuse from 'fuse.js';

function Search({ titles, titleNoveltie }){

    let [ resultSearch, setSearch ] = useState([]);
    let [ inputValue, setInputValue ] = useState('');

    const sutoComplete = ( value , array ) => {
        const autoComplet = new Fuse(array, {
            minMatchCharLength: 4,
            includeScore: true,
            keys: ['es']
        });
        let arrayTitle = [];
       
        autoComplet.search(value).forEach(title => {
            arrayTitle.push(title.item);
        });
        setSearch(arrayTitle);
    };

    const setTitleComponent = (textContent) => {
        titleNoveltie(textContent);
        setSearch(resultSearch = []);
        setInputValue(inputValue = '');
    };

    return(
        <div className='speedContain'>
            <div className='speed'>
                <input className='speed-input' type='text' placeholder='Búsqueda rápida' value={inputValue }  onChange={ e => { sutoComplete(e.target.value, titles), setInputValue(inputValue = e.target.value) } }/>
                <button className='speed-btn' type='button' >
                    <img className='speed-btnImg' src={ search } alt="" />
                </button>
            </div>
            <div className='resultContain'>
                {
                    resultSearch.length > 0 ?
                    (
                        resultSearch.map(element => (

                            <p onClick={ e => setTitleComponent( e.target.textContent ) } className='speed-title' key={element._id} >{ element.es }</p>

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