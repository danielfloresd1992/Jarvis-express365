import { /*toJpeg, toPng,*/ toBlob } from 'html-to-image';
//simport { base64ToFile } from '../util/64toFile';


function useImgAlternative(elementHtml, callback, download = true, imageCounting = 4) {
    return new Promise((resolve, reject) => {
        const originalElement = elementHtml;
        originalElement.style.zoom = 'normal';
        const replicElement = originalElement.querySelector('#forImg-canvas02');
        if(replicElement) replicElement.remove();
   
        const htmlForImg = originalElement.cloneNode(true);
        htmlForImg.id = 'forImg-canvas02';
        originalElement.appendChild(htmlForImg);
        htmlForImg.classList.add('box-imgComponenContent-alternative');

        Array.from(htmlForImg.children).forEach((element, index, arr) => {

            element.style.maxHeight = 'unset';
            element.style.display = 'none';
            element.querySelector('.box-text').classList.add('text-alternative');
            element.querySelector('.box-img').classList.add('box-img-alternative');
            if (element.querySelector('.box-deleteimg')) element.querySelector('.box-deleteimg').style.display = 'none';
            element.querySelector('.text-alternative').style.display = 'flex';
            element.querySelector('.text-alternative').style.height = '30px';
            element.querySelector('.text-alternative').style.padding = '0.5rem 0.8rem';
            element.querySelector('.text-alternative').style.fontSize = '.8rem';
            element.querySelector('.text-alternative').style.width = 'auto';
            element.querySelector('.box-imgContain').style.width = '100%';
            element.querySelector('.box-imgContain').style.height = '100%';
            element.style.height = '300px';
            element.style.width = '550px';

            if (imageCounting === 1) {
                if (index === 0) element.style.display = 'block';
                element.querySelector('.box-text').style.display = 'none';
            }
            else if (imageCounting === 2) {
                if (index === 0 || index === arr.length - 1) element.style.display = 'block';
                
            }
            else if (imageCounting === 4) {
                element.style.display = 'block';
            }
        });

        if(typeof callback === 'function') callback(htmlForImg);

        toBlob(htmlForImg)  // change to blob
            .then(dataUrl => {
                if (false){
                    const a = document.createElement('a');
                    a.href = dataUrl;
                    a.download = 'amage.png';
                    a.click();
                }
             
                //const file = base64ToFile(dataUrl, 'Demora primera atención'); // legace
                resolve(dataUrl);
            })
            .catch(err => {
                reject(err);
            })
            .finally(() => {
                htmlForImg.remove();
            });
            
    });
}


export { useImgAlternative };