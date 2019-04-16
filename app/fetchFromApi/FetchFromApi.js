const axios = require("axios");
const sleepFunc = require("../../app/utils/Sleep");

module.exports = {
  fetchData: async url => {
     console.log('api url: ' + url);

    try {
      const response = await axios({
        url: url,
        method: "GET",
        headers: {
          Accept: "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
      await sleepFunc.sleepForSeconds(5);
      
      if (response.status === 200 && response.data) {
        return { success: true, apiData: response.data };
      } else {
        console.log("cannot fetch games sched from api");
        return {
          success: false,
          errorMsg: "api fetch res status " + response.status
        };
      }
    } catch (error) {
      console.log("error fetching api data " + error.message);
      return { success: false, errorMsg: error.message };
    }
  }
};
