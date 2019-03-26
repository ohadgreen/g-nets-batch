const sleepFunc = require('../app/utils/Sleep');

async function chain() {
    console.log('chain tasks test');
    const seven = await wait10();
    console.log(seven);
    const four = await wait4();
    console.log(four);
    const one = await wait1();
    console.log(one);
}

chain();

async function wait1() {
    await sleepFunc.sleepForSeconds(1);
    console.log('one');
    return '1 done';
}
async function wait4() {
    await sleepFunc.sleepForSeconds(4);
    console.log('four');
    return '4 done';
}
async function wait10() {
    await sleepFunc.sleepForSeconds(10);
    console.log('ten');
    return '10 done';
}
