module.exports = {
    sleepForSeconds: seconds => {
        return new Promise(resolve => {
            setTimeout(resolve,seconds*1000)
        })
    },
}