module.exports = {
  calcDayParams: daysDiffFromToday => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + daysDiffFromToday);
    const dd = tomorrow.getDate();
    const day = dd < 10 ? "0" + dd : dd;
    const mm = tomorrow.getMonth() + 1; //January is 0!
    const month = mm < 10 ? "0" + mm : mm;
    const year = tomorrow.getFullYear();
    return { day, month, year };
  }
};
