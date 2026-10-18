import { createSlice } from "@reduxjs/toolkit";

export const establishment = createSlice({
    name: "establishment",
    initialState: null,
    reducers: {
        setEstablishment: (state, action) => {
            const users = action.payload;
            return users;
        }
    }
});

export const { setEstablishment } = establishment.actions;


// selectProcessRegister = «el local tiene activado el registro de procesos» (Local.processRegister, se activa en
// Client365): el de state.establishment, el local elegido. Si ese local está también en la lista que se pide al
// abrir (state.locals), manda la lista, que está al día: es la misma regla con que Main enseña o no Mesas.
// La usan los botones de Demoras (DelayComponent) y «Cambiar de usuario» (SwitchUser).
export const selectProcessRegister = (state) => {
    const fresh = state.locals?.find?.(local => local._id === state.establishment?._id);
    return (fresh ?? state.establishment)?.processRegister === true;
};

export default establishment.reducer;

