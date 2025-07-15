import axios from "axios";



function useAlert() {


    const request = text => {
        let URL;
        if (process.env.NODE_ENV === 'production') {
            window.location.hostname === 'localhost' ? URL = `https://72.68.60.201:4000/bot/voice/text=${text}/type=simple` : URL = `https://72.68.60.254:4000/bot/voice/text=${text}/type=simple`;

            axios.get(URL)
                .then(response => {
                    console.log(response);
                })
                .catch(err => {
                    console.log(err);
                });
        };
    }

    return {
        request
    };
}

export { useAlert };