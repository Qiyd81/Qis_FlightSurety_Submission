
const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const BigNumber = require('bignumber.js');

var Config = async function(accounts) {
    
    const owner = accounts[0];
    const firstAirline = accounts[1];
    const secondAirline = accounts[2];
    const thirdAirline = accounts[3];
    const fourthAirline = accounts[4];
    const fifthAirline = accounts[5];
    const sixthAirline = accounts[6];
    const passengerOne = accounts[7];
    const passengerTwo = accounts[8];

    const flightSuretyData = await FlightSuretyData.new(firstAirline, 'First Airline');
    const flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    
    return {
        owner: owner,
        firstAirline: firstAirline,
        secondAirline: secondAirline,
        thirdAirline: thirdAirline,
        fourthAirline: fourthAirline,
        fifthAirline: fifthAirline,
        sixthAirline: sixthAirline,
        passengerOne: passengerOne,
        passengerTwo: passengerTwo,
        weiMultiple: (new BigNumber(10)).pow(18),
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};