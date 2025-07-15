function useSaveNoveltie(){

    
    const save = ( noveltieTitle, userData ) => {
        
        const nameUser = userData.userName;

        if( localStorage.getItem('my-noveltie') === null ){
            const myNoveltie = [];
            myNoveltie.push({name: nameUser, titleNoveltie: noveltieTitle});
            localStorage.setItem('my-noveltie', JSON.stringify(myNoveltie));
        }
        else{
            const myNoveltie = JSON.parse(localStorage.getItem('my-noveltie'));
            myNoveltie.push({name: nameUser, titleNoveltie: noveltieTitle});
            localStorage.setItem('my-noveltie', JSON.stringify(myNoveltie));
        }
    };

    const getList = () => {
        
        if( localStorage.getItem('my-noveltie') === null ){
            const myNoveltie = [];
            localStorage.setItem('my-noveltie', JSON.stringify(myNoveltie));
            return myNoveltie;
        }
        return JSON.parse(localStorage.getItem('my-noveltie'));
    };

    const deleteListNoveltie = () => {
        localStorage.removeItem('my-noveltie');
    };

    return{
        save,
        getList,
        deleteListNoveltie
    }
}

export { useSaveNoveltie };