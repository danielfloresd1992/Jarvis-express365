import { createContext, useContext, useMemo, useState } from 'react';


/*  LA BANDEJA DE IMÁGENES, COMPARTIDA ENTRE SU BOTÓN Y SU PANEL
 *
 *  El botón vive en la barra de arriba (InboxButton, dentro de NavBar) y el panel aparte, en Home
 *  (images_inbox.jsx). Antes el botón flotaba arriba a la derecha y el centro tenía que dejarle un hueco;
 *  en la barra no tapa nada. Los dos necesitan lo mismo —si el panel está abierto y cuántas imágenes
 *  hay—, y eso vive aquí: el panel lo escribe y el botón lo lee.
 */

const InboxContext = createContext(null);


// InboxProvider = «el estado de la bandeja», para el botón y el panel. Lo monta Home envolviendo a los dos.
export function InboxProvider({ children }) {

    // collapsed = «el panel está cerrado» · count = «cuántas imágenes tiene»
    const [collapsed, setCollapsed] = useState(true);
    const [count, setCount] = useState(0);

    const value = useMemo(() => ({ collapsed, setCollapsed, count, setCount }), [collapsed, count]);

    return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}


// useInbox = «el estado de la bandeja»: { collapsed, setCollapsed, count, setCount }, o null fuera de InboxProvider
export const useInbox = () => useContext(InboxContext);
