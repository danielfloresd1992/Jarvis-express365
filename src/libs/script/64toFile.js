
const base64ToFile = (base64, filename) => {
    let arr = base64.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};



/*
function base64ToFile( dataURI, fileName ){  // failed in production
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    // write the ArrayBuffer to a blob, and you're done
    // use `File` constructor here
    var blob = new File([ia], fileName, { type: mimeString, lastModifiedDate: new Date() });
    
    //A Blob() is almost a File() - it's just missing the two properties below which we will add
    // blob.lastModifiedDate = new Date();
    // blob.name = fileName;
    //Cast to a File() type
    return blob;
}
*/



const blobToFile = (blob) => {
    const newFile = new File([blob], "reporte.png", {
        type: blob.type,
        lastModified: Date.now(),
    });

    return newFile;
}


export { base64ToFile, blobToFile };