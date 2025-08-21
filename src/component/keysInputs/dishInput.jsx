export default function DishInputSelet({ dishes, onChangeEvent, value }) {



    return (
        <label htmlFor="" className='box-label'>Tipo de plato
            <select
                className='box-inputText'
                onChange={e => {
                    if (dishes.length > 0) {
                        const dishSeleted = dishes.filter(dish => dish.nameDishe === e.target.value);
                        onChangeEvent(dishSeleted[0]);
                    }
                    else {
                        onChangeEvent({ nameDishe: e.target.value });
                    }
                }}
                required
                defaultValue={null}
                value={value?.nameDishe || null}
            >
                <option value={null} selected disabled={true}>--Selecione--</option>
                {
                    Array.isArray(dishes) > 0 ?
                        dishes.map(items => (
                            <option key={items._id} value={items.nameDishe} style={{ color: '#000', backgroundColor: '#fff' }}>{items.nameDishe}</option>

                        ))
                        :
                        <>

                        </>
                }


            </select>
        </label>
    )
}