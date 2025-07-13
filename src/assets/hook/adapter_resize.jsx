import { useEffect, useRef } from 'react';




export default function useAdapterResize({ breackWidth }) {

    const initZoom = typeof window !== 'undefined' ? (window.innerWidth < breackWidth && window.innerWidth > 720 ? ((window.innerWidth / breackWidth - 0.1)) : 1) : 1;
    const htmlAdapterRef = useRef(null);



    useEffect(() => {
        if (typeof window !== 'undefined' ) {
            
            const handleResize = () => {
                const newWidth = window.innerWidth;
                if(htmlAdapterRef.current){
                    if (newWidth < breackWidth && window.innerWidth > 720 && htmlAdapterRef.current) {
                        htmlAdapterRef.current.style.zoom = ((newWidth / breackWidth) - 0.1).toString();
                    } 
                    else if (window.innerWidth < 720) {
                        htmlAdapterRef.current.style.zoom = ((newWidth / breackWidth) + .2 ).toString();
                    }
                    else if (htmlAdapterRef.current) {
                        htmlAdapterRef.current.style.zoom = String(initZoom);
                    }
                    
                }
            };

            if(htmlAdapterRef.current) htmlAdapterRef.current.style.zoom = initZoom.toString();
            
            window.addEventListener('resize', handleResize);

            return () => {
                window.removeEventListener('resize', handleResize);
            };
        }
    }, [breackWidth]);

  

    return { htmlAdapterRef }
}
