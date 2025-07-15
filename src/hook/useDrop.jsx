import { useState } from "react";

function useDrop(){

    let [ file, setFile ] = useState({});

    const dragEnter = e => {
        e.preventDefault();
        e.stopPropagation();
    };
    const dragLeave = e => {
        e.preventDefault();
        e.stopPropagation();
    };
    const dragOver = e => {
        e.preventDefault();
        e.stopPropagation();
    };
    const drop = e => {
        e.preventDefault();
        e.stopPropagation();
        const img = e.target;
        const fileReader = new FileReader();
        fileReader.readAsDataURL(e.dataTransfer.files[0]);
        fileReader.onload = (e) => {
            e.preventDefault();
            img.src = e.target.result;
        }
        setFile(file = { file: e.dataTransfer.files[0] });
    };
    return [ dragEnter, dragLeave, dragOver, drop, file ];
}

export { useDrop };