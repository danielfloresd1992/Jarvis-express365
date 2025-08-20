import { useState, useRef, useEffect, useCallback } from 'react';

export default function useDraggableElement(coordinates) {
    const elementRef = useRef(null);
    const positionRef = useRef(coordinates ? coordinates.position : { x: 0, y: 0 });
    const sizeRef = useRef({ width: 0, height: 0 });
    const mousePositionRef = useRef({ x: 0, y: 0 });

    const isDraggingRef = useRef(false);
    const isResizingRef = useRef(false);
    const resizeHandleRef = useRef('');

    const inputRotate = useRef(null);
    const elementRotate = useRef(null);
    const refRotate = useRef(coordinates ? coordinates.rotate : 0);

    const [styleState, setStyleState] = useState({
        position: coordinates ? coordinates?.position : { x: 0, y: 0 },
        rotate: coordinates ? coordinates?.rotate : 0,
    });

    const updatePositionAndSize = useCallback(() => {
        if (!elementRef.current) return;

        // Actualiza la posición con top y left para no interferir con el redimensionamiento
        elementRef.current.style.top = `${positionRef.current.y}px`;
        elementRef.current.style.left = `${positionRef.current.x}px`;

        // Actualiza el tamaño
        if (sizeRef.current.width > 0 && sizeRef.current.height > 0) {
            elementRef.current.style.width = `${sizeRef.current.width}px`;
            elementRef.current.style.height = `${sizeRef.current.height}px`;
        }

        // Aplica la rotación
        elementRef.current.style.transform = `rotate(${refRotate.current}deg)`;
    }, []);

    useEffect(() => {
        if (elementRef.current) {
            elementRef.current.style.position = 'relative';

            // Inicializar el tamaño del div
            const rect = elementRef.current.getBoundingClientRect();
            sizeRef.current = { width: rect.width, height: rect.height };

            const handlerMousedown = (e) => {
                if (e.target.id === 'nodragg-3030') return;

                // Si el clic es en una manija de redimensionamiento
                if (e.target.classList.contains('resize-handle')) {
                    isResizingRef.current = true;
                    resizeHandleRef.current = e.target.classList[1]; // e.g., 'bottom-right'
                    mousePositionRef.current = { x: e.clientX, y: e.clientY };
                    elementRef.current.style.cursor = 'se-resize'; // Cambia el cursor según la manija
                    e.stopPropagation(); // Evita que el evento de arrastre se active
                } else {
                    // Si el clic es para arrastrar
                    isDraggingRef.current = true;
                    mousePositionRef.current = { x: e.clientX, y: e.clientY };
                    elementRef.current.style.cursor = 'grabbing';
                }
            };

            const handlerMousemove = (e) => {
                const dx = e.clientX - mousePositionRef.current.x;
                const dy = e.clientY - mousePositionRef.current.y;

                if (isDraggingRef.current) {
                    positionRef.current = {
                        x: positionRef.current.x + dx,
                        y: positionRef.current.y + dy,
                    };
                    updatePositionAndSize();
                } else if (isResizingRef.current) {
                    const handle = resizeHandleRef.current;
                    let newWidth = sizeRef.current.width;
                    let newHeight = sizeRef.current.height;
                    let newX = positionRef.current.x;
                    let newY = positionRef.current.y;

                    if (handle.includes('right')) {
                        newWidth += dx;
                    }
                    if (handle.includes('left')) {
                        newWidth -= dx;
                        newX += dx;
                    }
                    if (handle.includes('bottom')) {
                        newHeight += dy;
                    }
                    if (handle.includes('top')) {
                        newHeight -= dy;
                        newY += dy;
                    }

                    sizeRef.current = { width: newWidth, height: newHeight };
                    positionRef.current = { x: newX, y: newY };
                    updatePositionAndSize();
                }

                mousePositionRef.current = { x: e.clientX, y: e.clientY };
            };

            const handlerMouseup = () => {
                if (isDraggingRef.current || isResizingRef.current) {
                    isDraggingRef.current = false;
                    isResizingRef.current = false;
                    elementRef.current.style.cursor = 'grab';
                    setStyleState({
                        position: { x: positionRef.current.x, y: positionRef.current.y },
                        rotate: refRotate.current,
                    });
                }
            };

            const handlerMouseleave = e => {
                e.preventDefault();
                if (isDraggingRef.current || isResizingRef.current) return;
                isDraggingRef.current = false;
                isResizingRef.current = false;
                elementRef.current.style.cursor = 'grab';
                setStyleState({
                    position: { x: positionRef.current.x, y: positionRef.current.y },
                    rotate: refRotate.current,
                });
            };

            elementRef.current.addEventListener('mousedown', handlerMousedown);
            document.addEventListener('mousemove', handlerMousemove);
            document.addEventListener('mouseup', handlerMouseup);
            elementRef.current.addEventListener('mouseleave', handlerMouseleave);

            return () => {
                if (elementRef.current) {
                    elementRef.current.removeEventListener('mousedown', handlerMousedown);
                    document.removeEventListener('mousemove', handlerMousemove);
                    document.removeEventListener('mouseup', handlerMouseup);
                    elementRef.current.removeEventListener('mouseleave', handlerMouseleave);
                }
            };
        }
    }, [updatePositionAndSize]);

    return { elementRef, styleState };
}