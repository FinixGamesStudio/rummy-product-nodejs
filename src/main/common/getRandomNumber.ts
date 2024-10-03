const getRandomNumber = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min) + min);


function generateReferralCode(length: number) {
    var charset = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ123456789",
        // var charset = "0123456789",
        // var charset = "111111",
        retVal = "";
    // var  retVal = "111111";
    for (var i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

 function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


const exportObject = {
    getRandomNumber,
    generateReferralCode,
    sleep
}

export = exportObject