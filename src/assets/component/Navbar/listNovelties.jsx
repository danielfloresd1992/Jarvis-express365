import { useState, useEffect, memo } from "react";
import { useSaveNoveltie } from "../../hook/useSaveNoveltie";

function ListNovelties({ open }){

    const useNoveltie = useSaveNoveltie();
    let [ list, setList ] = useState([]);

    useEffect(() => {
        setList(list = useNoveltie.getList());
    }, [open]);
   
    return( 
        <>
            <div className={ open ? "listConponent scroll" : "listConponent scroll close"} >
                <ul className="listConponent-ul">
                {
                    list.length > 0 ? 
                    (
                        list.map((item,index) => (
                            <li className="listConponent-li" key={`${index}`}>{item.titleNoveltie}</li> 
                        ))
                    )           
                    : 
                    (
                        <p style={{color: '#fff'}}>sin reportar aun</p>
                    )
                }
                </ul>
            </div>
        </>
    );

}

export default memo(ListNovelties);