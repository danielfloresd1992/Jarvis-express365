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
            const labelEl = element.querySelector('.dropzone__label') || element.querySelector('.box-text');
            const imgEl = element.querySelector('.dropzone__img') || element.querySelector('.box-img');
            const deleteEl = element.querySelector('.dropzone__action-btn--delete') || element.querySelector('.box-deleteimg');
            const areaEl = element.querySelector('.dropzone__area') || element.querySelector('.box-imgContain');

            if (labelEl) labelEl.classList.add('text-alternative');
            if (imgEl) imgEl.classList.add('box-img-alternative');
            if (deleteEl) deleteEl.style.display = 'none';
            const altEl = element.querySelector('.text-alternative');
            if (altEl) {
                altEl.style.display = 'flex';
                altEl.style.height = '30px';
      

    
            }
            if (areaEl) {
                areaEl.style.width = '100%';
                areaEl.style.height = '100%';
            }
            element.style.height = '300px';
            element.style.width = '550px';

            if (imageCounting === 1) {
                if (index === 0) element.style.display = 'block';
                if (labelEl) labelEl.style.display = 'none';
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